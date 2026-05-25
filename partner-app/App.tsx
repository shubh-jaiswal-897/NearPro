import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import * as SecureStore from "expo-secure-store";
import AuthScreen from "./src/screens/AuthScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import NavigationScreen from "./src/screens/NavigationScreen";
import EarningsScreen from "./src/screens/EarningsScreen";
import Theme from "./src/components/Theme";

type Screen = "AUTH" | "DASHBOARD" | "NAVIGATION" | "EARNINGS";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>("AUTH");
  
  const [activeBookingId, setActiveBookingId] = useState("");

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      if (token) {
        setIsAuthenticated(true);
        setCurrentScreen("DASHBOARD");
      } else {
        setIsAuthenticated(false);
        setCurrentScreen("AUTH");
      }
    } catch (e) {
      console.error("Failed to check auth in partner app", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setCurrentScreen("DASHBOARD");
  };

  const handleJobAssigned = (bookingId: string) => {
    setActiveBookingId(bookingId);
    setCurrentScreen("NAVIGATION");
  };

  const handleJobFinished = () => {
    setActiveBookingId("");
    setCurrentScreen("DASHBOARD");
  };

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync("token");
      await SecureStore.deleteItemAsync("userId");
      await SecureStore.deleteItemAsync("workerCityId");
      setIsAuthenticated(false);
      setCurrentScreen("AUTH");
    } catch (e) {
      console.error("Failed to clean session in partner app:", e);
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

      {currentScreen === "DASHBOARD" && (
        <DashboardScreen
          onAssignJob={handleJobAssigned}
          onNavigateToEarnings={() => setCurrentScreen("EARNINGS")}
          onLogout={handleLogout}
        />
      )}

      {currentScreen === "NAVIGATION" && (
        <NavigationScreen
          bookingId={activeBookingId}
          onJobFinished={handleJobFinished}
        />
      )}

      {currentScreen === "EARNINGS" && (
        <EarningsScreen onBack={() => setCurrentScreen("DASHBOARD")} />
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
