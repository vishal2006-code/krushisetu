const jwt = require("jsonwebtoken");
const User = require("../models/User");

// १. युजर ओळखण्यासाठी (Authentication)
const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // युजर डेटाबेसमध्ये शोधा
      req.user = await User.findById(decoded.id).select("-password");
      
      if (!req.user) {
        return res.status(401).json({ message: "युजर सापडला नाही!" });
      }
      next();
    } else {
      return res.status(401).json({ message: "लॉगिन केलेले नाही, टोकन सापडले नाही." });
    }
  } catch (error) {
    console.error("Auth Error:", error.message);
    return res.status(401).json({ message: "टोकन इनव्हॅलिड आहे." });
  }
};

// २. अधिकार तपासण्यासाठी (Authorization) - Case-Insensitive Fix
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: "तुमची भूमिका (Role) स्पष्ट नाही." });
    }

    // डेटाबेस मधील रोल आणि परमिशन दोन्ही लहान लिपीत (lowercase) तपासा
    const userRole = req.user.role.toLowerCase();
    const allowedRoles = roles.map(r => r.toLowerCase());

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: `प्रवेश नाकारला: तुमची भूमिका (${req.user.role}) यासाठी पात्र नाही.`
      });
    }
    next();
  };
};

// दोन्ही फंक्शन्स एकत्र एक्सपोर्ट करा
module.exports = { protect, authorizeRoles };