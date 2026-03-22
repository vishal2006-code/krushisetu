import { useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./context/useAuth";
import { useTheme } from "./context/useTheme";

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-2xl border border-slate-200/70 bg-white/75 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
      aria-label="Toggle theme"
    >
      {isDark ? "Light Mode" : "Dark Mode"}
    </button>
  );
}

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout, loading } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navigationItems = useMemo(() => {
    if (user?.role === "farmer") {
      return [
        { label: "Dashboard", to: "/farmer-dashboard", icon: "DB" },
        { label: "Farm Profile", to: "/farmer-profile", icon: "FP" },
        { label: "Analytics", to: "/farmer-analytics", icon: "AN" },
        { label: "Account", to: "/profile", icon: "AC" }
      ];
    }

    return [
      { label: "Dashboard", to: "/customer-dashboard", icon: "DB" },
      { label: "My Orders", to: "/customer-orders", icon: "OR" },
      { label: "Favorites", to: "/favorites", icon: "FV" },
      { label: "Notifications", to: "/notifications", icon: "NT" },
      { label: "Account", to: "/profile", icon: "AC" }
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
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/70 bg-white/80 backdrop-blur-xl md:hidden dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex items-center justify-between px-4 py-4">
          <button
            type="button"
            onClick={() => setIsMobileOpen((open) => !open)}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            Menu
          </button>

          <button type="button" onClick={() => navigate("/")} className="text-lg font-black tracking-[0.14em] text-slate-900 dark:text-slate-50">
            KRUSHISETU
          </button>

          <div className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
            {user?.role}
          </div>
        </div>
      </header>

      {isMobileOpen ? (
        <button
          type="button"
          aria-label="Close menu overlay"
          className="fixed inset-0 z-40 bg-slate-950/35 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      ) : null}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-hidden border-r border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(240,253,244,0.95)_45%,rgba(239,246,255,0.92)_100%)] px-5 py-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.94)_0%,rgba(15,23,42,0.95)_45%,rgba(17,24,39,0.94)_100%)]",
          "md:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        ].join(" ")}
        style={{
          transition: isMobileOpen ? "transform 300ms ease" : undefined
        }}
      >
        <div className="floating-orb -right-6 top-20 h-24 w-24 bg-emerald-200/45" />
        <div className="floating-orb -left-10 bottom-28 h-28 w-28 bg-cyan-200/35" />

        <div className="animate-enter mb-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              navigate("/");
              setIsMobileOpen(false);
            }}
            className="text-left"
          >
            <p className="text-xs font-black uppercase tracking-[0.34em] text-emerald-600">KrushiSetu</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-50">Workspace</h1>
          </button>

          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-500 md:hidden dark:border-slate-700 dark:text-slate-300"
          >
            Close
          </button>
        </div>

        <div className="animate-enter-delay-1 relative mb-8 overflow-hidden rounded-[28px] bg-gradient-to-br from-emerald-500 via-green-500 to-cyan-500 p-5 text-white shadow-[0_26px_60px_rgba(22,163,74,0.2)]">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/12" />
          <div className="absolute bottom-0 right-12 h-14 w-14 rounded-full bg-white/10" />
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-100">Signed in as</p>
          <h2 className="mt-4 text-xl font-black">{user?.name || "User"}</h2>
          <p className="mt-1 text-sm text-emerald-50/90">{user?.email}</p>
          <div className="mt-4 inline-flex rounded-full bg-white/18 px-3 py-1 text-xs font-black uppercase tracking-[0.18em]">
            {user?.role}
          </div>
        </div>

        <nav className="animate-enter-delay-2 flex-1 space-y-2">
          {navigationItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={navItemClass} onClick={() => setIsMobileOpen(false)}>
              <span className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-black/5 text-xs font-black tracking-[0.14em] transition-all duration-300 group-hover:bg-emerald-100 dark:bg-white/5 dark:group-hover:bg-emerald-500/10">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="animate-enter-delay-3 mt-8 border-t border-white/70 pt-6 dark:border-slate-800">
          <div className="mb-4">
            <ThemeToggle />
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-rose-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
          >
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
}

export default Navbar;
