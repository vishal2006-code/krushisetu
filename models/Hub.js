const mongoose = require("mongoose");

const hubSchema = new mongoose.Schema({
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    unique: true,
    sparse: true
  },
  hubName: String,
  name: String,
  location: {
    type: {
      type: String,
      default: "Point"
    },
    coordinates: [Number]
  }
});

hubSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Hub", hubSchema);
