import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Switch,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import socketService from "../services/socket";
import api from "../services/api";
import { getCurrentLocation } from "../../customer-app/src/utils/location"; // share helper
import Theme from "../components/Theme";

interface DashboardScreenProps {
  onAssignJob: (bookingId: string) => void;
  onNavigateToEarnings: () => void;
  onLogout: () => void;
}

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

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>NearPro Partner Dashboard</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        {/* Giant Status card */}
        <View style={[styles.statusCard, isOnline && styles.onlineCard]}>
          <Text style={styles.statusLabel}>
            {isOnline ? "YOU ARE ONLINE & ACTIVE 🟢" : "YOU ARE OFFLINE 🔴"}
          </Text>
          <Text style={styles.statusDesc}>
            {isOnline
              ? "You will receive nearby service requests within 3-5 km. Keep this screen active."
              : "Turn on the toggle switch to begin receiving hyperlocal jobs in your city."}
          </Text>

          {loading ? (
            <ActivityIndicator color={Theme.colors.text} style={{ marginVertical: 10 }} />
          ) : (
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Go Online</Text>
              <Switch
                value={isOnline}
                onValueChange={handleToggleOnline}
                trackColor={{ false: "#767577", true: Theme.colors.success }}
                thumbColor={isOnline ? Theme.colors.text : "#f4f3f4"}
              />
            </View>
          )}
        </View>

        {/* Dashboard quick links */}
        <TouchableOpacity style={styles.menuLink} onPress={onNavigateToEarnings}>
          <Text style={styles.menuLinkText}>📊 Earning Statistics & Ledger</Text>
        </TouchableOpacity>

        {/* Active Job Alert Overlay sheet (Modal) */}
        {currentJob && (
          <Modal transparent visible={!!currentJob} animationType="slide">
            <View style={styles.modalBg}>
              <View style={styles.alertCard}>
                <Text style={styles.alertHeader}>🛠️ NEW HYPERLOCAL JOB BROADCAST</Text>
                
                <View style={styles.timerBadge}>
                  <Text style={styles.timerText}>Accept within: {countdown}s</Text>
                </View>

                <Text style={styles.jobName}>{currentJob.serviceName}</Text>
                <Text style={styles.jobAddr}>📍 Address: {currentJob.pickupAddress}</Text>

                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Distance</Text>
                    <Text style={styles.statVal}>{currentJob.estimatedDistance} km</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Est. Travel</Text>
                    <Text style={styles.statVal}>{currentJob.etaMinutes} mins</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Payout</Text>
                    <Text style={[styles.statVal, { color: Theme.colors.success }]}>
                      ${currentJob.payoutAmount.toFixed(2)}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.acceptBtn} onPress={handleAcceptJob}>
                  <Text style={styles.acceptBtnText}>ACCEPT WORK ORDER</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.declineBtn} onPress={handleDeclineJob}>
                  <Text style={styles.declineText}>DECLINE</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
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
  logoutBtn: {
    padding: Theme.spacing.xs,
  },
  logoutText: {
    color: Theme.colors.textMuted,
    fontSize: 14,
  },
  container: {
    flex: 1,
    padding: Theme.spacing.md,
    justifyContent: "center",
  },
  statusCard: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    alignItems: "center",
    marginBottom: Theme.spacing.xl,
  },
  onlineCard: {
    borderColor: Theme.colors.success,
  },
  statusLabel: {
    color: Theme.colors.text,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: Theme.spacing.sm,
  },
  statusDesc: {
    color: Theme.colors.textMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Theme.spacing.lg,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: Theme.spacing.lg,
  },
  switchLabel: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  menuLink: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    alignItems: "center",
  },
  menuLinkText: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: "500",
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  alertCard: {
    backgroundColor: Theme.colors.surfaceLight,
    borderTopLeftRadius: Theme.borderRadius.lg,
    borderTopRightRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    alignItems: "center",
  },
  alertHeader: {
    color: Theme.colors.primary,
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: Theme.spacing.sm,
  },
  timerBadge: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: Theme.colors.danger,
    borderWidth: 1,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.xl,
    marginBottom: Theme.spacing.md,
  },
  timerText: {
    color: Theme.colors.danger,
    fontWeight: "600",
    fontSize: 12,
  },
  jobName: {
    color: Theme.colors.text,
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: Theme.spacing.sm,
  },
  jobAddr: {
    color: Theme.colors.textMuted,
    fontSize: 15,
    textAlign: "center",
    marginBottom: Theme.spacing.lg,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: Theme.spacing.xl,
  },
  statBox: {
    width: "30%",
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.sm,
    alignItems: "center",
  },
  statLabel: {
    color: Theme.colors.textMuted,
    fontSize: 12,
  },
  statVal: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 4,
  },
  acceptBtn: {
    width: "100%",
    backgroundColor: Theme.colors.success,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: Theme.spacing.md,
    alignItems: "center",
    marginBottom: Theme.spacing.sm,
  },
  acceptBtnText: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: "bold",
  },
  declineBtn: {
    width: "100%",
    paddingVertical: Theme.spacing.md,
    alignItems: "center",
  },
  declineText: {
    color: Theme.colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
});

export default DashboardScreen;
