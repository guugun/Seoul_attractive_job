const jwt = require('jsonwebtoken');

const JWT_SECRET = 'music_vibe_secret_key_2024';

/**
 * Required authentication middleware.
 * Extracts and verifies JWT from Authorization header.
 * Sets req.user = { id, username, role }
 */
function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];

    if (!token && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.id, username: decoded.username, role: decoded.role };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '토큰이 만료되었습니다. 다시 로그인해주세요.' });
    }
    return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
  }
}

/**
 * Optional authentication middleware.
 * If token is present and valid, sets req.user. Otherwise continues without error.
 */
function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];

    if (!token && req.query.token) {
      token = req.query.token;
    }

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = { id: decoded.id, username: decoded.username, role: decoded.role };
    }
  } catch (error) {
    // Token invalid or expired — just proceed without user
    req.user = null;
  }
  next();
}

module.exports = { authenticateToken, optionalAuth, JWT_SECRET };
