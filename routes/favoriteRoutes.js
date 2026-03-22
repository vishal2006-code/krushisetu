const express = require("express");
const router = express.Router();
const {
  addFavorite,
  removeFavorite,
  getCustomerFavorites,
  isFavorited,
  updateFavoriteNotes
} = require("../controllers/favoriteController");
const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

// All favorite routes require authentication and customer role
// Specific routes first to avoid conflicts
router.get("/check/:vegetableId", protect, authorizeRoles("customer"), isFavorited);
router.put("/:vegetableId/notes", protect, authorizeRoles("customer"), updateFavoriteNotes);
router.delete("/:vegetableId", protect, authorizeRoles("customer"), removeFavorite);
// Generic routes last
router.post("/", protect, authorizeRoles("customer"), addFavorite);
router.get("/", protect, authorizeRoles("customer"), getCustomerFavorites);

module.exports = router;
