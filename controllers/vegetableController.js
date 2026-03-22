const Vegetable = require("../models/Vegetable");
const getVegetableEmoji = require("../utils/getVegetableEmoji");
const defaultVegetables = require("../config/defaultVegetables");

async function ensureDefaultVegetables() {
  const existing = await Vegetable.find({}, "name").lean();
  const existingNames = new Set(existing.map((item) => item.name.toLowerCase()));
  const missing = defaultVegetables.filter((item) => !existingNames.has(item.name.toLowerCase()));

  if (missing.length > 0) {
    await Vegetable.insertMany(missing, { ordered: false });
  }
}

exports.addVegetable = async (req, res) => {
  try {
    const { name, category, price, emoji, image, season } = req.body;

    if (!name || !category || !price || price <= 0) {
      return res.status(400).json({ message: "Name, category, and valid price are required" });
    }

    const vegetable = await Vegetable.create({
      name: name.trim(),
      category: category.trim(),
      price: Number(price),
      emoji: getVegetableEmoji(name, emoji),
      image,
      season
    });

    res.status(201).json({
      message: "Vegetable added successfully",
      vegetable
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: "Vegetable name already exists" });
      return;
    }

    res.status(500).json({ message: error.message });
  }
};

exports.getVegetables = async (req, res) => {
  try {
    await ensureDefaultVegetables();
    const vegetables = await Vegetable.find({ isActive: true });
    res.status(200).json(vegetables);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.searchVegetables = async (req, res) => {
  try {
    await ensureDefaultVegetables();
    const { search, category, priceMin, priceMax, season, sortBy = "name" } = req.query;
    const filter = { isActive: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } }
      ];
    }

    if (category) {
      filter.category = { $regex: category, $options: "i" };
    }

    if (season) {
      filter.season = { $regex: season, $options: "i" };
    }

    if (priceMin || priceMax) {
      filter.price = {};
      if (priceMin) filter.price.$gte = Number(priceMin);
      if (priceMax) filter.price.$lte = Number(priceMax);
    }

    let sortQuery = {};
    switch (sortBy) {
      case "price_low":
        sortQuery = { price: 1 };
        break;
      case "price_high":
        sortQuery = { price: -1 };
        break;
      case "newest":
        sortQuery = { createdAt: -1 };
        break;
      case "name":
      default:
        sortQuery = { name: 1 };
    }

    const vegetables = await Vegetable.find(filter).sort(sortQuery);

    res.json({
      count: vegetables.length,
      vegetables,
      filters: {
        search,
        category,
        priceMin,
        priceMax,
        season,
        sortBy
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const vegetables = await Vegetable.find({
      category: { $regex: category, $options: "i" },
      isActive: true
    });

    res.json({
      category,
      count: vegetables.length,
      vegetables
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSeasonalVegetables = async (req, res) => {
  try {
    const currentMonth = new Date().getMonth() + 1;
    const seasonMap = {
      1: "winter", 2: "winter", 3: "spring",
      4: "spring", 5: "summer", 6: "summer",
      7: "summer", 8: "monsoon", 9: "monsoon",
      10: "autumn", 11: "autumn", 12: "winter"
    };

    const currentSeason = seasonMap[currentMonth];

    const vegetables = await Vegetable.find({
      season: { $regex: currentSeason, $options: "i" },
      isActive: true
    });

    res.json({
      season: currentSeason,
      month: currentMonth,
      count: vegetables.length,
      vegetables
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
