const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        message: "Access denied: User role not found"
      });
    }

    // Case-insensitive role comparison
    const userRole = req.user.role.toLowerCase();
    const allowedRoles = roles.map(r => r.toLowerCase());

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: `Access denied: Your role (${req.user.role}) does not have permission`
      });
    }
    next();
  };
};

module.exports = { authorizeRoles };