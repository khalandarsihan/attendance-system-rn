// src/screens/TeacherSubjectsScreen.js - Fixed with proper time sorting
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function TeacherSubjectsScreen({ route, navigation }) {
  const { facultyCode } = route.params;
  const [mySubjects, setMySubjects] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMySubjects();
  }, []);

  const loadMySubjects = async () => {
    setRefreshing(true);
    try {
      const subjectsData = await AsyncStorage.getItem("subjects");
      if (subjectsData) {
        const allSubjects = JSON.parse(subjectsData);
        const facultySubjects = allSubjects.filter(
          (subject) => subject.faculty === facultyCode
        );
        setMySubjects(facultySubjects);
      }
    } catch (error) {
      console.log("Error loading subjects:", error);
    }
    setRefreshing(false);
  };

  const startClass = (subject) => {
    navigation.navigate("TeacherAttendance", {
      subject,
      faculty: facultyCode,
    });
  };

  // Helper function to convert time string to minutes for sorting
  const timeToMinutes = (timeString) => {
    if (!timeString || !timeString.includes("-")) return 0;

    const [startTime] = timeString.split("-");
    const [hours, minutes] = startTime.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const renderSubject = ({ item }) => (
    <TouchableOpacity
      style={styles.subjectCard}
      onPress={() => startClass(item)}
    >
      <View style={styles.subjectInfo}>
        <Text style={styles.subjectName}>{item.name}</Text>
        <Text style={styles.subjectSchedule}>
          {item.day} • {item.time}
        </Text>
      </View>
      <View style={styles.actionSection}>
        <Text style={styles.actionText}>Tap to take attendance</Text>
        <Text style={styles.arrowText}>→</Text>
      </View>
    </TouchableOpacity>
  );

  const getSubjectsByDay = () => {
    const subjectsByDay = {};
    const daysOfWeek = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    daysOfWeek.forEach((day) => {
      subjectsByDay[day] = mySubjects
        .filter((subject) => subject.day === day)
        .sort((a, b) => {
          // Sort by time - earliest first
          const timeA = timeToMinutes(a.time);
          const timeB = timeToMinutes(b.time);
          return timeA - timeB;
        });
    });

    return subjectsByDay;
  };

  const subjectsByDay = getSubjectsByDay();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Subjects</Text>
        <Text style={styles.subtitle}>Faculty Code: {facultyCode}</Text>
        <Text style={styles.totalCount}>
          Total Subjects: {mySubjects.length}
        </Text>
      </View>

      <FlatList
        data={Object.keys(subjectsByDay)}
        keyExtractor={(item) => item}
        renderItem={({ item: day }) => (
          <View style={styles.daySection}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>{day}</Text>
              <Text style={styles.dayCount}>
                {subjectsByDay[day].length} classes
              </Text>
            </View>
            {subjectsByDay[day].length > 0 ? (
              <View style={styles.subjectsContainer}>
                {subjectsByDay[day].map((subject) => (
                  <TouchableOpacity
                    key={subject.id}
                    style={styles.subjectCard}
                    onPress={() => startClass(subject)}
                  >
                    <View style={styles.timeIndicator}>
                      <Text style={styles.timeText}>{subject.time}</Text>
                    </View>
                    <View style={styles.subjectInfo}>
                      <Text style={styles.subjectName}>{subject.name}</Text>
                      <Text style={styles.subjectDetails}>
                        Faculty: {subject.faculty} • {subject.day}
                      </Text>
                    </View>
                    <View style={styles.actionSection}>
                      <Text style={styles.actionText}>Take Attendance</Text>
                      <Text style={styles.arrowText}>→</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyDay}>
                <Text style={styles.emptyText}>No classes scheduled</Text>
              </View>
            )}
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadMySubjects} />
        }
        showsVerticalScrollIndicator={false}
      />
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
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  subtitle: {
    fontSize: 14,
    color: "#C8E6C9",
    marginTop: 4,
  },
  totalCount: {
    fontSize: 12,
    color: "#A5D6A7",
    marginTop: 4,
  },
  daySection: {
    margin: 16,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E7D32",
  },
  dayCount: {
    fontSize: 14,
    color: "#666",
  },
  subjectsContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    elevation: 2,
    overflow: "hidden",
  },
  subjectCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
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
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  subjectDetails: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  actionSection: {
    alignItems: "center",
    paddingLeft: 16,
  },
  actionText: {
    fontSize: 12,
    color: "#2E7D32",
    marginBottom: 4,
    fontWeight: "500",
  },
  arrowText: {
    fontSize: 18,
    color: "#2E7D32",
    fontWeight: "bold",
  },
  emptyDay: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    elevation: 1,
  },
  emptyText: {
    color: "#999",
    fontStyle: "italic",
  },
});
