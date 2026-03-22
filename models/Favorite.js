const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    vegetable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vegetable",
      required: true
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    notes: {
      type: String,
      maxlength: 200
    },
    lastOrdered: Date,
    orderCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Ensure one favorite per customer-vegetable pair
favoriteSchema.index({ customer: 1, vegetable: 1 }, { unique: true });

module.exports = mongoose.model("Favorite", favoriteSchema);
