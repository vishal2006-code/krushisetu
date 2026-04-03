const express = require("express");
const { registerUser, loginUser, updateProfile } = require("../controllers/authController");
const { authorizeRoles } = require("../middlewares/roleMiddleware");
const { body } = require("express-validator");

const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");

const registerValidation = [
  body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("phone").isMobilePhone().withMessage("Please provide a valid phone number"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role").isIn(["customer", "farmer", "delivery_boy", "hub_manager"]).withMessage("Role must be customer, farmer, delivery_boy, or hub_manager")
];

router.post("/register", registerValidation, registerUser);
router.post("/login", loginUser);
router.get("/me", protect, (req, res) => {
  res.json({
    message: "Protected route accessed successfully 🔐",
    user: req.user
  });
});
router.put("/me", protect, updateProfile);


// Farmer only route
router.get(
  "/farmer-dashboard",
  protect,
  authorizeRoles("farmer"),
  (req, res) => {
    res.json({
      message: "Welcome Farmer Dashboard 🌾",
      user: req.user
    });
  }
);
module.exports = router;
