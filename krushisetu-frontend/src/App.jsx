import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";
import Navbar from "./Navbar";
import Login from "./Login";
import FarmerDashboard from "./FarmerDashboard";
import CustomerDashboard from "./CustomerDashboard";
import FarmerProfile from "./FarmerProfile";
import CustomerOrders from "./CustomerOrders";
import Profile from "./Profile";
import Favorites from "./Favorites";
import Notifications from "./Notifications";
import FarmerAnalytics from "./FarmerAnalytics";
import Reviews from "./Reviews";
import { LoadingState } from "./components/PageState";
import MapPage from "./MapPage";
import DeliveryDashboard from "./DeliveryDashboard";
import HubManagerDashboard from "./HubManagerDashboard";

function getDefaultRouteForRole(role) {
  switch (role) {
    case "farmer":
      return "/farmer-dashboard";
    case "delivery_boy":
      return "/delivery-dashboard";
    case "hub_manager":
      return "/hub-dashboard";
    case "customer":
    default:
      return "/customer-dashboard";
  }
}

function AccessDenied({ role }) {
  return (
    <div className="page-shell">
      <div className="mx-auto max-w-2xl rounded-[32px] border border-rose-200 bg-rose-50 p-10 text-center shadow-sm">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-rose-600">Access Denied</p>
        <h1 className="mt-4 text-4xl font-black text-slate-900">This dashboard is not available for your role.</h1>
        <p className="mt-4 text-slate-600">
          Your current role is <span className="font-bold">{role || "unknown"}</span>. Redirecting you to the correct workspace.
        </p>
        <Navigate to={getDefaultRouteForRole(role)} replace />
      </div>
    </div>
  );
}

function ProtectedRoute({ children, requiredRole = null }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingState title="Checking your session" subtitle="We are preparing your dashboard." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <AccessDenied role={user?.role} />;
  }

  return children;
}

function AppContent() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingState title="Loading KrushiSetu" subtitle="Restoring your account and routes." />;
  }

  return (
    <Router>
      <Navbar />
      <main className={isAuthenticated ? "pt-20 md:pl-72 md:pt-0" : ""}>
        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to={getDefaultRouteForRole(user?.role)} replace />
              ) : (
                <Login />
              )
            }
          />

          <Route
            path="/farmer-dashboard"
            element={
              <ProtectedRoute requiredRole="farmer">
                <FarmerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer-profile"
            element={
              <ProtectedRoute requiredRole="farmer">
                <FarmerProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer-analytics"
            element={
              <ProtectedRoute requiredRole="farmer">
                <FarmerAnalytics />
              </ProtectedRoute>
            }
          />

          <Route
            path="/customer-dashboard"
            element={
              <ProtectedRoute requiredRole="customer">
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer-orders"
            element={
              <ProtectedRoute requiredRole="customer">
                <CustomerOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute requiredRole="customer">
                <Favorites />
              </ProtectedRoute>
            }
          />

          <Route
            path="/delivery-dashboard"
            element={
              <ProtectedRoute requiredRole="delivery_boy">
                <DeliveryDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/hub-dashboard"
            element={
              <ProtectedRoute requiredRole="hub_manager">
                <HubManagerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reviews/:farmerId"
            element={
              <ProtectedRoute>
                <Reviews />
              </ProtectedRoute>
            }
          />

          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to={getDefaultRouteForRole(user?.role)} replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route path="/map" element={<MapPage />} />
        </Routes>
      </main>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
