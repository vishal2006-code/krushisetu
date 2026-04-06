import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "./context/useAuth";
import { API_URL } from "./lib/api";
import OrderTracking from "./components/OrderTracking";

function groupIncomingBatches(orders) {
  return Object.entries(
    (orders || []).reduce((acc, order) => {
      const key = order.batchId || `batch-${order._id}`;
      acc[key] = acc[key] || [];
      acc[key].push(order);
      return acc;
    }, {})
  );
}

function EmptyState({ title, subtitle, tone = "slate" }) {
  const toneMap = {
    slate: "border-slate-200 bg-slate-50 text-slate-600",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700"
  };

  return (
    <div className={`rounded-[28px] border px-6 py-10 text-center ${toneMap[tone] || toneMap.slate}`}>
      <p className="text-lg font-black text-slate-900">{title}</p>
      <p className="mt-2 text-sm">{subtitle}</p>
    </div>
  );
}

function HubManagerDashboard() {
  const { token } = useAuth();
  const [data, setData] = useState({
    stats: { awaitingHub: 0, packaged: 0, outForDelivery: 0 },
    awaitingHub: [],
    packaged: [],
    outForDelivery: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [activeBatchId, setActiveBatchId] = useState("");
  const [activeOrderId, setActiveOrderId] = useState("");
  const [isDispatching, setIsDispatching] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [dispatchForm, setDispatchForm] = useState({
    areaLabel: "",
    deliveryBoyId: ""
  });

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

      const response = await axios.get(`${API_URL}/orders/hub/dashboard`, {
        headers: authHeaders
      });

      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load hub dashboard");
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

  const incomingBatches = useMemo(() => groupIncomingBatches(data.awaitingHub), [data.awaitingHub]);
  const hubOrders = useMemo(
    () => [...data.awaitingHub.filter((order) => order.status === "arrived_at_hub"), ...data.packaged],
    [data.awaitingHub, data.packaged]
  );

  const toggleSelectedOrder = (orderId) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleReceiveBatch = async (batchId) => {
    try {
      setActionError("");
      setActionSuccess("");
      setActiveBatchId(batchId);
      await axios.put(`${API_URL}/orders/hub/batches/${batchId}/receive`, {}, { headers: authHeaders });
      setActionSuccess(`Batch ${batchId} marked as arrived at hub.`);
      await loadDashboard({ silent: true });
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to receive batch");
    } finally {
      setActiveBatchId("");
    }
  };

  const handlePackageOrder = async (orderId) => {
    try {
      setActionError("");
      setActionSuccess("");
      setActiveOrderId(orderId);
      await axios.put(`${API_URL}/orders/hub/orders/${orderId}/package`, {}, { headers: authHeaders });
      setActionSuccess(`Order ${orderId.slice(-6)} packaged successfully.`);
      await loadDashboard({ silent: true });
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to package order");
    } finally {
      setActiveOrderId("");
    }
  };

  const handleDispatch = async () => {
    try {
      setActionError("");
      setActionSuccess("");
      setIsDispatching(true);

      if (!selectedOrders.length) {
        setActionError("Select at least one packaged order to dispatch.");
        return;
      }

      await axios.post(
        `${API_URL}/orders/hub/delivery-batches`,
        {
          orderIds: selectedOrders,
          areaLabel: dispatchForm.areaLabel,
          deliveryBoyId: dispatchForm.deliveryBoyId || undefined
        },
        { headers: authHeaders }
      );

      setActionSuccess("Delivery batch dispatched successfully.");
      setSelectedOrders([]);
      setDispatchForm({ areaLabel: "", deliveryBoyId: "" });
      await loadDashboard({ silent: true });
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to dispatch delivery batch");
      setActionSuccess("");
    } finally {
      setIsDispatching(false);
    }
  };

  if (loading) {
    return <div className="page-shell text-center text-slate-500">Loading hub dashboard...</div>;
  }

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="page-hero animate-enter">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-emerald-100">Hub Ops</p>
          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black md:text-5xl">Hub Manager Dashboard</h1>
              <p className="mt-3 text-emerald-50/90">
                Receive grouped pickup batches, package orders, and dispatch local deliveries.
              </p>
            </div>
            <button
              type="button"
              onClick={() => loadDashboard({ silent: true })}
              className="rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-white backdrop-blur transition hover:bg-white/20"
            >
              {refreshing ? "Refreshing..." : "Refresh Board"}
            </button>
          </div>
        </section>

        {error ? <div className="glass-card text-rose-700">{error}</div> : null}
        {actionError ? <div className="glass-card border border-rose-200 bg-rose-50 text-rose-700">{actionError}</div> : null}
        {actionSuccess ? <div className="glass-card border border-emerald-200 bg-emerald-50 text-emerald-700">{actionSuccess}</div> : null}

        <section className="grid gap-6 md:grid-cols-3">
          <div className="glass-card border-amber-100">
            <p className="text-sm font-black uppercase tracking-widest text-slate-400">Incoming Batches</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{data.stats.awaitingHub}</p>
          </div>
          <div className="glass-card border-indigo-100">
            <p className="text-sm font-black uppercase tracking-widest text-slate-400">Orders At Hub</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{hubOrders.length}</p>
          </div>
          <div className="glass-card border-emerald-100">
            <p className="text-sm font-black uppercase tracking-widest text-slate-400">Out For Delivery</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{data.stats.outForDelivery}</p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
          <div className="space-y-6">
            <div className="glass-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-600">Inbound Logistics</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-900">Incoming Batches</h2>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                  {incomingBatches.length} grouped batches
                </span>
              </div>

              <div className="mt-6 space-y-5">
                {!incomingBatches.length ? (
                  <EmptyState title="No incoming batches" subtitle="Pickup batches will appear here after farmers hand over produce." tone="amber" />
                ) : (
                  incomingBatches.map(([batchId, orders]) => (
                    <div key={batchId} className="rounded-[28px] border border-amber-100 bg-amber-50/60 p-5">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Batch ID</p>
                          <h3 className="mt-1 text-xl font-black text-slate-900">{batchId}</h3>
                          <p className="mt-1 text-sm text-slate-500">{orders.length} orders waiting to be received</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleReceiveBatch(batchId)}
                          disabled={activeBatchId === batchId}
                          className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          {activeBatchId === batchId ? "Receiving..." : "Receive Batch"}
                        </button>
                      </div>

                      <div className="mt-4 grid gap-4">
                        {orders.map((order) => (
                          <div key={order._id} className="rounded-3xl border border-white bg-white p-4 shadow-sm">
                            <div className="flex flex-col gap-4 xl:flex-row xl:justify-between">
                              <div className="space-y-2">
                                <p className="text-lg font-black text-slate-900 dark:text-white">Order #{order._id.slice(-6)}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300">Pickup courier: {order.pickupBoy?.name || "Unassigned"}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Customer: {order.customer?.name || "Customer"}</p>
                              </div>
                              <div className="xl:w-[320px]">
                                <OrderTracking currentStatus={order.status} />
                              </div>
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
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-600">Packaging Desk</p>
                <h2 className="mt-2 text-2xl font-black text-slate-900">Orders At Hub</h2>
              </div>

              <div className="mt-6 space-y-4">
                {!hubOrders.length ? (
                  <EmptyState title="No hub orders" subtitle="Received orders ready for sorting will show here." tone="indigo" />
                ) : (
                  hubOrders.map((order) => (
                    <div key={order._id} className="rounded-3xl border border-indigo-100 bg-indigo-50/40 p-4">
                      <div className="flex flex-col gap-4 xl:flex-row xl:justify-between">
                        <div className="space-y-2">
                          <p className="text-lg font-black text-slate-900">Order #{order._id.slice(-6)}</p>
                          <p className="text-sm text-slate-600">Customer: {order.customer?.name || "Customer"}</p>
                          <p className="text-sm text-slate-500">Status: {(order.status || "pending").replace(/_/g, " ")}</p>
                        </div>
                        <div className="xl:w-[320px]">
                          <OrderTracking currentStatus={order.status} />
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handlePackageOrder(order._id)}
                          disabled={activeOrderId === order._id || order.status !== "arrived_at_hub"}
                          className="rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          {activeOrderId === order._id ? "Packaging..." : order.status === "packaged" ? "Packaged" : "Mark as Packaged"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="glass-card">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-600">Dispatch Section</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">Create Delivery Batch</h2>
              <p className="mt-2 text-sm text-slate-500">
                Select packaged orders for the same area, enter an optional delivery boy ID, and dispatch them together.
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Dispatch work करायला system ला `type: "delivery"` आणि `isAvailable: true` असलेला courier लागतो. फक्त `pickup` type boy असेल तर dispatch 400 येईल.
            </div>

            <div className="mt-6 grid gap-4">
              <label className="space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Area Label</span>
                <input
                  type="text"
                  value={dispatchForm.areaLabel}
                  onChange={(event) => setDispatchForm((prev) => ({ ...prev, areaLabel: event.target.value }))}
                  placeholder="e.g. Nashik Road Sector A"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">DeliveryBoy ID</span>
                <input
                  type="text"
                  value={dispatchForm.deliveryBoyId}
                  onChange={(event) => setDispatchForm((prev) => ({ ...prev, deliveryBoyId: event.target.value }))}
                  placeholder="Optional: leave blank to auto-assign nearest courier"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />
              </label>
            </div>

            <div className="mt-6 space-y-4">
              {!data.packaged.length ? (
                <EmptyState title="No packaged orders ready" subtitle="Package orders first, then they can be selected here for dispatch." tone="emerald" />
              ) : (
                data.packaged.map((order) => (
                  <label key={order._id} className="flex cursor-pointer items-start gap-3 rounded-3xl border border-emerald-100 bg-emerald-50/40 p-4">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order._id)}
                      onChange={() => toggleSelectedOrder(order._id)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-lg font-black text-slate-900 dark:text-white">Order #{order._id.slice(-6)}</p>
                        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700 shadow-sm">
                          {order.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Customer: {order.customer?.name || "Customer"}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Area: {order.batchMeta?.deliveryAreaLabel || "Set during dispatch"}</p>
                    </div>
                  </label>
                ))
              )}
            </div>

            {actionError ? (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                Dispatch failed: {actionError}
              </div>
            ) : null}

            {actionSuccess ? (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                {actionSuccess}
              </div>
            ) : null}

            <div className="mt-6 flex items-center justify-between gap-4 rounded-3xl border border-emerald-100 bg-emerald-50/70 p-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Selected Orders</p>
                <p className="mt-1 text-xl font-black text-slate-900">{selectedOrders.length}</p>
              </div>
              <button
                type="button"
                onClick={handleDispatch}
                disabled={!selectedOrders.length || isDispatching}
                className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isDispatching ? "Dispatching..." : "Dispatch Selected Orders"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default HubManagerDashboard;
