import { useEffect, useState } from "react";
import api, { getErrorMessage, setAuthToken } from "../lib/api";
import { AuthContext } from "./authContextValue";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  const persistSession = (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem("token", nextToken);
    localStorage.setItem("user", JSON.stringify(nextUser));
  };

  const clearSession = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuthToken(null);
  };

  const register = async (name, email, phone, password, role = "customer", city = "", village = "") => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post("/auth/register", {
        name,
        email,
        phone,
        password,
        role: role.toLowerCase(),
        city,
        village,
        latitude: 19.99,
        longitude: 73.78
      });

      const { token: nextToken, user: nextUser } = response.data;
      persistSession(nextToken, nextUser);
      return response.data;
    } catch (err) {
      const message = getErrorMessage(err, "Registration failed");
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post("/auth/login", { email, password });
      const { token: nextToken, user: nextUser } = response.data;
      persistSession(nextToken, nextUser);
      return response.data;
    } catch (err) {
      const message = getErrorMessage(err, "Login failed");
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearSession();
  };

  const syncUser = (nextUser) => {
    setUser(nextUser);
    localStorage.setItem("user", JSON.stringify(nextUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        register,
        login,
        logout,
        syncUser,
        isAuthenticated: Boolean(token)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
