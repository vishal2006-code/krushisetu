import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./context/useAuth";
import { formatINR, toSafeNumber } from "./utils/formatters";

import { API_URL } from "./lib/api";

function FarmerAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token, user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "farmer") return;

    const fetchAnalytics = async () => {
      try {
        const res = await axios.get(`${API_URL}/orders/farmer/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAnalytics(res.data);
      } catch {
        setError("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [token, user, isAuthenticated]);

  if (!isAuthenticated || user?.role !== "farmer") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <p className="text-2xl font-bold text-green-700">Only farmers can view analytics</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <p className="text-2xl font-bold text-green-700 animate-pulse">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <p className="text-2xl font-bold text-red-600 mb-4">Error</p>
          <p className="text-gray-700 mb-6">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-green-700 mb-2">📊 Farm Analytics</h1>
          <p className="text-gray-600">Your sales and performance insights</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Total Orders</p>
                <p className="text-4xl font-bold text-blue-600 mt-2">{analytics?.totalOrders || 0}</p>
              </div>
              <div className="text-3xl">📦</div>
            </div>
            <p className="text-sm text-gray-500 mt-4">All time orders</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Total Revenue</p>
                <p className="text-4xl font-bold text-green-600 mt-2">{formatINR(analytics?.totalRevenue, 0)}</p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
            <p className="text-sm text-gray-500 mt-4">From all orders</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Paid Orders</p>
                <p className="text-4xl font-bold text-yellow-600 mt-2">{analytics?.paidOrders || 0}</p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
            <p className="text-sm text-gray-500 mt-4">Completed payments</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Avg Order Value</p>
                <p className="text-4xl font-bold text-purple-600 mt-2">{formatINR(analytics?.averageOrderValue, 0)}</p>
              </div>
              <div className="text-3xl">📈</div>
            </div>
            <p className="text-sm text-gray-500 mt-4">Per order</p>
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Status */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Order Status</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700 font-semibold">Accepted</span>
                  <span className="text-xl font-bold text-green-600">{analytics?.acceptedOrders || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-600 h-3 rounded-full transition-all"
                    style={{width: `${(analytics?.acceptedOrders / analytics?.totalOrders * 100) || 0}%`}}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700 font-semibold">Pending</span>
                  <span className="text-xl font-bold text-orange-600">{analytics?.placedOrders || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-orange-600 h-3 rounded-full transition-all"
                    style={{width: `${(analytics?.placedOrders / analytics?.totalOrders * 100) || 0}%`}}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700 font-semibold">Cancelled</span>
                  <span className="text-xl font-bold text-red-600">{analytics?.cancelledOrders || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-red-600 h-3 rounded-full transition-all"
                    style={{width: `${(analytics?.cancelledOrders / analytics?.totalOrders * 100) || 0}%`}}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Payment Collection</h2>
            <div className="space-y-4">
              <div className="text-center py-8 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg">
                <p className="text-sm text-gray-600">Payment Collection Rate</p>
                <p className="text-5xl font-bold text-green-600 mt-2">
                  {analytics?.totalOrders > 0 
                    ? ((analytics?.paidOrders / analytics?.totalOrders * 100).toFixed(0)) 
                    : 0}%
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                  <p className="text-sm text-gray-600">Received</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{formatINR(analytics?.paidOrders > 0 ? (toSafeNumber(analytics?.totalRevenue) / toSafeNumber(analytics?.totalOrders)) * toSafeNumber(analytics?.paidOrders) : 0, 0)}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">{formatINR(analytics?.totalRevenue ? toSafeNumber(analytics?.totalRevenue) - ((toSafeNumber(analytics?.totalRevenue) / toSafeNumber(analytics?.totalOrders)) * toSafeNumber(analytics?.paidOrders)) : 0, 0)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FarmerAnalytics;



