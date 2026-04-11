
const express = require('express');
const router = express.Router();
const manifest = require('../addon/manifest');
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
  res.json(manifest);
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
