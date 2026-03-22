const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    title: {
      type: String,
      trim: true,
      maxlength: 100
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500
    },
    category: {
      type: String,
      enum: ["quality", "delivery", "farmer", "vegetable"],
      default: "quality"
    },
    helpful: {
      type: Number,
      default: 0
    },
    isVerified: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Compound index to prevent duplicate reviews
reviewSchema.index({ order: 1, reviewer: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
