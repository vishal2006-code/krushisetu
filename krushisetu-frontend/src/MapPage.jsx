import { useEffect, useState } from "react";
import axios from "axios";
import FarmersMap from "./components/FarmersMap";
import { API_URL } from "./lib/api";

function MapPage() {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API_URL}/farmers/all`)
      .then((res) => {
        setFarmers(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    // 🔥 h-screen मुळे मॅप पूर्ण स्क्रीन व्यापेल
    <div className="relative h-[calc(100vh-80px)] md:h-screen w-full overflow-hidden bg-slate-50">
      
      {/* Floating Header */}
      <div className="absolute top-6 left-1/2 z-[1000] -translate-x-1/2">
        <div className="flex items-center gap-3 rounded-full border border-emerald-100 bg-white/90 px-6 py-3 shadow-2xl backdrop-blur-md">
          <span className="flex h-3 w-3 animate-pulse rounded-full bg-emerald-500"></span>
          <h2 className="text-sm font-black uppercase tracking-widest text-emerald-900 md:text-base">
            Live Farmers Network Map
          </h2>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
            {farmers.length} Farmers Online
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex h-full items-center justify-center text-slate-400">
          Fetching coordinates...
        </div>
      ) : (
        <div className="h-full w-full p-4 md:p-6">
           <FarmersMap farmers={farmers} />
        </div>
      )}
    </div>
  );
}

export default MapPage;