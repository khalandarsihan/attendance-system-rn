// src/screens/TeacherReportsScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function TeacherReportsScreen({ route }) {
  const { faculty, facultyName } = route.params;
  const [mySubjects, setMySubjects] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("week");

  useEffect(() => {
    loadTeacherReports();
  }, []);

  const loadTeacherReports = async () => {
    setRefreshing(true);
    try {
      // Load faculty subjects
      const subjectsData = await AsyncStorage.getItem("subjects");
      if (subjectsData) {
        const allSubjects = JSON.parse(subjectsData);
        const facultySubjects = allSubjects.filter(
          (subject) => subject.faculty === faculty
        );
        setMySubjects(facultySubjects);
      }

      // Load attendance logs for this faculty
      const logsData = await AsyncStorage.getItem("attendanceLogs");
      if (logsData) {
        const allLogs = JSON.parse(logsData);
        const facultyLogs = allLogs.filter((log) => log.faculty === faculty);
        setAttendanceLogs(facultyLogs);
      }
    } catch (error) {
      console.log("Error loading teacher reports:", error);
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

  const getSubjectStats = () => {
    const filteredLogs = getFilteredLogs();
    const subjectStats = {};

    mySubjects.forEach((subject) => {
      subjectStats[subject.id] = {
        id: subject.id,
        name: subject.name,
        day: subject.day,
        time: subject.time,
        totalClasses: 0,
        totalDuration: 0,
        scheduledDuration: 0,
        averageAttendance: 0,
        lateStarts: 0,
        shortClasses: 0,
      };
    });

    filteredLogs.forEach((log) => {
      if (subjectStats[log.subjectId]) {
        const stat = subjectStats[log.subjectId];
        stat.totalClasses++;

        // Duration tracking
        if (log.actualDuration) {
          stat.totalDuration += log.actualDuration;
        }
        if (log.classSession?.scheduledDuration) {
          stat.scheduledDuration += log.classSession.scheduledDuration;
        }

        // Late starts and short classes
        if (log.classSession?.isLateStart) {
          stat.lateStarts++;
        }
        if (log.classSession?.isShortClass) {
          stat.shortClasses++;
        }

        // Attendance percentage
        const presentCount = Object.values(log.attendance).filter(
          (a) => (typeof a === "string" ? a : a.status) === "present"
        ).length;
        const totalMarked = Object.keys(log.attendance).length;
        if (totalMarked > 0) {
          stat.averageAttendance += (presentCount / totalMarked) * 100;
        }
      }
    });

    // Calculate averages
    Object.values(subjectStats).forEach((stat) => {
      if (stat.totalClasses > 0) {
        stat.averageAttendance = Math.round(
          stat.averageAttendance / stat.totalClasses
        );
        stat.averageDuration = Math.round(
          stat.totalDuration / stat.totalClasses
        );
        stat.scheduledAverage = Math.round(
          stat.scheduledDuration / stat.totalClasses
        );
        stat.efficiency =
          stat.scheduledAverage > 0
            ? Math.round((stat.averageDuration / stat.scheduledAverage) * 100)
            : 0;
      }
    });

    return Object.values(subjectStats).filter((stat) => stat.totalClasses > 0);
  };

  const getOverallStats = () => {
    const filteredLogs = getFilteredLogs();
    const totalClasses = filteredLogs.length;

    let totalDuration = 0;
    let totalScheduled = 0;
    let totalLateStarts = 0;
    let totalShortClasses = 0;
    let totalAttendancePercentage = 0;

    filteredLogs.forEach((log) => {
      if (log.actualDuration) totalDuration += log.actualDuration;
      if (log.classSession?.scheduledDuration)
        totalScheduled += log.classSession.scheduledDuration;
      if (log.classSession?.isLateStart) totalLateStarts++;
      if (log.classSession?.isShortClass) totalShortClasses++;

      const presentCount = Object.values(log.attendance).filter(
        (a) => (typeof a === "string" ? a : a.status) === "present"
      ).length;
      const totalMarked = Object.keys(log.attendance).length;
      if (totalMarked > 0) {
        totalAttendancePercentage += (presentCount / totalMarked) * 100;
      }
    });

    return {
      totalClasses,
      averageDuration:
        totalClasses > 0 ? Math.round(totalDuration / totalClasses) : 0,
      averageScheduled:
        totalClasses > 0 ? Math.round(totalScheduled / totalClasses) : 0,
      overallEfficiency:
        totalScheduled > 0
          ? Math.round((totalDuration / totalScheduled) * 100)
          : 0,
      punctualityRate:
        totalClasses > 0
          ? Math.round(((totalClasses - totalLateStarts) / totalClasses) * 100)
          : 100,
      completionRate:
        totalClasses > 0
          ? Math.round(
              ((totalClasses - totalShortClasses) / totalClasses) * 100
            )
          : 100,
      averageAttendance:
        totalClasses > 0
          ? Math.round(totalAttendancePercentage / totalClasses)
          : 0,
    };
  };

  const subjectStats = getSubjectStats();
  const overallStats = getOverallStats();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadTeacherReports}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.facultyName}>{facultyName}</Text>
          <Text style={styles.facultyCode}>Faculty Code: {faculty}</Text>
        </View>

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

        {/* Overall Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall Performance</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{overallStats.totalClasses}</Text>
              <Text style={styles.statLabel}>Classes Held</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {overallStats.overallEfficiency}%
              </Text>
              <Text style={styles.statLabel}>Time Efficiency</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {overallStats.averageAttendance}%
              </Text>
              <Text style={styles.statLabel}>Avg Attendance</Text>
            </View>
          </View>

          <View style={styles.performanceMetrics}>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Punctuality Rate:</Text>
              <Text
                style={[
                  styles.metricValue,
                  {
                    color:
                      overallStats.punctualityRate >= 90
                        ? "#4CAF50"
                        : "#FF9800",
                  },
                ]}
              >
                {overallStats.punctualityRate}%
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Class Completion Rate:</Text>
              <Text
                style={[
                  styles.metricValue,
                  {
                    color:
                      overallStats.completionRate >= 90 ? "#4CAF50" : "#FF9800",
                  },
                ]}
              >
                {overallStats.completionRate}%
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Average Duration:</Text>
              <Text style={styles.metricValue}>
                {overallStats.averageDuration} / {overallStats.averageScheduled}{" "}
                min
              </Text>
            </View>
          </View>
        </View>

        {/* Subject-wise Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subject-wise Performance</Text>
          {subjectStats.map((subject, index) => (
            <View key={index} style={styles.subjectCard}>
              <View style={styles.subjectHeader}>
                <Text style={styles.subjectName}>{subject.name}</Text>
                <Text style={styles.subjectEfficiency}>
                  {subject.efficiency}%
                </Text>
              </View>

              <Text style={styles.subjectSchedule}>
                {subject.day} • {subject.time}
              </Text>

              <View style={styles.subjectMetrics}>
                <Text style={styles.subjectMetric}>
                  Classes: {subject.totalClasses}
                </Text>
                <Text style={styles.subjectMetric}>
                  Avg Duration: {subject.averageDuration}min
                </Text>
                <Text style={styles.subjectMetric}>
                  Attendance: {subject.averageAttendance}%
                </Text>
              </View>

              <View style={styles.subjectIssues}>
                {subject.lateStarts > 0 && (
                  <Text style={styles.issueText}>
                    Late starts: {subject.lateStarts}
                  </Text>
                )}
                {subject.shortClasses > 0 && (
                  <Text style={styles.issueText}>
                    Short classes: {subject.shortClasses}
                  </Text>
                )}
              </View>

              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${subject.efficiency}%`,
                      backgroundColor:
                        subject.efficiency >= 90
                          ? "#4CAF50"
                          : subject.efficiency >= 75
                          ? "#FF9800"
                          : "#F44336",
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Performance Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Insights</Text>
          <View style={styles.tipsContainer}>
            {overallStats.punctualityRate < 90 && (
              <View style={styles.tipCard}>
                <Text style={styles.tipText}>
                  Consider setting reminders to improve class start punctuality
                </Text>
              </View>
            )}
            {overallStats.completionRate < 90 && (
              <View style={styles.tipCard}>
                <Text style={styles.tipText}>
                  Focus on completing full scheduled class duration
                </Text>
              </View>
            )}
            {overallStats.averageAttendance < 75 && (
              <View style={styles.tipCard}>
                <Text style={styles.tipText}>
                  Student engagement strategies may help improve attendance
                </Text>
              </View>
            )}
            {overallStats.overallEfficiency >= 95 && (
              <View style={[styles.tipCard, styles.successTip]}>
                <Text style={styles.successText}>
                  Excellent time management! Keep up the great work.
                </Text>
              </View>
            )}
          </View>
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
    backgroundColor: "#2E7D32",
    padding: 20,
    alignItems: "center",
  },
  facultyName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  facultyCode: {
    fontSize: 14,
    color: "#C8E6C9",
    marginTop: 4,
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
    marginBottom: 16,
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
  performanceMetrics: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: "#333",
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  subjectCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  subjectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  subjectEfficiency: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  subjectSchedule: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  subjectMetrics: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  subjectMetric: {
    fontSize: 12,
    color: "#666",
  },
  subjectIssues: {
    flexDirection: "row",
    marginBottom: 12,
  },
  issueText: {
    fontSize: 12,
    color: "#FF5722",
    marginRight: 16,
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
  tipsContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  tipCard: {
    backgroundColor: "#FFF3E0",
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
    padding: 12,
    marginBottom: 8,
    borderRadius: 4,
  },
  successTip: {
    backgroundColor: "#E8F5E9",
    borderLeftColor: "#4CAF50",
  },
  tipText: {
    fontSize: 14,
    color: "#333",
  },
  successText: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "500",
  },
});
