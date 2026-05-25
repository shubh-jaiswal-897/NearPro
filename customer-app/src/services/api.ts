import axios from "axios";
import * as SecureStore from "expo-secure-store";

// Use localhost for iOS simulator, and 10.0.2.2 for Android emulator
// In production, change to your hosted API domain.
const API_URL = "http://localhost:4000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Auto-inject JWT secure token before requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Failed to retrieve auth token from secure storage:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
