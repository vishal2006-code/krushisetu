import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./context/useAuth";
import { getVegetableIcon } from "./utils/vegetableIcons";
import { API_URL } from "./lib/api";

function FarmerProfile() {
  const [vegetables, setVegetables] = useState([]);
  const [selectedCrops, setSelectedCrops] = useState([]);
  const [village, setVillage] = useState("");
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  // 🔥 FETCH VEGETABLES
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

        if (!lat || !lng) {
          alert("❌ Invalid coordinates");
          return;
        }

        const loc = {
          type: "Point",
          coordinates: [Number(lng), Number(lat)]
        };

        console.log("✅ LOCATION SET:", loc);
        setLocation(loc);

        alert("✅ Location fetched");
      },
      (err) => {
        console.error(err);
        alert("❌ Location error");
      }
    );
  };

  // 🔥 UPDATE PROFILE
  const handleUpdate = async () => {
    if (!location || !location.coordinates) {
      alert("❌ Please fetch location first");
      return;
    }

    if (selectedCrops.length === 0) {
      alert("❌ Select at least one crop");
      return;
    }

    const payload = {
      cropsAvailable: selectedCrops,
      village,
      location
    };

    console.log("🚀 PAYLOAD:", payload);

    try {
      setLoading(true);

      await axios.post(
        `${API_URL}/farmers/profile`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert("✅ Profile updated successfully");

    } catch (err) {
      console.error(err);
      alert("❌ Error saving profile");
    } finally {
      setLoading(false);
    }
  };

  const toggleCrop = (id) => {
    setSelectedCrops(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">

          <h1 className="text-3xl font-bold text-green-700 mb-6">
            🌾 Farmer Profile
          </h1>

          {/* LOCATION */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Village / Address"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              className="w-full p-3 border rounded-lg mb-3"
            />

            <button
              onClick={getLocation}
              className="w-full bg-blue-500 text-white py-2 rounded-lg"
            >
              📍 Get Location
            </button>
          </div>

          {/* CROPS */}
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3">🥕 Select Crops</h2>

            <div className="grid grid-cols-2 gap-3">
              {vegetables.map(veg => (
                <button
                  key={veg._id}
                  onClick={() => toggleCrop(veg._id)}
                  className={`p-3 border rounded-lg ${
                    selectedCrops.includes(veg._id)
                      ? "bg-green-100 border-green-500"
                      : "bg-white"
                  }`}
                >
                  <span className="text-xl">
                    {getVegetableIcon(veg.name, veg.emoji)}
                  </span>
                  <div>{veg.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* SUBMIT */}
          <button
            onClick={handleUpdate}
            disabled={loading || !location}
            className="w-full bg-green-600 text-white py-3 rounded-lg"
          >
            {loading ? "Updating..." : "✅ Update Profile"}
          </button>

        </div>
      </div>
    </div>
  );
}

export default FarmerProfile;