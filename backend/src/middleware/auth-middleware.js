const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'meiosis-super-secret-dev-key';

const authMiddleware = (req, res, next) => {
  // 1. Get token from header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token missing or malformed.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 2. Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('[Auth Middleware] Token verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

module.exports = {
  authMiddleware,
  JWT_SECRET
};
