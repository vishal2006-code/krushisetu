const iconMap = [
  { keywords: ["tomato"], icon: "🍅" },
  { keywords: ["potato", "aloo"], icon: "🥔" },
  { keywords: ["onion"], icon: "🧅" },
  { keywords: ["carrot", "gajar"], icon: "🥕" },
  { keywords: ["brinjal", "eggplant", "baingan"], icon: "🍆" },
  { keywords: ["chili", "chilli", "pepper", "mirchi"], icon: "🌶️" },
  { keywords: ["corn", "maize", "makka"], icon: "🌽" },
  { keywords: ["cucumber", "kakdi"], icon: "🥒" },
  { keywords: ["broccoli", "cauliflower", "gobi"], icon: "🥦" },
  { keywords: ["garlic", "lahsun"], icon: "🧄" },
  { keywords: ["spinach", "palak", "methi", "leaf", "cabbage", "coriander"], icon: "🥬" },
  { keywords: ["pumpkin", "kaddu"], icon: "🎃" },
  { keywords: ["peas", "pea", "matar", "okra", "bhindi"], icon: "🫛" },
  { keywords: ["ginger", "adrak"], icon: "🫚" },
  { keywords: ["mushroom"], icon: "🍄" },
  { keywords: ["radish", "mooli"], icon: "🌱" },
  { keywords: ["beetroot", "beet"], icon: "🫜" },
  { keywords: ["bottle gourd", "lauki", "dudhi", "ridge gourd", "turai"], icon: "🥒" },
  { keywords: ["capsicum", "bell pepper"], icon: "🫑" }
];

const genericIcons = new Set(["🥬", "🥦", "🥕", "🫛", "🌱"]);

export function getVegetableIcon(name, emoji) {
  const normalizedName = String(name || "").toLowerCase().trim();
  const matched = iconMap.find((entry) => entry.keywords.some((keyword) => normalizedName.includes(keyword)));

  if (matched) {
    return matched.icon;
  }

  if (emoji && !genericIcons.has(emoji)) {
    return emoji;
  }

  return emoji || "🥬";
}

