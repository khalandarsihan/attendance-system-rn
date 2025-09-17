// src/screens/AttendanceScreen.js - Enhanced with Subject Selection
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AttendanceScreen() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [showSubjectModal, setShowSubjectModal] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [classStarted, setClassStarted] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [date] = useState(new Date().toISOString().split("T")[0]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      loadStudents();
      loadAttendanceForSubject();
    }
  }, [selectedSubject]);

  const loadSubjects = async () => {
    try {
      const subjectsData = await AsyncStorage.getItem("subjects");
      if (subjectsData) {
        const subjectsList = JSON.parse(subjectsData);
        setSubjects(subjectsList);
        // If no subjects found, show empty state
        if (subjectsList.length === 0) {
          setShowSubjectModal(false);
          Alert.alert(
            "No Subjects Found",
            "Please add subjects first using Bulk Import or Subject Management.",
            [{ text: "OK" }]
          );
        }
      } else {
        // No subjects in storage
        setShowSubjectModal(false);
        Alert.alert(
          "No Subjects Found",
          "Please add subjects first using Bulk Import from the Dashboard.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.log("Error loading subjects:", error);
    }
  };

  const loadStudents = async () => {
    try {
      const studentsData = await AsyncStorage.getItem("students");
      if (studentsData) {
        setStudents(JSON.parse(studentsData));
      } else {
        // Keep existing default students if no students in storage
        const defaultStudents = [
          {
            id: "1",
            name: "Ahmed Ali",
            rollNumber: "ST001",
            className: "Class A",
          },
          {
            id: "2",
            name: "Fatima Khan",
            rollNumber: "ST002",
            className: "Class A",
          },
          {
            id: "3",
            name: "Hassan Sheikh",
            rollNumber: "ST003",
            className: "Class B",
          },
          {
            id: "4",
            name: "Aisha Rahman",
            rollNumber: "ST004",
            className: "Class B",
          },
          {
            id: "5",
            name: "Omar Abdullah",
            rollNumber: "ST005",
            className: "Class A",
          },
          {
            id: "6",
            name: "Zara Malik",
            rollNumber: "ST006",
            className: "Class A",
          },
          {
            id: "7",
            name: "Ali Hassan",
            rollNumber: "ST007",
            className: "Class B",
          },
          {
            id: "8",
            name: "Maryam Ahmed",
            rollNumber: "ST008",
            className: "Class B",
          },
        ];
        setStudents(defaultStudents);
        await AsyncStorage.setItem("students", JSON.stringify(defaultStudents));
      }
    } catch (error) {
      console.log("Error loading students:", error);
    }
  };

  const loadAttendanceForSubject = async () => {
    try {
      const attendanceKey = `attendance_${selectedSubject.id}_${date}`;
      const attendanceData = await AsyncStorage.getItem(attendanceKey);
      if (attendanceData) {
        const parsedData = JSON.parse(attendanceData);
        setAttendance(parsedData.attendance || parsedData);
        if (parsedData.startTime) {
          setStartTime(parsedData.startTime);
          setClassStarted(true);
        } else {
          setClassStarted(false);
          setStartTime(null);
        }
      } else {
        // No attendance data for this subject today
        setAttendance({});
        setClassStarted(false);
        setStartTime(null);
      }
    } catch (error) {
      console.log("Error loading attendance:", error);
    }
  };

  const selectSubject = (subject) => {
    setSelectedSubject(subject);
    setShowSubjectModal(false);
  };

  const startClass = () => {
    const now = new Date();
    setStartTime(now.toISOString());
    setClassStarted(true);

    // Check if class is starting late
    if (selectedSubject.time) {
      const [scheduledStartTime] = selectedSubject.time.split("-");
      const [hours, minutes] = scheduledStartTime.split(":").map(Number);
      const scheduledStart = new Date();
      scheduledStart.setHours(hours, minutes, 0, 0);

      const delayMinutes = Math.round((now - scheduledStart) / (1000 * 60));
      if (delayMinutes > 5) {
        Alert.alert(
          "Late Start",
          `Class started ${delayMinutes} minutes late.\nScheduled: ${
            selectedSubject.time
          }\nActual: ${now.toLocaleTimeString()}`,
          [{ text: "OK" }]
        );
      }
    }

    Alert.alert(
      "Class Started",
      `${selectedSubject.name} session started at ${now.toLocaleTimeString()}`
    );
  };

  const markAttendance = (studentId, status) => {
    const timestamp = new Date().toISOString();
    const updatedAttendance = {
      ...attendance,
      [studentId]: {
        status,
        timestamp,
        markedBy: selectedSubject.faculty,
      },
    };
    setAttendance(updatedAttendance);
  };

  const saveAttendance = async () => {
    if (!classStarted) {
      Alert.alert("Error", "Please start the class session first");
      return;
    }

    try {
      const attendanceData = {
        date,
        subjectId: selectedSubject.id,
        subjectName: selectedSubject.name,
        faculty: selectedSubject.faculty,
        scheduledTime: selectedSubject.time,
        attendance,
        startTime,
        totalStudents: students.length,
        savedAt: new Date().toISOString(),
      };

      // Save subject-specific attendance
      const attendanceKey = `attendance_${selectedSubject.id}_${date}`;
      await AsyncStorage.setItem(attendanceKey, JSON.stringify(attendanceData));

      // Also save in general attendance log for reports
      const existingLogs = await AsyncStorage.getItem("attendanceLogs");
      const logs = existingLogs ? JSON.parse(existingLogs) : [];

      // Remove existing entry for same subject+date if exists
      const filteredLogs = logs.filter(
        (log) => !(log.subjectId === selectedSubject.id && log.date === date)
      );

      filteredLogs.push(attendanceData);
      await AsyncStorage.setItem(
        "attendanceLogs",
        JSON.stringify(filteredLogs)
      );

      Alert.alert("Success", `Attendance saved for ${selectedSubject.name}!`);
    } catch (error) {
      Alert.alert("Error", "Failed to save attendance");
    }
  };

  const getAttendanceCount = () => {
    const statuses = Object.values(attendance).map((item) =>
      typeof item === "string" ? item : item.status
    );
    const present = statuses.filter((status) => status === "present").length;
    const absent = statuses.filter((status) => status === "absent").length;
    const late = statuses.filter((status) => status === "late").length;
    const total = students.length;

    return {
      present,
      absent,
      late,
      total,
      unmarked: total - (present + absent + late),
    };
  };

  const formatTime = (timeString) => {
    return new Date(timeString).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderStudent = ({ item }) => {
    const studentAttendance = attendance[item.id];
    const status =
      typeof studentAttendance === "string"
        ? studentAttendance
        : studentAttendance?.status;
    const timestamp = studentAttendance?.timestamp;

    return (
      <View style={styles.studentCard}>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{item.name}</Text>
          <Text style={styles.studentDetails}>
            Roll: {item.rollNumber} • {item.className}
          </Text>
          {timestamp && (
            <Text style={styles.timestampText}>
              Marked at: {formatTime(timestamp)}
            </Text>
          )}
        </View>

        <View style={styles.attendanceButtons}>
          <TouchableOpacity
            style={[
              styles.statusButton,
              styles.presentButton,
              status === "present" && styles.activeButton,
            ]}
            onPress={() => markAttendance(item.id, "present")}
          >
            <Text style={styles.buttonText}>P</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statusButton,
              styles.absentButton,
              status === "absent" && styles.activeButton,
            ]}
            onPress={() => markAttendance(item.id, "absent")}
          >
            <Text style={styles.buttonText}>A</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statusButton,
              styles.lateButton,
              status === "late" && styles.activeButton,
            ]}
            onPress={() => markAttendance(item.id, "late")}
          >
            <Text style={styles.buttonText}>L</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const stats = getAttendanceCount();

  return (
    <SafeAreaView style={styles.container}>
      {/* Subject Selection Modal */}
      <Modal
        visible={showSubjectModal && subjects.length > 0}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          if (selectedSubject) {
            setShowSubjectModal(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Subject</Text>
            <FlatList
              data={subjects}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.subjectOption}
                  onPress={() => selectSubject(item)}
                >
                  <Text style={styles.subjectOptionName}>{item.name}</Text>
                  <Text style={styles.subjectOptionDetails}>
                    Faculty: {item.faculty} • {item.day} • {item.time}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {selectedSubject ? (
        <>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.changeSubjectButton}
              onPress={() => setShowSubjectModal(true)}
            >
              <Text style={styles.changeSubjectText}>Change Subject</Text>
            </TouchableOpacity>
            <Text style={styles.subjectTitle}>{selectedSubject.name}</Text>
            <Text style={styles.subjectDetails}>
              Faculty: {selectedSubject.faculty} • {selectedSubject.day} •{" "}
              {selectedSubject.time}
            </Text>
            <Text style={styles.dateHeader}>
              {date} •{" "}
              {currentTime.toLocaleTimeString("en-US", {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>

          {/* Class Session Control */}
          <View style={styles.sessionControls}>
            {!classStarted ? (
              <TouchableOpacity
                style={styles.startClassButton}
                onPress={startClass}
              >
                <Text style={styles.startClassText}>Start Class Session</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.sessionText}>
                Class started at:{" "}
                {startTime ? formatTime(startTime) : "Unknown"}
              </Text>
            )}
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.present}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.absent}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.late}</Text>
              <Text style={styles.statLabel}>Late</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.unmarked}</Text>
              <Text style={styles.statLabel}>Unmarked</Text>
            </View>
          </View>

          {/* Students List */}
          <FlatList
            data={students}
            keyExtractor={(item) => item.id}
            renderItem={renderStudent}
            style={styles.list}
            showsVerticalScrollIndicator={false}
          />

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, !classStarted && styles.disabledButton]}
            onPress={saveAttendance}
            disabled={!classStarted}
          >
            <Text style={styles.saveButtonText}>Save Attendance</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.noSubjectContainer}>
          <Text style={styles.noSubjectTitle}>No Subject Selected</Text>
          <Text style={styles.noSubjectText}>
            Please add subjects first using Bulk Import from the Dashboard.
          </Text>
          <TouchableOpacity
            style={styles.goToBulkImportButton}
            onPress={() => navigation?.navigate?.("BulkImport")}
          >
            <Text style={styles.goToBulkImportText}>Go to Bulk Import</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxHeight: "70%",
    width: "90%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  subjectOption: {
    backgroundColor: "#F5F5F5",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#2E7D32",
  },
  subjectOptionName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  subjectOptionDetails: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  header: {
    backgroundColor: "#2E7D32",
    padding: 20,
    alignItems: "center",
  },
  changeSubjectButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: "flex-end",
    marginBottom: 10,
  },
  changeSubjectText: {
    color: "white",
    fontSize: 14,
  },
  subjectTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  subjectDetails: {
    fontSize: 14,
    color: "#C8E6C9",
    textAlign: "center",
    marginTop: 4,
  },
  dateHeader: {
    fontSize: 16,
    color: "#E8F5E9",
    textAlign: "center",
    marginTop: 8,
  },
  sessionControls: {
    backgroundColor: "white",
    padding: 16,
    elevation: 2,
    alignItems: "center",
  },
  startClassButton: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  startClassText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  sessionText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingVertical: 16,
    justifyContent: "space-around",
    elevation: 2,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  studentCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    marginVertical: 6,
    borderRadius: 12,
    elevation: 2,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  studentDetails: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  timestampText: {
    fontSize: 12,
    color: "#2E7D32",
    marginTop: 4,
    fontStyle: "italic",
  },
  attendanceButtons: {
    flexDirection: "row",
  },
  statusButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    borderWidth: 2,
  },
  presentButton: {
    borderColor: "#4CAF50",
    backgroundColor: "#E8F5E8",
  },
  absentButton: {
    borderColor: "#F44336",
    backgroundColor: "#FFEBEE",
  },
  lateButton: {
    borderColor: "#FF9800",
    backgroundColor: "#FFF3E0",
  },
  activeButton: {
    opacity: 1,
    elevation: 3,
    transform: [{ scale: 1.1 }],
  },
  buttonText: {
    color: "#333",
    fontWeight: "bold",
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#2E7D32",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    margin: 16,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: "#AAA",
  },
  saveButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  noSubjectContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  noSubjectTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 16,
  },
  noSubjectText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginBottom: 24,
  },
  goToBulkImportButton: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  goToBulkImportText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
