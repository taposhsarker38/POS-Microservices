
import axios, { AxiosHeaders } from "axios";
import store from "../stores/store"; // relative path ঠিক করে নাও
import { clearAuth, setAccessToken } from "../stores/authSlice";

const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_URL || (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000");

const api = axios.create({
  baseURL: AUTH_BASE + "/api/v1/",
  withCredentials: true,
  timeout: 30000,
});

// request interceptor to attach token
api.interceptors.request.use((cfg) => {
  const token = store.getState().auth.accessToken;

  // Use braces (style) and ensure correct header type
  if (!cfg.headers) {
    cfg.headers = new AxiosHeaders();
  }

  const headers = cfg.headers instanceof AxiosHeaders
    ? cfg.headers
    : new AxiosHeaders(cfg.headers as any);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  headers.set("Content-Type", "application/json");

  cfg.headers = headers;
  return cfg;
});


// optional: response interceptor to catch 401 and dispatch clearAuth
api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      // if refresh handled by RTK, just clear local auth if needed
      store.dispatch(clearAuth());
    }
    return Promise.reject(err);
  }
);

export default api;
