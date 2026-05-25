import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import * as SecureStore from "expo-secure-store";
import AuthScreen from "./src/screens/AuthScreen";
import HomeScreen from "./src/screens/HomeScreen";
import BookingScreen from "./src/screens/BookingScreen";
import TrackingScreen from "./src/screens/TrackingScreen";
import { UserLocation } from "./src/utils/location";
import Theme from "./src/components/Theme";

type Screen = "AUTH" | "HOME" | "BOOKING" | "TRACKING";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>("AUTH");
  
  // Navigation State payload
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");
  const [customerLocation, setCustomerLocation] = useState<UserLocation | null>(null);
  const [activeBookingId, setActiveBookingId] = useState("");

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      if (token) {
        setIsAuthenticated(true);
        setCurrentScreen("HOME");
      } else {
        setIsAuthenticated(false);
        setCurrentScreen("AUTH");
      }
    } catch (e) {
      console.error("Secure store token check failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setCurrentScreen("HOME");
  };

  const handleSelectService = (serviceId: string, cityId: string, location: UserLocation) => {
    setSelectedServiceId(serviceId);
    setSelectedCityId(cityId);
    setCustomerLocation(location);
    setCurrentScreen("BOOKING");
  };

  const handleBookingSuccess = (bookingId: string) => {
    setActiveBookingId(bookingId);
    setCurrentScreen("TRACKING");
  };

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync("token");
      await SecureStore.deleteItemAsync("userId");
      setIsAuthenticated(false);
      setCurrentScreen("AUTH");
    } catch (e) {
      console.error("Token eviction failed:", e);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {currentScreen === "AUTH" && (
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
      )}
      
      {currentScreen === "HOME" && (
        <HomeScreen
          onSelectService={handleSelectService}
          onLogout={handleLogout}
        />
      )}

      {currentScreen === "BOOKING" && (
        <BookingScreen
          serviceId={selectedServiceId}
          cityId={selectedCityId}
          location={customerLocation!}
          onBookingSuccess={handleBookingSuccess}
          onBack={() => setCurrentScreen("HOME")}
        />
      )}

      {currentScreen === "TRACKING" && (
        <TrackingScreen
          bookingId={activeBookingId}
          onBackToHome={() => setCurrentScreen("HOME")}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  center: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
});
