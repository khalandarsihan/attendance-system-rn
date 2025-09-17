// src/screens/TeacherDashboard.js - Fixed navigation issue
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function TeacherDashboard({ route, navigation }) {
  const { faculty } = route.params;
  const [mySubjects, setMySubjects] = useState([]);
  const [todaySubjects, setTodaySubjects] = useState([]);
  const [recentClasses, setRecentClasses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTeacherData();
  }, []);

  // Helper function to convert time string to minutes for sorting
  const timeToMinutes = (timeString) => {
    if (!timeString || !timeString.includes("-")) return 0;

    const [startTime] = timeString.split("-");
    const [hours, minutes] = startTime.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const loadTeacherData = async () => {
    setRefreshing(true);
    try {
      // Load subjects assigned to this faculty
      const subjectsData = await AsyncStorage.getItem("subjects");
      if (subjectsData) {
        const allSubjects = JSON.parse(subjectsData);
        const facultySubjects = allSubjects.filter(
          (subject) => subject.faculty === faculty.facultyCode
        );
        setMySubjects(facultySubjects);

        // Get today's subjects with proper time sorting
        const today = new Date().toLocaleDateString("en", { weekday: "long" });
        const todaysClasses = facultySubjects
          .filter((subject) => subject.day === today)
          .sort((a, b) => {
            // Sort by time - earliest first
            const timeA = timeToMinutes(a.time);
            const timeB = timeToMinutes(b.time);
            return timeA - timeB;
          });
        setTodaySubjects(todaysClasses);
      }

      // Load recent attendance logs for this faculty
      const logsData = await AsyncStorage.getItem("attendanceLogs");
      if (logsData) {
        const allLogs = JSON.parse(logsData);
        const facultyLogs = allLogs
          .filter((log) => log.faculty === faculty.facultyCode)
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5);
        setRecentClasses(facultyLogs);
      }
    } catch (error) {
      console.log("Error loading teacher data:", error);
    }
    setRefreshing(false);
  };

  const logout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          await AsyncStorage.removeItem("teacherSession");
          navigation.replace("TeacherLogin");
        },
      },
    ]);
  };

  // FIXED: This function now properly navigates to TeacherAttendance
  const startClass = (subject) => {
    // Navigate to TeacherAttendance screen with proper parameters
    navigation.navigate("TeacherAttendance", {
      subject: subject,
      faculty: faculty.facultyCode,
    });
  };

  const viewMyReports = () => {
    navigation.navigate("TeacherReports", {
      faculty: faculty.facultyCode,
      facultyName: faculty.facultyName,
    });
  };

  const viewMySubjects = () => {
    navigation.navigate("TeacherSubjects", {
      facultyCode: faculty.facultyCode,
    });
  };

  const getDurationStats = () => {
    const totalScheduledMinutes = mySubjects.reduce((total, subject) => {
      const [start, end] = subject.time.split("-");
      const [startH, startM] = start.split(":").map(Number);
      const [endH, endM] = end.split(":").map(Number);
      return total + (endH * 60 + endM - (startH * 60 + startM));
    }, 0);

    const totalActualMinutes = recentClasses.reduce((total, log) => {
      return total + (log.actualDuration || 0);
    }, 0);

    return {
      scheduled: Math.round(totalScheduledMinutes / mySubjects.length) || 0,
      actual: Math.round(totalActualMinutes / recentClasses.length) || 0,
    };
  };

  const durationStats = getDurationStats();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadTeacherData} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.facultyName}>{faculty.facultyName}</Text>
            <Text style={styles.facultyCode}>
              Faculty Code: {faculty.facultyCode}
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{mySubjects.length}</Text>
            <Text style={styles.statLabel}>My Subjects</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{todaySubjects.length}</Text>
            <Text style={styles.statLabel}>Today's Classes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{durationStats.actual}min</Text>
            <Text style={styles.statLabel}>Avg Duration</Text>
          </View>
        </View>

        {/* Today's Classes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Classes</Text>
          {todaySubjects.length > 0 ? (
            todaySubjects.map((subject, index) => {
              const isCurrentTime = isInTimeSlot(subject.time);
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.classCard,
                    isCurrentTime && styles.currentClassCard,
                  ]}
                  onPress={() => startClass(subject)}
                  activeOpacity={0.7}
                >
                  <View style={styles.timeIndicator}>
                    <Text style={styles.timeText}>{subject.time}</Text>
                  </View>
                  <View style={styles.classInfo}>
                    <Text style={styles.className}>{subject.name}</Text>
                    <Text style={styles.classSchedule}>
                      {subject.day} • Faculty: {subject.faculty}
                    </Text>
                    {isCurrentTime && (
                      <Text style={styles.currentIndicator}>
                        NOW - Tap to start attendance
                      </Text>
                    )}
                    {!isCurrentTime && (
                      <Text style={styles.tapToStartText}>
                        Tap to take attendance
                      </Text>
                    )}
                  </View>
                  <View style={styles.classArrow}>
                    <Text style={styles.arrowText}>→</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No classes scheduled for today
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.actionButton} onPress={viewMyReports}>
            <Text style={styles.actionButtonText}>📊 View My Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={viewMySubjects}
          >
            <Text style={styles.actionButtonText}>📚 My Subjects</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Classes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Classes</Text>
          {recentClasses.length > 0 ? (
            recentClasses.map((log, index) => (
              <View key={index} style={styles.recentClassCard}>
                <View style={styles.recentClassInfo}>
                  <Text style={styles.recentClassName}>{log.subjectName}</Text>
                  <Text style={styles.recentClassDate}>{log.date}</Text>
                  <Text style={styles.recentClassStats}>
                    Duration: {log.actualDuration || "N/A"} min • Present:{" "}
                    {
                      Object.values(log.attendance).filter(
                        (a) =>
                          (typeof a === "string" ? a : a.status) === "present"
                      ).length
                    }
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No recent classes found</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper function to check if current time is within class time
function isInTimeSlot(timeSlot) {
  const [startTime, endTime] = timeSlot.split("-");
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  const now = new Date();
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();

  const slotStart = startHour * 60 + startMin;
  const slotEnd = endHour * 60 + endMin;
  const currentMinutes = currentHour * 60 + currentMin;

  return currentMinutes >= slotStart && currentMinutes <= slotEnd;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#2E7D32",
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    color: "#C8E6C9",
    fontSize: 16,
  },
  facultyName: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 4,
  },
  facultyCode: {
    color: "#A5D6A7",
    fontSize: 14,
    marginTop: 2,
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
    backgroundColor: "white",
    paddingVertical: 20,
    justifyContent: "space-around",
    elevation: 2,
  },
  statCard: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  classCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  currentClassCard: {
    backgroundColor: "#E8F5E9",
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  timeIndicator: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 16,
    minWidth: 80,
    alignItems: "center",
  },
  timeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2E7D32",
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  classSchedule: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  currentIndicator: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
    marginTop: 4,
  },
  tapToStartText: {
    fontSize: 12,
    color: "#2E7D32",
    fontWeight: "500",
    marginTop: 4,
  },
  classArrow: {
    padding: 8,
  },
  arrowText: {
    fontSize: 18,
    color: "#2E7D32",
  },
  emptyState: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    color: "#999",
    fontSize: 16,
  },
  actionButton: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  recentClassCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
  },
  recentClassInfo: {
    flex: 1,
  },
  recentClassName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  recentClassDate: {
    fontSize: 12,
    color: "#2E7D32",
    marginTop: 2,
  },
  recentClassStats: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
});
