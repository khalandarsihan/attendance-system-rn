// src/screens/BulkImportScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function BulkImportScreen({ navigation }) {
  const [importType, setImportType] = useState("subjects");
  const [textData, setTextData] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sampleData = {
    subjects: `JALALYN,MJ,Monday,6:30-7:10
PHYSICS,SH,Monday,7:15-7:55
URDU SPOKEN,JM,Monday,8:00-8:40
R. SWALIHEEN,KS,Monday,9:30-10:10
ALFIYA,MJ,Monday,10:15-10:55
MATHS,SH,Monday,11:00-11:40
B-HINDI,JM,Monday,11:45-12:25
PU ISLAMIC SHF,KS,Monday,13:40-14:20
MANTHIQ,MJ,Monday,14:25-15:10
C-THINKING,SH,Monday,15:15-15:55
IIT-STATS,KS,Monday,16:00-16:40`,
    students: `Ahmed Ali,ST001,Class A,ahmed.ali@email.com
Fatima Khan,ST002,Class A,fatima.khan@email.com
Hassan Sheikh,ST003,Class B,hassan.sheikh@email.com
Aisha Rahman,ST004,Class B,aisha.rahman@email.com
Omar Abdullah,ST005,Class A,omar.abdullah@email.com
Zara Malik,ST006,Class A,zara.malik@email.com
Ali Hassan,ST007,Class B,ali.hassan@email.com
Maryam Ahmed,ST008,Class B,maryam.ahmed@email.com
Yusuf Ibrahim,ST009,Class A,yusuf.ibrahim@email.com
Khadija Salman,ST010,Class B,khadija.salman@email.com`,
  };

  const loadSampleData = () => {
    setTextData(sampleData[importType]);
  };

  const processImport = async () => {
    if (!textData.trim()) {
      Alert.alert("Error", "Please enter data to import");
      return;
    }

    setIsLoading(true);

    try {
      const lines = textData.trim().split("\n");
      let processedData = [];
      let existingData = [];

      if (importType === "subjects") {
        const existingSubjects = await AsyncStorage.getItem("subjects");
        existingData = existingSubjects ? JSON.parse(existingSubjects) : [];

        lines.forEach((line, index) => {
          const parts = line.split(",").map((item) => item.trim());
          if (parts.length >= 2) {
            const [name, faculty, day, time] = parts;
            processedData.push({
              id: Date.now().toString() + index,
              name,
              faculty,
              day: day || "Monday",
              time: time || "9:00-10:00",
              createdAt: new Date().toISOString(),
            });
          }
        });

        const allSubjects = [...existingData, ...processedData];
        await AsyncStorage.setItem("subjects", JSON.stringify(allSubjects));
      } else if (importType === "students") {
        const existingStudents = await AsyncStorage.getItem("students");
        existingData = existingStudents ? JSON.parse(existingStudents) : [];

        lines.forEach((line, index) => {
          const parts = line.split(",").map((item) => item.trim());
          if (parts.length >= 2) {
            const [name, rollNumber, className, email] = parts;
            processedData.push({
              id: Date.now().toString() + index,
              name,
              rollNumber,
              className: className || "General",
              email: email || "",
              createdAt: new Date().toISOString(),
            });
          }
        });

        const allStudents = [...existingData, ...processedData];
        await AsyncStorage.setItem("students", JSON.stringify(allStudents));
      }

      Alert.alert(
        "Success",
        `Successfully imported ${processedData.length} ${importType}!`,
        [
          {
            text: "OK",
            onPress: () => {
              setTextData("");
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to import data. Please check the format.");
      console.log("Import error:", error);
    }

    setIsLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Bulk Import Data</Text>
        <Text style={styles.subtitle}>
          Import multiple records at once using CSV format
        </Text>

        {/* Import Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Import Type</Text>
          <TouchableOpacity
            style={[
              styles.typeButton,
              importType === "subjects" && styles.selectedType,
            ]}
            onPress={() => setImportType("subjects")}
          >
            <Text
              style={[
                styles.typeText,
                importType === "subjects" && styles.selectedTypeText,
              ]}
            >
              Subjects & Faculty
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeButton,
              importType === "students" && styles.selectedType,
            ]}
            onPress={() => setImportType("students")}
          >
            <Text
              style={[
                styles.typeText,
                importType === "students" && styles.selectedTypeText,
              ]}
            >
              Students
            </Text>
          </TouchableOpacity>
        </View>

        {/* Format Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Format Instructions</Text>
          <View style={styles.formatBox}>
            {importType === "subjects" ? (
              <Text style={styles.formatText}>
                Format: Subject Name, Faculty Code, Day, Time{"\n"}
                Example: PHYSICS,SH,Monday,7:15-7:55
              </Text>
            ) : (
              <Text style={styles.formatText}>
                Format: Name, Roll Number, Class, Email{"\n"}
                Example: Ahmed Ali,ST001,Class A,ahmed@email.com
              </Text>
            )}
          </View>
        </View>

        {/* Sample Data Button */}
        <TouchableOpacity style={styles.sampleButton} onPress={loadSampleData}>
          <Text style={styles.sampleButtonText}>
            Load TechEthica Sample Data
          </Text>
        </TouchableOpacity>

        {/* Text Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paste Your Data</Text>
          <TextInput
            style={styles.textInput}
            value={textData}
            onChangeText={setTextData}
            placeholder={`Enter ${importType} data here, one per line...`}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Import Button */}
        <TouchableOpacity
          style={[styles.importButton, isLoading && styles.disabledButton]}
          onPress={processImport}
          disabled={isLoading}
        >
          <Text style={styles.importButtonText}>
            {isLoading
              ? "Importing..."
              : `Import ${
                  importType.charAt(0).toUpperCase() + importType.slice(1)
                }`}
          </Text>
        </TouchableOpacity>

        {/* Guidelines */}
        <View style={styles.guidelines}>
          <Text style={styles.guidelineTitle}>Guidelines:</Text>
          <Text style={styles.guidelineText}>
            • Each line represents one record
          </Text>
          <Text style={styles.guidelineText}>
            • Use commas to separate fields
          </Text>
          <Text style={styles.guidelineText}>
            • Empty lines will be ignored
          </Text>
          <Text style={styles.guidelineText}>
            • Faculty codes: KS, MJ, JM, SH
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
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  typeButton: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  selectedType: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },
  typeText: {
    fontSize: 16,
    color: "#333",
  },
  selectedTypeText: {
    color: "white",
    fontWeight: "600",
  },
  formatBox: {
    backgroundColor: "#E8F5E9",
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#2E7D32",
  },
  formatText: {
    fontSize: 14,
    color: "#2E7D32",
    fontFamily: "monospace",
  },
  sampleButton: {
    backgroundColor: "#FF9800",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 24,
  },
  sampleButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  textInput: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    minHeight: 200,
    borderWidth: 1,
    borderColor: "#DDD",
    fontSize: 14,
    fontFamily: "monospace",
  },
  importButton: {
    backgroundColor: "#2E7D32",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 24,
  },
  disabledButton: {
    backgroundColor: "#AAA",
  },
  importButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  guidelines: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  guidelineTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  guidelineText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
});
