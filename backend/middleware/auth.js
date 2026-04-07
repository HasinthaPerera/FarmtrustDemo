const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

  const secrets = [];
  if (process.env.JWT_SECRET) secrets.push(process.env.JWT_SECRET);
  secrets.push('secret');

  for (const secret of secrets) {
    try {
      const decoded = jwt.verify(token, secret);
      req.user = decoded.user;
      return next();
    } catch (err) {
      // Try the next secret.
    }
  }

  return res.status(401).json({ msg: 'Token is not valid' });
};