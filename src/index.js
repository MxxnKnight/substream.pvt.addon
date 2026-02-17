
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
// This allows access to files via http://domain/uploads/...
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Addon Routes (Public for Stremio)
app.use('/', addonRoutes);

// Admin Routes (Upload, Login)
app.use('/api/admin', adminRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.send(`
    <h1>SubStream Private Addon</h1>
    <p>Addon is running.</p>
    <p>Manifest: <a href="/manifest.json">/manifest.json</a></p>
  `);
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
