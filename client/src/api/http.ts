import axios from "axios";
import { APP_CONFIG } from "../config/appConfig";

const http = axios.create({
  // Keep relative API paths rooted at the Vite origin when dev base URL is empty.
  baseURL: APP_CONFIG.apiBaseUrl || "/",
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default http;
