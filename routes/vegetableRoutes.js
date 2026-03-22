const express = require("express");
const { addVegetable, getVegetables, searchVegetables, getByCategory, getSeasonalVegetables } = require("../controllers/vegetableController");
const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

const router = express.Router();

// Admin only
router.post("/", addVegetable);

// Public routes
router.get("/", getVegetables);
router.get("/search", searchVegetables);
router.get("/category/:category", getByCategory);
router.get("/seasonal", getSeasonalVegetables);

module.exports = router;