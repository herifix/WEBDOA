import axios from "axios";

const http = axios.create({
  baseURL: "https://localhost:7125", // ⬅️ kosong karena pakai Vite proxy
  // headers: {
  //   "Content-Type": "application/json",
  // },
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default http;
