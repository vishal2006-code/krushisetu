import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "./context/useAuth";
import { API_URL } from "./lib/api";
import OrderTracking from "./components/OrderTracking";

function groupByBatch(orders, fallbackPrefix) {
  return Object.entries(
    (orders || []).reduce((acc, order) => {
      const key = order.batchId || order.deliveryBatchId || `${fallbackPrefix}-${order._id}`;
      acc[key] = acc[key] || [];
      acc[key].push(order);
      return acc;
    }, {})
  );
}

function StatusBadge({ status }) {
  const tones = {
    pickup_assigned: "border-amber-200 bg-amber-50 text-amber-700",
    picked_from_farmer: "border-emerald-200 bg-emerald-50 text-emerald-700",
    out_for_delivery: "border-indigo-200 bg-indigo-50 text-indigo-700",
    delivered: "border-emerald-200 bg-emerald-50 text-emerald-700"
  };

  return (
    <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${tones[status] || "border-slate-200 bg-slate-50 text-slate-700"}`}>
      {(status || "pending").replace(/_/g, " ")}
    </span>
  );
}

function EmptyState({ title, subtitle }) {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
      <p className="text-lg font-black text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function DeliveryDashboard() {
  const { token, user } = useAuth();
  const [data, setData] = useState({ pickupRuns: [], deliveryRuns: [], deliveryProfile: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [activeOrderId, setActiveOrderId] = useState("");

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`
    }),
    [token]
  );

  const loadDashboard = async ({ silent = false } = {}) => {
    try {
      setError("");
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await axios.get(`${API_URL}/orders/delivery/dashboard`, {
        headers: authHeaders
      });

      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load delivery dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    loadDashboard();
  }, [token]);

  const handleAction = async (orderId, endpoint) => {
    try {
      setActionError("");
      setActiveOrderId(orderId);
      await axios.put(`${API_URL}/orders/${orderId}/${endpoint}`, {}, { headers: authHeaders });
      await loadDashboard({ silent: true });
    } catch (err) {
      setActionError(err.response?.data?.message || "Unable to update task");
    } finally {
      setActiveOrderId("");
    }
  };

  const pickupGroups = useMemo(() => groupByBatch(data.pickupRuns, "pickup"), [data.pickupRuns]);
  const deliveryGroups = useMemo(() => groupByBatch(data.deliveryRuns, "delivery"), [data.deliveryRuns]);

  if (loading) {
    return <div className="page-shell text-center text-slate-500">Loading delivery dashboard...</div>;
  }

  const profileNotFound = error.toLowerCase().includes("profile not found");

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="page-hero animate-enter">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-emerald-100">Delivery Ops</p>
          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black md:text-5xl">Delivery Dashboard</h1>
              <p className="mt-3 text-emerald-50/90">
                {user?.name ? `${user.name}, here are your pickup and delivery tasks.` : "Track pickup milk-runs and last-mile drops from one place."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => loadDashboard({ silent: true })}
              className="rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-white backdrop-blur transition hover:bg-white/20"
            >
              {refreshing ? "Refreshing..." : "Refresh Tasks"}
            </button>
          </div>
        </section>

        {profileNotFound ? (
          <div className="glass-card border border-amber-200 bg-amber-50 text-amber-800">
            <h2 className="text-2xl font-black">Delivery profile not linked</h2>
            <p className="mt-3 text-sm">
              This login user does not have a matching `DeliveryBoy` record yet. Create or update a `deliveryboys` document with this user&apos;s `_id`, a `type` of `pickup` or `delivery`, and a valid location.
            </p>
          </div>
        ) : null}

        {!profileNotFound && error ? <div className="glass-card text-rose-700">{error}</div> : null}
        {actionError ? <div className="glass-card text-rose-700">{actionError}</div> : null}

        <section className="grid gap-6 md:grid-cols-3">
          <div className="glass-card border-emerald-100">
            <p className="text-sm font-black uppercase tracking-widest text-slate-400">Assigned Profile</p>
            <p className="mt-3 text-2xl font-black text-slate-900">{data.deliveryProfile?.name || "Not linked"}</p>
            <p className="mt-1 text-sm text-slate-500">{data.deliveryProfile?.type || "No operational type"}</p>
          </div>
          <div className="glass-card border-amber-100">
            <p className="text-sm font-black uppercase tracking-widest text-slate-400">Pickups To Be Done</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{data.pickupRuns?.length || 0}</p>
          </div>
          <div className="glass-card border-indigo-100">
            <p className="text-sm font-black uppercase tracking-widest text-slate-400">Deliveries To Be Done</p>
            <p className="mt-3 text-3xl font-black text-slate-900">
              {(data.deliveryRuns || []).filter((order) => order.status === "out_for_delivery").length}
            </p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="glass-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-600">Farmer To Hub</p>
                <h2 className="mt-2 text-2xl font-black text-slate-900">Pickups to be done</h2>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                {pickupGroups.length} batches
              </span>
            </div>

            <div className="mt-6 space-y-5">
              {!pickupGroups.length ? (
                <EmptyState title="No pickup tasks" subtitle="New milk-run batches will appear here when assigned." />
              ) : (
                pickupGroups.map(([batchId, orders]) => (
                  <div key={batchId} className="rounded-[28px] border border-amber-100 bg-amber-50/50 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Batch ID</p>
                        <h3 className="mt-1 text-lg font-black text-slate-900">{batchId}</h3>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
                        {orders.length} stops
                      </span>
                    </div>

                    <div className="mt-4 space-y-4">
                      {orders.map((order) => (
                        <div key={order._id} className="rounded-3xl border border-white bg-white p-4 shadow-sm">
                          <div className="flex flex-col gap-4 xl:flex-row xl:justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <p className="text-lg font-black text-slate-900 dark:text-white">Order #{order._id.slice(-6)}</p>
                                <StatusBadge status={order.status} />
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-300">Farmer: {order.assignedFarmer?.name || "Assigned farmer"}</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">Farmer phone: {order.assignedFarmer?.phone || "Unavailable"}</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">Farmer area: {order.assignedFarmer?.village || order.assignedFarmer?.city || "Unavailable"}</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">Handover qty: {order.batchMeta?.farmerHandoverQuantity || 0} kg</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">Batch total: {order.batchMeta?.totalBatchQuantity || 0} kg</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                Request status: {order.batchMeta?.pickupTaskStatus === "accepted" ? "You accepted this task" : "Farmer sent you this pickup request"}
                              </p>
                            </div>

                            <div className="xl:w-[320px]">
                              <OrderTracking currentStatus={order.status} />
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => handleAction(order._id, "pickup/accept")}
                              disabled={activeOrderId === order._id || order.batchMeta?.pickupTaskStatus === "accepted"}
                              className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                              {activeOrderId === order._id && order.batchMeta?.pickupTaskStatus !== "accepted" ? "Updating..." : order.batchMeta?.pickupTaskStatus === "accepted" ? "Request Accepted" : "Accept Request"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAction(order._id, "pickup")}
                              disabled={
                                activeOrderId === order._id ||
                                order.status !== "pickup_assigned" ||
                                order.batchMeta?.pickupTaskStatus !== "accepted"
                              }
                              className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                              {activeOrderId === order._id && order.batchMeta?.pickupTaskStatus === "accepted" ? "Updating..." : "Mark as Picked"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-600">Hub To Customer</p>
                <h2 className="mt-2 text-2xl font-black text-slate-900">Deliveries to be done</h2>
              </div>
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-indigo-700">
                {deliveryGroups.length} batches
              </span>
            </div>

            <div className="mt-6 space-y-5">
              {!deliveryGroups.length ? (
                <EmptyState title="No delivery tasks" subtitle="Assigned delivery drops will show up here." />
              ) : (
                deliveryGroups.map(([batchId, orders]) => (
                  <div key={batchId} className="rounded-[28px] border border-indigo-100 bg-indigo-50/50 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">Delivery Batch</p>
                        <h3 className="mt-1 text-lg font-black text-slate-900">{batchId}</h3>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
                        {orders.length} drops
                      </span>
                    </div>

                    <div className="mt-4 space-y-4">
                      {orders.map((order) => (
                        <div key={order._id} className="rounded-3xl border border-white bg-white p-4 shadow-sm">
                          <div className="flex flex-col gap-4 xl:flex-row xl:justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <p className="text-lg font-black text-slate-900 dark:text-white">Order #{order._id.slice(-6)}</p>
                                <StatusBadge status={order.status} />
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-300">Customer: {order.customer?.name || "Customer"}</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">Address: {order.deliveryAddress || "No address available"}</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">Area: {order.batchMeta?.deliveryAreaLabel || "Grouped route"}</p>
                            </div>

                            <div className="xl:w-[320px]">
                              <OrderTracking currentStatus={order.status} />
                            </div>
                          </div>

                          <div className="mt-4 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleAction(order._id, "deliver")}
                              disabled={activeOrderId === order._id || order.status !== "out_for_delivery"}
                              className="rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                              {activeOrderId === order._id ? "Updating..." : "Mark as Delivered"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default DeliveryDashboard;
