const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    type: {
      type: String,
      enum: ["order_placed", "order_accepted", "order_delivered", "payment_received", "new_vegetable", "review_received", "refund_issued"],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    data: {
      orderId: mongoose.Schema.Types.ObjectId,
      vegetableId: mongoose.Schema.Types.ObjectId,
      farmerId: mongoose.Schema.Types.ObjectId
    },
    read: {
      type: Boolean,
      default: false
    },
    readAt: Date,
    actionUrl: String
  },
  { timestamps: true }
);

// Index for faster queries
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
