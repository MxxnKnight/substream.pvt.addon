
const express = require('express');
const router = express.Router();
const { getManifest } = require('../addon/manifest');
const { getSubtitles } = require('../controllers/addonController');

// CORS middleware for all addon routes
const addonCors = (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
};

router.get('/manifest.json', addonCors, (req, res) => {
  res.setHeader('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate');
  res.json(getManifest());
});

// Proxy route to serve the subtitle file directly to Stremio clients.
// We support both .srt and .vtt extensions but ALWAYS serve cleaned WebVTT content
// because WebVTT is strict about UTF-8, which forces players (ExoPlayer/mpv) to render Malayalam correctly.
router.get('/subtitles/download/:encodedUrl.:ext(srt|vtt)', addonCors, async (req, res) => {
  try {
    const fileUrl = Buffer.from(req.params.encodedUrl, 'base64url').toString('utf-8');
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      return res.status(response.status).send(`Failed to fetch subtitle from upstream: ${response.statusText}`);
    }

    // Force UTF-8 and VTT headers. Most modern players (Stremio Android/Desktop) 
    // sniff the content (WEBVTT header) regardless of the extension in the URL.
    res.setHeader('Content-Type', 'text/vtt; charset=UTF-8');
    res.setHeader('Cache-Control', 'max-age=3600, public'); // Cache for 1 hour to prevent constant re-fetching
    
    const arrayBuffer = await response.arrayBuffer();
    let text = Buffer.from(arrayBuffer).toString('utf-8');

    // Convert SRT to WebVTT format
    if (text.charCodeAt(0) === 0xFEFF) {
      text = text.slice(1);
    }
    
    // Replace timestamp commas with dots for WebVTT compliance
    text = text.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');

    const vttContent = `WEBVTT\n\n${text}`;
    const buffer = Buffer.from(vttContent, 'utf-8');
    
    res.send(buffer);
  } catch (error) {
    console.error('Subtitle proxy error:', error);
    res.status(500).send('Internal server error during download proxy');
  }
});

// Handle subtitle requests.
// Stremio sends: /subtitles/{type}/{id}.json
// For series, id includes colons: tt1234567:1:2
// Express route `:id` captures everything before `.json` (colons are allowed in params).
// Decode URL-encoded colons (%3A) in case Stremio encodes them
const decodeId = (req, res, next) => {
  req.params.id = decodeURIComponent(req.params.id);
  next();
};

router.get('/subtitles/:type/:id.json', addonCors, decodeId, getSubtitles);
// Greedy route to catch ANY extra metadata Stremio Desktop/Android appends
router.get('/subtitles/:type/:id/:extra*', addonCors, decodeId, getSubtitles);

module.exports = router;
