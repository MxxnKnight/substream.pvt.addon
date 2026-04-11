
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const addonRoutes = require('./routes/addon');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust the first proxy (required on Render, Railway, Heroku, etc.)
// Without this, req.protocol returns 'http' even on HTTPS connections.
app.set('trust proxy', 1);

// ─── VERBOSE REQUEST LOGGER ──────────────────────────────────────────────────
// Logs EVERY request so we can verify whether Stremio is calling the addon
app.use((req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const ua = req.headers['user-agent'] || 'unknown';
  const ts = new Date().toISOString();
  // Only print addon-relevant routes verbosely; skip static assets silently
  const isAddonRoute = req.path.startsWith('/manifest') || req.path.startsWith('/subtitles');
  const isAdminRoute = req.path.startsWith('/api/');
  if (isAddonRoute) {
    console.log(`\n⭐ [${ts}] ADDON REQUEST`);
    console.log(`   ${req.method} ${req.originalUrl}`);
    console.log(`   From IP: ${ip}`);
    console.log(`   User-Agent: ${ua}`);
  } else if (isAdminRoute) {
    console.log(`[${ts}] ADMIN ${req.method} ${req.originalUrl} from ${ip}`);
  }
  next();
});
// ─────────────────────────────────────────────────────────────────────────────

// Middleware
app.use(cors());
app.use(express.json());

// Addon Routes (Public for Stremio)
app.use('/', addonRoutes);

// Admin Routes (Upload, Login)
app.use('/api/admin', adminRoutes);

// Static Frontend
const frontendPath = path.join(__dirname, '../public/admin');
app.use(express.static(frontendPath));

// Catch-all for SPA routing - must be last
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

app.listen(PORT, '0.0.0.0', () => {
  const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
  console.log(`\n✅ Server running on port ${PORT} (all interfaces)`);
  console.log(`\n   ── Stremio Manifest URL (install this in Stremio) ──`);
  console.log(`   ${baseUrl}/manifest.json`);
  console.log(`\n   ── Admin Dashboard ──`);
  console.log(`   ${baseUrl}/`);
  if (!process.env.BASE_URL) {
    console.log(`\n   ── LAN (same WiFi) ──`);
    try {
      const os = require('os');
      const nets = os.networkInterfaces();
      for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
          if (net.family === 'IPv4' && !net.internal) {
            console.log(`   Manifest: http://${net.address}:${PORT}/manifest.json`);
          }
        }
      }
    } catch(_) {}
  }
  console.log('');
});
