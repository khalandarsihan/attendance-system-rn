// src/screens/DailySummaryScreen.js - Enhanced Daily Summary with Date Picker
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  Modal,
  FlatList,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function DailySummaryScreen({ navigation }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [dateOptions, setDateOptions] = useState([]);

  useEffect(() => {
    loadDailyData();
    generateDateOptions();
  }, [selectedDate]);

  const generateDateOptions = () => {
    const options = [];
    const today = new Date();
    
    // Generate last 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split("T")[0];
      const dayName = date.toLocaleDateString("en", { weekday: "long" });
      const formattedDate = date.toLocaleDateString("en", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      
      options.push({
        date: dateString,
        display: `${formattedDate} (${dayName})`,
        isToday: i === 0,
        isYesterday: i === 1,
      });
    }
    
    setDateOptions(options);
  };

  const loadDailyData = async () => {
    setRefreshing(true);
    try {
      // Load all data
      const [logsData, studentsData, subjectsData] = await Promise.all([
        AsyncStorage.getItem("attendanceLogs"),
        AsyncStorage.getItem("students"),
        AsyncStorage.getItem("subjects"),
      ]);

      const allLogs = logsData ? JSON.parse(logsData) : [];
      const allStudents = studentsData ? JSON.parse(studentsData) : [];
      const allSubjects = subjectsData ? JSON.parse(subjectsData) : [];

      // Filter logs for selected date
      const selectedDateLogs = allLogs.filter((log) => log.date === selectedDate);

      setDailyLogs(selectedDateLogs);
      setStudents(allStudents);
      setSubjects(allSubjects);
    } catch (error) {
      console.log("Error loading daily data:", error);
    }
    setRefreshing(false);
  };

  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    return new Date(timeString).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAttendanceStats = (attendance) => {
    const statuses = Object.values(attendance).map((item) =>
      typeof item === "string" ? item : item.status
    );
    
    return {
      present: statuses.filter((s) => s === "present").length,
      late: statuses.filter((s) => s === "late").length,
      absent: statuses.filter((s) => s === "absent").length,
      total: statuses.length,
    };
  };

  const getDailyOverview = () => {
    const totalClasses = dailyLogs.length;
    const totalScheduledMinutes = dailyLogs.reduce((sum, log) => {
      return sum + (log.classSession?.scheduledDuration || 0);
    }, 0);
    
    const totalActualMinutes = dailyLogs.reduce((sum, log) => {
      return sum + (log.actualDuration || 0);
    }, 0);

    let totalPresent = 0;
    let totalLate = 0;
    let totalAbsent = 0;
    let totalPossible = 0;

    dailyLogs.forEach((log) => {
      const stats = getAttendanceStats(log.attendance);
      totalPresent += stats.present;
      totalLate += stats.late;
      totalAbsent += stats.absent;
      totalPossible += stats.total;
    });

    const lateStarts = dailyLogs.filter((log) => log.classSession?.isLateStart).length;
    const shortClasses = dailyLogs.filter((log) => log.classSession?.isShortClass).length;

    return {
      totalClasses,
      totalScheduledMinutes,
      totalActualMinutes,
      totalPresent,
      totalLate,
      totalAbsent,
      totalPossible,
      lateStarts,
      shortClasses,
      averageAttendance: totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0,
      timeEfficiency: totalScheduledMinutes > 0 ? Math.round((totalActualMinutes / totalScheduledMinutes) * 100) : 0,
    };
  };

  const getStudentAttendanceForDay = () => {
    const studentAttendance = {};
    
    students.forEach((student) => {
      studentAttendance[student.id] = {
        ...student,
        classes: [],
        totalPresent: 0,
        totalLate: 0,
        totalAbsent: 0,
        totalClasses: 0,
      };
    });

    dailyLogs.forEach((log) => {
      Object.entries(log.attendance).forEach(([studentId, attendance]) => {
        if (studentAttendance[studentId]) {
          const status = typeof attendance === "string" ? attendance : attendance.status;
          const classInfo = {
            subjectName: log.subjectName,
            time: log.scheduledTime,
            status,
            timestamp: typeof attendance === "object" ? attendance.timestamp : null,
          };
          
          studentAttendance[studentId].classes.push(classInfo);
          studentAttendance[studentId].totalClasses++;
          
          if (status === "present") studentAttendance[studentId].totalPresent++;
          else if (status === "late") studentAttendance[studentId].totalLate++;
          else if (status === "absent") studentAttendance[studentId].totalAbsent++;
        }
      });
    });

    return Object.values(studentAttendance).filter((student) => student.totalClasses > 0);
  };

  const exportDailySummary = async () => {
    const overview = getDailyOverview();
    const studentData = getStudentAttendanceForDay();
    
    const exportData = {
      date: selectedDate,
      overview,
      classes: dailyLogs.map((log) => ({
        subjectName: log.subjectName,
        faculty: log.faculty,
        scheduledTime: log.scheduledTime,
        startTime: log.classSession?.startTime,
        endTime: log.classSession?.endTime,
        duration: log.actualDuration,
        attendance: getAttendanceStats(log.attendance),
      })),
      students: studentData,
      exportedAt: new Date().toISOString(),
    };

    // In a real app, you would export this to a file or share it
    console.log("Daily Summary Export:", exportData);
    Alert.alert(
      "Export Complete",
      `Daily summary for ${selectedDate} exported to console.\n\nClasses: ${overview.totalClasses}\nStudents: ${studentData.length}`,
      [{ text: "OK" }]
    );
  };

  const renderClassCard = ({ item: log }) => {
    const stats = getAttendanceStats(log.attendance);
    const isLateStart = log.classSession?.isLateStart;
    const isShortClass = log.classSession?.isShortClass;

    return (
      <View style={styles.classCard}>
        <View style={styles.classHeader}>
          <Text style={styles.className}>{log.subjectName}</Text>
          <Text style={styles.facultyName}>Faculty: {log.faculty}</Text>
        </View>

        <View style={styles.timingInfo}>
          <View style={styles.timingRow}>
            <Text style={styles.timingLabel}>Scheduled:</Text>
            <Text style={styles.timingValue}>{log.scheduledTime}</Text>
          </View>
          <View style={styles.timingRow}>
            <Text style={styles.timingLabel}>Started:</Text>
            <Text style={[styles.timingValue, isLateStart && styles.lateText]}>
              {formatTime(log.classSession?.startTime)}
              {isLateStart && ` (${log.classSession?.delayMinutes}min late)`}
            </Text>
          </View>
          <View style={styles.timingRow}>
            <Text style={styles.timingLabel}>Ended:</Text>
            <Text style={styles.timingValue}>
              {formatTime(log.classSession?.endTime)}
            </Text>
          </View>
          <View style={styles.timingRow}>
            <Text style={styles.timingLabel}>Duration:</Text>
            <Text style={[styles.timingValue, isShortClass && styles.shortText]}>
              {log.actualDuration || 0} min
              {log.classSession?.scheduledDuration && 
                ` / ${log.classSession.scheduledDuration} min`}
              {isShortClass && " (short)"}
            </Text>
          </View>
        </View>

        <View style={styles.attendanceGrid}>
          <View style={[styles.attendanceStat, styles.presentStat]}>
            <Text style={styles.attendanceNumber}>{stats.present}</Text>
            <Text style={styles.attendanceLabel}>Present</Text>
          </View>
          <View style={[styles.attendanceStat, styles.lateStat]}>
            <Text style={styles.attendanceNumber}>{stats.late}</Text>
            <Text style={styles.attendanceLabel}>Late</Text>
          </View>
          <View style={[styles.attendanceStat, styles.absentStat]}>
            <Text style={styles.attendanceNumber}>{stats.absent}</Text>
            <Text style={styles.attendanceLabel}>Absent</Text>
          </View>
          <View style={[styles.attendanceStat, styles.totalStat]}>
            <Text style={styles.attendanceNumber}>{stats.total}</Text>
            <Text style={styles.attendanceLabel}>Total</Text>
          </View>
        </View>

        <View style={styles.classFooter}>
          <Text style={styles.attendancePercentage}>
            Attendance: {stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%
          </Text>
          <Text style={styles.efficiency}>
            Efficiency: {log.classSession?.efficiency || 0}%
          </Text>
        </View>
      </View>
    );
  };

  const renderStudentSummary = ({ item: student }) => {
    const attendancePercentage = student.totalClasses > 0 
      ? Math.round((student.totalPresent / student.totalClasses) * 100) 
      : 0;

    return (
      <View style={styles.studentCard}>
        <View style={styles.studentHeader}>
          <Text style={styles.studentName}>{student.name}</Text>
          <Text style={styles.studentPercentage}>{attendancePercentage}%</Text>
        </View>
        
        <Text style={styles.studentDetails}>
          Roll: {student.rollNumber} • {student.className}
        </Text>

        <View style={styles.studentStats}>
          <Text style={styles.studentStat}>P: {student.totalPresent}</Text>
          <Text style={styles.studentStat}>L: {student.totalLate}</Text>
          <Text style={styles.studentStat}>A: {student.totalAbsent}</Text>
          <Text style={styles.studentStat}>Total: {student.totalClasses}</Text>
        </View>

        <View style={styles.studentClasses}>
          {student.classes.map((classInfo, index) => (
            <View key={index} style={styles.classAttendance}>
              <Text style={styles.classSubject}>{classInfo.subjectName}</Text>
              <Text style={styles.classTime}>{classInfo.time}</Text>
              <View style={[
                styles.statusIndicator, 
                classInfo.status === 'present' && styles.presentIndicator,
                classInfo.status === 'late' && styles.lateIndicator,
                classInfo.status === 'absent' && styles.absentIndicator,
              ]}>
                <Text style={styles.statusText}>
                  {classInfo.status.charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const overview = getDailyOverview();
  const studentSummary = getStudentAttendanceForDay();

  return (
    <SafeAreaView style={styles.container}>
      {/* Date Picker Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Daily Summary</Text>
        <TouchableOpacity
          style={styles.datePicker}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.datePickerText}>
            {new Date(selectedDate).toLocaleDateString("en", {
              year: "numeric",
              month: "short",
              day: "numeric",
              weekday: "short",
            })}
          </Text>
          <Text style={styles.changeText}>Change Date</Text>
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Date</Text>
            <FlatList
              data={dateOptions}
              keyExtractor={(item) => item.date}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dateOption,
                    selectedDate === item.date && styles.selectedDateOption,
                  ]}
                  onPress={() => {
                    setSelectedDate(item.date);
                    setShowDatePicker(false);
                  }}
                >
                  <Text style={[
                    styles.dateOptionText,
                    selectedDate === item.date && styles.selectedDateText,
                  ]}>
                    {item.display}
                  </Text>
                  {item.isToday && (
                    <Text style={styles.todayBadge}>TODAY</Text>
                  )}
                  {item.isYesterday && (
                    <Text style={styles.yesterdayBadge}>YESTERDAY</Text>
                  )}
                </TouchableOpacity>
              )}
              style={styles.dateList}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadDailyData} />
        }
      >
        {/* Overview Stats */}
        <View style={styles.overviewSection}>
          <View style={styles.overviewHeader}>
            <Text style={styles.sectionTitle}>Day Overview</Text>
            <TouchableOpacity
              style={styles.exportButton}
              onPress={exportDailySummary}
            >
              <Text style={styles.exportText}>Export</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.overviewGrid}>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewNumber}>{overview.totalClasses}</Text>
              <Text style={styles.overviewLabel}>Classes Held</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewNumber}>{overview.totalActualMinutes}</Text>
              <Text style={styles.overviewLabel}>Total Minutes</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewNumber}>{overview.averageAttendance}%</Text>
              <Text style={styles.overviewLabel}>Avg Attendance</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewNumber}>{overview.timeEfficiency}%</Text>
              <Text style={styles.overviewLabel}>Time Efficiency</Text>
            </View>
          </View>

          <View style={styles.issuesSection}>
            {overview.lateStarts > 0 && (
              <Text style={styles.issueText}>⚠️ {overview.lateStarts} late starts</Text>
            )}
            {overview.shortClasses > 0 && (
              <Text style={styles.issueText}>⏱️ {overview.shortClasses} short classes</Text>
            )}
            {overview.lateStarts === 0 && overview.shortClasses === 0 && (
              <Text style={styles.successText}>✅ Perfect timing for all classes</Text>
            )}
          </View>
        </View>

        {/* Classes Detail */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Classes Detail</Text>
          {dailyLogs.length > 0 ? (
            <FlatList
              data={dailyLogs}
              keyExtractor={(item, index) => `${item.subjectId}-${index}`}
              renderItem={renderClassCard}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No classes held on this date</Text>
            </View>
          )}
        </View>

        {/* Student Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Student Attendance Summary</Text>
          {studentSummary.length > 0 ? (
            <FlatList
              data={studentSummary}
              keyExtractor={(item) => item.id}
              renderItem={renderStudentSummary}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No student attendance data</Text>
            </View>
          )}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  datePicker: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  datePickerText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  changeText: {
    color: "#BBDEFB",
    fontSize: 12,
    marginTop: 2,
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
    padding: 20,
    margin: 20,
    maxHeight: "80%",
    width: "90%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  dateList: {
    maxHeight: 400,
  },
  dateOption: {
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectedDateOption: {
    backgroundColor: "#1565C0",
  },
  dateOptionText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  selectedDateText: {
    color: "white",
    fontWeight: "600",
  },
  todayBadge: {
    backgroundColor: "#4CAF50",
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  yesterdayBadge: {
    backgroundColor: "#FF9800",
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modalCloseButton: {
    backgroundColor: "#1565C0",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  modalCloseText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  overviewSection: {
    backgroundColor: "white",
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  overviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  exportButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  exportText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  overviewCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    width: "48%",
    marginBottom: 8,
  },
  overviewNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1565C0",
  },
  overviewLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  issuesSection: {
    marginTop: 8,
  },
  issueText: {
    fontSize: 14,
    color: "#FF5722",
    marginBottom: 4,
  },
  successText: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "500",
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
  },
  classHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  className: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  facultyName: {
    fontSize: 14,
    color: "#666",
  },
  timingInfo: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  timingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  timingLabel: {
    fontSize: 14,
    color: "#666",
    width: 80,
  },
  timingValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    flex: 1,
  },
  lateText: {
    color: "#FF5722",
  },
  shortText: {
    color: "#FF9800",
  },
  attendanceGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  attendanceStat: {
    alignItems: "center",
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
  },
  presentStat: {
    backgroundColor: "#E8F5E9",
  },
  lateStat: {
    backgroundColor: "#FFF3E0",
  },
  absentStat: {
    backgroundColor: "#FFEBEE",
  },
  totalStat: {
    backgroundColor: "#F3E5F5",
  },
  attendanceNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  attendanceLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  classFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  attendancePercentage: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4CAF50",
  },
  efficiency: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2196F3",
  },
  studentCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  studentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  studentPercentage: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  studentDetails: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  studentStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    paddingVertical: 8,
  },
  studentStat: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  studentClasses: {
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingTop: 12,
  },
  classAttendance: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  classSubject: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  classTime: {
    fontSize: 12,
    color: "#666",
    marginHorizontal: 8,
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  presentIndicator: {
    backgroundColor: "#4CAF50",
  },
  lateIndicator: {
    backgroundColor: "#FF9800",
  },
  absentIndicator: {
    backgroundColor: "#F44336",
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyState: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    elevation: 1,
  },
  emptyText: {
    color: "#999",
    fontSize: 16,
    textAlign: "center",
  },
});
