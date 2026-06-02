import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Switch,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "../utils/secureStore";
import socketService from "../services/socket";
import api from "../services/api";
import { getCurrentLocation } from "../utils/location";
import Theme from "../components/Theme";

interface DashboardScreenProps {
  onAssignJob: (bookingId: string) => void;
  onNavigateToEarnings: () => void;
  onLogout: () => void;
}

const { width } = Dimensions.get("window");

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onAssignJob,
  onNavigateToEarnings,
  onLogout,
}) => {
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentJob, setCurrentJob] = useState<any | null>(null);
  const [countdown, setCountdown] = useState(15);
  
  // Handlers for periodic updates
  const trackingIntervalRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      stopTracking();
      clearCountdown();
      socketService.disconnect();
    };
  }, []);

  const handleToggleOnline = async (value: boolean) => {
    setLoading(true);
    try {
      // 1. Toggle status in PostgreSQL
      await api.patch("/workers/toggle-online", { isOnline: value });
      setIsOnline(value);

      if (value) {
        // Connect to Socket and Register
        const socket = await socketService.connect();
        const workerId = await SecureStore.getItemAsync("userId");
        const cityId = await SecureStore.getItemAsync("workerCityId");

        socket.emit("worker:register", { workerId, cityId });

        // Listen for targeted job broadcasts
        socket.on("job:broadcast", (data: any) => {
          triggerJobAlert(data);
        });

        // Start location transmission transmitter (GPS updates)
        startTracking(workerId!, cityId!);
      } else {
        stopTracking();
        socketService.disconnect();
        setCurrentJob(null);
      }
    } catch (e) {
      console.error("Failed to toggle online presence status:", e);
      Alert.alert("Connection Error", "Failed to update presence status.");
    } finally {
      setLoading(false);
    }
  };

  const startTracking = (workerId: string, cityId: string) => {
    stopTracking(); // clean old
    
    // Transmit location immediately
    transmitGPS(workerId, cityId);

    // Periodically transmit location coordinates every 10 seconds
    trackingIntervalRef.current = setInterval(() => {
      transmitGPS(workerId, cityId);
    }, 10000);
  };

  const stopTracking = () => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
  };

  const transmitGPS = async (workerId: string, cityId: string) => {
    try {
      const socket = socketService.getSocket();
      if (!socket || !socket.connected) return;

      const gps = await getCurrentLocation();
      if (gps) {
        socket.emit("worker:location_update", {
          workerId,
          cityId,
          latitude: gps.latitude,
          longitude: gps.longitude,
          heading: 0,
        });
      }
    } catch (err) {
      console.warn("Failed to transmit GPS coordinate updates", err);
    }
  };

  const triggerJobAlert = (jobData: any) => {
    clearCountdown();
    setCurrentJob(jobData);
    setCountdown(15);

    // Start timer countdown
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearCountdown();
          setCurrentJob(null); // auto reject
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const clearCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  const handleAcceptJob = async () => {
    if (!currentJob) return;
    
    clearCountdown();
    setLoading(true);

    try {
      const bookingId = currentJob.bookingId;
      
      // If it's the mock demo job, bypass api
      if (bookingId === "mock-booking-id") {
        setCurrentJob(null);
        onAssignJob(bookingId);
        return;
      }

      // Call accept API
      await api.post("/bookings/accept", { bookingId });
      
      setCurrentJob(null);
      onAssignJob(bookingId); // navigate to navigation screen
    } catch (error: any) {
      console.error("Job acceptance failed:", error);
      const msg = error.response?.data?.message || "This job was already accepted by another technician";
      Alert.alert("Job Unassigned", msg);
      setCurrentJob(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineJob = () => {
    clearCountdown();
    setCurrentJob(null);
  };

  // Helper to trigger a simulation job for testing
  const triggerMockJob = () => {
    triggerJobAlert({
      bookingId: "mock-booking-id",
      serviceName: "Home Electrical Wiring Repair",
      pickupAddress: "Flat 402, Royal Palms, Sector 62",
      estimatedDistance: 3.4,
      etaMinutes: 10,
      payoutAmount: 1250,
    });
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Header Area */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={20} color={Theme.colors.primary} />
            <View style={[styles.statusDot, { backgroundColor: isOnline ? Theme.colors.success : Theme.colors.textMuted }]} />
          </View>
          <View style={styles.userMeta}>
            <Text style={styles.userName}>Partner Portal</Text>
            <Text style={styles.userRole}>Verified Expert</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={22} color={Theme.colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Prominent Online/Offline Toggle Switch */}
        <View style={[styles.statusCard, isOnline && styles.onlineCard]}>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.statusLabel}>
                {isOnline ? "You are Online" : "You are Offline"}
              </Text>
              <Text style={styles.statusDesc}>
                {isOnline ? "Waiting for nearby service requests..." : "Go online to start receiving work order alerts"}
              </Text>
            </View>
            {loading ? (
              <ActivityIndicator color={Theme.colors.primary} size="small" />
            ) : (
              <Switch
                value={isOnline}
                onValueChange={handleToggleOnline}
                trackColor={{ false: "#1e293b", true: "rgba(16, 185, 129, 0.25)" }}
                thumbColor={isOnline ? Theme.colors.primary : "#475569"}
              />
            )}
          </View>
        </View>

        {/* Today's Earnings Card */}
        <TouchableOpacity style={styles.earningsCard} onPress={onNavigateToEarnings}>
          <View style={styles.earningsHeader}>
            <Text style={styles.earningsTitle}>TODAY'S EARNINGS</Text>
            <Ionicons name="trending-up" size={18} color={Theme.colors.primary} />
          </View>
          <Text style={styles.earningsAmount}>₹1,250</Text>
          <View style={styles.earningsFooter}>
            <Text style={styles.earningsSub}>Completed: 3 Jobs</Text>
            <Text style={styles.earningsLinkText}>View Ledger <Ionicons name="arrow-forward" size={12} /></Text>
          </View>
        </TouchableOpacity>

        {/* Demo trigger helper for testing */}
        {!currentJob && (
          <TouchableOpacity style={styles.demoTrigger} onPress={triggerMockJob}>
            <Ionicons name="flash-outline" size={16} color={Theme.colors.textMuted} style={{ marginRight: 6 }} />
            <Text style={styles.demoTriggerText}>Simulate Incoming Job Alert</Text>
          </TouchableOpacity>
        )}

        {/* Incoming Job Request Card */}
        {currentJob && (
          <View style={styles.incomingJobCard}>
            <View style={styles.incomingJobHeader}>
              <View style={styles.alertIndicator}>
                <View style={styles.pulseDot} />
                <Text style={styles.alertTitle}>INCOMING JOB REQUEST</Text>
              </View>
              <View style={styles.timerBadge}>
                <Ionicons name="time-outline" size={13} color={Theme.colors.danger} style={{ marginRight: 4 }} />
                <Text style={styles.timerText}>{countdown}s</Text>
              </View>
            </View>

            <Text style={styles.taskDescription}>{currentJob.serviceName}</Text>
            
            <View style={styles.jobDetailsGrid}>
              <View style={styles.jobDetailItem}>
                <Ionicons name="location-outline" size={16} color={Theme.colors.primary} />
                <Text style={styles.jobDetailText}>{currentJob.pickupAddress}</Text>
              </View>
              <View style={styles.jobDetailItem}>
                <Ionicons name="navigate-outline" size={16} color={Theme.colors.primary} />
                <Text style={styles.jobDetailText}>{currentJob.estimatedDistance} km away</Text>
              </View>
            </View>

            <View style={styles.payoutRow}>
              <Text style={styles.payoutLabel}>Est. Payout</Text>
              <Text style={styles.payoutValue}>₹{currentJob.payoutAmount}</Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.declineButton} onPress={handleDeclineJob}>
                <Text style={styles.declineButtonText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptButton} onPress={handleAcceptJob}>
                <Text style={styles.acceptButtonText}>Accept Job</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Background Decorative Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Service Performance</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoValue}>98%</Text>
              <Text style={styles.infoLabel}>Acceptance</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoValue}>4.9 ★</Text>
              <Text style={styles.infoLabel}>Rating</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoValue}>0</Text>
              <Text style={styles.infoLabel}>Cancellations</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Theme.colors.surfaceLight,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: "absolute",
    bottom: 0,
    right: 0,
    borderWidth: 1.5,
    borderColor: Theme.colors.surface,
  },
  userMeta: {
    marginLeft: Theme.spacing.sm,
  },
  userName: {
    fontSize: 15,
    fontWeight: "bold",
    color: Theme.colors.text,
  },
  userRole: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginTop: 1,
  },
  logoutBtn: {
    padding: Theme.spacing.xs,
  },
  scrollContent: {
    padding: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl,
  },
  statusCard: {
    backgroundColor: Theme.colors.surface,
    borderColor: "rgba(148, 163, 184, 0.08)",
    borderWidth: 1,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  onlineCard: {
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusLabel: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: "bold",
  },
  statusDesc: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
    maxWidth: width * 0.6,
  },
  earningsCard: {
    backgroundColor: Theme.colors.surface,
    borderColor: "rgba(16, 185, 129, 0.1)",
    borderWidth: 1,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },
  earningsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  earningsTitle: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  earningsAmount: {
    color: Theme.colors.primary,
    fontSize: 36,
    fontWeight: "bold",
    marginVertical: Theme.spacing.sm,
  },
  earningsFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(148, 163, 184, 0.06)",
    paddingTop: Theme.spacing.sm,
    marginTop: Theme.spacing.xs,
  },
  earningsSub: {
    color: Theme.colors.textMuted,
    fontSize: 13,
  },
  earningsLinkText: {
    color: Theme.colors.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  demoTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(148, 163, 184, 0.05)",
    borderColor: "rgba(148, 163, 184, 0.1)",
    borderWidth: 1,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: Theme.spacing.sm,
    marginBottom: Theme.spacing.lg,
  },
  demoTriggerText: {
    color: Theme.colors.textMuted,
    fontSize: 13,
    fontWeight: "500",
  },
  incomingJobCard: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.primary,
    borderWidth: 1.5,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: Theme.spacing.lg,
  },
  incomingJobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.md,
  },
  alertIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.primary,
    marginRight: Theme.spacing.xs,
  },
  alertTitle: {
    color: Theme.colors.primary,
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timerText: {
    color: Theme.colors.danger,
    fontSize: 12,
    fontWeight: "bold",
  },
  taskDescription: {
    fontSize: 22,
    fontWeight: "bold",
    color: Theme.colors.text,
    lineHeight: 28,
    marginBottom: Theme.spacing.md,
  },
  jobDetailsGrid: {
    backgroundColor: Theme.colors.surfaceLight,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  jobDetailItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 4,
  },
  jobDetailText: {
    color: Theme.colors.text,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  payoutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.xs,
  },
  payoutLabel: {
    color: Theme.colors.textMuted,
    fontSize: 14,
  },
  payoutValue: {
    color: Theme.colors.success,
    fontSize: 24,
    fontWeight: "bold",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  declineButton: {
    flex: 1,
    backgroundColor: Theme.colors.surfaceLight,
    paddingVertical: 14,
    borderRadius: Theme.borderRadius.md,
    alignItems: "center",
    marginRight: Theme.spacing.sm,
  },
  declineButtonText: {
    color: Theme.colors.textMuted,
    fontSize: 15,
    fontWeight: "bold",
  },
  acceptButton: {
    flex: 1.5,
    backgroundColor: Theme.colors.primary,
    paddingVertical: 14,
    borderRadius: Theme.borderRadius.md,
    alignItems: "center",
  },
  acceptButtonText: {
    color: Theme.colors.background,
    fontSize: 15,
    fontWeight: "bold",
  },
  infoSection: {
    marginTop: Theme.spacing.md,
  },
  infoTitle: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: Theme.spacing.md,
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoItem: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    alignItems: "center",
    marginHorizontal: 4,
    borderColor: "rgba(148, 163, 184, 0.04)",
    borderWidth: 1,
  },
  infoValue: {
    color: Theme.colors.text,
    fontSize: 18,
    fontWeight: "bold",
  },
  infoLabel: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
});

export default DashboardScreen;
