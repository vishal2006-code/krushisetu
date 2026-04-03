const getVegetableEmoji = require("../utils/getVegetableEmoji");

const defaults = [
  { name: "Tomato", category: "vegetable", price: 30, season: "summer", unit: "kg" },
  { name: "Potato", category: "vegetable", price: 25, season: "winter", unit: "kg" },
  { name: "Onion", category: "vegetable", price: 28, season: "winter", unit: "kg" },
  { name: "Carrot", category: "vegetable", price: 40, season: "winter", unit: "kg" },
  { name: "Cabbage", category: "vegetable", price: 35, season: "winter", unit: "kg" },
  { name: "Cauliflower", category: "vegetable", price: 45, season: "winter", unit: "kg" },
  { name: "Brinjal", category: "vegetable", price: 38, season: "summer", unit: "kg" },
  { name: "Spinach", category: "vegetable", price: 20, season: "winter", unit: "kg" },
  { name: "Cucumber", category: "vegetable", price: 30, season: "summer", unit: "kg" },
  { name: "Capsicum", category: "vegetable", price: 60, season: "summer", unit: "kg" },
  { name: "Bottle Gourd", category: "vegetable", price: 32, season: "summer", unit: "kg" },
  { name: "Lady Finger", category: "vegetable", price: 42, season: "summer", unit: "kg" },
  { name: "Wheat", category: "grain", price: 32, season: "winter", unit: "quintal", emoji: "🌾" },
  { name: "Bajra", category: "grain", price: 55, season: "winter", unit: "kg", emoji: "🥣" },
  { name: "Jowar", category: "grain", price: 48, season: "winter", unit: "kg", emoji: "🌽" },
  { name: "Apple", category: "fruit", price: 140, season: "autumn", unit: "kg", emoji: "🍎" },
  { name: "Banana", category: "fruit", price: 45, season: "summer", unit: "kg", emoji: "🍌" }
];

module.exports = defaults.map((item) => ({
  ...item,
  emoji: item.emoji || getVegetableEmoji(item.name),
  isActive: true
}));
