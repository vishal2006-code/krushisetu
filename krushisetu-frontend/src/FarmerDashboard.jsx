import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/useAuth";
import { API_URL } from "./lib/api";
import { getVegetableIcon } from "./utils/vegetableIcons";
import { formatINR } from "./utils/formatters";
import Chatbot from "./components/Chatbot";

function FarmerDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user, token } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setError(null);
        const res = await axios.get(`${API_URL}/orders/farmer`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(res.data || []);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load orders");
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await axios.put(
        `${API_URL}/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`Order ${newStatus} successfully updated!`);

      // update UI without reload
      setOrders(prev =>
        prev.map(order =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (err) {
      alert("Error updating status: " + err.message);
    }
  };

  // ---------------- LOADING ----------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="text-center p-12">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-2xl font-bold text-green-700">Loading your orders...</p>
        </div>
      </div>
    );
  }

  // ---------------- ERROR ----------------
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <p className="text-2xl font-bold text-red-600 mb-4">Error</p>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ---------------- MAIN UI ----------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-green-700 mb-2">
            Welcome, {user?.name}! 🌾
          </h1>
          <p className="text-gray-600">Manage your farm and orders</p>
        </div>

        {/* Layout (Orders + Chatbot) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT SIDE (Main content) */}
          <div className="lg:col-span-2">

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">📦 Listed Vegetables</h3>
                <p className="text-3xl font-bold text-green-600">0</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">📋 Pending Orders</h3>
                <p className="text-3xl font-bold text-blue-600">{orders.length}</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">💰 Total Earnings</h3>
                <p className="text-3xl font-bold text-orange-600">{formatINR(0, 0)}</p>
              </div>
            </div>

            {/* Action */}
            <div className="mb-12">
              <button
                onClick={() => navigate("/farmer-profile")}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition text-lg font-bold"
              >
                📝 Update Profile
              </button>
            </div>

            {/* Orders Section */}
            <h2 className="text-3xl font-bold text-gray-800 mb-8">📦 Orders</h2>

            {orders.length === 0 ? (
              <div className="bg-white text-center py-20 rounded-lg shadow-md">
                <div className="text-7xl mb-6">🌾</div>
                <h3 className="text-2xl font-bold text-gray-600">No orders yet</h3>
                <p className="text-gray-500 mt-2">
                  Keep your profile updated so customers can find you!
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {orders.map((order) => (
                  <div
                    key={order._id}
                    className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500"
                  >
                    <div className="flex flex-col lg:flex-row justify-between gap-6">

                      {/* Order Info */}
                      <div className="flex gap-6">
                        <div className="w-20 h-20 bg-green-100 rounded-lg flex items-center justify-center text-3xl">
                          {getVegetableIcon(order.vegetable?.name, order.vegetable?.emoji)}
                        </div>

                        <div>
                          <h3 className="text-2xl font-bold">
                            {order.vegetable?.name || "Unknown"}
                          </h3>
                          <p>Customer: {order.customer?.name}</p>
                          <p className="text-green-700 font-bold">
                            {order.quantity} kg
                          </p>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="flex items-center gap-4">
                        {order.status === "placed" ? (
                          <button
                            onClick={() => updateStatus(order._id, "accepted")}
                            className="bg-green-600 text-white px-4 py-2 rounded"
                          >
                            Accept
                          </button>
                        ) : (
                          <span className="text-green-600 font-bold">Accepted</span>
                        )}
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT SIDE (Chatbot) */}
          <div className="bg-white rounded-lg shadow-md p-4 h-fit">
            <Chatbot />
          </div>

        </div>
      </div>
    </div>
  );
}

export default FarmerDashboard;

