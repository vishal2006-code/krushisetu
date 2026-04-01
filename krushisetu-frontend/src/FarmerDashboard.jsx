import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/useAuth";
import { API_URL } from "./lib/api";
import { getVegetableIcon } from "./utils/vegetableIcons";
import { formatINR } from "./utils/formatters";
import Chatbot from "./components/Chatbot";

function getRelevantItems(order, farmerId) {
  if (Array.isArray(order?.orderItems) && order.orderItems.length > 0) {
    return order.orderItems.filter((item) => {
      const itemFarmerId =
        typeof item?.farmer === "string" ? item.farmer : item?.farmer?._id;
      return !farmerId || itemFarmerId === farmerId;
    });
  }

  if (order?.vegetable) {
    return [
      {
        _id: `legacy-${order._id}`,
        vegetable: order.vegetable,
        quantity: order.quantity,
        status: order.status,
        farmer: order.assignedFarmer,
        price: order.totalAmount
      }
    ];
  }

  return [];
}

function FarmerDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user, token } = useAuth();

  // ✅ FIXED useEffect (NO double call)
  useEffect(() => {
    if (!token || !user || user.role !== "farmer") {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        setError(null);

        const res = await axios.get(`${API_URL}/orders/farmer`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log("ORDERS:", res.data); // debug

        setOrders(res.data || []);
      } catch (err) {
        console.error("FETCH ERROR:", err);
        setError(err.response?.data?.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

  }, [token]); // ❗ ONLY token (IMPORTANT)

  const updateItemStatus = async (orderId, itemId, newStatus) => {
    try {
      await axios.put(
        `${API_URL}/orders/${orderId}/items/${itemId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOrders(prev =>
        prev.map(order => {
          if (order._id === orderId) {
            const updatedItems = (order.orderItems || []).map(item =>
              item._id === itemId ? { ...item, status: newStatus } : item
            );
            return { ...order, orderItems: updatedItems };
          }
          return order;
        })
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

        <div className="mb-12">
          <h1 className="text-4xl font-bold text-green-700 mb-2">
            Welcome, {user?.name}! 🌾
          </h1>
          <p className="text-gray-600">Manage your farm and orders</p>
        </div>

        <h2 className="text-3xl font-bold text-gray-800 mb-8">📦 Orders</h2>

        {orders.length === 0 ? (
          <div className="bg-white text-center py-20 rounded-lg shadow-md">
            <div className="text-7xl mb-6">🌾</div>
            <h3 className="text-2xl font-bold text-gray-600">No orders yet</h3>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => {
              const visibleItems = getRelevantItems(order, user?._id);

              return (
                <div
                  key={order._id}
                  className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500"
                >
                  <div className="mb-4">
                    <h3 className="text-xl font-bold">Order #{order._id.slice(-6)}</h3>
                    <p>Customer: {order.customer?.name || "Customer unavailable"}</p>
                  </div>

                  <div className="space-y-4">
                    {visibleItems.length > 0 ? visibleItems.map((item) => {
                      const isLegacyItem = String(item._id || "").startsWith("legacy-");
                      return (
                        <div key={item._id} className="flex justify-between p-4 bg-gray-50 rounded-lg gap-4">
                          <div className="flex gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl">
                              {getVegetableIcon(item.vegetable?.name, item.vegetable?.emoji)}
                            </div>
                            <div>
                              <p className="font-bold">{item.vegetable?.name || "Unknown vegetable"}</p>
                              <p>{item.quantity || 0} kg</p>
                              <p>Status: {item.status || order.status}</p>
                              {!isLegacyItem ? (
                                <p className="text-sm text-gray-500">
                                  Price: {formatINR((item.price || 0) * (item.quantity || 0))}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          {!isLegacyItem && item.status === "assigned" ? (
                            <button
                              onClick={() => updateItemStatus(order._id, item._id, "accepted")}
                              className="bg-blue-600 text-white px-3 py-1 rounded h-fit"
                            >
                              Accept
                            </button>
                          ) : null}
                        </div>
                      );
                    }) : (
                      <div className="p-4 bg-gray-50 rounded-lg text-gray-500">
                        No visible items for this order.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8">
          <Chatbot />
        </div>

      </div>
    </div>
  );
}

export default FarmerDashboard;
