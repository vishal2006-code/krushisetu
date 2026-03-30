const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "User not found." });
      }

      next();
    } else {
      return res.status(401).json({ message: "Not authorized. Token missing." });
    }
  } catch (error) {
    console.error("Auth Error:", error.message);
    return res.status(401).json({ message: "Invalid token." });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: "User role is missing." });
    }

    const userRole = req.user.role.toLowerCase();
    const allowedRoles = roles.map((role) => role.toLowerCase());

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: `Access denied: role "${req.user.role}" does not have permission.`
      });
    }

    next();
  };
};

module.exports = { protect, authorizeRoles };
