const mongoose = require("mongoose");

const farmerProfileSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    cropsAvailable: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vegetable"
      }
    ],
    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point"
    },
    coordinates: {
        type: [Number]  // [longitude, latitude]
    }
},

    village: {
      type: String
    },

    averageRating: {
      type: Number,
      default: 0
    },

    totalRatings: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);
farmerProfileSchema.index({ location: "2dsphere" });
module.exports = mongoose.model("FarmerProfile", farmerProfileSchema);
