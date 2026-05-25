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
import Theme from "../components/Theme";

interface TrackingScreenProps {
  bookingId: string;
  onBackToHome: () => void;
}

export const TrackingScreen: React.FC<TrackingScreenProps> = ({ bookingId, onBackToHome }) => {
  const [booking, setBooking] = useState<any | null>(null);
  const [workerLocation, setWorkerLocation] = useState<{
    latitude: number;
    longitude: number;
    heading: number;
  } | null>(null);
  const [status, setStatus] = useState("PENDING");
  const [etaText, setEtaText] = useState("Finding nearby technician...");
  const [assignedWorker, setAssignedWorker] = useState<any | null>(null);
  
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    fetchBookingDetails();
    setupWebSockets();

    return () => {
      socketService.disconnect();
    };
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      // In a full implementation, you'd have a GET /bookings/:id. Let's mock or get it
      // For now we get current details from API
      // Since booking details API falls under standard retrieval, let's try calling it.
      // (Even if API throws, we fallback to WebSocket status syncing)
      const response = await api.get(`/bookings/me`); // Or custom endpoint
      // Set initial status based on API
    } catch (e) {
      console.warn("Could not load booking details from REST endpoint, relying on socket updates", e);
    }
  };

  const setupWebSockets = async () => {
    try {
      const socket = await socketService.connect();

      // Join room for this booking
      socket.emit("join_room", { roomId: `booking:${bookingId}` });

      // Listen for booking status changes
      socket.on("job:state_changed", (data: any) => {
        if (data.bookingId !== bookingId) return;

        setStatus(data.status);
        
        if (data.status === "ACCEPTED") {
          setAssignedWorker(data.worker);
          setEtaText("Technician assigned. Preparing to head out...");
        } else if (data.status === "EN_ROUTE") {
          setEtaText("Technician is traveling to your location...");
        } else if (data.status === "IN_PROGRESS") {
          setEtaText("Technician is performing the service...");
        } else if (data.status === "COMPLETED") {
          setEtaText("Service completed successfully! 🎉");
          Alert.alert("Service Completed", "Thank you for using NearPro!", [
            { text: "Back to Home", onPress: onBackToHome },
          ]);
        } else if (data.status === "CANCELLED") {
          setEtaText("Booking cancelled.");
          Alert.alert("Booking Cancelled", "The booking has been cancelled.", [
            { text: "Back to Home", onPress: onBackToHome },
          ]);
        }
      });

      // Listen for coordinates stream from assigned worker
      socket.on("worker:location_stream", (coords: any) => {
        if (coords.bookingId !== bookingId) return;

        setWorkerLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          heading: coords.heading,
        });

        // Recalculate ETA dynamically
        if (coords.etaSeconds) {
          const mins = Math.max(1, Math.round(coords.etaSeconds / 60));
          setEtaText(`Arriving in approx ${mins} minutes`);
        } else {
          setEtaText("Technician is en route...");
        }

        // Animate map camera to keep both markers in view
        fitMarkers();
      });

      // Catch search failures
      socket.on("job:allocation_failed", (data: any) => {
        if (data.bookingId === bookingId) {
          setEtaText("No technician accepted. Retrying match...");
        }
      });

    } catch (error) {
      console.error("Socket tracking stream setup failed:", error);
    }
  };

  const fitMarkers = () => {
    if (!mapRef.current || !workerLocation || !booking) return;

    mapRef.current.fitToCoordinates(
      [
        { latitude: booking.pickupLat, longitude: booking.pickupLng },
        { latitude: workerLocation.latitude, longitude: workerLocation.longitude },
      ],
      {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      }
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Live Tracking</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={onBackToHome}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        {/* Native Map (React Native Maps) */}
        {/* We center on a default coordinate in case geolocations are loading */}
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          customMapStyle={mapStyle}
          initialRegion={{
            latitude: booking?.pickupLat || 40.7128,
            longitude: booking?.pickupLng || -74.0060,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >
          {/* Customer Pickup Pin */}
          {booking && (
            <Marker
              coordinate={{ latitude: booking.pickupLat, longitude: booking.pickupLng }}
              title="Your Location"
              pinColor={Theme.colors.primary}
            />
          )}

          {/* Worker Moving Pin */}
          {workerLocation && (
            <Marker
              coordinate={{
                latitude: workerLocation.latitude,
                longitude: workerLocation.longitude,
              }}
              title="Technician"
              flat
              rotation={workerLocation.heading}
            >
              <View style={styles.workerMarker}>
                <Text style={styles.workerEmoji}>🛠️</Text>
              </View>
            </Marker>
          )}
        </MapView>

        {/* Dynamic Details Bottom Modal Sheet */}
        <View style={styles.glassSheet}>
          <Text style={styles.statusTitle}>{etaText}</Text>
          
          <View style={styles.divider} />

          {assignedWorker ? (
            <View style={styles.workerRow}>
              <View style={styles.workerAvatar}>
                <Text style={styles.avatarText}>
                  {assignedWorker.name.charAt(0)}
                </Text>
              </View>
              <View style={styles.workerDetails}>
                <Text style={styles.workerName}>{assignedWorker.name}</Text>
                <Text style={styles.workerPhone}>📞 {assignedWorker.phone}</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{status}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.searchingRow}>
              <Text style={styles.searchingText}>
                Matching you with the closest verified worker in your city...
              </Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const mapStyle = [
  {
    elementType: "geometry",
    stylers: [{ color: "#0c0d12" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca3af" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#0c0d12" }],
  },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#2d3142" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#161824" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#2d3142" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#000000" }],
  },
];

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
  closeBtn: {
    padding: Theme.spacing.xs,
  },
  closeText: {
    color: Theme.colors.danger,
    fontSize: 15,
  },
  container: {
    flex: 1,
    position: "relative",
  },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height - 120,
  },
  workerMarker: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.primary,
    borderWidth: 2,
    borderRadius: 20,
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  workerEmoji: {
    fontSize: 18,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  statusTitle: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: Theme.colors.border,
    marginVertical: Theme.spacing.md,
  },
  workerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  workerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: Theme.colors.text,
    fontSize: 18,
    fontWeight: "bold",
  },
  workerDetails: {
    flex: 1,
    marginLeft: Theme.spacing.md,
  },
  workerName: {
    color: Theme.colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  workerPhone: {
    color: Theme.colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  badge: {
    backgroundColor: Theme.colors.surfaceLight,
    borderRadius: Theme.borderRadius.sm,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
  },
  badgeText: {
    color: Theme.colors.success,
    fontSize: 11,
    fontWeight: "bold",
  },
  searchingRow: {
    paddingVertical: Theme.spacing.xs,
  },
  searchingText: {
    color: Theme.colors.textMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 18,
  },
});

export default TrackingScreen;
