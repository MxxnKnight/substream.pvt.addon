
const express = require('express');
const router = express.Router();
const manifest = require('../addon/manifest');
const { getSubtitles } = require('../controllers/addonController');

router.get('/manifest.json', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.json(manifest);
});

router.get('/subtitles/:type/:id.json', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    next();
}, getSubtitles);

module.exports = router;
