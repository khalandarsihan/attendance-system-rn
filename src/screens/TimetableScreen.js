// src/screens/TimetableScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function TimetableScreen() {
  const [subjects, setSubjects] = useState([]);
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const timeSlots = [
    "6:30-7:10",
    "7:15-7:55",
    "8:00-8:40",
    "9:30-10:10",
    "10:15-10:55",
    "11:00-11:40",
    "11:45-12:25",
    "13:40-14:20",
    "14:25-15:10",
    "15:15-15:55",
    "16:00-16:40",
  ];

  const facultyColors = {
    KS: "#2196F3",
    MJ: "#4CAF50",
    JM: "#FF9800",
    SH: "#9C27B0",
  };

  useEffect(() => {
    loadTimetable();

    // Update current time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Set today as default selected day
    const today = new Date().toLocaleDateString("en", { weekday: "long" });
    if (daysOfWeek.includes(today)) {
      setSelectedDay(today);
    }
  }, []);

  const loadTimetable = async () => {
    setRefreshing(true);
    try {
      const subjectsData = await AsyncStorage.getItem("subjects");
      if (subjectsData) {
        setSubjects(JSON.parse(subjectsData));
      }
    } catch (error) {
      console.log("Error loading timetable:", error);
    }
    setRefreshing(false);
  };

  const getSubjectForSlot = (day, timeSlot) => {
    return subjects.find(
      (subject) => subject.day === day && subject.time === timeSlot
    );
  };

  const isCurrentTimeSlot = (timeSlot) => {
    const [startTime, endTime] = timeSlot.split("-");
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    const slotStart = startHour * 60 + startMin;
    const slotEnd = endHour * 60 + endMin;
    const currentMinutes = currentHour * 60 + currentMin;

    return (
      selectedDay ===
        new Date().toLocaleDateString("en", { weekday: "long" }) &&
      currentMinutes >= slotStart &&
      currentMinutes <= slotEnd
    );
  };

  const getUpcomingClasses = () => {
    const today = new Date().toLocaleDateString("en", { weekday: "long" });
    const todaySubjects = subjects.filter((subject) => subject.day === today);

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return todaySubjects
      .filter((subject) => {
        const [startTime] = subject.time.split("-");
        const [hours, minutes] = startTime.split(":").map(Number);
        const subjectStartMinutes = hours * 60 + minutes;
        return subjectStartMinutes > currentMinutes;
      })
      .slice(0, 3);
  };

  const takeAttendanceForSubject = async (subject) => {
    // This would navigate to attendance screen with pre-selected subject
    Alert.alert("Take Attendance", `Start attendance for ${subject.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Start",
        onPress: () => {
          Alert.alert(
            "Feature",
            "This would navigate to attendance screen with this subject pre-selected."
          );
        },
      },
    ]);
  };

  const renderTimeSlot = (timeSlot) => {
    const subject = getSubjectForSlot(selectedDay, timeSlot);
    const isCurrentSlot = isCurrentTimeSlot(timeSlot);

    return (
      <View key={timeSlot} style={styles.timeSlotContainer}>
        <View
          style={[styles.timeColumn, isCurrentSlot && styles.currentTimeColumn]}
        >
          <Text
            style={[styles.timeText, isCurrentSlot && styles.currentTimeText]}
          >
            {timeSlot}
          </Text>
          {isCurrentSlot && <Text style={styles.nowIndicator}>NOW</Text>}
        </View>

        <TouchableOpacity
          style={[
            styles.subjectColumn,
            subject && {
              backgroundColor: facultyColors[subject.faculty] + "20",
              borderLeftColor: facultyColors[subject.faculty],
            },
            isCurrentSlot && styles.currentSubjectColumn,
          ]}
          onPress={() => subject && takeAttendanceForSubject(subject)}
          disabled={!subject}
        >
          {subject ? (
            <>
              <Text style={styles.subjectName}>{subject.name}</Text>
              <Text
                style={[
                  styles.facultyName,
                  { color: facultyColors[subject.faculty] },
                ]}
              >
                Faculty: {subject.faculty}
              </Text>
              {isCurrentSlot && (
                <Text style={styles.attendancePrompt}>
                  Tap to take attendance
                </Text>
              )}
            </>
          ) : (
            <Text style={styles.freeSlot}>Free Period</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const upcomingClasses = getUpcomingClasses();

  return (
    <SafeAreaView style={styles.container}>
      {/* Day Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.daySelector}
        contentContainerStyle={styles.daySelectorContent}
      >
        {daysOfWeek.map((day) => {
          const isToday =
            day === new Date().toLocaleDateString("en", { weekday: "long" });
          return (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayButton,
                selectedDay === day && styles.selectedDayButton,
                isToday && styles.todayButton,
              ]}
              onPress={() => setSelectedDay(day)}
            >
              <Text
                style={[
                  styles.dayButtonText,
                  selectedDay === day && styles.selectedDayButtonText,
                  isToday && styles.todayButtonText,
                ]}
              >
                {day}
              </Text>
              {isToday && <Text style={styles.todayIndicator}>TODAY</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Upcoming Classes (only show for today) */}
      {selectedDay ===
        new Date().toLocaleDateString("en", { weekday: "long" }) &&
        upcomingClasses.length > 0 && (
          <View style={styles.upcomingSection}>
            <Text style={styles.upcomingTitle}>Upcoming Classes</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {upcomingClasses.map((subject, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.upcomingCard,
                    { borderLeftColor: facultyColors[subject.faculty] },
                  ]}
                  onPress={() => takeAttendanceForSubject(subject)}
                >
                  <Text style={styles.upcomingSubject}>{subject.name}</Text>
                  <Text style={styles.upcomingTime}>{subject.time}</Text>
                  <Text style={styles.upcomingFaculty}>{subject.faculty}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

      {/* Timetable */}
      <ScrollView
        style={styles.timetableContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadTimetable} />
        }
      >
        <View style={styles.timetableHeader}>
          <Text style={styles.timetableTitle}>{selectedDay} Schedule</Text>
          <Text style={styles.currentTimeDisplay}>
            {currentTime.toLocaleTimeString("en-US", {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>

        {timeSlots.map(renderTimeSlot)}

        {/* Faculty Legend */}
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Faculty Legend</Text>
          <View style={styles.legendGrid}>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendColor,
                  { backgroundColor: facultyColors.KS },
                ]}
              />
              <Text style={styles.legendText}>
                KS - Khalandar Sihan Saqaufi
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendColor,
                  { backgroundColor: facultyColors.MJ },
                ]}
              />
              <Text style={styles.legendText}>MJ - Muhammad Jamal Saqaufi</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendColor,
                  { backgroundColor: facultyColors.JM },
                ]}
              />
              <Text style={styles.legendText}>JM - Jaish Muhammad Saqaufi</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendColor,
                  { backgroundColor: facultyColors.SH },
                ]}
              />
              <Text style={styles.legendText}>SH - Muhammad Shakeel Sir</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <Text style={styles.quickStatsTitle}>{selectedDay} Summary</Text>
          <Text style={styles.quickStatsText}>
            Total Classes:{" "}
            {subjects.filter((s) => s.day === selectedDay).length}
          </Text>
          <Text style={styles.quickStatsText}>
            Faculty Teaching:{" "}
            {
              [
                ...new Set(
                  subjects
                    .filter((s) => s.day === selectedDay)
                    .map((s) => s.faculty)
                ),
              ].length
            }
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
  daySelector: {
    backgroundColor: "white",
    paddingVertical: 15,
    elevation: 2,
  },
  daySelectorContent: {
    paddingHorizontal: 16,
  },
  dayButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
  },
  selectedDayButton: {
    backgroundColor: "#2E7D32",
  },
  todayButton: {
    borderWidth: 2,
    borderColor: "#FF9800",
  },
  dayButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  selectedDayButtonText: {
    color: "white",
    fontWeight: "600",
  },
  todayButtonText: {
    color: "#FF9800",
    fontWeight: "600",
  },
  todayIndicator: {
    fontSize: 10,
    color: "#FF9800",
    fontWeight: "bold",
    marginTop: 2,
  },
  upcomingSection: {
    backgroundColor: "white",
    padding: 16,
    elevation: 1,
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  upcomingCard: {
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
    borderLeftWidth: 4,
    minWidth: 120,
  },
  upcomingSubject: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  upcomingTime: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  upcomingFaculty: {
    fontSize: 12,
    color: "#2E7D32",
    marginTop: 2,
  },
  timetableContainer: {
    flex: 1,
  },
  timetableHeader: {
    backgroundColor: "white",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timetableTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  currentTimeDisplay: {
    fontSize: 16,
    color: "#2E7D32",
    fontWeight: "600",
  },
  timeSlotContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    marginBottom: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  timeColumn: {
    width: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  currentTimeColumn: {
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
  },
  timeText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  currentTimeText: {
    color: "#2E7D32",
    fontWeight: "bold",
  },
  nowIndicator: {
    fontSize: 10,
    color: "#2E7D32",
    fontWeight: "bold",
    marginTop: 2,
  },
  subjectColumn: {
    flex: 1,
    paddingLeft: 16,
    justifyContent: "center",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderLeftWidth: 4,
    borderLeftColor: "transparent",
  },
  currentSubjectColumn: {
    backgroundColor: "#E8F5E9",
  },
  subjectName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  facultyName: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  attendancePrompt: {
    fontSize: 12,
    color: "#2E7D32",
    fontStyle: "italic",
    marginTop: 4,
  },
  freeSlot: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
  legendContainer: {
    backgroundColor: "white",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  legendGrid: {
    flexDirection: "column",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  legendText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  quickStats: {
    backgroundColor: "white",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  quickStatsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  quickStatsText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
});
