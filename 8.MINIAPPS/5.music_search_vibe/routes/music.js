const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const INVIDIOUS_INSTANCES = [
  'https://vid.puffyan.us',
  'https://invidious.snopyta.org',
  'https://yewtu.be',
  'https://inv.tux.pizza',
  'https://invidious.protokolla.fi'
];

const PIPED_API = 'https://pipedapi.kavin.rocks';

/**
 * Fetch with timeout helper
 */
async function fetchWithTimeout(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    return response;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

/**
 * Format duration from seconds to MM:SS or HH:MM:SS
 */
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Search via Invidious instances with fallback
 */
async function searchInvidious(query, page = 1) {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const url = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video&page=${page}`;
      const response = await fetchWithTimeout(url);
      if (!response.ok) continue;

      const data = await response.json();
      const results = data
        .filter(item => item.type === 'video')
        .map(item => ({
          videoId: item.videoId,
          title: item.title || '',
          description: item.description || item.descriptionHtml || '',
          thumbnail: item.videoThumbnails && item.videoThumbnails.length > 0
            ? item.videoThumbnails.find(t => t.quality === 'medium')?.url || item.videoThumbnails[0].url
            : `https://i.ytimg.com/vi/${item.videoId}/mqdefault.jpg`,
          channelName: item.author || '',
          duration: formatDuration(item.lengthSeconds),
          viewCount: item.viewCount || 0,
          publishedText: item.publishedText || ''
        }));
      return results;
    } catch (err) {
      console.log(`Invidious instance ${instance} failed:`, err.message);
      continue;
    }
  }
  return null; // all instances failed
}

/**
 * Search via Piped API (fallback)
 */
async function searchPiped(query) {
  try {
    const url = `${PIPED_API}/search?q=${encodeURIComponent(query)}&filter=videos`;
    const response = await fetchWithTimeout(url);
    if (!response.ok) return [];

    const data = await response.json();
    const items = data.items || [];
    return items.map(item => ({
      videoId: item.url ? item.url.replace('/watch?v=', '') : '',
      title: item.title || '',
      description: item.shortDescription || '',
      thumbnail: item.thumbnail || '',
      channelName: item.uploaderName || '',
      duration: formatDuration(item.duration),
      viewCount: item.views || 0,
      publishedText: item.uploadedDate || ''
    }));
  } catch (err) {
    console.error('Piped search failed:', err.message);
    return [];
  }
}

// GET /api/music - Get recently registered music (for homepage)
router.get('/', (req, res) => {
  try {
    const music = db.prepare(`
      SELECT m.*, 
        (SELECT COUNT(*) FROM music_likes ml WHERE ml.music_id = m.id) as likesCount,
        (SELECT COUNT(*) FROM comments c WHERE c.music_id = m.id) as commentsCount,
        (SELECT GROUP_CONCAT(h.tag) FROM music_hashtags mh JOIN hashtags h ON mh.hashtag_id = h.id WHERE mh.music_id = m.id) as tags
      FROM music m
      ORDER BY m.created_at DESC
      LIMIT 20
    `).all();

    res.json({ music });
  } catch (error) {
    console.error('Get recent music error:', error);
    res.status(500).json({ error: '최근 등록된 음악 목록을 가져오는 중 오류가 발생했습니다.' });
  }
});

// GET /api/music/search?q=keyword&type=title|description|hashtag&page=1
router.get('/search', async (req, res) => {
  try {
    const { q, type = 'title', page = 1 } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({ error: '검색어를 입력해주세요.' });
    }

    // Hashtag search: query local DB
    if (type === 'hashtag') {
      const searchTag = q.replace(/^#/, '').trim();
      const music = db.prepare(`
        SELECT m.*, GROUP_CONCAT(h.tag) as tags
        FROM music m
        JOIN music_hashtags mh ON m.id = mh.music_id
        JOIN hashtags h ON mh.hashtag_id = h.id
        WHERE h.tag LIKE ?
        GROUP BY m.id
        ORDER BY m.created_at DESC
      `).all(`%${searchTag}%`);

      return res.json({ results: music, source: 'local', type: 'hashtag' });
    }

    // Title/description search: use Invidious/Piped
    let results = await searchInvidious(q, parseInt(page));

    if (!results) {
      // Fallback to Piped
      console.log('All Invidious instances failed, falling back to Piped...');
      results = await searchPiped(q);
    }

    res.json({ results: results || [], source: results ? 'invidious' : 'piped', type });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: '검색 중 오류가 발생했습니다.' });
  }
});

