// src/screens/TeacherSubjectsScreen.js
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
        .sort((a, b) => a.time.localeCompare(b.time));
    });

    return subjectsByDay;
  };

  const subjectsByDay = getSubjectsByDay();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Subjects</Text>
        <Text style={styles.subtitle}>Faculty Code: {facultyCode}</Text>
      </View>

      <FlatList
        data={Object.keys(subjectsByDay)}
        keyExtractor={(item) => item}
        renderItem={({ item: day }) => (
          <View style={styles.daySection}>
            <Text style={styles.dayTitle}>
              {day} ({subjectsByDay[day].length} classes)
            </Text>
            {subjectsByDay[day].length > 0 ? (
              <FlatList
                data={subjectsByDay[day]}
                keyExtractor={(subject) => subject.id}
                renderItem={renderSubject}
                scrollEnabled={false}
              />
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
  daySection: {
    margin: 16,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    backgroundColor: "#E8F5E9",
    padding: 12,
    borderRadius: 8,
  },
  subjectCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  subjectSchedule: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  actionSection: {
    alignItems: "center",
  },
  actionText: {
    fontSize: 12,
    color: "#2E7D32",
    marginBottom: 4,
  },
  arrowText: {
    fontSize: 18,
    color: "#2E7D32",
  },
  emptyDay: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    color: "#999",
    fontStyle: "italic",
  },
});
