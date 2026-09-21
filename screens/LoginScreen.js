import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";

import { apiRequest } from "../services/api";

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Login Required", "Please enter your username and password.");
      return;
    }

    try {
      setLoading(true);

      const result = await apiRequest("/auth/login", "POST", {
        username: username.trim(),
        password: password,
      });

      console.log("LOGIN RESULT:", result);

      if (result.success) {
        // ==========================================
        // SAVE JWT TOKEN FOR WEB
        // ==========================================
        localStorage.setItem("cliptrack_token", result.data.token);

        // ==========================================
        // SAVE USER INFORMATION
        // ==========================================
        localStorage.setItem(
          "cliptrack_user",
          JSON.stringify(result.data.user),
        );

        console.log("TOKEN SAVED SUCCESSFULLY");

        navigation.replace("Dashboard");
      } else {
        Alert.alert(
          "Login Failed",
          result.message || "Invalid username or password.",
        );
      }
    } catch (error) {
      console.log("LOGIN ERROR:", error);

      Alert.alert(
        "Login Failed",
        error.message || "Unable to connect to the backend server.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.loginContainer}>
          {/* LOGO */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoIcon}>✂</Text>
            </View>

            <Text style={styles.logoText}>CLIPTRACK</Text>

            <Text style={styles.logoSubtitle}>
              Barbershop Management System
            </Text>
          </View>

          {/* WELCOME */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>Welcome Back</Text>

            <Text style={styles.welcomeText}>
              Sign in to manage your barbershop
            </Text>
          </View>

          {/* LOGIN CARD */}
          <View style={styles.card}>
            {/* USERNAME */}
            <Text style={styles.label}>Username</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter your username"
              placeholderTextColor="#999"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            {/* PASSWORD */}
            <Text style={styles.label}>Password</Text>

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                onSubmitEditing={handleLogin}
              />

              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.eyeIcon}>{showPassword ? "🙈" : "👁️"}</Text>
              </TouchableOpacity>
            </View>

            {/* LOGIN BUTTON */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                loading && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* FOOTER */}
          <Text style={styles.footer}>
            Being a barber is about taking care of the people.
            {"\n"}© 2026 ClipTrack
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F8F6",
  },

  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },

  loginContainer: {
    paddingHorizontal: 25,
    paddingVertical: 40,
  },

  /* LOGO */

  logoContainer: {
    alignItems: "center",
    marginBottom: 35,
  },

  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#1F7A5C",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },

  logoIcon: {
    fontSize: 48,
    color: "#FFFFFF",
  },

  logoText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1F7A5C",
    letterSpacing: 2,
  },

  logoSubtitle: {
    marginTop: 5,
    fontSize: 12,
    color: "#777",
    letterSpacing: 0.3,
  },

  /* WELCOME */

  welcomeContainer: {
    alignItems: "center",
    marginBottom: 25,
  },

  welcomeTitle: {
    fontSize: 25,
    fontWeight: "700",
    color: "#222",
  },

  welcomeText: {
    marginTop: 6,
    fontSize: 14,
    color: "#777",
  },

  /* CARD */

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 22,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#D9E1DD",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 15,
    color: "#222",
    backgroundColor: "#FAFCFB",
    marginBottom: 18,
  },

  /* PASSWORD */

  passwordContainer: {
    height: 52,
    borderWidth: 1,
    borderColor: "#D9E1DD",
    borderRadius: 10,
    backgroundColor: "#FAFCFB",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  passwordInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 15,
    color: "#222",
  },

  eyeButton: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },

  eyeIcon: {
    fontSize: 20,
  },

  /* LOGIN BUTTON */

  loginButton: {
    height: 52,
    backgroundColor: "#1F7A5C",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
  },

  loginButtonDisabled: {
    opacity: 0.7,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  /* FOOTER */

  footer: {
    textAlign: "center",
    marginTop: 25,
    fontSize: 12,
    color: "#999",
    lineHeight: 20,
  },
});
