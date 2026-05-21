const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

/**
 * Admin role check middleware
 */
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
  }
  next();
}

// Apply auth + admin check to all routes
router.use(authenticateToken, requireAdmin);

// GET /api/admin/stats - Dashboard statistics
router.get('/stats', (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const totalMusic = db.prepare('SELECT COUNT(*) as count FROM music').get().count;
    const totalComments = db.prepare('SELECT COUNT(*) as count FROM comments').get().count;
    const totalLikes = db.prepare('SELECT COUNT(*) as count FROM music_likes').get().count +
                       db.prepare('SELECT COUNT(*) as count FROM comment_likes').get().count;

    const recentUsers = db.prepare(`
      SELECT id, username, display_name, email, role, created_at
      FROM users ORDER BY created_at DESC LIMIT 5
    `).all();

    const recentComments = db.prepare(`
      SELECT c.id, c.content, c.created_at,
        u.username, u.display_name,
        m.title as music_title, m.youtube_id
      FROM comments c
      JOIN users u ON c.user_id = u.id
      JOIN music m ON c.music_id = m.id
      ORDER BY c.created_at DESC LIMIT 5
    `).all();

    res.json({
      totalUsers,
      totalMusic,
      totalComments,
      totalLikes,
      recentUsers,
      recentComments
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: '통계를 가져오는 중 오류가 발생했습니다.' });
  }
});

// GET /api/admin/users - List users with pagination
router.get('/users', (req, res) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    let query = 'SELECT id, username, email, display_name, avatar_url, role, created_at FROM users';
    let countQuery = 'SELECT COUNT(*) as count FROM users';
    const params = [];
    const countParams = [];

    if (search) {
      const whereClause = ' WHERE username LIKE ? OR email LIKE ? OR display_name LIKE ?';
      query += whereClause;
      countQuery += whereClause;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern, searchPattern);
    }

    const total = db.prepare(countQuery).get(...countParams).count;

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const users = db.prepare(query).all(...params);

    res.json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Admin list users error:', error);
    res.status(500).json({ error: '사용자 목록을 가져오는 중 오류가 발생했습니다.' });
  }
});

// PUT /api/admin/users/:id - Update user role
router.put('/users/:id', (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { role } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({ error: '유효하지 않은 사용자 ID입니다.' });
    }
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: '유효하지 않은 역할입니다. (user 또는 admin)' });
    }

    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // Prevent changing own role
    if (userId === req.user.id) {
      return res.status(400).json({ error: '자신의 역할은 변경할 수 없습니다.' });
    }

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);

    const updatedUser = db.prepare('SELECT id, username, email, display_name, avatar_url, role, created_at FROM users WHERE id = ?').get(userId);
    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Admin update user error:', error);
    res.status(500).json({ error: '사용자 역할 변경 중 오류가 발생했습니다.' });
  }
});

// DELETE /api/admin/users/:id - Delete user and their data
router.delete('/users/:id', (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: '유효하지 않은 사용자 ID입니다.' });
    }

    const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // Prevent deleting self
    if (userId === req.user.id) {
      return res.status(400).json({ error: '자기 자신을 삭제할 수 없습니다.' });
    }

    // Delete user and cascade (foreign keys handle related data)
    const deleteTransaction = db.transaction(() => {
      db.prepare('DELETE FROM comment_likes WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM music_likes WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM music_hashtags WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM notifications WHERE user_id = ?').run(userId);
      // Delete likes on user's comments before deleting comments
      db.prepare(`DELETE FROM comment_likes WHERE comment_id IN (SELECT id FROM comments WHERE user_id = ?)`).run(userId);
      db.prepare('DELETE FROM comments WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    });

    deleteTransaction();

    res.json({ message: `사용자 '${user.username}'이(가) 삭제되었습니다.` });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ error: '사용자 삭제 중 오류가 발생했습니다.' });
  }
});

