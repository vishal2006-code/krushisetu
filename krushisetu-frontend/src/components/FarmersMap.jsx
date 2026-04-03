import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css"; // CSS इम्पोर्ट करायला विसरू नकोस

function FarmersMap({ farmers }) {
  return (
    <MapContainer
      center={[18.5204, 73.8567]} // Pune default
      zoom={7}
      // 🔥 '500px' बदलून '100%' केलं आहे जेणेकरून तो पॅरेंट कंटेनरची पूर्ण हाईट घेईल
      style={{ height: "100%", width: "100%", borderRadius: "20px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {farmers.map((farmer) => {
        const lat = farmer.location?.coordinates?.[1];
        const lng = farmer.location?.coordinates?.[0];

        if (!lat || !lng) return null;

        return (
          <Marker key={farmer._id} position={[lat, lng]}>
            <Popup>
              <div className="p-2">
                <strong className="text-emerald-700">{farmer.farmer?.name || "Farmer"}</strong>
                <p className="text-xs text-slate-500">{farmer.city || "Nere, Pune"}</p>
                <p className="mt-1 text-[10px] font-bold uppercase text-emerald-600">
                  Rating: {farmer.averageRating || "N/A"} ⭐
                </p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

export default FarmersMap;