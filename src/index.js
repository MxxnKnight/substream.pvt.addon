
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const addonRoutes = require('./routes/addon');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve Frontend Dashboard
// The frontend build output is in public/admin
const frontendPath = path.join(__dirname, '../public/admin');
app.use(express.static(frontendPath));

// Addon Routes (Public for Stremio)
app.use('/', addonRoutes);

// Admin Routes (Upload, Login)
app.use('/api/admin', adminRoutes);

// 404 Handler for undefined routes
// Since the frontend is not using client-side routing (History API), we don't need a catch-all to serve index.html.
// This ensures that unknown API calls (e.g. from Stremio) return 404 JSON instead of HTML.
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Manifest URL: http://localhost:${PORT}/manifest.json`);
});
