const express = require("express");
const { getMyFarmerProfile, updateFarmerProfile } = require("../controllers/farmerController");
const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

const router = express.Router();

router.get(
  "/profile/me",
  protect,
  authorizeRoles("farmer"),
  getMyFarmerProfile
);

router.post(
  "/profile",
  protect,
  authorizeRoles("farmer"),
  updateFarmerProfile
);

module.exports = router;
