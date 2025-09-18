// src/screens/TeacherLoginScreen.js - Fixed Complete Version
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

  // Updated faculty credentials as per your requirement
  const facultyCredentials = {
    KS: {
      password: "sihan123",
      name: "Khalandar Sihan Saqaufi",
    },
    MJ: {
      password: "jamal123",
      name: "Muhammad Jamal Saqaufi",
    },
    JM: {
      password: "jaish123",
      name: "Jaish Muhammad Saqaufi",
    },
    SH: {
      password: "shakeel123",
      name: "Muhammad Shakeel Sir",
    },
  };

  const createTeacherSession = async (facultyCode, facultyName) => {
    const sessionData = {
      role: "teacher",
      facultyCode: facultyCode,
      facultyName: facultyName,
      loginTime: new Date().toISOString(),
      sessionId:
        Date.now().toString() + Math.random().toString(36).substr(2, 9),
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
    };

    await AsyncStorage.setItem("teacherSession", JSON.stringify(sessionData));
    return sessionData;
  };

  const handleLogin = async () => {
    if (!facultyCode.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter faculty code and password");
      return;
    }

    setIsLoading(true);

    const upperFacultyCode = facultyCode.toUpperCase().trim();
    const faculty = facultyCredentials[upperFacultyCode];

    if (faculty && faculty.password === password) {
      try {
        const session = await createTeacherSession(
          upperFacultyCode,
          faculty.name
        );

        Alert.alert("Login Successful", `Welcome ${faculty.name}`, [
          {
            text: "Continue",
            onPress: () =>
              navigation.replace("TeacherDashboard", { faculty: session }),
          },
        ]);
      } catch (error) {
        Alert.alert("Error", "Failed to create session. Please try again.");
      }
    } else {
      Alert.alert(
        "Login Failed",
        "Invalid faculty code or password. Please check your credentials and try again."
      );
    }

    setIsLoading(false);
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
          autoCorrect={false}
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
          style={styles.adminButton}
          onPress={() => navigation.navigate("AdminLogin")}
        >
          <Text style={styles.adminButtonText}>Admin Panel</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>TechEthica Management System v2.0</Text>
        <Text style={styles.footerSubtext}>
          Faculty: Contact admin for password reset
        </Text>
      </View>
    </SafeAreaView>
  );
}

// Complete styles object - This was missing in your file!
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#2E7D32", // Teacher green
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
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  loginButton: {
    backgroundColor: "#2E7D32",
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
