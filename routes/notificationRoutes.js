const express = require("express");
const router = express.Router();
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
} = require("../controllers/notificationController");
const { protect } = require("../middlewares/authMiddleware");

// All notification routes require authentication
// Specific routes first to avoid conflicts
router.get("/unread", protect, getUnreadCount);
router.put("/read-all", protect, markAllAsRead);
router.put("/:notificationId/read", protect, markAsRead);
router.delete("/:notificationId", protect, deleteNotification);
// Generic routes last
router.get("/", protect, getUserNotifications);

module.exports = router;
