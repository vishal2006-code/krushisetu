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

function ProtectedRoute({ children, requiredRole = null }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingState title="Checking your session" subtitle="We are preparing your dashboard." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/login" replace />;
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
                <Navigate to={user?.role === "farmer" ? "/farmer-dashboard" : "/customer-dashboard"} replace />
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
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
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
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
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
                <Navigate to={user?.role === "farmer" ? "/farmer-dashboard" : "/customer-dashboard"} replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
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

