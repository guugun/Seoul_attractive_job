const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

// POST /api/likes/comments/:id/like - Toggle comment like
router.post('/comments/:id/like', authenticateToken, (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    if (isNaN(commentId)) {
      return res.status(400).json({ error: '유효하지 않은 댓글 ID입니다.' });
    }

    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId);
    if (!comment) {
      return res.status(404).json({ error: '댓글을 찾을 수 없습니다.' });
    }

    const existingLike = db.prepare('SELECT id FROM comment_likes WHERE user_id = ? AND comment_id = ?').get(req.user.id, commentId);

    let liked;
    if (existingLike) {
      // Unlike
      db.prepare('DELETE FROM comment_likes WHERE id = ?').run(existingLike.id);
      liked = false;
    } else {
      // Like
      db.prepare('INSERT INTO comment_likes (user_id, comment_id) VALUES (?, ?)').run(req.user.id, commentId);
      liked = true;

      // Notify the comment author (if not self)
      if (comment.user_id !== req.user.id) {
        const liker = db.prepare('SELECT display_name FROM users WHERE id = ?').get(req.user.id);
        const music = db.prepare('SELECT title FROM music WHERE id = ?').get(comment.music_id);
        const message = `${liker.display_name}님이 회원님의 댓글을 좋아합니다.`;

        db.prepare(`
          INSERT INTO notifications (user_id, type, message, music_id)
          VALUES (?, ?, ?, ?)
        `).run(comment.user_id, 'comment_like', message, comment.music_id);

        if (global.sendSSENotification) {
          global.sendSSENotification(comment.user_id, {
            type: 'comment_like',
            message,
            musicId: comment.music_id,
            commentId
          });
        }
      }
    }

    const likeCount = db.prepare('SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = ?').get(commentId).count;

    res.json({ liked, likeCount });
  } catch (error) {
    console.error('Toggle comment like error:', error);
    res.status(500).json({ error: '좋아요 처리 중 오류가 발생했습니다.' });
  }
});

// POST /api/likes/music/:id/like - Toggle music like
router.post('/music/:id/like', authenticateToken, (req, res) => {
  try {
    const musicId = parseInt(req.params.id);
    if (isNaN(musicId)) {
      return res.status(400).json({ error: '유효하지 않은 음악 ID입니다.' });
    }

    const music = db.prepare('SELECT * FROM music WHERE id = ?').get(musicId);
    if (!music) {
      return res.status(404).json({ error: '음악을 찾을 수 없습니다.' });
    }

    const existingLike = db.prepare('SELECT id FROM music_likes WHERE user_id = ? AND music_id = ?').get(req.user.id, musicId);

    let liked;
    if (existingLike) {
      // Unlike
      db.prepare('DELETE FROM music_likes WHERE id = ?').run(existingLike.id);
      liked = false;
    } else {
      // Like
      db.prepare('INSERT INTO music_likes (user_id, music_id) VALUES (?, ?)').run(req.user.id, musicId);
      liked = true;
    }

    const likeCount = db.prepare('SELECT COUNT(*) as count FROM music_likes WHERE music_id = ?').get(musicId).count;

    res.json({ liked, likeCount });
  } catch (error) {
    console.error('Toggle music like error:', error);
    res.status(500).json({ error: '좋아요 처리 중 오류가 발생했습니다.' });
  }
});

// GET /api/likes/music/:id/status - Check if current user liked a music
router.get('/music/:id/status', authenticateToken, (req, res) => {
  try {
    const musicId = parseInt(req.params.id);
    if (isNaN(musicId)) {
      return res.status(400).json({ error: '유효하지 않은 음악 ID입니다.' });
    }

    const like = db.prepare('SELECT id FROM music_likes WHERE user_id = ? AND music_id = ?').get(req.user.id, musicId);
    const likeCount = db.prepare('SELECT COUNT(*) as count FROM music_likes WHERE music_id = ?').get(musicId).count;

    res.json({ liked: !!like, likeCount });
  } catch (error) {
    console.error('Check like status error:', error);
    res.status(500).json({ error: '좋아요 상태 확인 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
