import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/useAuth";
import { getVegetableIcon } from "./utils/vegetableIcons";
import { formatINR } from "./utils/formatters";

import { API_URL } from "./lib/api";

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [farmerProfile, setFarmerProfile] = useState(null);
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(res.data.user);
        setFormData(res.data.user);

        if (res.data.user?.role === "farmer") {
          const farmerRes = await axios.get(`${API_URL}/farmers/profile/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setFarmerProfile(farmerRes.data.profile);
        }
      } catch {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, isAuthenticated, navigate]);

  const handleUpdate = async () => {
    try {
      const res = await axios.put(`${API_URL}/auth/me`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data.user);
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch {
      alert("Failed to update profile");
    }
  };

  if (loading) {
    return (
      <div className="page-shell flex items-center justify-center">
        <div className="glass-card text-center">
          <div className="mx-auto mb-5 h-16 w-16 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="text-2xl font-black text-emerald-700">Loading profile...</p>
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
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="page-hero animate-enter">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-emerald-100">Account Center</p>
          <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-5">
              <div className="animate-float flex h-24 w-24 items-center justify-center rounded-[28px] bg-white/16 text-5xl backdrop-blur">
                {user?.role === "farmer" ? "🌾" : "🛒"}
              </div>
              <div>
                <h1 className="text-4xl font-black md:text-5xl">{user?.name}</h1>
                <p className="mt-2 text-base text-emerald-50/90">{user?.email}</p>
                <div className="mt-4 inline-flex rounded-full bg-white/16 px-4 py-2 text-xs font-black uppercase tracking-[0.22em]">
                  {user?.role}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl bg-white/14 px-5 py-4 backdrop-blur">
                <p className="text-2xl font-black">{user?.phone ? "1" : "0"}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-emerald-100/80">Phone Set</p>
              </div>
              <div className="rounded-2xl bg-white/14 px-5 py-4 backdrop-blur">
                <p className="text-2xl font-black">{farmerProfile?.cropsAvailable?.length || 0}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-emerald-100/80">Available Veg</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="glass-card animate-enter-delay-1">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-600">Personal Info</p>
                <h2 className="mt-2 text-3xl font-black text-slate-900">Profile details</h2>
              </div>
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="btn-secondary">
                  Edit Profile
                </button>
              ) : null}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[24px] border border-slate-100 bg-slate-50/70 p-5">
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-500">Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                ) : (
                  <p className="text-xl font-black text-slate-900">{user?.name}</p>
                )}
              </div>

              <div className="rounded-[24px] border border-slate-100 bg-slate-50/70 p-5">
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-500">Email</label>
                <p className="text-xl font-black text-slate-900">{user?.email}</p>
              </div>

              <div className="rounded-[24px] border border-slate-100 bg-slate-50/70 p-5">
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-500">Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                ) : (
                  <p className="text-xl font-black text-slate-900">{user?.phone || "Not set"}</p>
                )}
              </div>

              <div className="rounded-[24px] border border-slate-100 bg-slate-50/70 p-5">
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-500">Role</label>
                <p className="text-xl font-black capitalize text-slate-900">{user?.role}</p>
              </div>

              {user?.role === "farmer" ? (
                <>
                  <div className="rounded-[24px] border border-slate-100 bg-slate-50/70 p-5">
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-500">City</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.city || ""}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                      />
                    ) : (
                      <p className="text-xl font-black text-slate-900">{user?.city || "Not set"}</p>
                    )}
                  </div>

                  <div className="rounded-[24px] border border-slate-100 bg-slate-50/70 p-5">
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-500">Village</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.village || ""}
                        onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                      />
                    ) : (
                      <p className="text-xl font-black text-slate-900">{user?.village || "Not set"}</p>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {isEditing ? (
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button onClick={handleUpdate} className="btn-primary flex-1 py-4">
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(user);
                  }}
                  className="btn-secondary flex-1 py-4"
                >
                  Cancel
                </button>
              </div>
            ) : null}
          </section>

          <section className="glass-card animate-enter-delay-2">
            <div className="mb-6">
              <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-600">Farmer Inventory</p>
              <h2 className="mt-2 text-3xl font-black text-slate-900">Available vegetables</h2>
            </div>

            {user?.role === "farmer" ? (
              farmerProfile?.cropsAvailable?.length ? (
                <div className="grid gap-3">
                  {farmerProfile.cropsAvailable.map((crop, index) => (
                    <div
                      key={crop._id}
                      className={`flex items-center justify-between rounded-[24px] border border-emerald-100 bg-gradient-to-r from-emerald-50 to-white px-5 py-4 animate-enter-delay-${Math.min(index + 1, 3)}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                          {getVegetableIcon(crop.name, crop.emoji)}
                        </div>
                        <div>
                          <p className="text-lg font-black text-slate-900">{crop.name}</p>
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">{crop.category || "Vegetable"}</p>
                        </div>
                      </div>
                      <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-black text-white">
                        {crop.price != null ? formatINR(crop.price, 0) : "--"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
                  <div className="animate-float text-5xl">🌱</div>
                  <p className="mt-4 text-xl font-black text-slate-700">No vegetables added yet</p>
                  <p className="mt-2 text-sm text-slate-500">Update your farm profile to show customers what is currently available.</p>
                </div>
              )
            ) : (
              <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
                <div className="animate-float text-5xl">🧾</div>
                <p className="mt-4 text-xl font-black text-slate-700">Customer account</p>
                <p className="mt-2 text-sm text-slate-500">Vegetable availability appears here only for farmer accounts.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default Profile;


