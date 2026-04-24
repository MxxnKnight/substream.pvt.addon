
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
// Bypasses Cloudflare block on unusual User-Agents (like Exoplayer) and ensures .srt extension

// Fallback for old .srt links cached by Stremio Mobile
router.get('/subtitles/download/:encodedUrl.srt', addonCors, (req, res) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.get('host');
  res.redirect(302, `${protocol}://${host}/subtitles/download/${req.params.encodedUrl}.vtt`);
});

router.get('/subtitles/download/:encodedUrl.vtt', addonCors, async (req, res) => {
  try {
    const fileUrl = Buffer.from(req.params.encodedUrl, 'base64url').toString('utf-8');
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      return res.status(response.status).send(`Failed to fetch subtitle from upstream: ${response.statusText}`);
    }

    res.setHeader('Content-Type', 'text/vtt; charset=UTF-8');
    res.setHeader('Content-Disposition', 'attachment; filename="subtitle.vtt"');
    
    const arrayBuffer = await response.arrayBuffer();
    let text = Buffer.from(arrayBuffer).toString('utf-8');

    // Convert SRT to WebVTT format
    // WebVTT requires WEBVTT at the beginning
    // WebVTT timestamps use a dot instead of a comma: 00:00:00.000 instead of 00:00:00,000
    
    // Remove BOM if present before manipulation
    if (text.charCodeAt(0) === 0xFEFF) {
      text = text.slice(1);
    }
    
    // Replace timestamp commas with dots
    // SRT format: 00:00:10,056 --> 00:00:13,254
    text = text.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');

    const vttContent = `WEBVTT\n\n${text}`;
    
    // Buffer the final output
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
