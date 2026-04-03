const Vegetable = require("../models/Vegetable");
const getVegetableEmoji = require("../utils/getVegetableEmoji");
const defaultVegetables = require("../config/defaultVegetables");

const CATEGORY_ALIASES = {
  vegetable: "vegetable",
  vegetables: "vegetable",
  root: "vegetable",
  leafy: "vegetable",
  bulb: "vegetable",
  gourd: "vegetable",
  fruity: "fruit",
  fruit: "fruit",
  fruits: "fruit",
  grain: "grain",
  grains: "grain"
};

function normalizeCategory(category) {
  const normalized = String(category || "")
    .trim()
    .toLowerCase();

  return CATEGORY_ALIASES[normalized] || "vegetable";
}

function normalizeUnit(unit) {
  return String(unit || "").trim().toLowerCase() === "quintal" ? "quintal" : "kg";
}

async function ensureDefaultVegetables() {
  await Vegetable.updateMany(
    { category: { $nin: ["vegetable", "grain", "fruit"] } },
    { $set: { category: "vegetable" } }
  );
  await Vegetable.updateMany(
    { unit: { $exists: false } },
    { $set: { unit: "kg" } }
  );

  const existing = await Vegetable.find({}, "name").lean();
  const existingNames = new Set(existing.map((item) => item.name.toLowerCase()));
  const missing = defaultVegetables.filter((item) => !existingNames.has(item.name.toLowerCase()));

  if (missing.length > 0) {
    await Vegetable.insertMany(missing, { ordered: false });
  }
}

exports.addVegetable = async (req, res) => {
  try {
    const { name, category, price, emoji, image, season, unit } = req.body;

    if (!name || !category || !price || price <= 0) {
      return res.status(400).json({ message: "Name, category, and valid price are required" });
    }

    const vegetable = await Vegetable.create({
      name: name.trim(),
      category: normalizeCategory(category),
      price: Number(price),
      unit: normalizeUnit(unit),
      emoji: getVegetableEmoji(name, emoji),
      image,
      season
    });

    res.status(201).json({
      message: "Product added successfully",
      vegetable
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: "Product name already exists" });
      return;
    }

    res.status(500).json({ message: error.message });
  }
};

exports.getVegetables = async (req, res) => {
  try {
    await ensureDefaultVegetables();
    const category = req.query.category ? normalizeCategory(req.query.category) : null;
    const filter = { isActive: true };

    if (category && req.query.category !== "all") {
      filter.category = category;
    }

    const vegetables = await Vegetable.find(filter).sort({ category: 1, name: 1 });
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

    if (category && category !== "all") {
      filter.category = normalizeCategory(category);
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

    const normalizedCategory = normalizeCategory(category);

    const vegetables = await Vegetable.find({ category: normalizedCategory, isActive: true });

    res.json({
      category: normalizedCategory,
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
