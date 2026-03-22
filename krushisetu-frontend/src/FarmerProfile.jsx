import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./context/useAuth";
import { getVegetableIcon } from "./utils/vegetableIcons";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function FarmerProfile() {
  const [vegetables, setVegetables] = useState([]);
  const [selectedCrops, setSelectedCrops] = useState([]);
  const [village, setVillage] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { token } = useAuth();

  useEffect(() => {
    axios.get(`${API_URL}/vegetables`)
      .then(res => setVegetables(res.data))
      .catch(err => console.error("Error fetching vegetables", err));
  }, []);

  const handleUpdate = async () => {
    if (selectedCrops.length === 0) {
      setMessage("Please select at least one crop!");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const payload = {
        cropsAvailable: selectedCrops,
        village,
        city,
        latitude: 19.99,
        longitude: 73.78
      };

      await axios.post(
        `${API_URL}/farmers/profile`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage("✅ Crops updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("Error: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const toggleCrop = (id) => {
    setSelectedCrops(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-green-700 mb-2">🌾 Farm Profile</h1>
          <p className="text-gray-600 mb-8">Manage your farm details and available crops</p>

          {message && (
            <div className={`p-4 rounded-lg mb-6 ${message.includes("✅") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {message}
            </div>
          )}

          {/* Location Info */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📍 Location Details</h2>
            <input 
              type="text" 
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="City" 
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <input 
              type="text" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Village/Address" 
              value={village}
              onChange={(e) => setVillage(e.target.value)}
            />
          </div>

          {/* Crops Selection */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">🥕 Available Crops</h2>
            <p className="text-gray-600 mb-4">Select the crops you grow:</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {vegetables.map(veg => (
                <button
                  key={veg._id}
                  onClick={() => toggleCrop(veg._id)}
                  className={`p-4 rounded-lg border-2 font-bold transition-all ${
                    selectedCrops.includes(veg._id)
                      ? "border-green-600 bg-green-100 text-green-700"
                      : "border-gray-300 bg-white text-gray-700 hover:border-green-400"
                  }`}
                >
                  <span className="text-2xl block mb-2">{getVegetableIcon(veg.name, veg.emoji)}</span>
                  {veg.name}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Crops Summary */}
          {selectedCrops.length > 0 && (
            <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 font-semibold">
                Selected: {selectedCrops.length} crop(s)
              </p>
            </div>
          )}

          {/* Update Button */}
          <button 
            onClick={handleUpdate}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-lg font-bold text-lg hover:shadow-lg disabled:opacity-50 transition"
          >
            {loading ? "Updating..." : "✅ Update Farm Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default FarmerProfile;


