// src/screens/TeacherLoginScreen.js
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

export default function TeacherLoginScreen({ navigation }) {
  const [facultyCode, setFacultyCode] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const facultyCredentials = {
    KS: { password: "ks123", name: "Khalandar Sihan Saqaufi" },
    MJ: { password: "mj123", name: "Muhammad Jamal Saqaufi" },
    JM: { password: "jm123", name: "Jaish Muhammad Saqaufi" },
    SH: { password: "sh123", name: "Muhammad Shakeel Sir" },
  };

  const handleLogin = async () => {
    if (!facultyCode.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter faculty code and password");
      return;
    }

    setIsLoading(true);

    const upperFacultyCode = facultyCode.toUpperCase();
    const faculty = facultyCredentials[upperFacultyCode];

    if (faculty && faculty.password === password) {
      try {
        // Store login session
        const loginSession = {
          facultyCode: upperFacultyCode,
          facultyName: faculty.name,
          loginTime: new Date().toISOString(),
        };

        await AsyncStorage.setItem(
          "teacherSession",
          JSON.stringify(loginSession)
        );

        // Navigate to teacher dashboard
        navigation.replace("TeacherDashboard", { faculty: loginSession });
      } catch (error) {
        Alert.alert("Error", "Failed to login. Please try again.");
      }
    } else {
      Alert.alert(
        "Invalid Credentials",
        "Please check your faculty code and password"
      );
    }

    setIsLoading(false);
  };

  const quickLogin = (code) => {
    setFacultyCode(code);
    setPassword(facultyCredentials[code].password);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>TechEthica</Text>
        <Text style={styles.subtitle}>Teacher Portal</Text>
        <Text style={styles.tagline}>Sunnah & Science Research Labs</Text>
      </View>

      <View style={styles.loginForm}>
        <Text style={styles.formTitle}>Faculty Login</Text>

        <TextInput
          style={styles.input}
          placeholder="Faculty Code (KS, MJ, JM, SH)"
          value={facultyCode}
          onChangeText={setFacultyCode}
          autoCapitalize="characters"
          maxLength={2}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
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

        {/* Quick Login for Demo */}
        <View style={styles.quickLoginSection}>
          <Text style={styles.quickLoginTitle}>Quick Login (Demo)</Text>
          <View style={styles.facultyButtons}>
            {Object.keys(facultyCredentials).map((code) => (
              <TouchableOpacity
                key={code}
                style={styles.facultyQuickButton}
                onPress={() => quickLogin(code)}
              >
                <Text style={styles.facultyQuickText}>{code}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.adminButton}
          onPress={() => navigation.navigate("AdminLogin")}
        >
          <Text style={styles.adminButtonText}>Admin Panel</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Default passwords: ks123, mj123, jm123, sh123
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
    backgroundColor: "#2E7D32",
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
    color: "#C8E6C9",
    marginTop: 8,
  },
  tagline: {
    fontSize: 14,
    color: "#A5D6A7",
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
  },
  loginButton: {
    backgroundColor: "#2E7D32",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: "#AAA",
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  quickLoginSection: {
    marginTop: 32,
    padding: 16,
    backgroundColor: "white",
    borderRadius: 12,
    elevation: 2,
  },
  quickLoginTitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  facultyButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  facultyQuickButton: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2E7D32",
  },
  facultyQuickText: {
    color: "#2E7D32",
    fontWeight: "600",
  },
  adminButton: {
    backgroundColor: "#607D8B",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
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
    color: "#999",
    fontSize: 12,
    textAlign: "center",
  },
});
