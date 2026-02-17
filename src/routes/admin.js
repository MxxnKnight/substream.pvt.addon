
const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');
const { uploadSubtitle } = require('../controllers/uploadController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public route for login
router.post('/login', login);

// Protected route for uploads
// 'file' is the key expected in FormData
router.post('/upload', authenticate, upload.single('file'), uploadSubtitle);

module.exports = router;
