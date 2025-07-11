import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
  console.log('Request Headers:', req.headers); // Debug log
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'Ankit');
    req.user = { id: decoded.userId };
    next();
  } catch (err) {
    console.error('JWT verification error:', err); // Log the actual error
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

export default auth;
