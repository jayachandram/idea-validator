import axios from "axios";

/*
Production: same domain -> /api
Development: localhost backend
*/

const API_BASE =
  process.env.NODE_ENV === "development"
    ? "http://localhost:5000/api"
    : "/api";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 30000
});

api.interceptors.request.use((config) => {

  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;

});

export default api;