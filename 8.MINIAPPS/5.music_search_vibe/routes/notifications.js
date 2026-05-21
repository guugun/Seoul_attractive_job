const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/notifications - Get all notifications for current user
router.get('/', authenticateToken, (req, res) => {
  try {
    const notifications = db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 100
    `).all(req.user.id);

    const unreadCount = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id).count;

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: '알림을 가져오는 중 오류가 발생했습니다.' });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', authenticateToken, (req, res) => {
  try {
    const notifId = parseInt(req.params.id);
    if (isNaN(notifId)) {
      return res.status(400).json({ error: '유효하지 않은 알림 ID입니다.' });
    }

    const notification = db.prepare('SELECT * FROM notifications WHERE id = ? AND user_id = ?').get(notifId, req.user.id);
    if (!notification) {
      return res.status(404).json({ error: '알림을 찾을 수 없습니다.' });
    }

    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(notifId);

    res.json({ message: '알림이 읽음 처리되었습니다.' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: '알림 읽음 처리 중 오류가 발생했습니다.' });
  }
});

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', authenticateToken, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0').run(req.user.id);

    res.json({ message: '모든 알림이 읽음 처리되었습니다.' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: '알림 읽음 처리 중 오류가 발생했습니다.' });
  }
});

// GET /api/notifications/stream - SSE endpoint
router.get('/stream', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', message: '알림 연결됨' })}\n\n`);

    // Add to SSE clients map
    const sseClients = global.sseClients;
    if (!sseClients.has(userId)) {
      sseClients.set(userId, new Set());
    }
    sseClients.get(userId).add(res);

    // Send heartbeat every 30 seconds to keep connection alive
    const heartbeat = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch (err) {
        clearInterval(heartbeat);
      }
    }, 30000);

    // Clean up on close
    req.on('close', () => {
      clearInterval(heartbeat);
      const clients = sseClients.get(userId);
      if (clients) {
        clients.delete(res);
        if (clients.size === 0) {
          sseClients.delete(userId);
        }
      }
    });
  } catch (error) {
    console.error('SSE stream error:', error);
    res.status(500).json({ error: 'SSE 연결 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
