const mongoose = require("mongoose");

const PRODUCT_CATEGORIES = ["vegetable", "grain", "fruit"];
const PRODUCT_UNITS = ["kg", "quintal"];

const vegetableSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      enum: PRODUCT_CATEGORIES,
      lowercase: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      enum: PRODUCT_UNITS,
      default: "kg"
    },
    image: {
      type: String,
      default: ""
    },
    emoji: {
      type: String,
      default: "🥬"
    },
    season: {
      type: String
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

vegetableSchema.statics.PRODUCT_CATEGORIES = PRODUCT_CATEGORIES;
vegetableSchema.statics.PRODUCT_UNITS = PRODUCT_UNITS;

module.exports = mongoose.model("Vegetable", vegetableSchema);
