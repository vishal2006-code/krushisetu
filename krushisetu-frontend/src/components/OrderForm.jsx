import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { getVegetableIcon } from "../utils/vegetableIcons";
import { formatINR } from "../utils/formatters";
import { API_URL } from "../lib/api";

const CATEGORY_TABS = [
  { key: "all", label: "All" },
  { key: "vegetable", label: "Vegetables" },
  { key: "grain", label: "Grains" },
  { key: "fruit", label: "Fruits" }
];

function formatCategoryLabel(category) {
  if (!category) {
    return "Product";
  }

  return category.charAt(0).toUpperCase() + category.slice(1);
}

function getUnitLabel(unit, quantity) {
  const safeUnit = unit === "quintal" ? "quintal" : "kg";
  const safeQuantity = Number(quantity) || 0;
  if (safeQuantity === 1) {
    return safeUnit;
  }
  return safeUnit === "quintal" ? "quintals" : "kg";
}

function OrderForm() {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState(null);
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    axios
      .get(`${API_URL}/vegetables`)
      .then((res) => setProducts(Array.isArray(res.data) ? res.data : []))
      .catch(() => alert("Error loading products"));
  }, []);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "all") {
      return products;
    }

    return products.filter((product) => product.category === selectedCategory);
  }, [products, selectedCategory]);

  const selectedProductData = useMemo(
    () => filteredProducts.find((product) => product._id === selectedProduct) || null,
    [filteredProducts, selectedProduct]
  );

  const cartSummary = useMemo(() => {
    const itemCount = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const total = cart.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
      0
    );
    return { itemCount, total };
  }, [cart]);

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setLocation({
          type: "Point",
          coordinates: [lng, lat]
        });

        alert("Location captured successfully");
      },
      () => {
        alert("Location permission denied");
      }
    );
  };

  const addToCart = () => {
    if (!selectedProductData) {
      alert("Select a product");
      return;
    }

    setCart((prev) => [...prev, { ...selectedProductData, quantity: Number(quantity) || 1 }]);
    setQuantity(1);
    setSelectedProduct("");
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return alert("Cart empty");
    if (!deliveryAddress) return alert("Enter address");
    if (!location) return alert("Click 'Use My Location' first");

    try {
      const orderItems = cart.map((item) => ({
        vegetableId: item._id,
        quantity: item.quantity
      }));

      await axios.post(
        `${API_URL}/orders`,
        {
          orderItems,
          deliveryAddress,
          notes,
          location
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert("Order placed successfully");
      setCart([]);
      setDeliveryAddress("");
      setNotes("");
      setLocation(null);
      navigate("/customer-orders");
    } catch (err) {
      if (err.response?.data?.message) {
        alert(err.response.data.message);
      } else {
        alert("Product not available near you");
      }
    }
  };

  return (
    <section className="glass-card p-6 md:p-8">
      <div className="flex flex-col gap-8 xl:grid xl:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">
                Order Builder
              </p>
              <h2 className="mt-2 text-3xl font-black text-slate-900">
                Create your produce and grain order
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Switch categories, choose products, and place an order with the same delivery flow.
              </p>
            </div>
            <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/80 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                Available products
              </p>
              <p className="mt-1 text-2xl font-black text-slate-900">{filteredProducts.length}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {CATEGORY_TABS.map((tab) => {
              const active = selectedCategory === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(tab.key);
                    setSelectedProduct("");
                  }}
                  className={[
                    "rounded-full border px-4 py-2 text-sm font-black transition",
                    active
                      ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
                  ].join(" ")}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="surface-panel p-5">
              <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Product
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="input-shell mt-3"
              >
                <option value="">Select product</option>
                {filteredProducts.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name} - {formatINR(product.price)} / {product.unit || "kg"}
                  </option>
                ))}
              </select>

              {selectedProductData ? (
                <div className="mt-4 flex items-center gap-3 rounded-[22px] border border-emerald-100 bg-emerald-50/70 p-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                    {getVegetableIcon(selectedProductData.name, selectedProductData.emoji)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-slate-900">{selectedProductData.name}</p>
                    <p className="text-sm text-slate-500">
                      {formatINR(selectedProductData.price)} per {selectedProductData.unit || "kg"}
                    </p>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                      {formatCategoryLabel(selectedProductData.category)}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="surface-panel p-5">
              <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Quantity ({selectedProductData?.unit || "kg"})
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="input-shell mt-3"
              />
              <button onClick={addToCart} className="btn-primary mt-4 w-full">
                Add To Cart
              </button>
            </div>
          </div>

          <div className="surface-panel p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Delivery details
                </p>
                <h3 className="mt-1 text-xl font-black text-slate-900">Address and notes</h3>
              </div>
              <button onClick={getLocation} className="btn-secondary">
                {location ? "Location Added" : "Use My Location"}
              </button>
            </div>

            <textarea
              placeholder="Enter full delivery address"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              rows={4}
              className="input-shell mt-4 resize-none"
            />

            <textarea
              placeholder="Notes for delivery, timing, or special instructions"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="input-shell mt-4 resize-none"
            />

            <div
              className={[
                "mt-4 rounded-[22px] border px-4 py-3 text-sm font-semibold",
                location
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-500"
              ].join(" ")}
            >
              {location
                ? `Location captured: ${location.coordinates[1].toFixed(4)}, ${location.coordinates[0].toFixed(4)}`
                : "Location not added yet"}
            </div>
          </div>
        </div>

        <aside className="surface-panel flex h-fit flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Cart Summary
              </p>
              <h3 className="mt-1 text-2xl font-black text-slate-900">Your basket</h3>
            </div>
            <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
              {cart.length} items
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {cart.length > 0 ? (
              cart.map((item, index) => (
                <div
                  key={`${item._id}-${index}`}
                  className="flex items-center gap-3 rounded-[22px] border border-slate-200 bg-slate-50/80 p-4"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                    {getVegetableIcon(item.name, item.emoji)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-500">
                      {item.quantity} {getUnitLabel(item.unit, item.quantity)} x {formatINR(item.price)}
                    </p>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                      {formatCategoryLabel(item.category)}
                    </p>
                  </div>
                  <p className="text-sm font-black text-slate-900">
                    {formatINR(item.quantity * item.price)}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-sm text-slate-500">
                Your cart is empty. Add products to start building the order.
              </div>
            )}
          </div>

          <div className="mt-5 rounded-[24px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-cyan-50 p-5">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Total quantity</span>
              <span className="font-bold text-slate-900">{cartSummary.itemCount}</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-slate-500">Estimated total</span>
              <span className="text-3xl font-black text-slate-900">
                {formatINR(cartSummary.total)}
              </span>
            </div>
            <button onClick={handlePlaceOrder} className="btn-primary mt-5 w-full">
              Place Order
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default OrderForm;
