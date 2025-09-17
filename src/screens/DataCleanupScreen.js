// src/screens/DataCleanupScreen.js - Updated with separate delete features
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

export default function DataCleanupScreen({ navigation }) {
  const [stats, setStats] = useState({
    totalSubjects: 0,
    duplicateSubjects: 0,
    totalStudents: 0,
    duplicateStudents: 0,
    attendanceLogs: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    analyzeData();
  }, []);

  const analyzeData = async () => {
    try {
      const [subjectsData, studentsData, logsData] = await Promise.all([
        AsyncStorage.getItem("subjects"),
        AsyncStorage.getItem("students"),
        AsyncStorage.getItem("attendanceLogs"),
      ]);

      // Analyze subjects
      let totalSubjects = 0;
      let duplicateSubjects = 0;
      if (subjectsData) {
        const subjects = JSON.parse(subjectsData);
        totalSubjects = subjects.length;

        // Find duplicates by name, faculty, day, time
        const seen = new Set();
        const duplicates = new Set();
        subjects.forEach((subject) => {
          const key = `${subject.name}-${subject.faculty}-${subject.day}-${subject.time}`;
          if (seen.has(key)) {
            duplicates.add(key);
          }
          seen.add(key);
        });
        duplicateSubjects = subjects.filter((subject) => {
          const key = `${subject.name}-${subject.faculty}-${subject.day}-${subject.time}`;
          return duplicates.has(key);
        }).length;
      }

      // Analyze students
      let totalStudents = 0;
      let duplicateStudents = 0;
      if (studentsData) {
        const students = JSON.parse(studentsData);
        totalStudents = students.length;

        // Find duplicates by roll number
        const rollNumbers = students.map((s) => s.rollNumber);
        duplicateStudents = rollNumbers.length - new Set(rollNumbers).size;
      }

      // Count attendance logs
      let attendanceLogs = 0;
      if (logsData) {
        attendanceLogs = JSON.parse(logsData).length;
      }

      setStats({
        totalSubjects,
        duplicateSubjects,
        totalStudents,
        duplicateStudents,
        attendanceLogs,
      });
    } catch (error) {
      console.log("Error analyzing data:", error);
    }
  };

  const cleanupSubjects = async () => {
    Alert.alert(
      "Remove Duplicate Subjects",
      `This will remove ${stats.duplicateSubjects} duplicate subject entries. Continue?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clean Up", onPress: performSubjectCleanup },
      ]
    );
  };

  const performSubjectCleanup = async () => {
    setIsLoading(true);
    try {
      const subjectsData = await AsyncStorage.getItem("subjects");
      if (subjectsData) {
        const subjects = JSON.parse(subjectsData);

        // Remove duplicates - keep first occurrence
        const seen = new Set();
        const uniqueSubjects = subjects.filter((subject) => {
          const key = `${subject.name}-${subject.faculty}-${subject.day}-${subject.time}`;
          if (seen.has(key)) {
            return false; // Skip duplicate
          }
          seen.add(key);
          return true; // Keep unique
        });

        await AsyncStorage.setItem("subjects", JSON.stringify(uniqueSubjects));

        Alert.alert(
          "Cleanup Complete",
          `Removed ${
            subjects.length - uniqueSubjects.length
          } duplicate subjects.\nKept ${
            uniqueSubjects.length
          } unique subjects.`,
          [{ text: "OK", onPress: analyzeData }]
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to cleanup subjects");
    }
    setIsLoading(false);
  };

  const cleanupStudents = async () => {
    Alert.alert(
      "Remove Duplicate Students",
      `This will remove duplicate student entries. Continue?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clean Up", onPress: performStudentCleanup },
      ]
    );
  };

  const performStudentCleanup = async () => {
    setIsLoading(true);
    try {
      const studentsData = await AsyncStorage.getItem("students");
      if (studentsData) {
        const students = JSON.parse(studentsData);

        // Remove duplicates by roll number - keep first occurrence
        const seen = new Set();
        const uniqueStudents = students.filter((student) => {
          if (seen.has(student.rollNumber)) {
            return false; // Skip duplicate
          }
          seen.add(student.rollNumber);
          return true; // Keep unique
        });

        await AsyncStorage.setItem("students", JSON.stringify(uniqueStudents));

        Alert.alert(
          "Cleanup Complete",
          `Removed ${
            students.length - uniqueStudents.length
          } duplicate students.\nKept ${
            uniqueStudents.length
          } unique students.`,
          [{ text: "OK", onPress: analyzeData }]
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to cleanup students");
    }
    setIsLoading(false);
  };

  // NEW: Delete all subjects
  const deleteAllSubjects = async () => {
    Alert.alert(
      "Delete All Subjects",
      `This will permanently delete ALL ${stats.totalSubjects} subjects and their related attendance data. This action cannot be undone!`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "DELETE ALL SUBJECTS",
          style: "destructive",
          onPress: performDeleteAllSubjects,
        },
      ]
    );
  };

  const performDeleteAllSubjects = async () => {
    setIsLoading(true);
    try {
      // Remove all subjects
      await AsyncStorage.removeItem("subjects");

      // Remove all attendance logs related to subjects
      await AsyncStorage.removeItem("attendanceLogs");

      // Clear all attendance session data
      const allKeys = await AsyncStorage.getAllKeys();
      const attendanceKeys = allKeys.filter(
        (key) => key.startsWith("attendance_") || key.startsWith("session_")
      );
      if (attendanceKeys.length > 0) {
        await AsyncStorage.multiRemove(attendanceKeys);
      }

      Alert.alert(
        "Subjects Deleted",
        "All subjects and related attendance data have been permanently deleted.",
        [{ text: "OK", onPress: analyzeData }]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to delete subjects");
    }
    setIsLoading(false);
  };

  // NEW: Delete all students
  const deleteAllStudents = async () => {
    Alert.alert(
      "Delete All Students",
      `This will permanently delete ALL ${stats.totalStudents} students. Attendance records will be preserved but student names will show as unknown. This action cannot be undone!`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "DELETE ALL STUDENTS",
          style: "destructive",
          onPress: performDeleteAllStudents,
        },
      ]
    );
  };

  const performDeleteAllStudents = async () => {
    setIsLoading(true);
    try {
      // Remove all students
      await AsyncStorage.removeItem("students");

      Alert.alert(
        "Students Deleted",
        "All student records have been permanently deleted. Attendance logs are preserved.",
        [{ text: "OK", onPress: analyzeData }]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to delete students");
    }
    setIsLoading(false);
  };

  // NEW: Delete all attendance logs
  const deleteAllAttendanceLogs = async () => {
    Alert.alert(
      "Delete All Attendance Records",
      `This will permanently delete ALL ${stats.attendanceLogs} attendance records and session data. Students and subjects will be preserved. This action cannot be undone!`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "DELETE ALL ATTENDANCE",
          style: "destructive",
          onPress: performDeleteAllAttendance,
        },
      ]
    );
  };

  const performDeleteAllAttendance = async () => {
    setIsLoading(true);
    try {
      // Remove all attendance logs
      await AsyncStorage.removeItem("attendanceLogs");

      // Clear all attendance session data
      const allKeys = await AsyncStorage.getAllKeys();
      const attendanceKeys = allKeys.filter(
        (key) => key.startsWith("attendance_") || key.startsWith("session_")
      );
      if (attendanceKeys.length > 0) {
        await AsyncStorage.multiRemove(attendanceKeys);
      }

      Alert.alert(
        "Attendance Data Deleted",
        "All attendance records and session data have been permanently deleted.",
        [{ text: "OK", onPress: analyzeData }]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to delete attendance data");
    }
    setIsLoading(false);
  };

  const clearAllData = async () => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete ALL subjects, students, and attendance records. This action cannot be undone!",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "DELETE EVERYTHING",
          style: "destructive",
          onPress: performClearAll,
        },
      ]
    );
  };

  const performClearAll = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        AsyncStorage.removeItem("subjects"),
        AsyncStorage.removeItem("students"),
        AsyncStorage.removeItem("attendanceLogs"),
        // Clear all attendance session data
        AsyncStorage.getAllKeys().then((keys) => {
          const attendanceKeys = keys.filter(
            (key) => key.startsWith("attendance_") || key.startsWith("session_")
          );
          return AsyncStorage.multiRemove(attendanceKeys);
        }),
      ]);

      Alert.alert(
        "All Data Cleared",
        "All data has been permanently deleted.",
        [
          {
            text: "OK",
            onPress: () => {
              analyzeData();
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to clear data");
    }
    setIsLoading(false);
  };

  const exportData = async () => {
    try {
      const [subjectsData, studentsData, logsData] = await Promise.all([
        AsyncStorage.getItem("subjects"),
        AsyncStorage.getItem("students"),
        AsyncStorage.getItem("attendanceLogs"),
      ]);

      const exportData = {
        subjects: subjectsData ? JSON.parse(subjectsData) : [],
        students: studentsData ? JSON.parse(studentsData) : [],
        attendanceLogs: logsData ? JSON.parse(logsData) : [],
        exportDate: new Date().toISOString(),
        appVersion: "2.0",
      };

      // In a real app, you would export this to a file or share it
      console.log("Export Data:", exportData);
      Alert.alert(
        "Export Data",
        `Data exported to console.\nSubjects: ${exportData.subjects.length}\nStudents: ${exportData.students.length}\nLogs: ${exportData.attendanceLogs.length}`
      );
    } catch (error) {
      Alert.alert("Error", "Failed to export data");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Data Cleanup & Management</Text>
        <Text style={styles.subtitle}>
          Remove duplicate entries and manage your data
        </Text>

        {/* Data Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Analysis</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalSubjects}</Text>
              <Text style={styles.statLabel}>Total Subjects</Text>
              {stats.duplicateSubjects > 0 && (
                <Text style={styles.duplicateText}>
                  {stats.duplicateSubjects} duplicates
                </Text>
              )}
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalStudents}</Text>
              <Text style={styles.statLabel}>Total Students</Text>
              {stats.duplicateStudents > 0 && (
                <Text style={styles.duplicateText}>
                  {stats.duplicateStudents} duplicates
                </Text>
              )}
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.attendanceLogs}</Text>
              <Text style={styles.statLabel}>Attendance Logs</Text>
            </View>
          </View>
        </View>

        {/* Cleanup Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cleanup Duplicates</Text>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.cleanupButton,
              stats.duplicateSubjects === 0 && styles.disabledButton,
            ]}
            onPress={cleanupSubjects}
            disabled={stats.duplicateSubjects === 0 || isLoading}
          >
            <Text style={styles.actionButtonText}>
              Remove Duplicate Subjects ({stats.duplicateSubjects})
            </Text>
            <Text style={styles.actionSubtext}>
              Keep only unique subject entries
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.cleanupButton,
              stats.duplicateStudents === 0 && styles.disabledButton,
            ]}
            onPress={cleanupStudents}
            disabled={stats.duplicateStudents === 0 || isLoading}
          >
            <Text style={styles.actionButtonText}>
              Remove Duplicate Students ({stats.duplicateStudents})
            </Text>
            <Text style={styles.actionSubtext}>
              Keep only unique student entries
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.refreshButton]}
            onPress={analyzeData}
            disabled={isLoading}
          >
            <Text style={styles.actionButtonText}>Refresh Analysis</Text>
            <Text style={styles.actionSubtext}>Re-scan for duplicates</Text>
          </TouchableOpacity>
        </View>

        {/* NEW: Delete Specific Data Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delete Specific Data</Text>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.deleteButton,
              stats.totalSubjects === 0 && styles.disabledButton,
            ]}
            onPress={deleteAllSubjects}
            disabled={stats.totalSubjects === 0 || isLoading}
          >
            <Text style={styles.deleteButtonText}>
              Delete All Subjects ({stats.totalSubjects})
            </Text>
            <Text style={styles.deleteSubtext}>
              Remove all subjects and related attendance data
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.deleteButton,
              stats.totalStudents === 0 && styles.disabledButton,
            ]}
            onPress={deleteAllStudents}
            disabled={stats.totalStudents === 0 || isLoading}
          >
            <Text style={styles.deleteButtonText}>
              Delete All Students ({stats.totalStudents})
            </Text>
            <Text style={styles.deleteSubtext}>
              Remove all student records (attendance preserved)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.deleteButton,
              stats.attendanceLogs === 0 && styles.disabledButton,
            ]}
            onPress={deleteAllAttendanceLogs}
            disabled={stats.attendanceLogs === 0 || isLoading}
          >
            <Text style={styles.deleteButtonText}>
              Delete All Attendance Records ({stats.attendanceLogs})
            </Text>
            <Text style={styles.deleteSubtext}>
              Remove all attendance data (subjects & students preserved)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>

          <TouchableOpacity
            style={[styles.actionButton, styles.exportButton]}
            onPress={exportData}
            disabled={isLoading}
          >
            <Text style={styles.actionButtonText}>Export All Data</Text>
            <Text style={styles.actionSubtext}>
              Backup your data (to console for now)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={clearAllData}
            disabled={isLoading}
          >
            <Text style={styles.dangerButtonText}>Clear All Data</Text>
            <Text style={styles.dangerSubtext}>
              Permanently delete everything
            </Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>Instructions:</Text>
          <Text style={styles.instructionText}>
            • Run analysis to identify duplicates
          </Text>
          <Text style={styles.instructionText}>
            • Clean up duplicates before adding new data
          </Text>
          <Text style={styles.instructionText}>
            • Use specific delete options to remove individual data types
          </Text>
          <Text style={styles.instructionText}>
            • Export data as backup before major changes
          </Text>
          <Text style={styles.instructionText}>
            • Use "Clear All" only to start completely fresh
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
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1565C0",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1565C0",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  duplicateText: {
    fontSize: 11,
    color: "#FF5722",
    fontWeight: "600",
    marginTop: 4,
  },
  actionButton: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cleanupButton: {
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
  },
  refreshButton: {
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  exportButton: {
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  deleteButton: {
    borderLeftWidth: 4,
    borderLeftColor: "#FF5722",
    backgroundColor: "#FFF3E0",
  },
  dangerButton: {
    borderLeftWidth: 4,
    borderLeftColor: "#F44336",
    backgroundColor: "#FFEBEE",
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  actionSubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF5722",
  },
  deleteSubtext: {
    fontSize: 14,
    color: "#FF5722",
    marginTop: 4,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F44336",
  },
  dangerSubtext: {
    fontSize: 14,
    color: "#F44336",
    marginTop: 4,
  },
  instructions: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
});
