// src/screens/ReportsScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ReportsScreen() {
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [selectedView, setSelectedView] = useState("overview");

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    setRefreshing(true);
    try {
      const [logsData, studentsData, subjectsData] = await Promise.all([
        AsyncStorage.getItem("attendanceLogs"),
        AsyncStorage.getItem("students"),
        AsyncStorage.getItem("subjects"),
      ]);

      setAttendanceLogs(logsData ? JSON.parse(logsData) : []);
      setStudents(studentsData ? JSON.parse(studentsData) : []);
      setSubjects(subjectsData ? JSON.parse(subjectsData) : []);
    } catch (error) {
      console.log("Error loading report data:", error);
    }
    setRefreshing(false);
  };

  const getFilteredLogs = () => {
    const periodDays =
      selectedPeriod === "week" ? 7 : selectedPeriod === "month" ? 30 : 365;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodDays);

    return attendanceLogs.filter((log) => {
      const logDate = new Date(log.date);
      return logDate >= cutoffDate;
    });
  };

  const getOverallStats = () => {
    const filteredLogs = getFilteredLogs();
    const totalClasses = filteredLogs.length;
    const totalStudents = students.length;

    let totalPresent = 0;
    let totalPossible = 0;

    filteredLogs.forEach((log) => {
      Object.values(log.attendance).forEach((attendanceRecord) => {
        totalPossible++;
        const status =
          typeof attendanceRecord === "string"
            ? attendanceRecord
            : attendanceRecord.status;
        if (status === "present") totalPresent++;
      });
    });

    const overallPercentage =
      totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0;

    return {
      totalClasses,
      totalStudents,
      overallPercentage,
      totalPresent,
      totalPossible,
    };
  };

  const getSubjectStats = () => {
    const filteredLogs = getFilteredLogs();
    const subjectStats = {};

    subjects.forEach((subject) => {
      subjectStats[subject.id] = {
        id: subject.id,
        name: subject.name,
        faculty: subject.faculty,
        day: subject.day,
        time: subject.time,
        totalClasses: 0,
        totalPresent: 0,
        totalPossible: 0,
        lateStarts: 0,
      };
    });

    filteredLogs.forEach((log) => {
      if (subjectStats[log.subjectId]) {
        subjectStats[log.subjectId].totalClasses++;

        // Check for late starts
        if (log.startTime) {
          const startTime = new Date(log.startTime);
          const scheduledTime = log.scheduledTime;
          if (scheduledTime) {
            const [scheduledStartTime] = scheduledTime.split("-");
            const [hours, minutes] = scheduledStartTime.split(":").map(Number);
            const scheduledStart = new Date(startTime);
            scheduledStart.setHours(hours, minutes, 0, 0);

            if (startTime > scheduledStart) {
              subjectStats[log.subjectId].lateStarts++;
            }
          }
        }

        Object.values(log.attendance).forEach((attendanceRecord) => {
          subjectStats[log.subjectId].totalPossible++;
          const status =
            typeof attendanceRecord === "string"
              ? attendanceRecord
              : attendanceRecord.status;
          if (status === "present") {
            subjectStats[log.subjectId].totalPresent++;
          }
        });
      }
    });

    return Object.values(subjectStats).filter((stat) => stat.totalClasses > 0);
  };

  const getStudentStats = () => {
    const filteredLogs = getFilteredLogs();
    const studentStats = {};

    students.forEach((student) => {
      studentStats[student.id] = {
        id: student.id,
        name: student.name,
        rollNumber: student.rollNumber,
        className: student.className,
        totalPresent: 0,
        totalAbsent: 0,
        totalLate: 0,
        totalClasses: 0,
      };
    });

    filteredLogs.forEach((log) => {
      Object.entries(log.attendance).forEach(
        ([studentId, attendanceRecord]) => {
          if (studentStats[studentId]) {
            studentStats[studentId].totalClasses++;
            const status =
              typeof attendanceRecord === "string"
                ? attendanceRecord
                : attendanceRecord.status;

            if (status === "present") studentStats[studentId].totalPresent++;
            else if (status === "absent") studentStats[studentId].totalAbsent++;
            else if (status === "late") studentStats[studentId].totalLate++;
          }
        }
      );
    });

    return Object.values(studentStats)
      .filter((stat) => stat.totalClasses > 0)
      .sort((a, b) => {
        const aPercentage =
          a.totalClasses > 0 ? (a.totalPresent / a.totalClasses) * 100 : 0;
        const bPercentage =
          b.totalClasses > 0 ? (b.totalPresent / b.totalClasses) * 100 : 0;
        return bPercentage - aPercentage;
      });
  };

  const renderOverview = () => {
    const overallStats = getOverallStats();

    return (
      <ScrollView>
        {/* Overall Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{overallStats.totalClasses}</Text>
              <Text style={styles.statLabel}>Classes Held</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {overallStats.totalStudents}
              </Text>
              <Text style={styles.statLabel}>Total Students</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {overallStats.overallPercentage}%
              </Text>
              <Text style={styles.statLabel}>Avg Attendance</Text>
            </View>
          </View>
        </View>

        {/* Recent Classes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Classes</Text>
          {getFilteredLogs()
            .slice(-5)
            .reverse()
            .map((log, index) => (
              <View key={index} style={styles.recentClassCard}>
                <View style={styles.classHeader}>
                  <Text style={styles.className}>{log.subjectName}</Text>
                  <Text style={styles.classDate}>{log.date}</Text>
                </View>
                <Text style={styles.classDetails}>
                  Faculty: {log.faculty} • Students: {log.totalStudents}
                </Text>
                <Text style={styles.classStats}>
                  Present:{" "}
                  {
                    Object.values(log.attendance).filter(
                      (a) =>
                        (typeof a === "string" ? a : a.status) === "present"
                    ).length
                  }{" "}
                  / {Object.keys(log.attendance).length} marked
                </Text>
              </View>
            ))}
        </View>
      </ScrollView>
    );
  };

  const renderSubjectStats = () => {
    const subjectStats = getSubjectStats();

    return (
      <FlatList
        data={subjectStats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const percentage =
            item.totalPossible > 0
              ? Math.round((item.totalPresent / item.totalPossible) * 100)
              : 0;

          return (
            <View style={styles.subjectStatCard}>
              <View style={styles.subjectHeader}>
                <Text style={styles.subjectStatName}>{item.name}</Text>
                <Text style={styles.subjectStatPercentage}>{percentage}%</Text>
              </View>
              <Text style={styles.subjectStatDetails}>
                Faculty: {item.faculty} • {item.day} • {item.time}
              </Text>
              <Text style={styles.subjectStatInfo}>
                Classes: {item.totalClasses} • Late Starts: {item.lateStarts}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${percentage}%`,
                      backgroundColor:
                        percentage >= 75
                          ? "#4CAF50"
                          : percentage >= 50
                          ? "#FF9800"
                          : "#F44336",
                    },
                  ]}
                />
              </View>
            </View>
          );
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadReportData} />
        }
      />
    );
  };

  const renderStudentStats = () => {
    const studentStats = getStudentStats();

    return (
      <FlatList
        data={studentStats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const percentage =
            item.totalClasses > 0
              ? Math.round((item.totalPresent / item.totalClasses) * 100)
              : 0;

          return (
            <View style={styles.studentStatCard}>
              <View style={styles.studentHeader}>
                <Text style={styles.studentStatName}>{item.name}</Text>
                <Text style={styles.studentStatPercentage}>{percentage}%</Text>
              </View>
              <Text style={styles.studentStatDetails}>
                Roll: {item.rollNumber} • {item.className}
              </Text>
              <Text style={styles.studentStatInfo}>
                Present: {item.totalPresent} • Absent: {item.totalAbsent} •
                Late: {item.totalLate}
              </Text>
              <Text style={styles.studentStatTotal}>
                Total Classes: {item.totalClasses}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${percentage}%`,
                      backgroundColor:
                        percentage >= 75
                          ? "#4CAF50"
                          : percentage >= 50
                          ? "#FF9800"
                          : "#F44336",
                    },
                  ]}
                />
              </View>
            </View>
          );
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadReportData} />
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[
            styles.periodButton,
            selectedPeriod === "week" && styles.selectedPeriod,
          ]}
          onPress={() => setSelectedPeriod("week")}
        >
          <Text
            style={[
              styles.periodText,
              selectedPeriod === "week" && styles.selectedPeriodText,
            ]}
          >
            Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.periodButton,
            selectedPeriod === "month" && styles.selectedPeriod,
          ]}
          onPress={() => setSelectedPeriod("month")}
        >
          <Text
            style={[
              styles.periodText,
              selectedPeriod === "month" && styles.selectedPeriodText,
            ]}
          >
            Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.periodButton,
            selectedPeriod === "year" && styles.selectedPeriod,
          ]}
          onPress={() => setSelectedPeriod("year")}
        >
          <Text
            style={[
              styles.periodText,
              selectedPeriod === "year" && styles.selectedPeriodText,
            ]}
          >
            Year
          </Text>
        </TouchableOpacity>
      </View>

      {/* View Selector */}
      <View style={styles.viewSelector}>
        <TouchableOpacity
          style={[
            styles.viewButton,
            selectedView === "overview" && styles.selectedView,
          ]}
          onPress={() => setSelectedView("overview")}
        >
          <Text
            style={[
              styles.viewText,
              selectedView === "overview" && styles.selectedViewText,
            ]}
          >
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.viewButton,
            selectedView === "subjects" && styles.selectedView,
          ]}
          onPress={() => setSelectedView("subjects")}
        >
          <Text
            style={[
              styles.viewText,
              selectedView === "subjects" && styles.selectedViewText,
            ]}
          >
            Subjects
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.viewButton,
            selectedView === "students" && styles.selectedView,
          ]}
          onPress={() => setSelectedView("students")}
        >
          <Text
            style={[
              styles.viewText,
              selectedView === "students" && styles.selectedViewText,
            ]}
          >
            Students
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {selectedView === "overview" && renderOverview()}
      {selectedView === "subjects" && renderSubjectStats()}
      {selectedView === "students" && renderStudentStats()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  periodSelector: {
    flexDirection: "row",
    backgroundColor: "white",
    margin: 16,
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  selectedPeriod: {
    backgroundColor: "#2E7D32",
  },
  periodText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  selectedPeriodText: {
    color: "white",
    fontWeight: "600",
  },
  viewSelector: {
    flexDirection: "row",
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  selectedView: {
    backgroundColor: "#2E7D32",
  },
  viewText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  selectedViewText: {
    color: "white",
    fontWeight: "600",
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  statsGrid: {
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
    color: "#2E7D32",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  recentClassCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  classHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  className: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  classDate: {
    fontSize: 14,
    color: "#2E7D32",
  },
  classDetails: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  classStats: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  subjectStatCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
  },
  subjectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subjectStatName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  subjectStatPercentage: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  subjectStatDetails: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  subjectStatInfo: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  studentStatCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
  },
  studentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  studentStatName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  studentStatPercentage: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  studentStatDetails: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  studentStatInfo: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  studentStatTotal: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    marginBottom: 12,
  },
});
