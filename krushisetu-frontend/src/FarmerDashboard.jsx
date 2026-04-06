import { useEffect, useState } from "react";
import axios from "axios";
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

function formatPickupTaskStatus(status) {
  switch (status) {
    case "requested":
      return "Request sent to pickup boy";
    case "accepted":
      return "Pickup boy accepted request";
    default:
      return "Waiting for pickup assignment";
  }
}

function FarmerDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeOrderId, setActiveOrderId] = useState("");
  const [openChat, setOpenChat] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    const showTimer = setTimeout(() => setShowHint(true), 1000);
    const hideTimer = setTimeout(() => setShowHint(false), 6000);

    const interval = setInterval(() => {
      setShowHint(true);
      setTimeout(() => setShowHint(false), 5000);
    }, 15000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      clearInterval(interval);
    };
  }, []);

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

        setOrders(res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token, user]);

  const acceptOrder = async (orderId) => {
    try {
      setActiveOrderId(orderId);
      const response = await axios.put(
        `${API_URL}/orders/${orderId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOrders((prev) =>
        prev.map((order) => (order._id === orderId ? response.data.order : order))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign pickup boy");
    } finally {
      setActiveOrderId("");
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8 relative">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-green-700 mb-2">
            Welcome, {user?.name}! 🌾
          </h1>
          <p className="text-gray-600">Manage your farm and pickup assignments</p>
        </div>

        <h2 className="text-3xl font-bold text-gray-800 mb-8">Orders</h2>

        {orders.length === 0 ? (
          <div className="bg-white text-center py-20 rounded-lg shadow-md">
            <div className="text-7xl mb-6">🌾</div>
            <h3 className="text-2xl font-bold text-gray-600">No orders yet</h3>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => {
              const visibleItems = getRelevantItems(order, user?._id);
              const canAssignPickup =
                !order.pickupBoy &&
                (
                  order.status === "pending_farmer_acceptance" ||
                  order.status === "accepted_by_farmer" ||
                  visibleItems.some((item) => ["assigned", "accepted"].includes(item.status))
                );

              return (
                <div
                  key={order._id}
                  className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold">Order #{order._id.slice(-6)}</h3>
                      <p>Customer: {order.customer?.name || "Customer unavailable"}</p>
                      <p className="text-sm text-gray-500">Order status: {order.status}</p>
                    </div>

                    {canAssignPickup ? (
                      <button
                        onClick={() => acceptOrder(order._id)}
                        disabled={activeOrderId === order._id}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        {activeOrderId === order._id ? "Assigning..." : "Accept & Assign Pickup"}
                      </button>
                    ) : null}
                  </div>

                  <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
                      Pickup Assignment
                    </p>
                    <p className="mt-2 text-slate-800 font-semibold">
                      Delivery Boy: {order.pickupBoy?.name || "Not assigned yet"}
                    </p>
                    <p className="text-sm text-slate-600">
                      Phone: {order.pickupBoy?.phone || "Will appear after assignment"}
                    </p>
                    <p className="text-sm text-slate-600">
                      Task status: {formatPickupTaskStatus(order.batchMeta?.pickupTaskStatus)}
                    </p>
                    <p className="text-sm text-slate-600">
                      Batch ID: {order.batchId || "Will be generated on assignment"}
                    </p>
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

        {/* 🔘 CHAT BUTTON (fixed always) */}
        <button
          onClick={() => {
            setOpenChat(!openChat);
            setShowHint(false);
          }}
          className="fixed bottom-6 right-6 bg-emerald-600 text-white w-16 h-16 rounded-full shadow-lg text-2xl flex items-center justify-center hover:bg-emerald-700 z-50"
        >
          💬
        </button>

        {/* 💬 MESSAGE BUBBLE */}
        {showHint && !openChat && (
          <div className="fixed bottom-24 right-6 w-64 bg-white text-gray-800 p-3 rounded-xl shadow-lg text-sm z-50 animate-bounce">
            👋 Hi! I'm here to help you with orders, crops, and farm features.
          </div>
        )}

        {/* 🔥 CHAT POPUP */}
        {openChat && (
          <div className="fixed bottom-24 right-6 w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
            
            <div className="bg-emerald-600 text-white px-4 py-3 flex justify-between items-center">
              <span className="font-bold">KrushiSetu Chat</span>
              <button onClick={() => setOpenChat(false)}>✖</button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <Chatbot />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FarmerDashboard;
