// src/screens/DailySummaryScreen.js - Enhanced with Teacher Filter & Student Quick View
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
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function DailySummaryScreen({ navigation }) {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedTeacher, setSelectedTeacher] = useState("all");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTeacherPicker, setShowTeacherPicker] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [dateOptions, setDateOptions] = useState([]);
  const [searchStudent, setSearchStudent] = useState("");

  // Faculty list with full names
  const facultyList = [
    { code: "all", name: "All Teachers" },
    { code: "KS", name: "Khalandar Sihan Saqaufi" },
    { code: "MJ", name: "Muhammad Jamal Saqaufi" },
    { code: "JM", name: "Jaish Muhammad Saqaufi" },
    { code: "SH", name: "Muhammad Shakeel Sir" },
  ];

  useEffect(() => {
    loadDailyData();
    generateDateOptions();
  }, [selectedDate, selectedTeacher]);

  // Helper function to format delay in hours and minutes
  const formatDelay = (minutes) => {
    if (!minutes || minutes < 60) {
      return `${minutes || 0}min`;
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

  const generateDateOptions = () => {
    const options = [];
    const today = new Date();

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
      const [logsData, studentsData, subjectsData] = await Promise.all([
        AsyncStorage.getItem("attendanceLogs"),
        AsyncStorage.getItem("students"),
        AsyncStorage.getItem("subjects"),
      ]);

      const allLogs = logsData ? JSON.parse(logsData) : [];
      const allStudents = studentsData ? JSON.parse(studentsData) : [];
      const allSubjects = subjectsData ? JSON.parse(subjectsData) : [];

      // Filter logs by date and teacher
      let filteredLogs = allLogs.filter((log) => log.date === selectedDate);

      if (selectedTeacher !== "all") {
        filteredLogs = filteredLogs.filter(
          (log) => log.faculty === selectedTeacher
        );
      }

      setDailyLogs(filteredLogs);
      setStudents(allStudents);
      setSubjects(allSubjects);
    } catch (error) {
      console.log("Error loading daily data:", error);
    }
    setRefreshing(false);
  };

  const getTeacherName = (code) => {
    const teacher = facultyList.find((f) => f.code === code);
    return teacher ? teacher.name : code;
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
    const activeFaculty = [...new Set(dailyLogs.map((log) => log.faculty))]
      .length;

    let totalPresent = 0;
    let totalLate = 0;
    let totalAbsent = 0;
    let totalPossible = 0;
    let lateStarts = 0;
    let shortClasses = 0;

    dailyLogs.forEach((log) => {
      const stats = getAttendanceStats(log.attendance);
      totalPresent += stats.present;
      totalLate += stats.late;
      totalAbsent += stats.absent;
      totalPossible += stats.total;

      if (log.classSession?.isLateStart) lateStarts++;
      if (log.classSession?.isShortClass) shortClasses++;
    });

    return {
      totalClasses,
      activeFaculty,
      totalPresent,
      totalLate,
      totalAbsent,
      totalPossible,
      lateStarts,
      shortClasses,
      averageAttendance:
        totalPossible > 0
          ? Math.round((totalPresent / totalPossible) * 100)
          : 0,
    };
  };

  // NEW: Get student-wise attendance for selected date/teacher
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
          const status =
            typeof attendance === "string" ? attendance : attendance.status;
          const classInfo = {
            subjectName: log.subjectName,
            faculty: log.faculty,
            time: log.scheduledTime,
            status,
            timestamp:
              typeof attendance === "object" ? attendance.timestamp : null,
          };

          studentAttendance[studentId].classes.push(classInfo);
          studentAttendance[studentId].totalClasses++;

          if (status === "present") studentAttendance[studentId].totalPresent++;
          else if (status === "late") studentAttendance[studentId].totalLate++;
          else if (status === "absent")
            studentAttendance[studentId].totalAbsent++;
        }
      });
    });

    return Object.values(studentAttendance)
      .filter((student) => student.totalClasses > 0)
      .sort((a, b) => {
        const aPercentage =
          a.totalClasses > 0 ? (a.totalPresent / a.totalClasses) * 100 : 0;
        const bPercentage =
          b.totalClasses > 0 ? (b.totalPresent / b.totalClasses) * 100 : 0;
        return bPercentage - aPercentage;
      });
  };

  // NEW: Open student detail modal
  const openStudentModal = (student) => {
    setSelectedStudent(student);
    setShowStudentModal(true);
  };

  // NEW: Get filtered students for search - FIXED search logic with null checks
  const getFilteredStudents = () => {
    const studentData = getStudentAttendanceForDay();
    if (!searchStudent.trim()) return studentData;

    const searchTerm = searchStudent.toLowerCase().trim();

    return studentData.filter((student) => {
      const name = student.name ? student.name.toLowerCase() : "";
      const rollNumber = student.rollNumber
        ? student.rollNumber.toLowerCase()
        : "";
      const className = student.className
        ? student.className.toLowerCase()
        : "";

      return (
        name.includes(searchTerm) ||
        rollNumber.includes(searchTerm) ||
        className.includes(searchTerm)
      );
    });
  };

  const exportDailySummary = async () => {
    const overview = getDailyOverview();
    const studentData = getStudentAttendanceForDay();

    const exportData = {
      date: selectedDate,
      teacher:
        selectedTeacher === "all"
          ? "All Teachers"
          : getTeacherName(selectedTeacher),
      overview,
      classes: dailyLogs.map((log) => ({
        subjectName: log.subjectName,
        faculty: log.faculty,
        scheduledTime: log.scheduledTime,
        attendance: getAttendanceStats(log.attendance),
      })),
      students: studentData,
      exportedAt: new Date().toISOString(),
    };

    console.log("Daily Summary Export:", exportData);
    Alert.alert(
      "Export Complete",
      `Daily summary exported to console.\n\nDate: ${selectedDate}\nTeacher: ${exportData.teacher}\nClasses: ${overview.totalClasses}\nStudents: ${studentData.length}`,
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
          <Text style={styles.facultyName}>
            {getTeacherName(log.faculty)} ({log.faculty})
          </Text>
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
              {isLateStart &&
                ` (${formatDelay(log.classSession?.delayMinutes)} late)`}
            </Text>
          </View>
          <View style={styles.timingRow}>
            <Text style={styles.timingLabel}>Duration:</Text>
            <Text
              style={[styles.timingValue, isShortClass && styles.shortText]}
            >
              {log.actualDuration || 0} min
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
            Attendance:{" "}
            {stats.total > 0
              ? Math.round((stats.present / stats.total) * 100)
              : 0}
            %
          </Text>
        </View>
      </View>
    );
  };

  // NEW: Render student summary with tap to view details
  const renderStudentSummary = ({ item: student }) => {
    const attendancePercentage =
      student.totalClasses > 0
        ? Math.round((student.totalPresent / student.totalClasses) * 100)
        : 0;

    return (
      <TouchableOpacity
        style={styles.studentCard}
        onPress={() => openStudentModal(student)}
      >
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

        <Text style={styles.tapHint}>Tap to view details</Text>
      </TouchableOpacity>
    );
  };

  // NEW: Render student detail modal
  const renderStudentModal = () => {
    if (!selectedStudent) return null;

    const attendancePercentage =
      selectedStudent.totalClasses > 0
        ? Math.round(
            (selectedStudent.totalPresent / selectedStudent.totalClasses) * 100
          )
        : 0;

    return (
      <Modal
        visible={showStudentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStudentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.studentModalContent}>
            <View style={styles.studentModalHeader}>
              <Text style={styles.studentModalName}>
                {selectedStudent.name}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowStudentModal(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.studentModalInfo}>
              Roll: {selectedStudent.rollNumber} • {selectedStudent.className}
            </Text>

            <Text style={styles.studentModalDate}>
              {selectedDate} •{" "}
              {selectedTeacher === "all"
                ? "All Teachers"
                : getTeacherName(selectedTeacher)}
            </Text>

            <View style={styles.studentModalStats}>
              <View style={styles.modalStatCard}>
                <Text style={styles.modalStatNumber}>
                  {selectedStudent.totalPresent}
                </Text>
                <Text style={styles.modalStatLabel}>Present</Text>
              </View>
              <View style={styles.modalStatCard}>
                <Text style={styles.modalStatNumber}>
                  {selectedStudent.totalLate}
                </Text>
                <Text style={styles.modalStatLabel}>Late</Text>
              </View>
              <View style={styles.modalStatCard}>
                <Text style={styles.modalStatNumber}>
                  {selectedStudent.totalAbsent}
                </Text>
                <Text style={styles.modalStatLabel}>Absent</Text>
              </View>
              <View style={styles.modalStatCard}>
                <Text style={styles.modalStatNumber}>
                  {attendancePercentage}%
                </Text>
                <Text style={styles.modalStatLabel}>Rate</Text>
              </View>
            </View>

            <Text style={styles.classListTitle}>Class-wise Attendance:</Text>
            <FlatList
              data={selectedStudent.classes}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={styles.classAttendanceRow}>
                  <View style={styles.classAttendanceInfo}>
                    <Text style={styles.classAttendanceSubject}>
                      {item.subjectName}
                    </Text>
                    <Text style={styles.classAttendanceDetails}>
                      {item.faculty} • {item.time}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      item.status === "present" && styles.presentBadge,
                      item.status === "late" && styles.lateBadge,
                      item.status === "absent" && styles.absentBadge,
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>
                      {item.status === "present"
                        ? "PRESENT"
                        : item.status === "late"
                        ? "LATE"
                        : "ABSENT"}
                    </Text>
                  </View>
                </View>
              )}
              style={styles.classAttendanceList}
            />
          </View>
        </View>
      </Modal>
    );
  };

  const overview = getDailyOverview();
  const studentSummary = getFilteredStudents();

  return (
    <SafeAreaView style={styles.container}>
      {/* Enhanced Header with Teacher Filter */}
      <View style={styles.header}>
        <Text style={styles.title}>Daily Summary</Text>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.filterButtonText}>
              📅{" "}
              {new Date(selectedDate).toLocaleDateString("en", {
                month: "short",
                day: "numeric",
              })}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowTeacherPicker(true)}
          >
            <Text style={styles.filterButtonText}>
              👨‍🏫 {selectedTeacher === "all" ? "All" : selectedTeacher}
            </Text>
          </TouchableOpacity>
        </View>
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
                  <Text
                    style={[
                      styles.dateOptionText,
                      selectedDate === item.date && styles.selectedDateText,
                    ]}
                  >
                    {item.display}
                  </Text>
                  {item.isToday && <Text style={styles.todayBadge}>TODAY</Text>}
                </TouchableOpacity>
              )}
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

      {/* NEW: Teacher Picker Modal */}
      <Modal
        visible={showTeacherPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTeacherPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Teacher</Text>
            <FlatList
              data={facultyList}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.teacherOption,
                    selectedTeacher === item.code &&
                      styles.selectedTeacherOption,
                  ]}
                  onPress={() => {
                    setSelectedTeacher(item.code);
                    setShowTeacherPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.teacherOptionText,
                      selectedTeacher === item.code &&
                        styles.selectedTeacherText,
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text style={styles.teacherCodeText}>
                    {item.code === "all" ? "" : `Code: ${item.code}`}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowTeacherPicker(false)}
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
        {/* Enhanced Overview Stats */}
        <View style={styles.overviewSection}>
          <View style={styles.overviewHeader}>
            <Text style={styles.sectionTitle}>
              {selectedTeacher === "all"
                ? "All Teachers"
                : getTeacherName(selectedTeacher)}
            </Text>
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
              <Text style={styles.overviewNumber}>
                {overview.activeFaculty}
              </Text>
              <Text style={styles.overviewLabel}>Active Faculty</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewNumber}>
                {overview.averageAttendance}%
              </Text>
              <Text style={styles.overviewLabel}>Avg Attendance</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewNumber}>{overview.totalPresent}</Text>
              <Text style={styles.overviewLabel}>Total Present</Text>
            </View>
          </View>

          <View style={styles.issuesSection}>
            {overview.lateStarts > 0 && (
              <Text style={styles.issueText}>
                ⚠️ {overview.lateStarts} late starts
              </Text>
            )}
            {overview.shortClasses > 0 && (
              <Text style={styles.issueText}>
                ⏱️ {overview.shortClasses} short classes
              </Text>
            )}
            {overview.lateStarts === 0 &&
              overview.shortClasses === 0 &&
              overview.totalClasses > 0 && (
                <Text style={styles.successText}>
                  ✅ Perfect timing for all classes
                </Text>
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
              <Text style={styles.emptyText}>
                No classes found for{" "}
                {selectedTeacher === "all"
                  ? "any teacher"
                  : getTeacherName(selectedTeacher)}{" "}
                on this date
              </Text>
            </View>
          )}
        </View>

        {/* NEW: Enhanced Student Summary with Search */}
        <View style={styles.section}>
          <View style={styles.studentSectionHeader}>
            <Text style={styles.sectionTitle}>
              Student Attendance ({studentSummary.length})
            </Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search students..."
              value={searchStudent}
              onChangeText={setSearchStudent}
              clearButtonMode="while-editing"
              returnKeyType="search"
            />
          </View>

          {studentSummary.length > 0 ? (
            <FlatList
              data={studentSummary}
              keyExtractor={(item) => item.id}
              renderItem={renderStudentSummary}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {searchStudent.trim()
                  ? `No students found matching "${searchStudent}"`
                  : "No student attendance data"}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Student Detail Modal */}
      {renderStudentModal()}
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
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  filterButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 0.45,
    alignItems: "center",
  },
  filterButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
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
  teacherOption: {
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedTeacherOption: {
    backgroundColor: "#1565C0",
  },
  teacherOptionText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
  selectedTeacherText: {
    color: "white",
  },
  teacherCodeText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
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
  studentSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#DDD",
    flex: 0.4,
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
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  attendancePercentage: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4CAF50",
    textAlign: "center",
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
    marginBottom: 8,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    paddingVertical: 8,
  },
  studentStat: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  tapHint: {
    fontSize: 12,
    color: "#1565C0",
    fontStyle: "italic",
    textAlign: "center",
  },
  studentModalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    margin: 20,
    maxHeight: "90%",
    width: "95%",
  },
  studentModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  studentModalName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  closeButton: {
    backgroundColor: "#FF5722",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  studentModalInfo: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  studentModalDate: {
    fontSize: 14,
    color: "#1565C0",
    fontWeight: "500",
    marginBottom: 20,
  },
  studentModalStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalStatCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 2,
  },
  modalStatNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1565C0",
  },
  modalStatLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  classListTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  classAttendanceList: {
    maxHeight: 300,
  },
  classAttendanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  classAttendanceInfo: {
    flex: 1,
  },
  classAttendanceSubject: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  classAttendanceDetails: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 70,
    alignItems: "center",
  },
  presentBadge: {
    backgroundColor: "#4CAF50",
  },
  lateBadge: {
    backgroundColor: "#FF9800",
  },
  absentBadge: {
    backgroundColor: "#F44336",
  },
  statusBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  emptyState: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    elevation: 1,
  },
});
