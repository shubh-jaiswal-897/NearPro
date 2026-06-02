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
import * as SecureStore from "../utils/secureStore";
import api from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import Theme from "../components/Theme";

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  
  // Selection States
  const [cities, setCities] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCityId, setSelectedCityId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
      if (Platform.OS === 'web') {
        window.alert("Connection Error: Could not load cities and skill categories list.");
      } else {
        Alert.alert("Connection Error", "Could not load cities and skill categories list.");
      }
    } finally {
      setLoadingMetadata(false);
    }
  };

  const handleSubmit = async () => {
    setFieldErrors({});
    
    if (!email || !password || (!isLogin && (!firstName || !lastName || !phoneNumber || !selectedCityId || !selectedCategoryId))) {
      if (Platform.OS === 'web') {
        window.alert("Error: Please fill in all required fields");
      } else {
        Alert.alert("Error", "Please fill in all required fields");
      }
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
            aadhaarNumber: aadhaarNumber.trim() === "" ? undefined : aadhaarNumber,
            role: "WORKER",
            cityId: selectedCityId,
            serviceCategoryId: selectedCategoryId,
          };

      const response = await api.post(endpoint, payload);
      const { token, user } = response.data.data;

      if (!isLogin) {
        if (Platform.OS === 'web') {
          window.alert("Success: Registration successful! Your application is pending admin approval.");
        } else {
          Alert.alert("Success", "Registration successful! Your application is pending admin approval.");
        }
        setIsLogin(true);
        setLoading(false);
        return;
      }

      // Verify that user logged in is a worker
      if (user.role !== "WORKER") {
        if (Platform.OS === 'web') {
          window.alert("Access Denied: Please use the Customer App to log into this account.");
        } else {
          Alert.alert("Access Denied", "Please use the Customer App to log into this account.");
        }
        setLoading(false);
        return;
      }

      await SecureStore.setItemAsync("token", token);
      await SecureStore.setItemAsync("userId", user.id);
      await SecureStore.setItemAsync("workerCityId", user.workerProfile?.cityId || selectedCityId);

      onAuthSuccess();
    } catch (error: any) {
      console.error("Authentication request error:", error);
      let msg = error.response?.data?.message || "Failed. Check credentials or validation.";
      if (error.response?.data?.errors) {
        console.error("Validation errors:", error.response.data.errors);
        
        // Map backend errors to inline field errors
        const newFieldErrors: Record<string, string> = {};
        error.response.data.errors.forEach((err: any) => {
          // err.field will be something like "body.phoneNumber" or "body.aadhaarNumber"
          const fieldName = err.field.replace("body.", "");
          newFieldErrors[fieldName] = err.message;
        });
        setFieldErrors(newFieldErrors);

        const errorDetails = error.response.data.errors.map((err: any) => err.message).join("\n");
        msg = `${msg}\n${errorDetails}`;
      }
      
      // If we mapped field errors, we might not need an aggressive popup for everything,
      // but we still keep it as a fallback for now.
      if (Object.keys(fieldErrors).length === 0) {
        if (Platform.OS === 'web') {
          window.alert(`Registration Failed:\n${msg}`);
        } else {
          Alert.alert("Registration Failed", msg);
        }
      }
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
            <>
              <View style={styles.nameRow}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>First Name</Text>
                  <View style={[styles.inputContainer, fieldErrors.firstName && styles.inputError]}>
                    <Ionicons name="person-outline" size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="First Name"
                      value={firstName}
                      onChangeText={setFirstName}
                      autoCapitalize="words"
                    />
                  </View>
                  {fieldErrors.firstName && <Text style={styles.errorText}>{fieldErrors.firstName}</Text>}
                </View>
                
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Last Name</Text>
                  <View style={[styles.inputContainer, fieldErrors.lastName && styles.inputError]}>
                    <Ionicons name="person-outline" size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Last Name"
                      value={lastName}
                      onChangeText={setLastName}
                      autoCapitalize="words"
                    />
                  </View>
                  {fieldErrors.lastName && <Text style={styles.errorText}>{fieldErrors.lastName}</Text>}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={[styles.inputContainer, fieldErrors.phoneNumber && styles.inputError]}>
                  <Ionicons name="call-outline" size={20} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter phone number"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                  />
                </View>
                {fieldErrors.phoneNumber && <Text style={styles.errorText}>{fieldErrors.phoneNumber}</Text>}
              </View>
            </>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputContainer, fieldErrors.email && styles.inputError]}>
              <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {fieldErrors.email && <Text style={styles.errorText}>{fieldErrors.email}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputContainer, fieldErrors.password && styles.inputError]}>
              <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color={Theme.colors.textMuted} 
                />
              </TouchableOpacity>
            </View>
            {fieldErrors.password && <Text style={styles.errorText}>{fieldErrors.password}</Text>}
          </View>

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
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  inputGroup: {
    width: "100%",
    marginBottom: Theme.spacing.md,
  },
  label: {
    color: Theme.colors.text,
    fontSize: 14,
    marginBottom: 4,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.sm,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: Theme.colors.text,
    paddingVertical: Theme.spacing.sm,
    fontSize: 15,
  },
  eyeIcon: {
    padding: 10,
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
  inputError: {
    borderColor: Theme.colors.danger,
  },
  errorText: {
    color: Theme.colors.danger,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default AuthScreen;
