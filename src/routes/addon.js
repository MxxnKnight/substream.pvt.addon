
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

router.get('/subtitles/download/:encodedUrl.srt', addonCors, async (req, res) => {
  try {
    const fileUrl = Buffer.from(req.params.encodedUrl, 'base64url').toString('utf-8');
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      return res.status(response.status).send(`Failed to fetch subtitle from upstream: ${response.statusText}`);
    }

    res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
    res.setHeader('Content-Disposition', 'attachment; filename="subtitle.srt"');
    
    // We must download the entire file into a buffer first
    // because streaming (piping) uses Transfer-Encoding: chunked.
    // Stremio Desktop (VLC setup) strictly requires a Content-Length header to accept subtitles!
    const arrayBuffer = await response.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);

    // Prepend UTF-8 BOM if not already present.
    // VLC/Stremio fallback: even if Content-Type charset is ignored, the BOM
    // forces correct UTF-8 detection for non-ASCII scripts like Malayalam.
    const hasBOM = buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF;
    if (!hasBOM) {
      buffer = Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), buffer]);
    }
    
    // Express res.send() will automatically compute and set the Content-Length!
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
