const getVegetableEmoji = require("../utils/getVegetableEmoji");

const defaults = [
  { name: "Tomato", category: "Vegetable", price: 30, season: "summer" },
  { name: "Potato", category: "Root", price: 25, season: "winter" },
  { name: "Onion", category: "Bulb", price: 28, season: "winter" },
  { name: "Carrot", category: "Root", price: 40, season: "winter" },
  { name: "Cabbage", category: "Leafy", price: 35, season: "winter" },
  { name: "Cauliflower", category: "Vegetable", price: 45, season: "winter" },
  { name: "Brinjal", category: "Vegetable", price: 38, season: "summer" },
  { name: "Spinach", category: "Leafy", price: 20, season: "winter" },
  { name: "Cucumber", category: "Vegetable", price: 30, season: "summer" },
  { name: "Capsicum", category: "Vegetable", price: 60, season: "summer" },
  { name: "Bottle Gourd", category: "Gourd", price: 32, season: "summer" },
  { name: "Lady Finger", category: "Vegetable", price: 42, season: "summer" }
];

module.exports = defaults.map((item) => ({
  ...item,
  emoji: getVegetableEmoji(item.name),
  isActive: true
}));
