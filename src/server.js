
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const addonRoutes = require('./routes/addon');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Log buffer for the dashboard
const logBuffer = [];
const MAX_LOGS = 200;

const addToLogs = (message) => {
  const ts = new Date().toLocaleTimeString();
  logBuffer.unshift({ ts, message });
  if (logBuffer.length > MAX_LOGS) logBuffer.pop();
};

// Make logs available to routes
app.set('logBuffer', logBuffer);

// Trust the first proxy (required on Render, Railway, Heroku, etc.)
// Without this, req.protocol returns 'http' even on HTTPS connections.
app.set('trust proxy', 1);

// ─── VERBOSE REQUEST LOGGER ──────────────────────────────────────────────────
// Logs EVERY request so we can verify whether Stremio is calling the addon
app.use((req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const ua = req.headers['user-agent'] || 'unknown';
  const ts = new Date().toISOString();
  
  // Skip self-pings in the buffer to keep it clean (but keep in console)
  const isSelfPing = req.originalUrl.includes('manifest.json') && ua.includes('node-fetch');
  
  const logMsg = `${req.method} ${req.originalUrl} | UA: ${ua} | IP: ${ip}`;
  console.log(`[${ts}] ${logMsg}`);
  
  if (!isSelfPing) {
    addToLogs(`${req.method} ${req.originalUrl}`);
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

// Static Assets
app.use(express.static(path.join(__dirname, '../public')));

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
  addToLogs(`ERROR: ${err.message}`);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, '0.0.0.0', () => {
  const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
  console.log(`\n✅ Server running on port ${PORT} (all interfaces)`);
  console.log(`\n   ── Stremio Manifest URL (install this in Stremio) ──`);
  console.log(`   ${baseUrl}/manifest.json`);
  console.log(`\n   ── Admin Dashboard ──`);
  console.log(`   ${baseUrl}/`);
  
  addToLogs(`Server started on port ${PORT}`);

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

  // Self-ping mechanism to keep Render free tier alive
  setInterval(() => {
    try {
      fetch(`${baseUrl}/manifest.json`)
        .then(res => {
          if (res.ok) console.log(`[Self-Ping] Successfully pinged to keep server awake (${new Date().toISOString()})`);
        })
        .catch(() => {});
    } catch (err) {}
  }, 14 * 60 * 1000); // 14 minutes
});
