// src/screens/TeacherAttendanceScreen.js - Fixed time format handling
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function TeacherAttendanceScreen({ route, navigation }) {
  const { subject, faculty } = route.params;
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [classSession, setClassSession] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [date] = useState(new Date().toISOString().split("T")[0]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadStudents();
    loadExistingSession();
  }, []);

  // Helper function to normalize time format
  const normalizeTimeFormat = (timeString) => {
    if (!timeString) return timeString;

    // Handle formats like "14.25-15.10 PM" or "14.25-15.10"
    let normalizedTime = timeString
      .replace(/\./g, ":") // Replace dots with colons
      .replace(/\s*(AM|PM)\s*$/i, ""); // Remove AM/PM

    return normalizedTime;
  };

  // Helper function to format delay in hours and minutes
  const formatDelay = (minutes) => {
    if (minutes < 60) {
      return `${minutes}min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours}h`;
      } else {
        return `${hours}h ${remainingMinutes}min`;
      }
    }
  };

  const loadStudents = async () => {
    try {
      const studentsData = await AsyncStorage.getItem("students");
      if (studentsData) {
        setStudents(JSON.parse(studentsData));
      }
    } catch (error) {
      console.log("Error loading students:", error);
    }
  };

  const loadExistingSession = async () => {
    try {
      const sessionKey = `session_${subject.id}_${date}`;
      const sessionData = await AsyncStorage.getItem(sessionKey);

      if (sessionData) {
        const session = JSON.parse(sessionData);
        setClassSession(session);

        // Load attendance for this session
        const attendanceKey = `attendance_${subject.id}_${date}`;
        const attendanceData = await AsyncStorage.getItem(attendanceKey);
        if (attendanceData) {
          const parsedData = JSON.parse(attendanceData);
          setAttendance(parsedData.attendance || {});
        }
      }
    } catch (error) {
      console.log("Error loading session:", error);
    }
  };

  const startClass = async () => {
    const startTime = new Date();
    const normalizedTime = normalizeTimeFormat(subject.time);

    // Calculate if starting late
    let isLate = false;
    let delayMinutes = 0;

    if (normalizedTime && normalizedTime.includes("-")) {
      try {
        const [scheduledStartTime] = normalizedTime.split("-");
        const [hours, minutes] = scheduledStartTime.split(":").map(Number);

        if (!isNaN(hours) && !isNaN(minutes)) {
          const scheduledStart = new Date();
          scheduledStart.setHours(hours, minutes, 0, 0);

          delayMinutes = Math.round((startTime - scheduledStart) / (1000 * 60));
          isLate = delayMinutes > 5;
        }
      } catch (error) {
        console.log("Error parsing time:", error);
      }
    }

    const session = {
      subjectId: subject.id,
      subjectName: subject.name,
      faculty,
      date,
      startTime: startTime.toISOString(),
      scheduledStartTime: startTime.toISOString(), // fallback
      isLateStart: isLate,
      delayMinutes: isLate ? delayMinutes : 0,
      scheduledDuration: getScheduledDuration(),
    };

    setClassSession(session);

    // Save session
    try {
      const sessionKey = `session_${subject.id}_${date}`;
      await AsyncStorage.setItem(sessionKey, JSON.stringify(session));
    } catch (error) {
      console.log("Error saving session:", error);
    }

    if (isLate && delayMinutes > 0) {
      Alert.alert(
        "Late Start Alert",
        `Class started ${formatDelay(delayMinutes)} late.\nScheduled: ${
          subject.time
        }\nActual: ${startTime.toLocaleTimeString()}`,
        [{ text: "OK" }]
      );
    } else {
      Alert.alert(
        "Class Started",
        `${subject.name} session started successfully!`
      );
    }
  };

  const endClass = async () => {
    if (!classSession) return;

    Alert.alert(
      "End Class",
      "Are you sure you want to end this class session?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "End Class", onPress: confirmEndClass },
      ]
    );
  };

  const confirmEndClass = async () => {
    const endTime = new Date();
    const startTime = new Date(classSession.startTime);
    const actualDuration = Math.round((endTime - startTime) / (1000 * 60));
    const scheduledDuration = classSession.scheduledDuration;
    const shortfall = scheduledDuration - actualDuration;

    const updatedSession = {
      ...classSession,
      endTime: endTime.toISOString(),
      actualDuration,
      shortfall: shortfall > 0 ? shortfall : 0,
      isShortClass: shortfall > 5,
      efficiency: Math.round((actualDuration / scheduledDuration) * 100),
    };

    setClassSession(updatedSession);

    // Save updated session
    try {
      const sessionKey = `session_${subject.id}_${date}`;
      await AsyncStorage.setItem(sessionKey, JSON.stringify(updatedSession));
    } catch (error) {
      console.log("Error saving session:", error);
    }

    // Show duration summary
    let message = `Class Duration Summary:\n\nScheduled: ${scheduledDuration} minutes\nActual: ${actualDuration} minutes\nEfficiency: ${updatedSession.efficiency}%`;

    if (updatedSession.isShortClass) {
      message += `\n\nWarning: Class was ${shortfall} minutes shorter than scheduled.`;
    }

    Alert.alert("Class Ended", message, [
      { text: "OK", onPress: () => navigation.goBack() },
    ]);
  };

  const getScheduledDuration = () => {
    const normalizedTime = normalizeTimeFormat(subject.time);

    if (!normalizedTime || !normalizedTime.includes("-")) {
      return 40; // Default 40 minutes if time format is invalid
    }

    try {
      const [startTime, endTime] = normalizedTime.split("-");
      const [startH, startM] = startTime.split(":").map(Number);
      const [endH, endM] = endTime.split(":").map(Number);

      if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) {
        return 40; // Default duration
      }

      return endH * 60 + endM - (startH * 60 + startM);
    } catch (error) {
      return 40; // Default duration
    }
  };

  const markAttendance = (studentId, status) => {
    const timestamp = new Date().toISOString();
    const updatedAttendance = {
      ...attendance,
      [studentId]: {
        status,
        timestamp,
        markedBy: faculty,
      },
    };
    setAttendance(updatedAttendance);
  };

  const saveAttendance = async () => {
    if (!classSession) {
      Alert.alert("Error", "Please start the class session first");
      return;
    }

    try {
      const attendanceData = {
        date,
        subjectId: subject.id,
        subjectName: subject.name,
        faculty,
        scheduledTime: subject.time,
        attendance,
        classSession,
        totalStudents: students.length,
        savedAt: new Date().toISOString(),
        actualDuration: classSession.actualDuration,
        efficiency: classSession.efficiency,
      };

      // Save attendance
      const attendanceKey = `attendance_${subject.id}_${date}`;
      await AsyncStorage.setItem(attendanceKey, JSON.stringify(attendanceData));

      // Update attendance logs
      const existingLogs = await AsyncStorage.getItem("attendanceLogs");
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      const filteredLogs = logs.filter(
        (log) => !(log.subjectId === subject.id && log.date === date)
      );
      filteredLogs.push(attendanceData);
      await AsyncStorage.setItem(
        "attendanceLogs",
        JSON.stringify(filteredLogs)
      );

      Alert.alert("Success", "Attendance saved successfully!");
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

  const getClassDuration = () => {
    if (!classSession || !classSession.startTime) return 0;
    const startTime = new Date(classSession.startTime);
    const endTime = classSession.endTime
      ? new Date(classSession.endTime)
      : currentTime;
    return Math.round((endTime - startTime) / (1000 * 60));
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
  const currentDuration = getClassDuration();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.subjectTitle}>{subject.name}</Text>
        <Text style={styles.subjectDetails}>
          Faculty: {faculty} • {subject.day} • {subject.time}
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
        {!classSession ? (
          <TouchableOpacity
            style={styles.startClassButton}
            onPress={startClass}
          >
            <Text style={styles.startClassText}>Start Class Session</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.sessionInfo}>
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionText}>
                Started: {formatTime(classSession.startTime)}
                {classSession.isLateStart && (
                  <Text style={styles.lateText}>
                    {" "}
                    ({formatDelay(classSession.delayMinutes)} late)
                  </Text>
                )}
              </Text>
              {!classSession.endTime && (
                <TouchableOpacity
                  style={styles.endClassButton}
                  onPress={endClass}
                >
                  <Text style={styles.endClassText}>End Class</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.durationInfo}>
              <Text style={styles.durationText}>
                Duration: {currentDuration} min /{" "}
                {classSession.scheduledDuration} min
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(
                        (currentDuration / classSession.scheduledDuration) *
                          100,
                        100
                      )}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.efficiencyText}>
                Efficiency:{" "}
                {Math.round(
                  (currentDuration / classSession.scheduledDuration) * 100
                )}
                %
              </Text>
            </View>

            {classSession.endTime && (
              <View style={styles.completedSession}>
                <Text style={styles.sessionText}>
                  Ended: {formatTime(classSession.endTime)}
                </Text>
                <Text style={styles.finalStats}>
                  Final Duration: {classSession.actualDuration} min •
                  Efficiency: {classSession.efficiency}%
                  {classSession.isShortClass && (
                    <Text style={styles.shortText}>
                      {" "}
                      • {formatDelay(classSession.shortfall)} short
                    </Text>
                  )}
                </Text>
              </View>
            )}
          </View>
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
        style={[styles.saveButton, !classSession && styles.disabledButton]}
        onPress={saveAttendance}
        disabled={!classSession}
      >
        <Text style={styles.saveButtonText}>Save Attendance</Text>
      </TouchableOpacity>
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
    padding: 20,
    alignItems: "center",
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
  },
  startClassButton: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  startClassText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  sessionInfo: {
    alignItems: "center",
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 16,
  },
  sessionText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  lateText: {
    color: "#FF5722",
    fontWeight: "600",
  },
  endClassButton: {
    backgroundColor: "#FF5722",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  endClassText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  durationInfo: {
    width: "100%",
    marginBottom: 16,
  },
  durationText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 4,
  },
  efficiencyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  completedSession: {
    width: "100%",
    padding: 16,
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
  },
  finalStats: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
    marginTop: 4,
  },
  shortText: {
    color: "#FF5722",
    fontWeight: "600",
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
});
