import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/useAuth";
import { getVegetableIcon } from "./utils/vegetableIcons";
import { formatINR, toSafeNumber } from "./utils/formatters";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const orderStatusStyles = {
  placed: "border-amber-200 bg-amber-50 text-amber-700",
  accepted: "border-emerald-200 bg-emerald-50 text-emerald-700",
  delivered: "border-cyan-200 bg-cyan-50 text-cyan-700",
  cancelled: "border-rose-200 bg-rose-50 text-rose-700"
};

const paymentStatusStyles = {
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  failed: "border-rose-200 bg-rose-50 text-rose-700",
  refunded: "border-slate-200 bg-slate-100 text-slate-700"
};

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 19.5c1.6-3.3 4.2-5 7.5-5s5.9 1.7 7.5 5" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
    </svg>
  );
}

function IconCreditCard() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
      <path d="M2.5 10h19M6.5 15h4" />
    </svg>
  );
}

function IconBag() {
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M6 8h12l-1 12H7L6 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function formatLabel(value, fallback) {
  if (!value) return fallback;
  return value
    .toString()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payingOrderId, setPayingOrderId] = useState("");
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    let isActive = true;

    const fetchOrders = async () => {
      try {
        setError(null);
        const res = await axios.get(`${API_URL}/orders/customer`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!isActive) return;
        setOrders(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (!isActive) return;
        setError(err.response?.data?.message || "Failed to load orders");
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      isActive = false;
    };
  }, [token, isAuthenticated, navigate]);

  const summary = useMemo(() => {
    const totalOrders = orders.length;
    const pendingPayments = orders.filter((order) => (order.paymentStatus || "pending") !== "paid").length;
    const grandTotal = orders.reduce((sum, order) => {
      const unitPrice = toSafeNumber(order.vegetable?.price);
      const quantity = toSafeNumber(order.quantity);
      return sum + unitPrice * quantity;
    }, 0);

    return { totalOrders, pendingPayments, grandTotal };
  }, [orders]);

  const handlePayNow = async (orderId) => {
    try {
      setPayingOrderId(orderId);
      await axios.put(
        `${API_URL}/orders/${orderId}/pay`,
        { paymentMethod: "manual", transactionId: Date.now().toString() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId
            ? {
                ...order,
                paymentStatus: "paid"
              }
            : order
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || "Payment failed");
    } finally {
      setPayingOrderId("");
    }
  };

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
          <button
            onClick={() => window.location.reload()}
            className="btn-primary mt-6"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="page-hero animate-enter">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-emerald-100">Orders</p>
          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black md:text-5xl">My Orders</h1>
              <p className="mt-2 text-emerald-50/90">Track order progress, payment status, and assignment details in one place.</p>
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
                <p className="text-xl font-black">{formatINR(summary.grandTotal)}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/80">Total Value</p>
              </div>
            </div>
          </div>
        </section>

        {orders.length === 0 ? (
          <section className="glass-card animate-enter-delay-1 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
              <IconBag />
            </div>
            <h2 className="text-3xl font-black text-slate-900">No orders yet</h2>
            <p className="mx-auto mt-2 max-w-xl text-slate-500">Start shopping from the customer dashboard and your orders will appear here instantly.</p>
            <button onClick={() => navigate("/customer-dashboard")} className="btn-primary mt-6">
              Start Shopping
            </button>
          </section>
        ) : (
          <section className="space-y-4">
            {orders.map((order, index) => {
              const unitPrice = toSafeNumber(order.vegetable?.price);
              const quantity = toSafeNumber(order.quantity);
              const calculatedTotal = unitPrice * quantity;
              const orderStatus = (order.status || "placed").toLowerCase();
              const paymentStatus = (order.paymentStatus || "pending").toLowerCase();
              const isFarmerAssigned = Boolean(order.assignedFarmer?.name);

              return (
                <article
                  key={order._id}
                  className={`group rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_16px_50px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_64px_rgba(15,23,42,0.14)] animate-enter-delay-${Math.min(index + 1, 3)}`}
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-3xl shadow-sm">
                          {getVegetableIcon(order.vegetable?.name, order.vegetable?.emoji)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-2xl font-black text-slate-900">{order.vegetable?.name || "Unknown Product"}</h3>
                          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                            {quantity} kg x {formatINR(unitPrice)} / kg
                          </p>
                        </div>
                        <span
                          className={`ml-auto inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${orderStatusStyles[orderStatus] || "border-slate-200 bg-slate-50 text-slate-700"}`}
                        >
                          {formatLabel(orderStatus, "Placed")}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <div
                          className={`rounded-2xl border px-4 py-3 ${
                            isFarmerAssigned
                              ? "border-slate-200 bg-slate-50/70"
                              : "border-amber-200 bg-amber-50"
                          }`}
                        >
                          <p className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                            <IconUser /> Farmer
                          </p>
                          <p className={`font-bold ${isFarmerAssigned ? "text-slate-800" : "text-amber-700"}`}>
                            {isFarmerAssigned ? order.assignedFarmer.name : "Farmer not assigned yet"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                          <p className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                            <IconCalendar /> Order Date
                          </p>
                          <p className="font-bold text-slate-800">{new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 sm:col-span-2 xl:col-span-1">
                          <p className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                            <IconCreditCard /> Payment
                          </p>
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${paymentStatusStyles[paymentStatus] || "border-slate-200 bg-slate-50 text-slate-700"}`}
                          >
                            {formatLabel(paymentStatus, "Pending")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full rounded-[24px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-cyan-50 p-5 lg:w-72">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Order Total</p>
                      <p className="mt-2 text-4xl font-black text-slate-900">{formatINR(calculatedTotal)}</p>
                      <p className="mt-1 text-sm text-slate-500">Calculated as quantity x unit price</p>

                      {paymentStatus !== "paid" ? (
                        <button
                          onClick={() => handlePayNow(order._id)}
                          disabled={payingOrderId === order._id}
                          className="btn-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {payingOrderId === order._id ? "Processing..." : "Pay Now"}
                        </button>
                      ) : (
                        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-700">
                          Payment completed successfully
                        </div>
                      )}
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
