import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "./lib/api";
import OrderTracking from "./components/OrderTracking";
import { useAuth } from "./context/useAuth";
import { formatINR } from "./utils/formatters";
import { getVegetableIcon } from "./utils/vegetableIcons";

const orderStatusStyles = {
  placed: "border-amber-200 bg-amber-50 text-amber-700",
  pending_farmer_acceptance: "border-blue-200 bg-blue-50 text-blue-700",
  accepted_by_farmer: "border-cyan-200 bg-cyan-50 text-cyan-700",
  pickup_assigned: "border-indigo-200 bg-indigo-50 text-indigo-700",
  picked_from_farmer: "border-violet-200 bg-violet-50 text-violet-700",
  arrived_at_hub: "border-purple-200 bg-purple-50 text-purple-700",
  packaged: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
  out_for_delivery: "border-orange-200 bg-orange-50 text-orange-700",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-rose-200 bg-rose-50 text-rose-700"
};

const paymentStatusStyles = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700"
};

function formatLabel(value, fallback = "Unknown") {
  if (!value) {
    return fallback;
  }

  return value
    .toString()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getOrderItems(order) {
  if (Array.isArray(order?.orderItems) && order.orderItems.length > 0) {
    return order.orderItems;
  }

  if (order?.vegetable) {
    return [
      {
        _id: `legacy-${order._id}`,
        vegetable: order.vegetable,
        quantity: order.quantity || 0,
        price: order.vegetable?.price || 0,
        farmer: order.assignedFarmer,
        status: order.status
      }
    ];
  }

  return [];
}

function getPrimaryItemLabel(orderItems) {
  if (!orderItems.length) {
    return "No items";
  }

  if (orderItems.length === 1) {
    return orderItems[0].vegetable?.name || "Ordered item";
  }

  return `${orderItems[0].vegetable?.name || "Order"} +${orderItems.length - 1} more`;
}

function getUnitLabel(unit, quantity) {
  const safeUnit = unit === "quintal" ? "quintal" : "kg";
  const safeQuantity = Number(quantity) || 0;
  if (safeQuantity === 1) {
    return safeUnit;
  }
  return safeUnit === "quintal" ? "quintals" : "kg";
}

function SummaryPill({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/90 px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}

function EmptyState({ onBrowse }) {
  return (
    <section className="glass-card animate-enter-delay-1 text-center">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-4xl font-black text-emerald-600">
        O
      </div>
      <h2 className="text-3xl font-black text-slate-900">No orders yet</h2>
      <p className="mx-auto mt-2 max-w-xl text-slate-500">
        Start shopping from the customer dashboard and your orders will appear here.
      </p>
      <button onClick={onBrowse} className="btn-primary mt-6">
        Start Shopping
      </button>
    </section>
  );
}

function CustomerOrders() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingOrderId, setPayingOrderId] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    let isMounted = true;

    async function fetchOrders() {
      try {
        setError("");
        const response = await api.get("/orders/customer");

        if (isMounted) {
          const nextOrders = Array.isArray(response.data) ? response.data : [];
          setOrders(nextOrders);
          setExpandedOrderId((current) => current || nextOrders[0]?._id || "");
        }
      } catch (requestError) {
        if (isMounted) {
          setError(getErrorMessage(requestError, "Failed to load orders"));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchOrders();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, navigate]);

  const summary = useMemo(() => {
    return orders.reduce(
      (accumulator, order) => {
        accumulator.totalOrders += 1;
        accumulator.totalValue += Number(order.totalAmount) || 0;
        if ((order.paymentStatus || "pending") !== "paid") {
          accumulator.pendingPayments += 1;
        }
        return accumulator;
      },
      { totalOrders: 0, totalValue: 0, pendingPayments: 0 }
    );
  }, [orders]);

  async function handlePayNow(orderId) {
    try {
      setPayingOrderId(orderId);
      await api.put(`/orders/${orderId}/pay`, {
        paymentMethod: "manual",
        transactionId: Date.now().toString()
      });

      setOrders((previousOrders) =>
        previousOrders.map((order) =>
          order._id === orderId ? { ...order, paymentStatus: "paid" } : order
        )
      );
    } catch (requestError) {
      window.alert(getErrorMessage(requestError, "Payment failed"));
    } finally {
      setPayingOrderId("");
    }
  }

  function toggleExpanded(orderId) {
    setExpandedOrderId((current) => (current === orderId ? "" : orderId));
  }

  if (loading) {
    return (
      <div className="page-shell flex items-center justify-center">
        <div className="glass-card text-center">
          <div className="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="text-2xl font-black text-emerald-700">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell flex items-center justify-center">
        <div className="glass-card max-w-xl text-center">
          <p className="text-2xl font-black text-rose-700">Unable to load orders</p>
          <p className="mt-2 text-slate-600">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary mt-6">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="page-hero animate-enter">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-emerald-100">
            Orders
          </p>
          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black md:text-5xl">My Orders</h1>
              <p className="mt-2 max-w-2xl text-emerald-50/90">
                View orders in a compact list and expand any row for items, live processing, and delivery details.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
                <p className="text-2xl font-black">{summary.totalOrders}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/80">Orders</p>
              </div>
              <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
                <p className="text-2xl font-black">{summary.pendingPayments}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/80">Pending Pay</p>
              </div>
              <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
                <p className="text-xl font-black">{formatINR(summary.totalValue)}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/80">Total Value</p>
              </div>
            </div>
          </div>
        </section>

        {orders.length === 0 ? (
          <EmptyState onBrowse={() => navigate("/customer-dashboard")} />
        ) : (
          <section className="space-y-4">
            {orders.map((order, index) => {
              const orderItems = getOrderItems(order);
              const orderStatus = (order.status || "placed").toLowerCase();
              const paymentStatus = (order.paymentStatus || "pending").toLowerCase();
              const isExpanded = expandedOrderId === order._id;

              return (
                <article
                  key={order._id}
                  className={`overflow-hidden rounded-[30px] border border-white/70 bg-white/90 shadow-[0_18px_60px_rgba(15,23,42,0.08)] transition duration-300 animate-enter-delay-${Math.min(index + 1, 3)}`}
                >
                  <button
                    type="button"
                    onClick={() => toggleExpanded(order._id)}
                    className="w-full text-left"
                  >
                    <div className="flex flex-col gap-4 p-4 sm:p-5 lg:p-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                              Order #{order._id.slice(-6)}
                            </h2>
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${
                                orderStatusStyles[orderStatus] ||
                                "border-slate-200 bg-slate-50 text-slate-700"
                              }`}
                            >
                              {formatLabel(orderStatus, "Placed")}
                            </span>
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${
                                paymentStatusStyles[paymentStatus] ||
                                "border-slate-200 bg-slate-50 text-slate-700"
                              }`}
                            >
                              {paymentStatus === "paid" ? "Paid" : "Payment Pending"}
                            </span>
                          </div>
                          <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                            {getPrimaryItemLabel(orderItems)}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-4 lg:min-w-[220px] lg:justify-end">
                          <div className="text-right">
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                              Total
                            </p>
                            <p className="mt-1 text-2xl font-black text-slate-900">
                              {formatINR(order.totalAmount || 0)}
                            </p>
                          </div>
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600">
                            <span
                              className={`text-lg font-black transition-transform duration-300 ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            >
                              v
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                        <SummaryPill label="Items" value={`${orderItems.length}`} />
                        <SummaryPill
                          label="Ordered On"
                          value={new Date(order.createdAt).toLocaleDateString("en-IN")}
                        />
                        <SummaryPill
                          label="Delivery To"
                          value={order.deliveryAddress || "Address unavailable"}
                        />
                        <SummaryPill
                          label="Current Step"
                          value={formatLabel(order.status, "Placed")}
                        />
                        <SummaryPill
                          label="Action"
                          value={isExpanded ? "Hide Details" : "View Details"}
                        />
                      </div>
                    </div>
                  </button>

                  <div
                    className={`grid transition-all duration-300 ease-out ${
                      isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="border-t border-slate-200/80 bg-slate-50/55 px-4 py-4 sm:px-5 sm:py-5 lg:px-6">
                      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                        <div className="space-y-4">
                          <section className="rounded-[26px] border border-slate-200 bg-white p-4 sm:p-5">
                            <div className="flex items-center justify-between gap-3">
                              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
                                Items Ordered
                              </h3>
                              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                                {orderItems.length} item{orderItems.length > 1 ? "s" : ""}
                              </span>
                            </div>

                            <div className="mt-4 space-y-3">
                              {orderItems.map((item) => (
                                <div
                                  key={item._id}
                                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center"
                                >
                                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">
                                    {getVegetableIcon(item.vegetable?.name, item.vegetable?.emoji)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-slate-900 dark:text-white">
                                      {item.vegetable?.name || "Unknown Product"}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                      {item.quantity || 0}{" "}
                                      {getUnitLabel(item.vegetable?.unit, item.quantity)} x{" "}
                                      {formatINR(item.price || 0)} ={" "}
                                      {formatINR((Number(item.quantity) || 0) * (Number(item.price) || 0))}
                                    </p>
                                    <p className="mt-1 break-words text-xs text-slate-500 dark:text-slate-400">
                                      Farmer: {item.farmer?.name || "Not assigned"}
                                    </p>
                                  </div>
                                  <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-300 dark:border-slate-600 dark:bg-slate-700">
                                    {formatLabel(item.status, "Assigned")}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </section>

                          <section className="rounded-[26px] border border-slate-200 bg-white p-4 sm:p-5">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
                              Delivery Details
                            </h3>

                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                              <SummaryPill
                                label="Delivery To"
                                value={order.deliveryAddress || "Address unavailable"}
                              />
                              <SummaryPill
                                label="Payment"
                                value={formatLabel(order.paymentStatus, "Pending")}
                              />
                              <SummaryPill
                                label="Delivery Charge"
                                value={formatINR(order.deliveryCharge || 0)}
                              />
                              <SummaryPill
                                label="Delivered To"
                                value={order.customer?.name || "Customer"}
                              />
                            </div>

                            {paymentStatus !== "paid" ? (
                              <button
                                onClick={() => handlePayNow(order._id)}
                                disabled={payingOrderId === order._id}
                                className="btn-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                              >
                                {payingOrderId === order._id ? "Processing..." : "Pay Now"}
                              </button>
                            ) : (
                              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                                Payment completed successfully
                              </div>
                            )}
                          </section>
                        </div>

                        <section className="rounded-[26px] border border-slate-200 bg-white p-4 sm:p-5">
                          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
                            Live Processing
                          </h3>
                          <p className="mt-2 text-sm text-slate-500">
                            Follow the order from placement to delivery.
                          </p>
                          <div className="mt-4">
                            <OrderTracking currentStatus={order.status} compact />
                          </div>
                        </section>
                      </div>
                    </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {orders.length > 0 ? (
          <div className="pt-2 text-center">
            <button onClick={() => navigate("/customer-dashboard")} className="btn-secondary">
              Continue Shopping
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default CustomerOrders;
