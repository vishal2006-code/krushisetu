import { useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./context/useAuth";
import { useTheme } from "./context/useTheme";

// 🔥 प्रोफेशनल आयकॉन्स Lucide React मधून इम्पोर्ट केले आहेत
import { 
  LayoutDashboard, 
  Map, 
  ShoppingBag, 
  Heart, 
  Bell, 
  UserCircle, 
  Truck, 
  Warehouse, 
  Sprout, 
  BarChart3, 
  Settings,
  LogOut,
  Menu,
  X
} from "lucide-react";

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="w-full rounded-2xl border border-slate-200/70 bg-white/75 px-4 py-3 text-sm font-bold text-slate-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
    >
      {isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
    </button>
  );
}

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout, loading } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // 🔥 रोलनुसार प्रोफेशनल आयकॉन्स मॅपिंग
  const navigationItems = useMemo(() => {
    const size = 20;
    
    // FARMER ROUTES
    if (user?.role === "farmer") {
      return [
        { label: "Dashboard", to: "/farmer-dashboard", icon: <LayoutDashboard size={size} /> },
        { label: "Farm Profile", to: "/farmer-profile", icon: <Sprout size={size} /> },
        { label: "Analytics", to: "/farmer-analytics", icon: <BarChart3 size={size} /> },
        { label: "Account", to: "/profile", icon: <UserCircle size={size} /> }
      ];
    }

    // DELIVERY BOY ROUTES
    if (user?.role === "delivery_boy") {
      return [
        { label: "Delivery Tasks", to: "/delivery-dashboard", icon: <Truck size={size} /> },
        { label: "Notifications", to: "/notifications", icon: <Bell size={size} /> },
        { label: "Account", to: "/profile", icon: <UserCircle size={size} /> }
      ];
    }

    // HUB MANAGER ROUTES
    if (user?.role === "hub_manager") {
      return [
        { label: "Hub Mgmt", to: "/hub-dashboard", icon: <Warehouse size={size} /> },
        { label: "Notifications", to: "/notifications", icon: <Bell size={size} /> },
        { label: "Account", to: "/profile", icon: <UserCircle size={size} /> }
      ];
    }

    // CUSTOMER ROUTES (Default)
    return [
      { label: "Dashboard", to: "/customer-dashboard", icon: <LayoutDashboard size={size} /> },
      { label: "Farmer Map", to: "/map", icon: <Map size={size} /> },
      { label: "My Orders", to: "/customer-orders", icon: <ShoppingBag size={size} /> },
      { label: "Favorites", to: "/favorites", icon: <Heart size={size} /> },
      { label: "Notifications", to: "/notifications", icon: <Bell size={size} /> },
      { label: "Account", to: "/profile", icon: <UserCircle size={size} /> }
    ];
  }, [user?.role]);

  const handleLogout = () => {
    logout();
    setIsMobileOpen(false);
    navigate("/login");
  };

  if (loading || !isAuthenticated || location.pathname === "/login") {
    return null;
  }

  const navItemClass = ({ isActive }) =>
    [
      "group flex items-center gap-3 rounded-[22px] px-4 py-3 text-sm font-bold tracking-[0.03em] transition-all duration-300",
      isActive
        ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-[0_18px_36px_rgba(16,185,129,0.25)]"
        : "text-slate-600 hover:bg-white/80 hover:text-emerald-700 hover:shadow-sm dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-emerald-300"
    ].join(" ");

  return (
    <>
      {/* Mobile Header */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/70 bg-white/80 backdrop-blur-xl md:hidden dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex items-center justify-between px-4 py-4">
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <Menu size={24} />
          </button>
          <button type="button" onClick={() => navigate("/")} className="text-lg font-black tracking-[0.14em] text-emerald-600">
            KRUSHISETU
          </button>
          <div className="h-10 w-10 rounded-full bg-emerald-500/10 p-1 flex items-center justify-center">
             <UserCircle size={24} className="text-emerald-600" />
          </div>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop & Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-hidden border-r border-white/70 bg-white px-5 py-6 shadow-2xl transition-transform duration-300 dark:border-slate-800/80 dark:bg-slate-950 md:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Workspace Branding */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Workspace</p>
            <h1 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">KrushiSetu</h1>
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="md:hidden">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* User Profile Card */}
        <div className="relative mb-8 overflow-hidden rounded-[28px] bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white shadow-xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100/80">Active Session</p>
          <h2 className="mt-3 truncate text-lg font-black">{user?.name}</h2>
          <div className="mt-3 inline-block rounded-full bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
            {user?.role?.replace("_", " ")}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => (
            <NavLink 
              key={item.to} 
              to={item.to} 
              className={navItemClass} 
              onClick={() => setIsMobileOpen(false)}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 transition-colors group-hover:bg-emerald-100 dark:bg-slate-800 dark:group-hover:bg-emerald-900/30">
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="mt-6 space-y-3 border-t border-slate-100 pt-6 dark:border-slate-800">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-50 py-3 text-sm font-black uppercase tracking-widest text-rose-600 transition-colors hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

export default Navbar;