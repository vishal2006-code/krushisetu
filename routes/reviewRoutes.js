const express = require("express");
const router = express.Router();
const { 
  createReview, 
  getFarmerReviews, 
  getFarmerStats, 
  deleteReview 
} = require("../controllers/reviewController");
const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

// Customer routes
router.post("/", protect, authorizeRoles("customer"), createReview);
router.delete("/:reviewId", protect, authorizeRoles("customer"), deleteReview);

// Public routes
router.get("/farmer/:farmerId", getFarmerReviews);

// Farmer routes
router.get("/stats/my-stats", protect, authorizeRoles("farmer"), getFarmerStats);

module.exports = router;
