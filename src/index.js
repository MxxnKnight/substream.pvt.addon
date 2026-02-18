
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const addonRoutes = require('./routes/addon');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Middleware
app.use(cors());
app.use(express.json());

// 2. Addon Routes (Public for Stremio)
// Mount at root BEFORE static files to ensure API precedence
app.use('/', addonRoutes);

// 3. Admin Routes (Upload, Login)
app.use('/api/admin', adminRoutes);

// 4. Static Uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 5. Static Frontend
// Serve the built frontend assets
const frontendPath = path.join(__dirname, '../public/admin');
app.use(express.static(frontendPath));

// 6. Catch-all for Frontend Routing
// This must be last. Serves index.html for any unknown routes (SPA support)
app.get('*', (req, res) => {
  const indexHtml = path.join(frontendPath, 'index.html');
  if (require('fs').existsSync(indexHtml)) {
      res.sendFile(indexHtml);
  } else {
      res.status(404).send('Frontend not built or found');
  }
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
