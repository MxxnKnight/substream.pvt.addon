
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

const { getSubtitleById } = require('../services/db');

// Proxy route to serve the subtitle file directly to Stremio clients.
// We support both .srt and .vtt extensions but ALWAYS serve cleaned WebVTT content.
// We now look up the file by ID for shorter, more reliable URLs.
router.get('/subtitles/download/:id.:ext(srt|vtt)', addonCors, async (req, res) => {
  const { id, ext } = req.params;
  console.log(`[Subtitle Proxy] Request received: id=${id}, ext=${ext}, UA=${req.headers['user-agent']}`);
  
  try {
    const sub = await getSubtitleById(id);
    if (!sub) {
      console.error(`[Subtitle Proxy] Subtitle ID ${id} not found in DB`);
      return res.status(404).send('Subtitle record not found');
    }

    console.log(`[Subtitle Proxy] Fetching from upstream: ${sub.file_path}`);
    const upstreamResponse = await fetch(sub.file_path);
    
    if (!upstreamResponse.ok) {
      console.error(`[Subtitle Proxy] Upstream fetch failed: ${upstreamResponse.status} ${upstreamResponse.statusText}`);
      return res.status(upstreamResponse.status).send(`Failed to fetch subtitle from upstream: ${upstreamResponse.statusText}`);
    }

    // Android players are very sensitive to headers
    res.setHeader('Content-Type', 'text/vtt; charset=UTF-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'max-age=3600, public');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    const arrayBuffer = await upstreamResponse.arrayBuffer();
    let text = Buffer.from(arrayBuffer).toString('utf-8');

    console.log(`[Subtitle Proxy] Processing content (length: ${text.length})...`);

    // Convert SRT to WebVTT format
    if (text.charCodeAt(0) === 0xFEFF) {
      text = text.slice(1);
    }
    
    // Replace timestamp commas with dots for WebVTT compliance
    text = text.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');

    const vttContent = `WEBVTT\n\n${text}`;
    const buffer = Buffer.from(vttContent, 'utf-8');
    
    console.log(`[Subtitle Proxy] Sending ${buffer.length} bytes to Stremio`);
    res.send(buffer);
  } catch (error) {
    console.error(`[Subtitle Proxy] Error processing ${id}:`, error);
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
