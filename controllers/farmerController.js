const FarmerProfile = require("../models/FarmerProfile");

exports.updateFarmerProfile = async (req, res) => {
  try {
    const { cropsAvailable, village, latitude, longitude } = req.body;

    let profile = await FarmerProfile.findOne({ farmer: req.user._id });

    const locationData = {
      type: "Point",
      coordinates: [longitude, latitude]
    };

    if (profile) {
      profile.cropsAvailable = cropsAvailable;
      profile.village = village;
      profile.location = locationData;
      await profile.save();
    } else {
      profile = await FarmerProfile.create({
        farmer: req.user._id,
        cropsAvailable,
        village,
        location: locationData
      });
    }

    const populatedProfile = await FarmerProfile.findById(profile._id)
      .populate("cropsAvailable", "name emoji category price")
      .populate("farmer", "name email phone city village");

    res.status(200).json({
      message: "Farmer profile updated successfully",
      profile: populatedProfile
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
