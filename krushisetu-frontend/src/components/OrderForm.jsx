import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { getVegetableIcon } from "../utils/vegetableIcons";
import { formatINR, toSafeNumber } from "../utils/formatters";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function OrderForm() {
  const [vegetables, setVegetables] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVegetable, setSelectedVegetable] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    let isActive = true;

    const fetchVegetables = async () => {
      try {
        const res = await axios.get(`${API_URL}/vegetables`);
        if (!isActive) return;
        setVegetables(res.data);
      } catch {
        if (!isActive) return;
        setError("Failed to load vegetables");
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchVegetables();

    return () => {
      isActive = false;
    };
  }, []);

  const selectedVegData = vegetables.find((v) => v._id === selectedVegetable);
  const filteredVegetables = vegetables.filter((veg) => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return (
      veg.name?.toLowerCase().includes(query) ||
      veg.category?.toLowerCase().includes(query) ||
      veg.season?.toLowerCase().includes(query)
    );
  });

  const addToCart = () => {
    if (!selectedVegetable) {
      alert("Please select a vegetable");
      return;
    }

    if (quantity <= 0) {
      alert("Quantity must be at least 1");
      return;
    }

    const veg = vegetables.find((v) => v._id === selectedVegetable);
    const existingItem = cart.find((item) => item._id === selectedVegetable);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item._id === selectedVegetable ? { ...item, quantity: item.quantity + quantity } : item
        )
      );
    } else {
      setCart([...cart, { ...veg, quantity }]);
    }

    setQuantity(1);
    setSelectedVegetable("");
  };

  const removeFromCart = (vegetableId) => {
    setCart(cart.filter((item) => item._id !== vegetableId));
  };

  const updateQuantity = (vegetableId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(vegetableId);
      return;
    }

    setCart(
      cart.map((item) =>
        item._id === vegetableId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => {
      const price = toSafeNumber(item.price);
      const qty = toSafeNumber(item.quantity);
      return sum + price * qty;
    }, 0);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    if (!token) {
      alert("Please login first!");
      navigate("/login");
      return;
    }

    try {
      const promises = cart.map((item) =>
        axios.post(
          `${API_URL}/orders`,
          {
            vegetableId: item._id,
            quantity: item.quantity
          },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );

      await Promise.all(promises);
      alert("Orders placed successfully!");
      setCart([]);
      navigate("/customer-orders");
    } catch (err) {
      alert("Error placing order: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div className="page-shell flex items-center justify-center">
        <div className="glass-card text-center">
          <div className="mx-auto mb-5 h-16 w-16 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="text-2xl font-black text-emerald-700">Loading vegetables...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell flex items-center justify-center">
        <div className="glass-card text-center">
          <p className="text-2xl font-black text-rose-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="page-hero animate-enter">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-emerald-100">Customer Ordering</p>
          <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="max-w-2xl text-4xl font-black leading-tight md:text-5xl">Order fresh vegetables with a faster, friendlier flow.</h1>
              <p className="mt-4 max-w-2xl text-base text-emerald-50/90">
                Search the catalog, preview pricing, and build an order cart from locally available produce.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-white/14 px-4 py-3 backdrop-blur">
                <p className="text-2xl font-black">{vegetables.length}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-50/80">Vegetables</p>
              </div>
              <div className="rounded-2xl bg-white/14 px-4 py-3 backdrop-blur">
                <p className="text-2xl font-black">{cart.length}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-50/80">Cart Items</p>
              </div>
              <div className="rounded-2xl bg-white/14 px-4 py-3 backdrop-blur">
                <p className="text-2xl font-black">{formatINR(getTotalPrice(), 0)}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-50/80">Total</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.3fr_0.9fr]">
          <section className="glass-card animate-enter-delay-1">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-600">Order Builder</p>
                <h2 className="mt-2 text-3xl font-black text-slate-900">Choose your vegetables</h2>
              </div>
              <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
                {filteredVegetables.length} visible
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-black uppercase tracking-[0.2em] text-slate-500">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by vegetable, category, or season"
                  className="input-shell"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black uppercase tracking-[0.2em] text-slate-500">Available Vegetables</label>
                <select
                  value={selectedVegetable}
                  onChange={(e) => setSelectedVegetable(e.target.value)}
                  className="input-shell appearance-none"
                >
                  <option value="">Choose a vegetable</option>
                  {filteredVegetables.map((veg) => (
                    <option key={veg._id} value={veg._id}>
                      {veg.name} - {formatINR(veg.price)}/kg
                    </option>
                  ))}
                </select>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                    {filteredVegetables.length} visible
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    from {vegetables.length} total vegetables
                  </span>
                </div>
              </div>

              {selectedVegData ? (
                <div className="animate-enter rounded-[28px] border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-cyan-50 p-6">
                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="animate-float flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-4xl shadow-sm">
                        {getVegetableIcon(selectedVegData.name, selectedVegData.emoji)}
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-900">{selectedVegData.name}</h3>
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-600">{selectedVegData.category || "Fresh Vegetable"}</p>
                        <p className="mt-1 text-sm text-slate-500">{selectedVegData.season || "Available this season"}</p>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-900 px-5 py-4 text-white">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Price per kg</p>
                      <p className="mt-2 text-3xl font-black">{formatINR(selectedVegData.price)}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div>
                <label className="mb-2 block text-sm font-black uppercase tracking-[0.2em] text-slate-500">Quantity</label>
                <div className="flex items-center gap-3 rounded-[24px] border border-slate-200/70 bg-white/80 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-2xl font-black text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                  >
                    -
                  </button>
                  <div className="flex flex-1 items-center justify-center">
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full max-w-[140px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-2xl font-black text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:focus:ring-emerald-500/10"
                    />
                  </div>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-2xl font-black text-white transition hover:-translate-y-0.5 hover:bg-emerald-600"
                  >
                    +
                  </button>
                </div>
                <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                  Selected quantity: <span className="font-black text-slate-900 dark:text-slate-100">{quantity} kg</span>
                </p>
              </div>

              {selectedVegData ? (
                <div className="rounded-[26px] border border-cyan-100 bg-cyan-50/80 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-slate-700">Estimated total</span>
                    <span className="text-3xl font-black text-cyan-700">
                      {formatINR(toSafeNumber(selectedVegData.price) * toSafeNumber(quantity))}
                    </span>
                  </div>
                </div>
              ) : null}

              <button
                onClick={addToCart}
                disabled={!selectedVegetable}
                className="btn-primary w-full py-4 text-lg disabled:cursor-not-allowed disabled:opacity-55"
              >
                Add to Cart
              </button>
            </div>
          </section>

          <section className="glass-card animate-enter-delay-2 h-fit xl:sticky xl:top-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-600">Cart</p>
                <h2 className="mt-2 text-3xl font-black text-slate-900">Your basket</h2>
              </div>
              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">{cart.length} items</div>
            </div>

            {cart.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
                <div className="animate-float text-5xl">{"\uD83E\uDDFA"}</div>
                <p className="mt-4 text-xl font-black text-slate-700">Cart is empty</p>
                <p className="mt-2 text-sm text-slate-500">Choose vegetables from the catalog to start building an order.</p>
              </div>
            ) : (
              <>
                <div className="max-h-[28rem] space-y-4 overflow-y-auto pr-1">
                  {cart.map((item, index) => (
                    <div
                      key={item._id}
                      className={`rounded-[26px] border border-slate-200 bg-white/90 p-4 shadow-sm animate-enter-delay-${Math.min(index + 1, 3)}`}
                    >
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
                            {getVegetableIcon(item.name, item.emoji)}
                          </div>
                          <div>
                            <h4 className="text-lg font-black text-slate-900">{item.name}</h4>
                            <p className="text-sm text-slate-500">{formatINR(item.price)}/kg</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-100"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          className="flex-1 rounded-xl bg-rose-100 py-2 font-black text-rose-700 transition hover:bg-rose-200"
                        >
                          -
                        </button>
                        <span className="flex-1 text-center text-lg font-black text-slate-900">{item.quantity} kg</span>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          className="flex-1 rounded-xl bg-emerald-100 py-2 font-black text-emerald-700 transition hover:bg-emerald-200"
                        >
                          +
                        </button>
                      </div>

                      <div className="mt-4 border-t border-slate-100 pt-3 text-right text-xl font-black text-slate-900">
                        {formatINR(toSafeNumber(item.price) * toSafeNumber(item.quantity))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-[28px] bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-800 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] text-emerald-100">Grand Total</p>
                      <p className="mt-2 text-4xl font-black">{formatINR(getTotalPrice())}</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 px-4 py-3 text-right">
                      <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">Items</p>
                      <p className="mt-1 text-2xl font-black">{cart.length}</p>
                    </div>
                  </div>
                </div>

                <button onClick={handlePlaceOrder} className="btn-primary mt-6 w-full py-4 text-lg">
                  Place Order
                </button>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default OrderForm;
