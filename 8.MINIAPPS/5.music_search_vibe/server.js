const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize database (creates tables + seeds admin)
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Global SSE clients map: userId -> Set of response objects
const sseClients = new Map();
global.sseClients = sseClients;

/**
 * Send SSE notification to a specific user
 */
function sendSSENotification(userId, data) {
  const clients = sseClients.get(userId);
  if (clients && clients.size > 0) {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    clients.forEach((res) => {
      try {
        res.write(payload);
      } catch (err) {
        // Client disconnected, will be cleaned up
      }
    });
  }
}
global.sendSSENotification = sendSSENotification;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/music', require('./routes/music'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/likes', require('./routes/likes'));
app.use('/api/hashtags', require('./routes/hashtags'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));

// SPA fallback: serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🎵 Music Search Vibe server running on http://localhost:${PORT}`);
});

module.exports = app;
