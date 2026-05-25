import React, { useState } from "react";
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
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password || (!isLogin && (!firstName || !lastName || !phoneNumber))) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin
        ? { email, password }
        : { email, password, firstName, lastName, phoneNumber, role: "CUSTOMER" };

      const response = await api.post(endpoint, payload);
      const { token, user } = response.data.data;

      // Cache token and user ID
      await SecureStore.setItemAsync("token", token);
      await SecureStore.setItemAsync("userId", user.id);

      onAuthSuccess();
    } catch (error: any) {
      console.error("Authentication request error:", error);
      const msg = error.response?.data?.message || "Something went wrong. Please check your credentials.";
      Alert.alert("Authentication Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.glassCard}>
        <Text style={styles.title}>NearPro</Text>
        <Text style={styles.subtitle}>
          {isLogin ? "10-Minute Hyperlocal Services" : "Create Customer Account"}
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
            <Text style={styles.buttonText}>{isLogin ? "Login" : "Register"}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.toggleBtn}>
          <Text style={styles.toggleText}>
            {isLogin
              ? "Don't have an account? Sign Up"
              : "Already have an account? Log In"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: Theme.colors.text,
    letterSpacing: 1.5,
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
    fontSize: 16,
  },
  halfInput: {
    width: "48%",
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
    fontSize: 18,
    fontWeight: "600",
  },
  toggleBtn: {
    marginTop: Theme.spacing.lg,
  },
  toggleText: {
    color: Theme.colors.textMuted,
    fontSize: 14,
  },
});

export default AuthScreen;
