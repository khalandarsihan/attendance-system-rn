// src/screens/SubjectManagementScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Modal,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SubjectManagementScreen() {
  const [subjects, setSubjects] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [newSubject, setNewSubject] = useState({
    name: "",
    faculty: "",
    day: "",
    time: "",
  });

  const facultyList = [
    { code: "KS", name: "Khalandar Sihan Saqaufi" },
    { code: "MJ", name: "Muhammad Jamal Saqaufi" },
    { code: "JM", name: "Jaish Muhammad Saqaufi" },
    { code: "SH", name: "Muhammad Shakeel Sir" },
  ];

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const commonTimeSlots = [
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

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const subjectsData = await AsyncStorage.getItem("subjects");
      if (subjectsData) {
        setSubjects(JSON.parse(subjectsData));
      }
    } catch (error) {
      console.log("Error loading subjects:", error);
    }
  };

  const addOrUpdateSubject = async () => {
    if (!newSubject.name.trim() || !newSubject.faculty) {
      Alert.alert("Error", "Please fill in subject name and select faculty");
      return;
    }

    // Check for time conflicts
    const conflictingSubject = subjects.find(
      (subject) =>
        subject.day === newSubject.day &&
        subject.time === newSubject.time &&
        subject.faculty === newSubject.faculty &&
        (!editingSubject || subject.id !== editingSubject.id)
    );

    if (conflictingSubject) {
      Alert.alert(
        "Time Conflict",
        `${newSubject.faculty} already has ${conflictingSubject.name} scheduled at ${newSubject.day} ${newSubject.time}`,
        [{ text: "OK" }]
      );
      return;
    }

    try {
      let updatedSubjects;

      if (editingSubject) {
        // Update existing subject
        updatedSubjects = subjects.map((subject) =>
          subject.id === editingSubject.id
            ? { ...subject, ...newSubject }
            : subject
        );
      } else {
        // Add new subject
        const subject = {
          id: Date.now().toString(),
          name: newSubject.name.trim(),
          faculty: newSubject.faculty,
          day: newSubject.day || "Monday",
          time: newSubject.time || "9:00-10:00",
          createdAt: new Date().toISOString(),
        };
        updatedSubjects = [...subjects, subject];
      }

      setSubjects(updatedSubjects);
      await AsyncStorage.setItem("subjects", JSON.stringify(updatedSubjects));

      resetForm();
      Alert.alert(
        "Success",
        `Subject ${editingSubject ? "updated" : "added"} successfully!`
      );
    } catch (error) {
      Alert.alert(
        "Error",
        `Failed to ${editingSubject ? "update" : "add"} subject`
      );
    }
  };

  const editSubject = (subject) => {
    setEditingSubject(subject);
    setNewSubject({
      name: subject.name,
      faculty: subject.faculty,
      day: subject.day,
      time: subject.time,
    });
    setShowAddModal(true);
  };

  const deleteSubject = async (subjectId) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this subject? This will also remove all associated attendance data.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const updatedSubjects = subjects.filter(
                (s) => s.id !== subjectId
              );
              setSubjects(updatedSubjects);
              await AsyncStorage.setItem(
                "subjects",
                JSON.stringify(updatedSubjects)
              );

              // Also clean up attendance data for this subject
              const attendanceLogs = await AsyncStorage.getItem(
                "attendanceLogs"
              );
              if (attendanceLogs) {
                const logs = JSON.parse(attendanceLogs);
                const filteredLogs = logs.filter(
                  (log) => log.subjectId !== subjectId
                );
                await AsyncStorage.setItem(
                  "attendanceLogs",
                  JSON.stringify(filteredLogs)
                );
              }
            } catch (error) {
              console.log("Error deleting subject:", error);
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setNewSubject({ name: "", faculty: "", day: "", time: "" });
    setEditingSubject(null);
    setShowAddModal(false);
  };

  const getFacultyName = (code) => {
    const faculty = facultyList.find((f) => f.code === code);
    return faculty ? faculty.name : code;
  };

  const getSubjectsByDay = () => {
    const subjectsByDay = {};
    daysOfWeek.forEach((day) => {
      subjectsByDay[day] = subjects
        .filter((subject) => subject.day === day)
        .sort((a, b) => {
          const aTime = a.time.split("-")[0];
          const bTime = b.time.split("-")[0];
          return aTime.localeCompare(bTime);
        });
    });
    return subjectsByDay;
  };

  const renderSubject = ({ item }) => (
    <View style={styles.subjectCard}>
      <View style={styles.subjectHeader}>
        <Text style={styles.subjectName}>{item.name}</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => editSubject(item)}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteSubject(item.id)}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.facultyText}>
        Faculty: {getFacultyName(item.faculty)} ({item.faculty})
      </Text>
      <Text style={styles.scheduleText}>
        {item.day} • {item.time}
      </Text>
    </View>
  );

  const renderDaySection = (day, daySubjects) => (
    <View key={day} style={styles.daySection}>
      <View style={styles.dayHeader}>
        <Text style={styles.dayTitle}>{day}</Text>
        <Text style={styles.dayCount}>{daySubjects.length} classes</Text>
      </View>
      {daySubjects.length > 0 ? (
        <FlatList
          data={daySubjects}
          keyExtractor={(item) => item.id}
          renderItem={renderSubject}
          scrollEnabled={false}
        />
      ) : (
        <View style={styles.emptyDay}>
          <Text style={styles.emptyDayText}>No classes scheduled</Text>
        </View>
      )}
    </View>
  );

  const subjectsByDay = getSubjectsByDay();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Subject Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+ Add Subject</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{subjects.length}</Text>
          <Text style={styles.statLabel}>Total Subjects</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {[...new Set(subjects.map((s) => s.faculty))].length}
          </Text>
          <Text style={styles.statLabel}>Active Faculty</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {
              daysOfWeek.filter((day) => subjects.some((s) => s.day === day))
                .length
            }
          </Text>
          <Text style={styles.statLabel}>Active Days</Text>
        </View>
      </View>

      {/* Subjects by Day */}
      <ScrollView style={styles.content}>
        {daysOfWeek.map((day) => renderDaySection(day, subjectsByDay[day]))}
      </ScrollView>

      {/* Add/Edit Subject Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={resetForm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingSubject ? "Edit Subject" : "Add New Subject"}
            </Text>

            <ScrollView>
              <TextInput
                style={styles.input}
                placeholder="Subject Name (e.g., PHYSICS)"
                value={newSubject.name}
                onChangeText={(text) =>
                  setNewSubject({ ...newSubject, name: text })
                }
              />

              <Text style={styles.fieldLabel}>Select Faculty</Text>
              <View style={styles.facultyButtons}>
                {facultyList.map((faculty) => (
                  <TouchableOpacity
                    key={faculty.code}
                    style={[
                      styles.facultyButton,
                      newSubject.faculty === faculty.code &&
                        styles.selectedFaculty,
                    ]}
                    onPress={() =>
                      setNewSubject({ ...newSubject, faculty: faculty.code })
                    }
                  >
                    <Text
                      style={[
                        styles.facultyButtonText,
                        newSubject.faculty === faculty.code &&
                          styles.selectedFacultyText,
                      ]}
                    >
                      {faculty.code}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Select Day</Text>
              <View style={styles.daysContainer}>
                {daysOfWeek.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayButton,
                      newSubject.day === day && styles.selectedDay,
                    ]}
                    onPress={() => setNewSubject({ ...newSubject, day })}
                  >
                    <Text
                      style={[
                        styles.dayButtonText,
                        newSubject.day === day && styles.selectedDayText,
                      ]}
                    >
                      {day.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Select Time Slot</Text>
              <View style={styles.timeSlotsContainer}>
                {commonTimeSlots.map((timeSlot) => (
                  <TouchableOpacity
                    key={timeSlot}
                    style={[
                      styles.timeSlotButton,
                      newSubject.time === timeSlot && styles.selectedTimeSlot,
                    ]}
                    onPress={() =>
                      setNewSubject({ ...newSubject, time: timeSlot })
                    }
                  >
                    <Text
                      style={[
                        styles.timeSlotText,
                        newSubject.time === timeSlot &&
                          styles.selectedTimeSlotText,
                      ]}
                    >
                      {timeSlot}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Or Enter Custom Time</Text>
              <TextInput
                style={styles.input}
                placeholder="Custom time (e.g., 9:00-10:00)"
                value={newSubject.time}
                onChangeText={(text) =>
                  setNewSubject({ ...newSubject, time: text })
                }
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={resetForm}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={addOrUpdateSubject}
              >
                <Text style={styles.saveButtonText}>
                  {editingSubject ? "Update" : "Add"} Subject
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    flex: 1,
  },
  addButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingVertical: 16,
    justifyContent: "space-around",
    elevation: 2,
  },
  statCard: {
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  daySection: {
    marginVertical: 8,
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
  emptyDay: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  emptyDayText: {
    color: "#999",
    fontStyle: "italic",
  },
  subjectCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    elevation: 1,
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
  actionButtons: {
    flexDirection: "row",
  },
  editButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
  },
  editButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "#FF5252",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  facultyText: {
    fontSize: 14,
    color: "#2E7D32",
    marginBottom: 4,
  },
  scheduleText: {
    fontSize: 14,
    color: "#666",
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
    maxHeight: "90%",
    width: "95%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  facultyButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  facultyButton: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    flex: 1,
    alignItems: "center",
    marginHorizontal: 2,
  },
  selectedFaculty: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },
  facultyButtonText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  selectedFacultyText: {
    color: "white",
  },
  daysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  dayButton: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    width: "13%",
    alignItems: "center",
  },
  selectedDay: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },
  dayButtonText: {
    fontSize: 12,
    color: "#333",
  },
  selectedDayText: {
    color: "white",
  },
  timeSlotsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  timeSlotButton: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  selectedTimeSlot: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },
  timeSlotText: {
    fontSize: 12,
    color: "#333",
  },
  selectedTimeSlotText: {
    color: "white",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: "#2E7D32",
    marginLeft: 10,
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
