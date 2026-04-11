
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
const { Readable } = require('stream');
router.get('/subtitles/download/:encodedUrl.srt', addonCors, async (req, res) => {
  try {
    const fileUrl = Buffer.from(req.params.encodedUrl, 'base64url').toString('utf-8');
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      return res.status(response.status).send(`Failed to fetch subtitle from upstream: ${response.statusText}`);
    }

    res.setHeader('Content-Type', 'application/x-subrip');
    res.setHeader('Content-Disposition', 'attachment; filename="subtitle.srt"');
    
    if (response.body) {
      const readable = Readable.fromWeb(response.body);
      readable.pipe(res);
    } else {
      res.status(500).send('Empty response from upstream');
    }
  } catch (error) {
    console.error('Subtitle proxy error:', error);
    res.status(500).send('Internal server error during download proxy');
  }
});

// Handle subtitle requests.
// Stremio sends: /subtitles/{type}/{id}.json
// For series, id includes colons: tt1234567:1:2
// Express route `:id` captures everything before `.json` (colons are allowed in params).
router.get('/subtitles/:type/:id.json', addonCors, (req, res, next) => {
  // Decode URL-encoded colons (%3A) in case Stremio encodes them
  req.params.id = decodeURIComponent(req.params.id);
  next();
}, getSubtitles);

module.exports = router;
