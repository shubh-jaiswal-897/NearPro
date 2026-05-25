import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import api from "../services/api";
import { UserLocation } from "../utils/location";
import Theme from "../components/Theme";

interface BookingScreenProps {
  serviceId: string;
  cityId: string;
  location: UserLocation;
  onBookingSuccess: (bookingId: string) => void;
  onBack: () => void;
}

export const BookingScreen: React.FC<BookingScreenProps> = ({
  serviceId,
  cityId,
  location,
  onBookingSuccess,
  onBack,
}) => {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBookingSubmit = async () => {
    if (!address || address.trim().length < 5) {
      Alert.alert("Error", "Please enter a valid complete address");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        serviceId,
        pickupLat: location.latitude,
        pickupLng: location.longitude,
        pickupAddress: address,
      };

      const response = await api.post("/bookings", payload);
      const booking = response.data.data.booking;

      Alert.alert(
        "Booking Requested 🚀",
        "We are looking for the closest technicians. Connecting live tracker...",
        [
          {
            text: "View Live Status",
            onPress: () => onBookingSuccess(booking.id),
          },
        ]
      );
    } catch (error: any) {
      console.error("Booking request submission error:", error);
      const msg = error.response?.data?.message || "Failed to create booking. Please try again.";
      Alert.alert("Booking Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Booking</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Delivery Location</Text>
          <Text style={styles.cardDesc}>
            Our professional partner will reach your coordinates within 10 minutes.
          </Text>

          <Text style={styles.label}>Full Street Address / Flat No.</Text>
          <TextInput
            style={styles.addressInput}
            multiline
            numberOfLines={3}
            placeholder="Type your flat/house number and street details here..."
            placeholderTextColor={Theme.colors.textMuted}
            value={address}
            onChangeText={setAddress}
          />

          <View style={styles.gpsBadge}>
            <Text style={styles.gpsText}>
              📍 GPS Location Locked: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.bookBtn, loading && styles.disabledBtn]}
            onPress={handleBookingSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Theme.colors.text} />
            ) : (
              <Text style={styles.bookText}>Book 10-Minute Dispatch</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  backBtn: {
    width: 60,
  },
  backText: {
    color: Theme.colors.primary,
    fontSize: 16,
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Theme.colors.text,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: Theme.spacing.md,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  cardHeader: {
    fontSize: 20,
    fontWeight: "bold",
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  cardDesc: {
    color: Theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 18,
    marginBottom: Theme.spacing.lg,
  },
  label: {
    color: Theme.colors.text,
    fontSize: 15,
    fontWeight: "500",
    marginBottom: Theme.spacing.sm,
  },
  addressInput: {
    backgroundColor: Theme.colors.surfaceLight,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.md,
    color: Theme.colors.text,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    fontSize: 15,
    textAlignVertical: "top",
    minHeight: 80,
    marginBottom: Theme.spacing.md,
  },
  gpsBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.lg,
    alignSelf: "flex-start",
  },
  gpsText: {
    color: Theme.colors.success,
    fontSize: 13,
    fontWeight: "500",
  },
  bookBtn: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: Theme.spacing.md,
    alignItems: "center",
  },
  disabledBtn: {
    backgroundColor: Theme.colors.border,
  },
  bookText: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default BookingScreen;
