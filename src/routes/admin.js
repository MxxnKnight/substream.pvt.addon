
const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');
const { uploadSubtitle } = require('../controllers/uploadController');
const { listSubtitles, deleteSubtitle, fetchMetadata, searchExternalSubtitles, importExternalSubtitle, inspectExternalLink, searchTmdbByTitle } = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public route for login
router.post('/login', login);

// Protected routes
router.get('/metadata', authenticate, fetchMetadata);
router.post('/upload', authenticate, upload.single('file'), uploadSubtitle);
router.get('/subtitles', authenticate, listSubtitles);
router.delete('/subtitles/:id', authenticate, deleteSubtitle);

// External Search & Import
router.get('/search-external', authenticate, searchExternalSubtitles);
router.post('/import-external', authenticate, importExternalSubtitle);
router.get('/inspect-link', authenticate, inspectExternalLink);
router.get('/tmdb/search', authenticate, searchTmdbByTitle);

// Add logs endpoint
router.get('/logs', authenticate, (req, res) => {
  const logBuffer = req.app.get('logBuffer');
  res.json(logBuffer);
});

module.exports = router;
