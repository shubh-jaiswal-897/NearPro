import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Dimensions,
  Linking,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_GOOGLE } from "../components/MapView";
import socketService from "../services/socket";
import api from "../services/api";
import * as SecureStore from "../utils/secureStore";
import { getCurrentLocation } from "../utils/location";
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
  
  // OTP States
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");

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
        pickupLat: 28.6273, // Noida / NCR area coordinates
        pickupLng: 77.3725,
        pickupAddress: "Flat 402, Royal Palms, Sector 62, Noida",
        customerName: "Jane Smith",
        customerPhone: "+91 98765 43210",
        customerNotes: "Home Electrical Wiring Repair - The living room lights are flickering, and the main switchboard has a burnt smell. Please call when you reach the gate.",
        workerCut: 1250.00,
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

  const handleStatusTransition = async (bypassOtp = false) => {
    // If transitioning from EN_ROUTE to IN_PROGRESS, require OTP
    if (status === "EN_ROUTE" && !bypassOtp) {
      setOtpValue("");
      setOtpError("");
      setOtpModalVisible(true);
      return;
    }

    setLoading(true);
    try {
      let nextStatus = "ACCEPTED";
      if (status === "ACCEPTED") nextStatus = "EN_ROUTE";
      else if (status === "EN_ROUTE") nextStatus = "IN_PROGRESS";
      else if (status === "IN_PROGRESS") nextStatus = "COMPLETED";

      // If it's a mock booking, transition client side directly
      if (bookingId === "mock-booking-id") {
        setStatus(nextStatus);
        if (nextStatus === "COMPLETED") {
          stopGPSBroadcast();
          Alert.alert(
            "Job Completed! 🎉",
            `Earnings of ₹${booking?.workerCut?.toFixed(2)} have been credited to your wallet.`,
            [{ text: "Back to Dashboard", onPress: onJobFinished }]
          );
        }
        setLoading(false);
        return;
      }

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
          `Earnings of ₹${booking?.workerCut?.toFixed(2)} have been credited to your wallet.`,
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

  const verifyOTP = () => {
    if (otpValue === "1234" || bookingId === "mock-booking-id") {
      setOtpModalVisible(false);
      handleStatusTransition(true); // Complete transition to IN_PROGRESS
    } else {
      setOtpError("Invalid OTP. Hint: Use '1234'");
    }
  };

  const handleNavigateGoogleMaps = () => {
    if (!booking) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${booking.pickupLat},${booking.pickupLng}`;
    Linking.openURL(url).catch(() => {
      const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.pickupAddress)}`;
      Linking.openURL(searchUrl);
    });
  };

  const getButtonText = () => {
    if (status === "ACCEPTED") return "Start Traveling (En Route)";
    if (status === "EN_ROUTE") return "Start Work (Enter OTP)";
    if (status === "IN_PROGRESS") return "Complete Work";
    return "Finished";
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity onPress={onJobFinished} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Active Work Order</Text>
        </View>
        <Text style={[styles.statusBadge, status === "IN_PROGRESS" && styles.progressBadge]}>{status}</Text>
      </View>

      <View style={styles.container}>
        {/* Map Section */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: booking?.pickupLat || 28.6273,
              longitude: booking?.pickupLng || 77.3725,
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
          
          {/* Navigate via Google Maps Overlay Button */}
          <TouchableOpacity style={styles.navButton} onPress={handleNavigateGoogleMaps}>
            <Ionicons name="compass" size={20} color={Theme.colors.background} style={{ marginRight: 6 }} />
            <Text style={styles.navButtonText}>Navigate via Google Maps</Text>
          </TouchableOpacity>
        </View>

        {/* Detailed Customer notes & routing bottom sheet */}
        {booking && (
          <View style={styles.glassSheet}>
            <View style={styles.clientRow}>
              <View style={styles.clientMeta}>
                <Text style={styles.customerName}>{booking.customerName}</Text>
                <Text style={styles.customerPhone}>📞 {booking.customerPhone}</Text>
              </View>
              <Text style={styles.payoutBadge}>₹{booking.workerCut}</Text>
            </View>

            <View style={styles.divider} />

            {/* Address */}
            <View style={styles.sectionRow}>
              <Ionicons name="location-sharp" size={18} color={Theme.colors.primary} style={styles.sectionIcon} />
              <View style={styles.sectionTextContainer}>
                <Text style={styles.sectionLabel}>Service Address</Text>
                <Text style={styles.sectionContent}>{booking.pickupAddress}</Text>
              </View>
            </View>

            {/* Customer Filled Notes */}
            <View style={styles.sectionRow}>
              <Ionicons name="document-text-sharp" size={18} color={Theme.colors.primary} style={styles.sectionIcon} />
              <View style={styles.sectionTextContainer}>
                <Text style={styles.sectionLabel}>Customer Notes</Text>
                <Text style={styles.sectionContentNotes}>{booking.customerNotes}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Bottom Action Button */}
            <TouchableOpacity
              style={[styles.actionBtn, loading && styles.disabledBtn]}
              onPress={() => handleStatusTransition(false)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Theme.colors.background} />
              ) : (
                <Text style={styles.actionText}>{getButtonText()}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* OTP Entry Dialog Modal */}
      <Modal transparent visible={otpModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.otpCard}>
            <View style={styles.otpHeader}>
              <Text style={styles.otpTitle}>Enter Service OTP</Text>
              <TouchableOpacity onPress={() => setOtpModalVisible(false)}>
                <Ionicons name="close" size={24} color={Theme.colors.textMuted} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.otpSub}>
              Ask the customer for the verification OTP sent to their mobile app to initiate this work order.
            </Text>

            <TextInput
              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="0 0 0 0"
              placeholderTextColor="rgba(148, 163, 184, 0.3)"
              value={otpValue}
              onChangeText={(text) => {
                setOtpValue(text);
                setOtpError("");
              }}
            />

            {otpError ? <Text style={styles.otpErrorText}>{otpError}</Text> : null}
            <Text style={styles.otpHint}>Demo OTP Hint: Use 1234</Text>

            <TouchableOpacity style={styles.otpVerifyBtn} onPress={verifyOTP}>
              <Text style={styles.otpVerifyBtnText}>Verify and Start Work</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    borderBottomColor: Theme.colors.surfaceLight,
    backgroundColor: Theme.colors.surface,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    marginRight: Theme.spacing.sm,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Theme.colors.text,
  },
  statusBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderColor: Theme.colors.primary,
    borderWidth: 1,
    color: Theme.colors.primary,
    fontSize: 10,
    fontWeight: "bold",
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: Theme.borderRadius.sm,
    letterSpacing: 0.5,
  },
  progressBadge: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderColor: "#3b82f6",
    color: "#3b82f6",
  },
  container: {
    flex: 1,
    position: "relative",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    width: Dimensions.get("window").width,
    height: "100%",
  },
  navButton: {
    position: "absolute",
    top: Theme.spacing.md,
    right: Theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  navButtonText: {
    color: Theme.colors.background,
    fontSize: 13,
    fontWeight: "bold",
  },
  glassSheet: {
    position: "absolute",
    bottom: Theme.spacing.md,
    left: Theme.spacing.md,
    right: Theme.spacing.md,
    backgroundColor: Theme.colors.glassBg,
    borderColor: Theme.colors.glassBorder,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  clientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clientMeta: {
    flex: 1,
  },
  customerName: {
    color: Theme.colors.text,
    fontSize: 18,
    fontWeight: "bold",
  },
  customerPhone: {
    color: Theme.colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  payoutBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    color: Theme.colors.success,
    fontSize: 18,
    fontWeight: "bold",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.md,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(148, 163, 184, 0.08)",
    marginVertical: Theme.spacing.sm,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: Theme.spacing.xs,
  },
  sectionIcon: {
    marginTop: 2,
    marginRight: Theme.spacing.sm,
  },
  sectionTextContainer: {
    flex: 1,
  },
  sectionLabel: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionContent: {
    color: Theme.colors.text,
    fontSize: 14,
    marginTop: 1,
  },
  sectionContentNotes: {
    color: Theme.colors.text,
    fontSize: 13.5,
    marginTop: 2,
    lineHeight: 18,
    fontStyle: "italic",
  },
  actionBtn: {
    width: "100%",
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: Theme.spacing.xs,
  },
  disabledBtn: {
    backgroundColor: Theme.colors.surfaceLight,
  },
  actionText: {
    color: Theme.colors.background,
    fontSize: 15,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(11, 15, 25, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: Theme.spacing.lg,
  },
  otpCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: Theme.colors.surface,
    borderColor: "rgba(16, 185, 129, 0.2)",
    borderWidth: 1,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  otpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.md,
  },
  otpTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Theme.colors.text,
  },
  otpSub: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    lineHeight: 18,
    marginBottom: Theme.spacing.lg,
  },
  otpInput: {
    backgroundColor: Theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.1)",
    borderRadius: Theme.borderRadius.md,
    color: Theme.colors.primary,
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 8,
    paddingVertical: Theme.spacing.sm,
    marginBottom: Theme.spacing.xs,
  },
  otpErrorText: {
    color: Theme.colors.danger,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: Theme.spacing.sm,
  },
  otpHint: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: Theme.spacing.lg,
  },
  otpVerifyBtn: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  otpVerifyBtnText: {
    color: Theme.colors.background,
    fontSize: 15,
    fontWeight: "bold",
  },
});

export default NavigationScreen;
