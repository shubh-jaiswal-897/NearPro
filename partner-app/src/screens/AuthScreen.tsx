import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import api from "../services/api";
import Theme from "../components/Theme";

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  
  // Selection States
  const [cities, setCities] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCityId, setSelectedCityId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  useEffect(() => {
    if (!isLogin) {
      loadRegistrationMetadata();
    }
  }, [isLogin]);

  const loadRegistrationMetadata = async () => {
    setLoadingMetadata(true);
    try {
      const [citiesRes, catsRes] = await Promise.all([
        api.get("/cities"),
        api.get("/services/categories"),
      ]);
      setCities(citiesRes.data.data.cities);
      setCategories(catsRes.data.data.categories);
    } catch (e) {
      console.error("Failed to load cities/skills metadata:", e);
      Alert.alert("Connection Error", "Could not load cities and skill categories list.");
    } finally {
      setLoadingMetadata(false);
    }
  };

  const handleSubmit = async () => {
    if (!email || !password || (!isLogin && (!firstName || !lastName || !phoneNumber || !selectedCityId || !selectedCategoryId))) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin
        ? { email, password }
        : {
            email,
            password,
            firstName,
            lastName,
            phoneNumber,
            role: "WORKER",
            cityId: selectedCityId,
            serviceCategoryId: selectedCategoryId,
          };

      const response = await api.post(endpoint, payload);
      const { token, user } = response.data.data;

      // Verify that user logged in is a worker
      if (user.role !== "WORKER") {
        Alert.alert("Access Denied", "Please use the Customer App to log into this account.");
        setLoading(false);
        return;
      }

      await SecureStore.setItemAsync("token", token);
      await SecureStore.setItemAsync("userId", user.id);
      await SecureStore.setItemAsync("workerCityId", user.workerProfile?.cityId || selectedCityId);

      onAuthSuccess();
    } catch (error: any) {
      console.error("Authentication request error:", error);
      const msg = error.response?.data?.message || "Failed. Check credentials.";
      Alert.alert("Registration Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.glassCard}>
          <Text style={styles.title}>NearPro Partner</Text>
          <Text style={styles.subtitle}>
            {isLogin ? "Technician Service Portal" : "Join the Hyperlocal Network"}
          </Text>

          {!isLogin && (
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="First Name"
                placeholderTextColor={Theme.colors.textMuted}
                value={firstName}
                onChangeText={setFirstName}
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Last Name"
                placeholderTextColor={Theme.colors.textMuted}
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
          )}

          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor={Theme.colors.textMuted}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          )}

          {/* Select City and Skill Category if Registering */}
          {!isLogin && (
            <View style={{ width: "100%" }}>
              <Text style={styles.selectLabel}>Select Operational City</Text>
              {loadingMetadata ? (
                <ActivityIndicator color={Theme.colors.primary} style={{ marginVertical: 10 }} />
              ) : (
                <View style={styles.selectionGrid}>
                  {cities.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.selectorBadge, selectedCityId === c.id && styles.selectedBadge]}
                      onPress={() => setSelectedCityId(c.id)}
                    >
                      <Text style={styles.badgeText}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.selectLabel}>Select Service Skill</Text>
              {!loadingMetadata && (
                <View style={styles.selectionGrid}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.selectorBadge, selectedCategoryId === cat.id && styles.selectedBadge]}
                      onPress={() => setSelectedCategoryId(cat.id)}
                    >
                      <Text style={styles.badgeText}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor={Theme.colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={Theme.colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Theme.colors.text} />
            ) : (
              <Text style={styles.buttonText}>{isLogin ? "Sign In" : "Register Profile"}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.toggleBtn}>
            <Text style={styles.toggleText}>
              {isLogin
                ? "Don't have a partner account? Sign Up"
                : "Already have a partner account? Sign In"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Theme.spacing.md,
  },
  glassCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: Theme.colors.glassBg,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.glassBorder,
    padding: Theme.spacing.lg,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Theme.colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Theme.colors.textMuted,
    marginBottom: Theme.spacing.lg,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  input: {
    width: "100%",
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.md,
    color: Theme.colors.text,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
    fontSize: 15,
  },
  halfInput: {
    width: "48%",
  },
  selectLabel: {
    color: Theme.colors.text,
    alignSelf: "flex-start",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Theme.spacing.xs,
  },
  selectionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    marginBottom: Theme.spacing.md,
  },
  selectorBadge: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.sm,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    marginRight: 6,
    marginBottom: 6,
  },
  selectedBadge: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  badgeText: {
    color: Theme.colors.text,
    fontSize: 13,
  },
  button: {
    width: "100%",
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: Theme.spacing.md,
    alignItems: "center",
    marginTop: Theme.spacing.sm,
  },
  buttonText: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  toggleBtn: {
    marginTop: Theme.spacing.lg,
  },
  toggleText: {
    color: Theme.colors.textMuted,
    fontSize: 13,
  },
});

export default AuthScreen;
