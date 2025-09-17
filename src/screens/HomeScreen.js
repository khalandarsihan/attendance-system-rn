// src/screens/HomeScreen.js - Updated with Logout
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function HomeScreen({ navigation }) {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSubjects: 0,
    totalFaculty: 4,
    todayClasses: 0,
  });

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const students = await AsyncStorage.getItem("students");
      const subjects = await AsyncStorage.getItem("subjects");

      const studentCount = students ? JSON.parse(students).length : 0;
      const subjectCount = subjects ? JSON.parse(subjects).length : 0;

      setStats({
        totalStudents: studentCount,
        totalSubjects: subjectCount,
        totalFaculty: 4,
        todayClasses: Math.min(subjectCount, 11),
      });
    } catch (error) {
      console.log("Error loading dashboard stats:", error);
    }
  };

  const logout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout from admin panel?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          await AsyncStorage.removeItem("adminSession");
          navigation.replace("AdminLogin");
        },
      },
    ]);
  };

  const menuItems = [
    {
      title: "Take Attendance",
      subtitle: "Mark student attendance for classes",
      icon: "✓",
      color: "#4CAF50",
      onPress: () => navigation.navigate("Attendance"),
    },
    {
      title: "Manage Subjects",
      subtitle: "Add, edit, or remove subjects",
      icon: "📚",
      color: "#2196F3",
      onPress: () => navigation.navigate("SubjectManagement"),
    },
    {
      title: "Bulk Import Data",
      subtitle: "Import subjects, students, or timetable",
      icon: "📤",
      color: "#FF9800",
      onPress: () => navigation.navigate("BulkImport"),
    },
    {
      title: "Manage Students",
      subtitle: "Add or manage student records",
      icon: "👥",
      color: "#9C27B0",
      onPress: () => navigation.navigate("Students"),
    },
    {
      title: "View Timetable",
      subtitle: "Check class schedule and timings",
      icon: "🕐",
      color: "#795548",
      onPress: () => navigation.navigate("Timetable"),
    },
    {
      title: "View Reports",
      subtitle: "Attendance analytics and reports",
      icon: "📊",
      color: "#607D8B",
      onPress: () => navigation.navigate("Reports"),
    },
    {
      title: "Data Cleanup",
      subtitle: "Remove duplicates and manage data",
      icon: "🗑️",
      color: "#FF5722",
      onPress: () => navigation.navigate("DataCleanup"),
    },
  ];

  const StatCard = ({ title, value, subtitle }) => (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const MenuItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.menuItem, { borderLeftColor: item.color }]}
      onPress={item.onPress}
    >
      <View style={styles.menuIcon}>
        <Text style={styles.iconText}>{item.icon}</Text>
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{item.title}</Text>
        <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
      </View>
      <Text style={styles.menuArrow}>→</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Logout */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <Text style={styles.welcomeText}>Welcome to</Text>
              <Text style={styles.instituteText}>TechEthica</Text>
              <Text style={styles.taglineText}>
                Sunnah & Science Research Labs
              </Text>
              <Text style={styles.subtitleText}>Admin Panel</Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <StatCard title="Students" value={stats.totalStudents} />
          <StatCard title="Subjects" value={stats.totalSubjects} />
          <StatCard title="Faculty" value={stats.totalFaculty} />
          <StatCard title="Today's Classes" value={stats.todayClasses} />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Administrative Functions</Text>

          {menuItems.map((item, index) => (
            <MenuItem key={index} item={item} />
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Academic Year 2024-2025 • Admin Version 2.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#1565C0",
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
  },
  welcomeText: {
    color: "#E3F2FD",
    fontSize: 16,
    fontWeight: "400",
  },
  instituteText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 5,
  },
  taglineText: {
    color: "#90CAF9",
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 2,
  },
  subtitleText: {
    color: "#BBDEFB",
    fontSize: 16,
    marginTop: 8,
  },
  logoutButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1565C0",
  },
  statTitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  statSubtitle: {
    fontSize: 10,
    color: "#999",
    marginTop: 2,
    textAlign: "center",
  },
  quickActions: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  menuItem: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderLeftWidth: 4,
  },
  menuIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  iconText: {
    fontSize: 24,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  menuSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  menuArrow: {
    fontSize: 18,
    color: "#999",
  },
  footer: {
    alignItems: "center",
    padding: 20,
  },
  footerText: {
    color: "#999",
    fontSize: 12,
  },
});
