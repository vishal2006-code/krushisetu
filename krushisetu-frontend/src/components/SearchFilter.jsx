import { useState } from "react";

function SearchFilter({ onSearch, onFilter }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    priceMin: "",
    priceMax: "",
    season: "",
    sortBy: "name"
  });

  const handleSearch = (value) => {
    setSearchTerm(value);
    onSearch(value);
  };

  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const categories = ["Vegetable", "Leafy", "Root", "Fruity"];
  const seasons = ["summer", "monsoon", "winter", "spring", "autumn"];
  const sortOptions = [
    { value: "name", label: "Name (A-Z)" },
    { value: "price_low", label: "Price (Low to High)" },
    { value: "price_high", label: "Price (High to Low)" },
    { value: "newest", label: "Newest First" }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">🔍 Search & Filter</h2>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search vegetables by name..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-lg"
        />
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange("category", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Price Min */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Min Price (₹)</label>
          <input
            type="number"
            placeholder="Min"
            value={filters.priceMin}
            onChange={(e) => handleFilterChange("priceMin", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Price Max */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Max Price (₹)</label>
          <input
            type="number"
            placeholder="Max"
            value={filters.priceMax}
            onChange={(e) => handleFilterChange("priceMax", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Season Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Season</label>
          <select
            value={filters.season}
            onChange={(e) => handleFilterChange("season", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Seasons</option>
            {seasons.map(season => (
              <option key={season} value={season}>{season}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Sort Options */}
      <div className="mt-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
        <div className="flex gap-2 flex-wrap">
          {sortOptions.map(option => (
            <button
              key={option.value}
              onClick={() => handleFilterChange("sortBy", option.value)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filters.sortBy === option.value
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SearchFilter;

