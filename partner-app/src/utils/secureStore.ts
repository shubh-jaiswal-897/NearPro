/**
 * SecureStore web polyfill — expo-secure-store is native-only.
 * On web, we fall back to localStorage (less secure, acceptable for dev/web preview).
 */
import { Platform } from "react-native";

let SecureStore: {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
};

if (Platform.OS === "web") {
  SecureStore = {
    getItemAsync: async (key: string) => localStorage.getItem(key),
    setItemAsync: async (key: string, value: string) => { localStorage.setItem(key, value); },
    deleteItemAsync: async (key: string) => { localStorage.removeItem(key); },
  };
} else {
  SecureStore = require("expo-secure-store");
}

export const getItemAsync = SecureStore.getItemAsync;
export const setItemAsync = SecureStore.setItemAsync;
export const deleteItemAsync = SecureStore.deleteItemAsync;

export default SecureStore;
