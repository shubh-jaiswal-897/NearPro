import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Dimensions,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import socketService from "../services/socket";
import api from "../services/api";
import { getCurrentLocation } from "../../customer-app/src/utils/location";
import Theme from "../components/Theme";

interface NavigationScreenProps {
  bookingId: string;
  onJobFinished: () => void;
}

export const NavigationScreen: React.FC<NavigationScreenProps> = ({
  bookingId,
  onJobFinished,
}) => {
  const [booking, setBooking] = useState<any | null>(null);
  const [status, setStatus] = useState("ACCEPTED");
  const [loading, setLoading] = useState(false);
  
  const mapRef = useRef<MapView | null>(null);
  const gpsIntervalRef = useRef<any>(null);

  useEffect(() => {
    fetchBookingDetails();
    setupWebSockets();

    return () => {
      stopGPSBroadcast();
    };
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      // In production, fetch specific booking details
      // Here we simulate loading
      setBooking({
        id: bookingId,
        pickupLat: 40.7128,
        pickupLng: -74.0060,
        pickupAddress: "Flat 302, Green Avenue, NY",
        customerName: "Jane Smith",
        customerPhone: "+1987654321",
        workerCut: 38.50,
      });
    } catch (e) {
      console.error("Failed to load booking info", e);
    }
  };

  const setupWebSockets = async () => {
    try {
      const socket = await socketService.connect();
      socket.emit("join_room", { roomId: `booking:${bookingId}` });

      // Start transmitting coordinates mapping to this booking ID
      startGPSBroadcast();
    } catch (err) {
      console.error("Socket error on navigation screen:", err);
    }
  };

  const startGPSBroadcast = async () => {
    stopGPSBroadcast();

    const workerId = await api.defaults.headers.common["Authorization"] // mock workerId retrieval
      ? "worker-id"
      : "worker-id";

    broadcastPosition();

    // Broadcast GPS location to websocket room every 5 seconds (fast sync during navigation!)
    gpsIntervalRef.current = setInterval(() => {
      broadcastPosition();
    }, 5000);
  };

  const stopGPSBroadcast = () => {
    if (gpsIntervalRef.current) {
      clearInterval(gpsIntervalRef.current);
      gpsIntervalRef.current = null;
    }
  };

  const broadcastPosition = async () => {
    try {
      const socket = socketService.getSocket();
      if (!socket || !socket.connected) return;

      const gps = await getCurrentLocation();
      const workerId = await SecureStore.getItemAsync("userId");
      const cityId = await SecureStore.getItemAsync("workerCityId");

      if (gps) {
        socket.emit("worker:location_update", {
          workerId,
          cityId,
          latitude: gps.latitude,
          longitude: gps.longitude,
          heading: 90, // heading mock
          bookingId, // links coordinate stream to booking
        });
      }
    } catch (e) {
      console.warn("Failed to broadcast coordinate stream:", e);
    }
  };

  const handleStatusTransition = async () => {
    setLoading(true);
    try {
      let nextStatus = "ACCEPTED";
      if (status === "ACCEPTED") nextStatus = "EN_ROUTE";
      else if (status === "EN_ROUTE") nextStatus = "IN_PROGRESS";
      else if (status === "IN_PROGRESS") nextStatus = "COMPLETED";

      // Call patch status
      await api.patch("/bookings/status", {
        bookingId,
        status: nextStatus,
      });

      setStatus(nextStatus);

      if (nextStatus === "COMPLETED") {
        stopGPSBroadcast();
        Alert.alert(
          "Job Completed! 🎉",
          `Earnings of $${booking?.workerCut?.toFixed(2)} have been credited to your wallet.`,
          [{ text: "Back to Dashboard", onPress: onJobFinished }]
        );
      }
    } catch (e) {
      console.error("Failed to update booking status lifecycle:", e);
      Alert.alert("Error", "Failed to transition status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getButtonText = () => {
    if (status === "ACCEPTED") return "START TRAVELING (EN ROUTE)";
    if (status === "EN_ROUTE") return "ARRIVED (START SERVICE)";
    if (status === "IN_PROGRESS") return "SERVICE COMPLETED";
    return "FINISHED";
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Job Dispatch Routing</Text>
        <Text style={styles.statusBadge}>{status}</Text>
      </View>

      <View style={styles.container}>
        {/* Navigation Map overlay */}
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: booking?.pickupLat || 40.7128,
            longitude: booking?.pickupLng || -74.0060,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          }}
        >
          {booking && (
            <Marker
              coordinate={{ latitude: booking.pickupLat, longitude: booking.pickupLng }}
              title="Customer Address"
              pinColor={Theme.colors.primary}
            />
          )}
        </MapView>

        {/* Customer Routing Bottom Sheet */}
        {booking && (
          <View style={styles.glassSheet}>
            <Text style={styles.customerName}>Client: {booking.customerName}</Text>
            <Text style={styles.customerAddr}>📍 {booking.pickupAddress}</Text>
            <Text style={styles.customerPhone}>📞 Phone: {booking.customerPhone}</Text>

            <View style={styles.divider} />

            <TouchableOpacity
              style={[styles.actionBtn, loading && styles.disabledBtn]}
              onPress={handleStatusTransition}
              disabled={loading}
            >
              <Text style={styles.actionText}>{getButtonText()}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Theme.colors.text,
  },
  statusBadge: {
    backgroundColor: "rgba(124, 58, 237, 0.15)",
    borderColor: Theme.colors.primary,
    borderWidth: 1,
    color: Theme.colors.primary,
    fontSize: 11,
    fontWeight: "bold",
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.sm,
  },
  container: {
    flex: 1,
    position: "relative",
  },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height - 120,
  },
  glassSheet: {
    position: "absolute",
    bottom: Theme.spacing.lg,
    left: Theme.spacing.md,
    right: Theme.spacing.md,
    backgroundColor: Theme.colors.glassBg,
    borderColor: Theme.colors.glassBorder,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
  },
  customerName: {
    color: Theme.colors.text,
    fontSize: 18,
    fontWeight: "bold",
  },
  customerAddr: {
    color: Theme.colors.textMuted,
    fontSize: 14,
    marginTop: Theme.spacing.xs,
  },
  customerPhone: {
    color: Theme.colors.textMuted,
    fontSize: 14,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Theme.colors.border,
    marginVertical: Theme.spacing.md,
  },
  actionBtn: {
    width: "100%",
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: Theme.spacing.md,
    alignItems: "center",
  },
  disabledBtn: {
    backgroundColor: Theme.colors.border,
  },
  actionText: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default NavigationScreen;
