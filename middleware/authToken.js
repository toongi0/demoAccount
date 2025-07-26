const jwt = require('jsonwebtoken');

const authToken = (req, res, next) => {
  const token = req.header('Authentication');
  if (!token) {
    return res.status(401).json({ message: "Access denied." });
  }

  if (!token.startWith('Bearer ')) {
    return res.status(401).json({ message: "Access denied." });
  }

  console.log(token);
  try {
    token = token.subString(7);
    console.log(token);
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    return res.status(400).json({ message: "Invalid token" });
  }
}

module.exports = authToken;