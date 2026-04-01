import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./context/useAuth";
import { getVegetableIcon } from "./utils/vegetableIcons";
import { API_URL } from "./lib/api";

function FarmerProfile() {
  const [vegetables, setVegetables] = useState([]);
  const [selectedCrops, setSelectedCrops] = useState([]);
  const [village, setVillage] = useState("");
  const [city, setCity] = useState("");
  const [location, setLocation] = useState(null); // 🔥 NEW
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { token } = useAuth();

  useEffect(() => {
    axios.get(`${API_URL}/vegetables`)
      .then(res => setVegetables(res.data))
      .catch(err => console.error("Error fetching vegetables", err));
  }, []);

  // 🔥 GET GPS LOCATION
  const getLocation = () => {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      // 🔥 VALIDATION
      if (!lat || !lng) {
        alert("❌ Failed to get valid coordinates");
        return;
      }

      const loc = {
        type: "Point",
        coordinates: [Number(lng), Number(lat)]
      };

      console.log("SET LOCATION:", loc);

      setLocation(loc);

      alert("✅ Location fetched");
    },
    (err) => {
      console.error(err);
      alert("❌ Location error");
    }
  );
};
const handleUpdate = async () => {

  // 🔥 WAIT FIX
  if (
  !location ||
  !location.coordinates ||
  typeof location.coordinates[0] !== "number" ||
  typeof location.coordinates[1] !== "number"
) {
  alert("❌ Invalid location. Please fetch again.");
  return;
}

  console.log("FINAL LOCATION:", location);

  const payload = {
    cropsAvailable: selectedCrops,
    village,
    city,
    location
  };

  try {
    await axios.post(
      `${API_URL}/farmers/profile`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    alert("✅ Profile updated");
  } catch (err) {
    console.error(err);
    alert("❌ Error saving profile");
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

          {/* Location */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📍 Location Details</h2>

            <input
              type="text"
              className="w-full p-3 border rounded-lg mb-4"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />

            <input
              type="text"
              className="w-full p-3 border rounded-lg"
              placeholder="Village/Address"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
            />

            {/* 🔥 BUTTON */}
            <button
              onClick={getLocation}
              className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg"
            >
              📍 Get Current Location
            </button>
          </div>

          {/* Crops */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">🥕 Available Crops</h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {vegetables.map(veg => (
                <button
                  key={veg._id}
                  onClick={() => toggleCrop(veg._id)}
                  className={`p-4 rounded-lg border-2 ${
                    selectedCrops.includes(veg._id)
                      ? "border-green-600 bg-green-100"
                      : "border-gray-300"
                  }`}
                >
                  <span className="text-2xl block mb-2">
                    {getVegetableIcon(veg.name, veg.emoji)}
                  </span>
                  {veg.name}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleUpdate}
            disabled={loading}
            className="w-full bg-green-500 text-white py-4 rounded-lg"
          >
            {loading ? "Updating..." : "✅ Update Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default FarmerProfile;