const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token;

    // 🔐 Check token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];

      // 🔍 Decode token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      console.log("DECODED:", decoded); // ✅ debug (keep for now)

      // 🔥 HANDLE BOTH CASES (id OR _id)
      const userId = decoded._id || decoded.id;

      if (!userId) {
        return res.status(401).json({ message: "Invalid token structure." });
      }

      // 🔍 Find user in DB
      req.user = await User.findById(userId).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "User not found." });
      }

      next();
    } else {
      return res.status(401).json({ message: "Not authorized. Token missing." });
    }
  } catch (error) {
    console.error("AUTH ERROR:", error.message);
    return res.status(401).json({ message: "Invalid token." });
  }
};

// 🔐 Role Middleware (SAFE)
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        message: "Unauthorized: user or role missing"
      });
    }

    const userRole = req.user.role.toLowerCase();
    const allowedRoles = roles.map(r => r.toLowerCase());

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: `Access denied: role "${req.user.role}" not allowed`
      });
    }

    next();
  };
};

module.exports = { protect, authorizeRoles };