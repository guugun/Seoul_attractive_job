const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// GET /api/comments/music/:musicId/comments - Get all comments for a music
router.get('/music/:musicId/comments', optionalAuth, (req, res) => {
  try {
    const musicId = parseInt(req.params.musicId);
    if (isNaN(musicId)) {
      return res.status(400).json({ error: '유효하지 않은 음악 ID입니다.' });
    }

    const comments = db.prepare(`
      SELECT
        c.id,
        c.content,
        c.created_at,
        c.user_id,
        c.music_id,
        u.username,
        u.display_name,
        u.avatar_url,
        (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) as like_count
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.music_id = ?
      ORDER BY c.created_at DESC
    `).all(musicId);

    // If user is logged in, check which comments they liked
    if (req.user) {
      const userLikes = db.prepare(`
        SELECT comment_id FROM comment_likes WHERE user_id = ? AND comment_id IN (${comments.map(() => '?').join(',')})
      `).all(req.user.id, ...comments.map(c => c.id));

      const likedSet = new Set(userLikes.map(l => l.comment_id));
      comments.forEach(c => {
        c.user_liked = likedSet.has(c.id);
      });
    } else {
      comments.forEach(c => {
        c.user_liked = false;
      });
    }

    res.json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: '댓글을 가져오는 중 오류가 발생했습니다.' });
  }
});

// POST /api/comments/music/:musicId/comments - Create comment
router.post('/music/:musicId/comments', authenticateToken, (req, res) => {
  try {
    const musicId = parseInt(req.params.musicId);
    const { content } = req.body;

    if (isNaN(musicId)) {
      return res.status(400).json({ error: '유효하지 않은 음악 ID입니다.' });
    }
    if (!content || content.trim() === '') {
      return res.status(400).json({ error: '댓글 내용을 입력해주세요.' });
    }

    // Check music exists
    const music = db.prepare('SELECT * FROM music WHERE id = ?').get(musicId);
    if (!music) {
      return res.status(404).json({ error: '음악을 찾을 수 없습니다.' });
    }

    const result = db.prepare(`
      INSERT INTO comments (user_id, music_id, content)
      VALUES (?, ?, ?)
    `).run(req.user.id, musicId, content.trim());

    const comment = db.prepare(`
      SELECT
        c.id, c.content, c.created_at, c.user_id, c.music_id,
        u.username, u.display_name, u.avatar_url
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid);

    comment.like_count = 0;
    comment.user_liked = false;

    // Notify all users who liked this music (except the commenter)
    const likers = db.prepare(`
      SELECT DISTINCT user_id FROM music_likes
      WHERE music_id = ? AND user_id != ?
    `).all(musicId, req.user.id);

    const commenterUser = db.prepare('SELECT display_name FROM users WHERE id = ?').get(req.user.id);
    const notifMessage = `${commenterUser.display_name}님이 "${music.title}"에 댓글을 남겼습니다: "${content.trim().substring(0, 50)}"`;

    const insertNotif = db.prepare(`
      INSERT INTO notifications (user_id, type, message, music_id)
      VALUES (?, ?, ?, ?)
    `);

    for (const liker of likers) {
      insertNotif.run(liker.user_id, 'new_comment', notifMessage, musicId);

      // Push via SSE
      if (global.sendSSENotification) {
        global.sendSSENotification(liker.user_id, {
          type: 'new_comment',
          message: notifMessage,
          musicId,
          commentId: comment.id
        });
      }
    }

    res.status(201).json({ comment });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: '댓글 작성 중 오류가 발생했습니다.' });
  }
});

// DELETE /api/comments/:id - Delete own comment (or admin)
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    if (isNaN(commentId)) {
      return res.status(400).json({ error: '유효하지 않은 댓글 ID입니다.' });
    }

    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId);
    if (!comment) {
      return res.status(404).json({ error: '댓글을 찾을 수 없습니다.' });
    }

    // Only owner or admin can delete
    if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: '댓글을 삭제할 권한이 없습니다.' });
    }

    // Delete associated likes first, then comment
    db.prepare('DELETE FROM comment_likes WHERE comment_id = ?').run(commentId);
    db.prepare('DELETE FROM comments WHERE id = ?').run(commentId);

    res.json({ message: '댓글이 삭제되었습니다.' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: '댓글 삭제 중 오류가 발생했습니다.' });
  }
});

// GET /api/comments/user/:userId - Get all comments by a user
router.get('/user/:userId', (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: '유효하지 않은 사용자 ID입니다.' });
    }

    const comments = db.prepare(`
      SELECT
        c.id, c.content, c.created_at, c.user_id, c.music_id,
        u.username, u.display_name, u.avatar_url,
        m.title as music_title, m.youtube_id, m.thumbnail as music_thumbnail,
        (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) as like_count
      FROM comments c
      JOIN users u ON c.user_id = u.id
      JOIN music m ON c.music_id = m.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `).all(userId);

    res.json({ comments });
  } catch (error) {
    console.error('Get user comments error:', error);
    res.status(500).json({ error: '사용자 댓글을 가져오는 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