// GET /api/admin/comments - List all comments with pagination
router.get('/comments', (req, res) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT c.id, c.content, c.created_at, c.user_id, c.music_id,
        u.username, u.display_name,
        m.title as music_title, m.youtube_id,
        (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) as like_count
      FROM comments c
      JOIN users u ON c.user_id = u.id
      JOIN music m ON c.music_id = m.id
    `;
    let countQuery = `
      SELECT COUNT(*) as count FROM comments c
      JOIN users u ON c.user_id = u.id
      JOIN music m ON c.music_id = m.id
    `;
    const params = [];
    const countParams = [];

    if (search) {
      const whereClause = ' WHERE c.content LIKE ? OR u.username LIKE ? OR m.title LIKE ?';
      query += whereClause;
      countQuery += whereClause;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern, searchPattern);
    }

    const total = db.prepare(countQuery).get(...countParams).count;

    query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const comments = db.prepare(query).all(...params);

    res.json({
      comments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Admin list comments error:', error);
    res.status(500).json({ error: '댓글 목록을 가져오는 중 오류가 발생했습니다.' });
  }
});

// DELETE /api/admin/comments/:id - Delete comment
router.delete('/comments/:id', (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    if (isNaN(commentId)) {
      return res.status(400).json({ error: '유효하지 않은 댓글 ID입니다.' });
    }

    const comment = db.prepare('SELECT id FROM comments WHERE id = ?').get(commentId);
    if (!comment) {
      return res.status(404).json({ error: '댓글을 찾을 수 없습니다.' });
    }

    db.prepare('DELETE FROM comment_likes WHERE comment_id = ?').run(commentId);
    db.prepare('DELETE FROM comments WHERE id = ?').run(commentId);

    res.json({ message: '댓글이 삭제되었습니다.' });
  } catch (error) {
    console.error('Admin delete comment error:', error);
    res.status(500).json({ error: '댓글 삭제 중 오류가 발생했습니다.' });
  }
});

// GET /api/admin/music - List all music with stats
router.get('/music', (req, res) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT m.*,
        (SELECT COUNT(*) FROM comments c WHERE c.music_id = m.id) as comment_count,
        (SELECT COUNT(*) FROM music_likes ml WHERE ml.music_id = m.id) as like_count,
        (SELECT COUNT(*) FROM music_hashtags mh WHERE mh.music_id = m.id) as hashtag_count
      FROM music m
    `;
    let countQuery = 'SELECT COUNT(*) as count FROM music m';
    const params = [];
    const countParams = [];

    if (search) {
      const whereClause = ' WHERE m.title LIKE ? OR m.channel_name LIKE ? OR m.youtube_id LIKE ?';
      query += whereClause;
      countQuery += whereClause;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern, searchPattern);
    }

    const total = db.prepare(countQuery).get(...countParams).count;

    query += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const music = db.prepare(query).all(...params);

    res.json({
      music,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Admin list music error:', error);
    res.status(500).json({ error: '음악 목록을 가져오는 중 오류가 발생했습니다.' });
  }
});

// DELETE /api/admin/music/:id - Delete music and all related data
router.delete('/music/:id', (req, res) => {
  try {
    const musicId = parseInt(req.params.id);
    if (isNaN(musicId)) {
      return res.status(400).json({ error: '유효하지 않은 음악 ID입니다.' });
    }

    const music = db.prepare('SELECT id, title FROM music WHERE id = ?').get(musicId);
    if (!music) {
      return res.status(404).json({ error: '음악을 찾을 수 없습니다.' });
    }

    const deleteTransaction = db.transaction(() => {
      // Delete comment likes for this music's comments
      db.prepare(`DELETE FROM comment_likes WHERE comment_id IN (SELECT id FROM comments WHERE music_id = ?)`).run(musicId);
      // Delete comments
      db.prepare('DELETE FROM comments WHERE music_id = ?').run(musicId);
      // Delete music likes
      db.prepare('DELETE FROM music_likes WHERE music_id = ?').run(musicId);
      // Delete music hashtag links
      db.prepare('DELETE FROM music_hashtags WHERE music_id = ?').run(musicId);
      // Delete notifications for this music
      db.prepare('DELETE FROM notifications WHERE music_id = ?').run(musicId);
      // Delete music
      db.prepare('DELETE FROM music WHERE id = ?').run(musicId);
    });

    deleteTransaction();

    res.json({ message: `음악 '${music.title}'이(가) 삭제되었습니다.` });
  } catch (error) {
    console.error('Admin delete music error:', error);
    res.status(500).json({ error: '음악 삭제 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
