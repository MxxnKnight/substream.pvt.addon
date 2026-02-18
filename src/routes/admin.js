
const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');
const { uploadSubtitle } = require('../controllers/uploadController');
const { listSubtitles, deleteSubtitle } = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public route for login
router.post('/login', login);

// Protected routes
router.post('/upload', authenticate, upload.single('file'), uploadSubtitle);
router.get('/subtitles', authenticate, listSubtitles);
router.delete('/subtitles/:id', authenticate, deleteSubtitle);

module.exports = router;
