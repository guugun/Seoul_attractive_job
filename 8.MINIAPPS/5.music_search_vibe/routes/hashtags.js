const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

// POST /api/hashtags/music/:musicId - Add hashtag(s) to music
router.post('/music/:musicId', authenticateToken, (req, res) => {
  try {
    const musicId = parseInt(req.params.musicId);
    if (isNaN(musicId)) {
      return res.status(400).json({ error: '유효하지 않은 음악 ID입니다.' });
    }

    const { tags } = req.body;
    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({ error: '하나 이상의 해시태그를 입력해주세요.' });
    }

    // Check music exists
    const music = db.prepare('SELECT id FROM music WHERE id = ?').get(musicId);
    if (!music) {
      return res.status(404).json({ error: '음악을 찾을 수 없습니다.' });
    }

    const insertHashtag = db.prepare('INSERT OR IGNORE INTO hashtags (tag) VALUES (?)');
    const getHashtag = db.prepare('SELECT id FROM hashtags WHERE tag = ?');
    const insertLink = db.prepare('INSERT OR IGNORE INTO music_hashtags (music_id, hashtag_id, user_id) VALUES (?, ?, ?)');

    const addedTags = [];
    const addTagsTransaction = db.transaction(() => {
      for (let tag of tags) {
        tag = tag.replace(/^#/, '').trim().toLowerCase();
        if (!tag) continue;

        insertHashtag.run(tag);
        const hashtag = getHashtag.get(tag);
        if (hashtag) {
          const result = insertLink.run(musicId, hashtag.id, req.user.id);
          if (result.changes > 0) {
            addedTags.push({ id: hashtag.id, tag });
          }
        }
      }
    });

    addTagsTransaction();

    // Get all hashtags for this music
    const allHashtags = db.prepare(`
      SELECT h.id, h.tag, mh.user_id, u.username as added_by
      FROM music_hashtags mh
      JOIN hashtags h ON mh.hashtag_id = h.id
      JOIN users u ON mh.user_id = u.id
      WHERE mh.music_id = ?
    `).all(musicId);

    res.status(201).json({ added: addedTags, hashtags: allHashtags });
  } catch (error) {
    console.error('Add hashtag error:', error);
    res.status(500).json({ error: '해시태그 추가 중 오류가 발생했습니다.' });
  }
});

// GET /api/hashtags/music/:musicId - Get all hashtags for a music
router.get('/music/:musicId', (req, res) => {
  try {
    const musicId = parseInt(req.params.musicId);
    if (isNaN(musicId)) {
      return res.status(400).json({ error: '유효하지 않은 음악 ID입니다.' });
    }

    const hashtags = db.prepare(`
      SELECT h.id, h.tag, mh.user_id, u.username as added_by, mh.created_at
      FROM music_hashtags mh
      JOIN hashtags h ON mh.hashtag_id = h.id
      JOIN users u ON mh.user_id = u.id
      WHERE mh.music_id = ?
      ORDER BY mh.created_at ASC
    `).all(musicId);

    res.json({ hashtags });
  } catch (error) {
    console.error('Get hashtags error:', error);
    res.status(500).json({ error: '해시태그를 가져오는 중 오류가 발생했습니다.' });
  }
});

// GET /api/hashtags/search?tag=keyword - Search music by hashtag
router.get('/search', (req, res) => {
  try {
    const { tag } = req.query;
    if (!tag || tag.trim() === '') {
      return res.status(400).json({ error: '검색할 해시태그를 입력해주세요.' });
    }

    const searchTag = tag.replace(/^#/, '').trim().toLowerCase();

    const music = db.prepare(`
      SELECT DISTINCT m.*,
        (SELECT COUNT(*) FROM music_likes ml WHERE ml.music_id = m.id) as like_count,
        (SELECT COUNT(*) FROM comments c WHERE c.music_id = m.id) as comment_count,
        GROUP_CONCAT(DISTINCT h.tag) as tags
      FROM music m
      JOIN music_hashtags mh ON m.id = mh.music_id
      JOIN hashtags h ON mh.hashtag_id = h.id
      WHERE h.tag LIKE ?
      GROUP BY m.id
      ORDER BY m.created_at DESC
    `).all(`%${searchTag}%`);

    res.json({ results: music });
  } catch (error) {
    console.error('Search hashtag error:', error);
    res.status(500).json({ error: '해시태그 검색 중 오류가 발생했습니다.' });
  }
});

// GET /api/hashtags/popular - Get top 20 most used hashtags
router.get('/popular', (req, res) => {
  try {
    const hashtags = db.prepare(`
      SELECT h.id, h.tag, COUNT(mh.id) as count
      FROM hashtags h
      JOIN music_hashtags mh ON h.id = mh.hashtag_id
      GROUP BY h.id
      ORDER BY count DESC
      LIMIT 20
    `).all();

    res.json({ hashtags });
  } catch (error) {
    console.error('Get popular hashtags error:', error);
    res.status(500).json({ error: '인기 해시태그를 가져오는 중 오류가 발생했습니다.' });
  }
});

// DELETE /api/hashtags/music/:musicId/:hashtagId - Remove hashtag from music
router.delete('/music/:musicId/:hashtagId', authenticateToken, (req, res) => {
  try {
    const musicId = parseInt(req.params.musicId);
    const hashtagId = parseInt(req.params.hashtagId);

    if (isNaN(musicId) || isNaN(hashtagId)) {
      return res.status(400).json({ error: '유효하지 않은 ID입니다.' });
    }

    const link = db.prepare('SELECT * FROM music_hashtags WHERE music_id = ? AND hashtag_id = ?').get(musicId, hashtagId);
    if (!link) {
      return res.status(404).json({ error: '해시태그 연결을 찾을 수 없습니다.' });
    }

    // Only the user who added it or admin can remove
    if (link.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: '해시태그를 삭제할 권한이 없습니다.' });
    }

    db.prepare('DELETE FROM music_hashtags WHERE music_id = ? AND hashtag_id = ?').run(musicId, hashtagId);

    res.json({ message: '해시태그가 제거되었습니다.' });
  } catch (error) {
    console.error('Delete hashtag error:', error);
    res.status(500).json({ error: '해시태그 삭제 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
