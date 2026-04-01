import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { getVegetableIcon } from "../utils/vegetableIcons";
import { formatINR, toSafeNumber } from "../utils/formatters";
import { API_URL } from "../lib/api";

function OrderForm() {
  const [vegetables, setVegetables] = useState([]);
  const [selectedVegetable, setSelectedVegetable] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState(null); // 🔥 NEW
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    axios.get(`${API_URL}/vegetables`)
      .then(res => setVegetables(res.data))
      .catch(() => alert("Error loading vegetables"));
  }, []);

  // 🔥 GET CUSTOMER LOCATION
  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setLocation({
          type: "Point",
          coordinates: [lng, lat],
        });

        alert("✅ Location captured");
      },
      () => {
        alert("❌ Location permission denied");
      }
    );
  };

  const addToCart = () => {
    if (!selectedVegetable) return alert("Select vegetable");

    const veg = vegetables.find(v => v._id === selectedVegetable);

    setCart([...cart, { ...veg, quantity }]);
    setQuantity(1);
    setSelectedVegetable("");
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return alert("Cart empty");
    if (!deliveryAddress) return alert("Enter address");
    if (!location) return alert("Click 'Use My Location' first"); // 🔥 IMPORTANT

    try {
      const orderItems = cart.map(item => ({
        vegetableId: item._id,
        quantity: item.quantity
      }));

      await axios.post(
        `${API_URL}/orders`,
        {
          orderItems,
          deliveryAddress,
          notes,
          location // 🔥 NEW
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert("✅ Order placed successfully");
      setCart([]);
      setDeliveryAddress("");
      setNotes("");
      setLocation(null);
      navigate("/customer-orders");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">

      <h1 className="text-3xl font-bold mb-4">🛒 Order Vegetables</h1>

      {/* Select Vegetable */}
      <select
        value={selectedVegetable}
        onChange={(e) => setSelectedVegetable(e.target.value)}
        className="w-full p-2 border mb-3"
      >
        <option value="">Select vegetable</option>
        {vegetables.map(v => (
          <option key={v._id} value={v._id}>
            {v.name} - ₹{v.price}
          </option>
        ))}
      </select>

      {/* Quantity */}
      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        className="w-full p-2 border mb-3"
      />

      <button onClick={addToCart} className="bg-green-500 text-white px-4 py-2">
        Add to Cart
      </button>

      {/* Cart */}
      <div className="mt-4">
        {cart.map(item => (
          <div key={item._id}>
            {item.name} - {item.quantity}kg
          </div>
        ))}
      </div>

      {/* Address */}
      <textarea
        placeholder="Delivery Address"
        value={deliveryAddress}
        onChange={(e) => setDeliveryAddress(e.target.value)}
        className="w-full p-2 border mt-4"
      />

      {/* 🔥 LOCATION BUTTON */}
      <button
        onClick={getLocation}
        className="bg-blue-500 text-white px-4 py-2 mt-3 w-full"
      >
        📍 Use My Location
      </button>

      {/* Place Order */}
      <button
        onClick={handlePlaceOrder}
        className="bg-black text-white px-4 py-3 mt-4 w-full"
      >
        Place Order
      </button>
    </div>
  );
}

export default OrderForm;