// GET /api/music/:id - Get music by local DB id
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const musicId = parseInt(req.params.id);
    if (isNaN(musicId)) {
      return res.status(400).json({ error: '유효하지 않은 음악 ID입니다.' });
    }

    const music = db.prepare('SELECT * FROM music WHERE id = ?').get(musicId);
    if (!music) {
      return res.status(404).json({ error: '음악을 찾을 수 없습니다.' });
    }

    // Get hashtags
    const hashtags = db.prepare(`
      SELECT h.id, h.tag, mh.user_id, u.username as added_by
      FROM music_hashtags mh
      JOIN hashtags h ON mh.hashtag_id = h.id
      JOIN users u ON mh.user_id = u.id
      WHERE mh.music_id = ?
    `).all(musicId);

    // Get comments count
    const commentsCount = db.prepare('SELECT COUNT(*) as count FROM comments WHERE music_id = ?').get(musicId).count;

    // Get likes count
    const likesCount = db.prepare('SELECT COUNT(*) as count FROM music_likes WHERE music_id = ?').get(musicId).count;

    // Check if current user liked
    let userLiked = false;
    if (req.user) {
      const like = db.prepare('SELECT id FROM music_likes WHERE user_id = ? AND music_id = ?').get(req.user.id, musicId);
      userLiked = !!like;
    }

    res.json({
      ...music,
      hashtags,
      commentsCount,
      likesCount,
      userLiked
    });
  } catch (error) {
    console.error('Get music error:', error);
    res.status(500).json({ error: '음악 정보를 가져오는 중 오류가 발생했습니다.' });
  }
});

// GET /api/music/youtube/:youtubeId - Get or create music entry by YouTube video ID
router.get('/youtube/:youtubeId', optionalAuth, (req, res) => {
  try {
    const { youtubeId } = req.params;

    let music = db.prepare('SELECT * FROM music WHERE youtube_id = ?').get(youtubeId);

    if (!music) {
      // Create a placeholder entry
      const result = db.prepare(`
        INSERT INTO music (youtube_id, title, thumbnail)
        VALUES (?, ?, ?)
      `).run(youtubeId, `YouTube Video ${youtubeId}`, `https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg`);

      music = db.prepare('SELECT * FROM music WHERE id = ?').get(result.lastInsertRowid);
    }

    // Get hashtags
    const hashtags = db.prepare(`
      SELECT h.id, h.tag, mh.user_id, u.username as added_by
      FROM music_hashtags mh
      JOIN hashtags h ON mh.hashtag_id = h.id
      JOIN users u ON mh.user_id = u.id
      WHERE mh.music_id = ?
    `).all(music.id);

    // Get counts
    const commentsCount = db.prepare('SELECT COUNT(*) as count FROM comments WHERE music_id = ?').get(music.id).count;
    const likesCount = db.prepare('SELECT COUNT(*) as count FROM music_likes WHERE music_id = ?').get(music.id).count;

    let userLiked = false;
    if (req.user) {
      const like = db.prepare('SELECT id FROM music_likes WHERE user_id = ? AND music_id = ?').get(req.user.id, music.id);
      userLiked = !!like;
    }

    res.json({
      ...music,
      hashtags,
      commentsCount,
      likesCount,
      userLiked
    });
  } catch (error) {
    console.error('Get youtube music error:', error);
    res.status(500).json({ error: '음악 정보를 가져오는 중 오류가 발생했습니다.' });
  }
});

// POST /api/music - Register a music entry from YouTube data
router.post('/', authenticateToken, (req, res) => {
  try {
    const { youtube_id, title, description, thumbnail, channel_name, duration } = req.body;

    if (!youtube_id || !title) {
      return res.status(400).json({ error: 'YouTube ID와 제목은 필수입니다.' });
    }

    // Check if already exists
    let music = db.prepare('SELECT * FROM music WHERE youtube_id = ?').get(youtube_id);

    if (music) {
      // Update with richer info if available
      db.prepare(`
        UPDATE music SET
          title = COALESCE(NULLIF(?, ''), title),
          description = COALESCE(NULLIF(?, ''), description),
          thumbnail = COALESCE(NULLIF(?, ''), thumbnail),
          channel_name = COALESCE(NULLIF(?, ''), channel_name),
          duration = COALESCE(NULLIF(?, ''), duration)
        WHERE youtube_id = ?
      `).run(title, description || '', thumbnail || '', channel_name || '', duration || '', youtube_id);

      music = db.prepare('SELECT * FROM music WHERE youtube_id = ?').get(youtube_id);
      return res.json(music);
    }

    const result = db.prepare(`
      INSERT INTO music (youtube_id, title, description, thumbnail, channel_name, duration)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(youtube_id, title, description || '', thumbnail || '', channel_name || '', duration || '');

    music = db.prepare('SELECT * FROM music WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(music);
  } catch (error) {
    console.error('Create music error:', error);
    res.status(500).json({ error: '음악 등록 중 오류가 발생했습니다.' });
  }
});

// GET /api/music/user/:userId/liked - Get all music liked by a user
router.get('/user/:userId/liked', (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: '유효하지 않은 사용자 ID입니다.' });
    }

    const music = db.prepare(`
      SELECT m.*, 
        (SELECT COUNT(*) FROM music_likes ml WHERE ml.music_id = m.id) as likesCount,
        (SELECT COUNT(*) FROM comments c WHERE c.music_id = m.id) as commentsCount
      FROM music m
      JOIN music_likes ml ON m.id = ml.music_id
      WHERE ml.user_id = ?
      ORDER BY ml.created_at DESC
    `).all(userId);

    res.json({ music });
  } catch (error) {
    console.error('Get liked music error:', error);
    res.status(500).json({ error: '좋아요 한 음악 목록을 가져오는 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
