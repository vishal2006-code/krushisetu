const FarmerProfile = require("../models/FarmerProfile");

exports.updateFarmerProfile = async (req, res) => {
  try {
    const { cropsAvailable, city, village, location, latitude, longitude } = req.body;

    console.log("REQ BODY:", req.body);

    const coordinates = Array.isArray(location?.coordinates)
      ? location.coordinates
      : [Number(longitude), Number(latitude)];

    if (
      !Array.isArray(coordinates) ||
      coordinates.length !== 2 ||
      Number.isNaN(coordinates[0]) ||
      Number.isNaN(coordinates[1])
    ) {
      return res.status(400).json({
        message: "Valid numeric location required"
      });
    }

    let farmerProfile = await FarmerProfile.findOne({ farmer: req.user._id });

    if (!farmerProfile) {
      farmerProfile = new FarmerProfile({
        farmer: req.user._id
      });
    }

    farmerProfile.cropsAvailable = Array.isArray(cropsAvailable) ? cropsAvailable : [];
    farmerProfile.village = village;
    farmerProfile.location = {
      type: "Point",
      coordinates
    };

    await farmerProfile.save();

    res.json({
      message: "Profile updated successfully",
      farmerProfile
    });
  } catch (error) {
    console.error("Farmer profile update error:", error);
    res.status(500).json({
      message: error.message,
      ...(process.env.NODE_ENV === "development"
        ? {
            name: error.name,
            stack: error.stack
          }
        : {})
    });
  }
};

exports.getMyFarmerProfile = async (req, res) => {
  try {
    const profile = await FarmerProfile.findOne({ farmer: req.user._id })
      .populate("cropsAvailable", "name emoji category price")
      .populate("farmer", "name email phone city village");

    res.status(200).json({
      profile: profile || null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
