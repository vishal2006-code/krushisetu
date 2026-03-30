import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "https://krushisetu-backend-d32x.onrender.com/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }

    return Promise.reject(error);
  }
);

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
}

export function getErrorMessage(error, fallback = "Something went wrong") {
  return error.response?.data?.message || fallback;
}

export default api;
