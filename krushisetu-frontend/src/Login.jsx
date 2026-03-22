import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/useAuth";

function Login() {
  const navigate = useNavigate();
  const { login, register, loading, error } = useAuth();

  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "customer",
    city: "",
    village: ""
  });
  const [localError, setLocalError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalError("");

    try {
      await login(formData.email, formData.password);
      navigate("/");
    } catch (err) {
      setLocalError(err.response?.data?.message || "Login failed");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (formData.password !== formData.confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    if (!formData.phone || !formData.email || !formData.name || !formData.password) {
      setLocalError("Please fill all required fields");
      return;
    }

    try {
      await register(
        formData.name,
        formData.email,
        formData.phone,
        formData.password,
        formData.role,
        formData.city,
        formData.village
      );
      navigate("/");
    } catch (err) {
      setLocalError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.28),_transparent_28%),linear-gradient(135deg,_#062e1f_0%,_#14532d_48%,_#0f172a_100%)] px-4 py-10">
      <div className="floating-orb left-[8%] top-[12%] h-28 w-28 bg-emerald-300/30" />
      <div className="floating-orb bottom-[16%] right-[10%] h-36 w-36 bg-cyan-300/20" />
      <div className="floating-orb right-[26%] top-[20%] h-20 w-20 bg-yellow-200/20" />
hello
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="animate-enter hidden rounded-[36px] border border-white/10 bg-white/8 p-10 text-white shadow-[0_30px_100px_rgba(0,0,0,0.28)] backdrop-blur-xl lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.4em] text-emerald-200">KrushiSetu</p>
            <h1 className="mt-5 max-w-lg text-5xl font-black leading-tight">
              Fresh produce meets local trust.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-emerald-50/90">
              Farmers manage crops, customers place direct orders, and the platform keeps everything organized in one shared dashboard.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { value: "12+", label: "Available vegetables" },
              { value: "2", label: "User roles" },
              { value: "24/7", label: "Order visibility" }
            ].map((item, index) => (
              <div
                key={item.label}
                className={`rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur animate-enter-delay-${Math.min(index + 1, 3)}`}
              >
                <p className="text-3xl font-black text-white">{item.value}</p>
                <p className="mt-2 text-sm text-emerald-100/80">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card animate-enter mx-auto w-full max-w-xl overflow-hidden border-white/20 bg-white/88 p-0">
          <div className="border-b border-slate-100 bg-gradient-to-r from-white via-emerald-50 to-cyan-50 px-8 py-8">
            <div className="inline-flex rounded-full bg-emerald-100 px-4 py-1 text-xs font-bold uppercase tracking-[0.25em] text-emerald-700">
              Welcome
            </div>
            <h2 className="mt-4 text-4xl font-black text-slate-900">Access your farm network</h2>
            <p className="mt-3 text-slate-600">
              {isSignup ? "Create your account and start managing produce." : "Sign in to continue with orders, analytics, and profiles."}
            </p>
          </div>

          <div className="px-8 py-8">
            {(error || localError) && (
              <div className="animate-enter mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {error || localError}
              </div>
            )}

            {!isSignup ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-bold uppercase tracking-[0.18em] text-slate-500">Email</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    autoComplete="email"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold uppercase tracking-[0.18em] text-slate-500">Password</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    autoComplete="current-password"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-primary animate-glow w-full py-4 disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? "Logging in..." : "Login to Dashboard"}
                </button>

                <p className="pt-2 text-center text-sm text-slate-600">
                  Don&apos;t have an account?{" "}
                  <button type="button" onClick={() => setIsSignup(true)} className="font-bold text-emerald-700 transition hover:text-emerald-600">
                    Create one
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    autoComplete="name"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    autoComplete="tel"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  autoComplete="email"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  >
                    <option value="customer">Customer</option>
                    <option value="farmer">Farmer</option>
                  </select>

                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleInputChange}
                    autoComplete="address-level2"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <input
                  type="text"
                  name="village"
                  placeholder="Village"
                  value={formData.village}
                  onChange={handleInputChange}
                  autoComplete="address-level3"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    autoComplete="new-password"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    autoComplete="new-password"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-primary animate-glow w-full py-4 disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? "Creating account..." : "Create Account"}
                </button>

                <p className="pt-2 text-center text-sm text-slate-600">
                  Already have an account?{" "}
                  <button type="button" onClick={() => setIsSignup(false)} className="font-bold text-emerald-700 transition hover:text-emerald-600">
                    Login here
                  </button>
                </p>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Login;

