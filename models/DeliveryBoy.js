const mongoose = require("mongoose");

const deliveryBoySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["pickup", "delivery"],
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

deliveryBoySchema.index({ location: "2dsphere" });

module.exports = mongoose.model("DeliveryBoy", deliveryBoySchema);
