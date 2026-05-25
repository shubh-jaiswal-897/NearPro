import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
} from "react-native";
import api from "../services/api";
import { getCurrentLocation, UserLocation } from "../utils/location";
import Theme from "../components/Theme";

interface HomeScreenProps {
  onSelectService: (serviceId: string, cityId: string, location: UserLocation) => void;
  onLogout: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectService, onLogout }) => {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [city, setCity] = useState<any | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [checkingGeofence, setCheckingGeofence] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [activeCitiesList, setActiveCitiesList] = useState<any[]>([]);

  useEffect(() => {
    initGeofenceCheck();
  }, []);

  const initGeofenceCheck = async () => {
    setCheckingGeofence(true);
    try {
      const gpsCoords = await getCurrentLocation();
      
      if (!gpsCoords) {
        Alert.alert(
          "Location Required",
          "Location access is required to check geofence coverage. Please enable GPS permissions.",
          [{ text: "Retry", onPress: initGeofenceCheck }]
        );
        setCheckingGeofence(false);
        return;
      }

      setLocation(gpsCoords);

      // Check geofence coverage
      const response = await api.get(`/cities/check-geofence?lat=${gpsCoords.latitude}&lng=${gpsCoords.longitude}`);
      
      if (response.data.inCoverage) {
        setCity(response.data.data.city);
        fetchCategories();
      } else {
        // Outside coverage
        fetchActiveCities();
      }
    } catch (error) {
      console.error("Geofence lookup failed:", error);
      fetchActiveCities(); // display coverage error
    } finally {
      setCheckingGeofence(false);
    }
  };

  const fetchActiveCities = async () => {
    try {
      const response = await api.get("/cities");
      setActiveCitiesList(response.data.data.cities);
    } catch (error) {
      console.error("Failed to load cities list:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get("/services/categories");
      setCategories(response.data.data.categories);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const handleCategorySelect = async (category: any) => {
    setSelectedCategory(category);
    setLoadingServices(true);
    try {
      const response = await api.get(`/services/category/${category.id}?cityId=${city.id}`);
      setServices(response.data.data.services);
    } catch (error) {
      console.error("Failed to load services for category:", error);
    } finally {
      setLoadingServices(false);
    }
  };

  if (checkingGeofence) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>Checking geofence service coverage...</Text>
      </View>
    );
  }

  // If customer is outside geofence service coverage, show active cities
  if (!city) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.outsideContainer}>
          <Text style={styles.errorTitle}>Outside Coverage Zone 📍</Text>
          <Text style={styles.errorDesc}>
            We don't operate at your current coordinates yet. We are launching in new locations soon!
          </Text>

          <Text style={styles.listHeader}>Our Operating Cities:</Text>
          <FlatList
            data={activeCitiesList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.cityCard}>
                <Text style={styles.cityName}>{item.name}</Text>
                <Text style={styles.cityLoc}>{item.state}, {item.country}</Text>
              </View>
            )}
            style={{ width: "100%", maxHeight: 200 }}
          />

          <TouchableOpacity style={styles.retryBtn} onPress={initGeofenceCheck}>
            <Text style={styles.buttonText}>Retry Location Scan</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>NearPro Hyperlocal</Text>
          <Text style={styles.headerLoc}>📍 Serving in {city.name}</Text>
        </View>
        <TouchableOpacity style={styles.headerLogout} onPress={onLogout}>
          <Text style={styles.logoutLink}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.contentContainer}>
        {/* Categories Section */}
        <Text style={styles.sectionTitle}>Service Categories</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isSelected = selectedCategory?.id === item.id;
            return (
              <TouchableOpacity
                style={[styles.categoryCard, isSelected && styles.selectedCategory]}
                onPress={() => handleCategorySelect(item)}
              >
                <Text style={[styles.categoryText, isSelected && styles.selectedCategoryText]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
          style={styles.categoryList}
        />

        {/* Dynamic Services List */}
        {selectedCategory ? (
          <View style={styles.servicesContainer}>
            <Text style={styles.sectionTitle}>{selectedCategory.name} Services</Text>
            {loadingServices ? (
              <ActivityIndicator color={Theme.colors.primary} style={{ marginTop: 20 }} />
            ) : services.length === 0 ? (
              <Text style={styles.emptyText}>No services available in this category.</Text>
            ) : (
              services.map((service) => (
                <View key={service.id} style={styles.serviceCard}>
                  <View style={styles.serviceDetails}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.serviceDesc}>{service.description || "Fast service delivery"}</Text>
                    {service.pricing ? (
                      <Text style={styles.servicePrice}>
                        Starting from ${service.pricing.basePrice.toFixed(2)}
                      </Text>
                    ) : (
                      <Text style={styles.priceError}>Pricing unavailable in city</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[styles.bookBtn, !service.pricing && styles.disabledBookBtn]}
                    disabled={!service.pricing}
                    onPress={() => onSelectService(service.id, city.id, location!)}
                  >
                    <Text style={styles.bookBtnText}>Book in 10m</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={styles.promptContainer}>
            <Text style={styles.promptText}>Please select a category above to view local services</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: Theme.colors.textMuted,
    marginTop: Theme.spacing.md,
    fontSize: 16,
  },
  outsideContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Theme.spacing.lg,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Theme.colors.danger,
    marginBottom: Theme.spacing.sm,
  },
  errorDesc: {
    color: Theme.colors.textMuted,
    textAlign: "center",
    fontSize: 16,
    marginBottom: Theme.spacing.xl,
    lineHeight: 22,
  },
  listHeader: {
    color: Theme.colors.text,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Theme.spacing.md,
    alignSelf: "flex-start",
  },
  cityCard: {
    width: "100%",
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  cityName: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: "bold",
  },
  cityLoc: {
    color: Theme.colors.textMuted,
    fontSize: 14,
  },
  retryBtn: {
    width: "100%",
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: Theme.spacing.md,
    alignItems: "center",
    marginTop: Theme.spacing.lg,
  },
  logoutBtn: {
    marginTop: Theme.spacing.xl,
  },
  logoutText: {
    color: Theme.colors.textMuted,
    fontSize: 16,
    textDecorationLine: "underline",
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
    fontSize: 20,
    fontWeight: "bold",
    color: Theme.colors.text,
  },
  headerLoc: {
    fontSize: 14,
    color: Theme.colors.success,
    fontWeight: "500",
    marginTop: 2,
  },
  headerLogout: {
    padding: Theme.spacing.xs,
  },
  logoutLink: {
    color: Theme.colors.textMuted,
    fontSize: 14,
  },
  contentContainer: {
    flex: 1,
    padding: Theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
  },
  categoryList: {
    marginBottom: Theme.spacing.xl,
  },
  categoryCard: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.xl,
    marginRight: Theme.spacing.sm,
  },
  selectedCategory: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  categoryText: {
    color: Theme.colors.textMuted,
    fontSize: 15,
    fontWeight: "500",
  },
  selectedCategoryText: {
    color: Theme.colors.text,
  },
  servicesContainer: {
    flex: 1,
  },
  emptyText: {
    color: Theme.colors.textMuted,
    textAlign: "center",
    marginTop: Theme.spacing.xl,
  },
  serviceCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  serviceDetails: {
    flex: 1,
    marginRight: Theme.spacing.md,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "bold",
    color: Theme.colors.text,
  },
  serviceDesc: {
    color: Theme.colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  servicePrice: {
    color: Theme.colors.success,
    fontWeight: "600",
    marginTop: 4,
    fontSize: 14,
  },
  priceError: {
    color: Theme.colors.danger,
    fontSize: 12,
    marginTop: 4,
  },
  bookBtn: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
  },
  disabledBookBtn: {
    backgroundColor: Theme.colors.border,
  },
  bookBtnText: {
    color: Theme.colors.text,
    fontWeight: "600",
    fontSize: 13,
  },
  promptContainer: {
    alignItems: "center",
    marginTop: Theme.spacing.xl,
  },
  promptText: {
    color: Theme.colors.textMuted,
    fontSize: 15,
    textAlign: "center",
  },
  buttonText: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default HomeScreen;
