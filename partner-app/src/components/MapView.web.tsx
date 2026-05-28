/**
 * MapView.web.tsx — Web stub for react-native-maps
 * Metro bundler automatically uses this file on web platform.
 * react-native-maps is not compatible with web, so we render a placeholder.
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";

// Web-safe stub — no react-native-maps import at all
const MapView = React.forwardRef<View, any>(({ style, children }, ref) => {
  return (
    <View ref={ref} style={[styles.mapPlaceholder, style]}>
      <Text style={styles.mapText}>🗺️ Map view available on mobile app</Text>
    </View>
  );
});

MapView.displayName = "MapView";

export const Marker = () => null;
export const PROVIDER_GOOGLE = undefined;
export default MapView;

const styles = StyleSheet.create({
  mapPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
    borderRadius: 8,
  },
  mapText: {
    color: "#888",
    fontSize: 14,
  },
});
