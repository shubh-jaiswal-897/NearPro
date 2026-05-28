import { Platform } from "react-native";

export interface GPSCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

/**
 * Get the current GPS location of the device.
 * Returns null on web or if permission is denied.
 */
export const getCurrentLocation = async (): Promise<GPSCoords | null> => {
  // Web fallback — use browser Geolocation API
  if (Platform.OS === "web") {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }),
        () => resolve(null),
        { timeout: 5000 }
      );
    });
  }

  // Native — use expo-location
  try {
    const ExpoLocation = await import("expo-location");
    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
    if (status !== "granted") return null;

    const location = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.High });
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy ?? undefined,
    };
  } catch (e) {
    console.warn("Failed to get GPS location:", e);
    return null;
  }
};
