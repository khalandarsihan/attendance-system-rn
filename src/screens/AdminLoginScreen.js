// src/screens/AdminLoginScreen.js - Production Version (No External Dependencies)
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AdminLoginScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // PRODUCTION CREDENTIALS - CHANGE THESE IMMEDIATELY!
  const adminCredentials = {
    username: "admin",
    password: "chikaka9", // Use a strong password
  };

  // Simple session management
  const createAdminSession = async () => {
    const sessionData = {
      role: "admin",
      username: username,
      loginTime: new Date().toISOString(),
      sessionId:
        Date.now().toString() + Math.random().toString(36).substr(2, 9),
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
    };

    await AsyncStorage.setItem("adminSession", JSON.stringify(sessionData));
    return sessionData;
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter username and password");
      return;
    }

    setIsLoading(true);

    // Simple credential check
    if (
      username.trim() === adminCredentials.username &&
      password === adminCredentials.password
    ) {
      try {
        await createAdminSession();

        Alert.alert("Login Successful", "Welcome to TechEthica Admin Panel", [
          {
            text: "Continue",
            onPress: () => navigation.replace("AdminPanel"),
          },
        ]);
      } catch (error) {
        Alert.alert("Error", "Failed to create session. Please try again.");
      }
    } else {
      Alert.alert(
        "Login Failed",
        "Invalid username or password. Please check your credentials and try again."
      );
    }

    setIsLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>TechEthica</Text>
        <Text style={styles.subtitle}>Admin Panel</Text>
        <Text style={styles.tagline}>Sunnah & Science Research Labs</Text>
      </View>

      <View style={styles.loginForm}>
        <Text style={styles.formTitle}>Administrator Login</Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />

        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.disabledButton]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.loginButtonText}>
            {isLoading ? "Logging in..." : "Login"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.teacherButton}
          onPress={() => navigation.navigate("TeacherLogin")}
        >
          <Text style={styles.teacherButtonText}>Teacher Portal</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>TechEthica Management System v2.0</Text>
        <Text style={styles.footerSubtext}>
          Contact administrator for access credentials
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#1565C0", // Admin blue
    padding: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
  subtitle: {
    fontSize: 20,
    color: "#BBDEFB",
    marginTop: 8,
  },
  tagline: {
    fontSize: 14,
    color: "#90CAF9",
    fontStyle: "italic",
    marginTop: 4,
  },
  loginForm: {
    flex: 1,
    padding: 32,
    justifyContent: "center",
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 32,
  },
  input: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#DDD",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  loginButton: {
    backgroundColor: "#1565C0",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  disabledButton: {
    backgroundColor: "#AAA",
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  teacherButton: {
    backgroundColor: "#2E7D32",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
  },
  adminButton: {
    backgroundColor: "#607D8B",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
  },
  teacherButtonText: {
    color: "white",
    fontSize: 16,
  },
  adminButtonText: {
    color: "white",
    fontSize: 16,
  },
  footer: {
    padding: 16,
    alignItems: "center",
  },
  footerText: {
    color: "#666",
    fontSize: 12,
    textAlign: "center",
    fontWeight: "600",
  },
  footerSubtext: {
    color: "#999",
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
  },
});
