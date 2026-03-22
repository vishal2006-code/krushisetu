const Favorite = require("../models/Favorite");
const Vegetable = require("../models/Vegetable");

// Add to favorites
exports.addFavorite = async (req, res) => {
  try {
    const { vegetableId } = req.body;
    const customerId = req.user._id;

    const vegetable = await Vegetable.findById(vegetableId);
    if (!vegetable) {
      return res.status(404).json({ message: "Vegetable not found" });
    }

    const favorite = await Favorite.findOneAndUpdate(
      { customer: customerId, vegetable: vegetableId },
      { 
        customer: customerId, 
        vegetable: vegetableId 
      },
      { upsert: true, new: true }
    );

    res.status(201).json({
      message: "Added to favorites ❤️",
      favorite
    });

  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: "Already in favorites" });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// Remove from favorites
exports.removeFavorite = async (req, res) => {
  try {
    const { vegetableId } = req.params;
    const customerId = req.user._id;

    const favorite = await Favorite.findOneAndDelete({
      customer: customerId,
      vegetable: vegetableId
    });

    if (!favorite) {
      return res.status(404).json({ message: "Favorite not found" });
    }

    res.json({ message: "Removed from favorites" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get customer favorites
exports.getCustomerFavorites = async (req, res) => {
  try {
    const customerId = req.user._id;

    const favorites = await Favorite.find({ customer: customerId })
      .populate("vegetable", "name price emoji category image")
      .populate("farmer", "name phone email city")
      .sort({ createdAt: -1 });

    res.json(favorites);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Check if vegetable is favorited
exports.isFavorited = async (req, res) => {
  try {
    const { vegetableId } = req.params;
    const customerId = req.user._id;

    const favorite = await Favorite.findOne({
      customer: customerId,
      vegetable: vegetableId
    });

    res.json({ isFavorited: !!favorite });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update favorite notes
exports.updateFavoriteNotes = async (req, res) => {
  try {
    const { vegetableId } = req.params;
    const { notes } = req.body;
    const customerId = req.user._id;

    const favorite = await Favorite.findOneAndUpdate(
      { customer: customerId, vegetable: vegetableId },
      { notes },
      { new: true }
    );

    if (!favorite) {
      return res.status(404).json({ message: "Favorite not found" });
    }

    res.json({
      message: "Notes updated",
      favorite
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
