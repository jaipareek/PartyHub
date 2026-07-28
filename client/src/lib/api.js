import axios from "axios";

// 🧠 LEARN: axios.create() makes a reusable HTTP client
// Instead of writing the base URL every time, we set it once here
// Every API call will automatically use this base URL
//
// Example:
//   api.get("/events")  →  sends GET to http://localhost:5000/api/events
//   api.post("/bookings", data)  →  sends POST to http://localhost:5000/api/bookings

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Send cookies with requests (needed for auth)
});

// 🧠 LEARN: Interceptors — middleware for HTTP requests
// This runs BEFORE every request is sent
// We'll use it to attach the auth token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// This runs AFTER every response is received
// If we get a 401 (unauthorized), remove token safely without forcing an infinite reload loop
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      
      const currentPath = window.location.pathname;
      const isPublicOrAuthPage = [
        "/login", 
        "/signup", 
        "/owner/login", 
        "/owner/signup", 
        "/", 
        "/events", 
        "/venues"
      ].includes(currentPath) || currentPath.startsWith("/events/") || currentPath.startsWith("/venues/");

      // Only redirect to login if user is currently on a protected route (e.g. /my-bookings, /squads)
      if (!isPublicOrAuthPage) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
