// App.js - Updated with Admin Authentication
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

// Admin screens
import AdminLoginScreen from "./src/screens/AdminLoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import AttendanceScreen from "./src/screens/AttendanceScreen";
import SubjectManagementScreen from "./src/screens/SubjectManagementScreen";
import BulkImportScreen from "./src/screens/BulkImportScreen";
import StudentsScreen from "./src/screens/StudentsScreen";
import ReportsScreen from "./src/screens/ReportsScreen";
import TimetableScreen from "./src/screens/TimetableScreen";
import DataCleanupScreen from "./src/screens/DataCleanupScreen";

// Teacher screens
import TeacherLoginScreen from "./src/screens/TeacherLoginScreen";
import TeacherDashboard from "./src/screens/TeacherDashboard";
import TeacherAttendanceScreen from "./src/screens/TeacherAttendanceScreen";
import TeacherReportsScreen from "./src/screens/TeacherReportsScreen";
import TeacherSubjectsScreen from "./src/screens/TeacherSubjectsScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Admin Tab Navigator
function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#1565C0",
        tabBarInactiveTintColor: "#757575",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: "#E0E0E0",
          paddingBottom: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: "#1565C0",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Dashboard",
          headerTitle: "TechEthica - Admin Panel",
        }}
      />
      <Tab.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{ title: "Take Attendance" }}
      />
      <Tab.Screen
        name="Timetable"
        component={TimetableScreen}
        options={{ title: "Schedule" }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ title: "Reports" }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="AdminLogin"
        screenOptions={{
          headerStyle: {
            backgroundColor: "#1565C0",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      >
        {/* Authentication Screens */}
        <Stack.Screen
          name="AdminLogin"
          component={AdminLoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="TeacherLogin"
          component={TeacherLoginScreen}
          options={{ headerShown: false }}
        />

        {/* Admin Panel */}
        <Stack.Screen
          name="AdminPanel"
          component={AdminTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SubjectManagement"
          component={SubjectManagementScreen}
          options={{ title: "Manage Subjects" }}
        />
        <Stack.Screen
          name="BulkImport"
          component={BulkImportScreen}
          options={{ title: "Bulk Import Data" }}
        />
        <Stack.Screen
          name="Students"
          component={StudentsScreen}
          options={{ title: "Manage Students" }}
        />

        {/* Teacher Portal */}
        <Stack.Screen
          name="TeacherDashboard"
          component={TeacherDashboard}
          options={{
            title: "Teacher Dashboard",
            headerLeft: null,
            headerStyle: { backgroundColor: "#2E7D32" },
          }}
        />
        <Stack.Screen
          name="TeacherAttendance"
          component={TeacherAttendanceScreen}
          options={{
            title: "Take Attendance",
            headerStyle: { backgroundColor: "#2E7D32" },
          }}
        />
        <Stack.Screen
          name="TeacherReports"
          component={TeacherReportsScreen}
          options={{
            title: "My Performance Reports",
            headerStyle: { backgroundColor: "#2E7D32" },
          }}
        />
        <Stack.Screen
          name="TeacherSubjects"
          component={TeacherSubjectsScreen}
          options={{
            title: "My Subjects",
            headerStyle: { backgroundColor: "#2E7D32" },
          }}
        />
        <Stack.Screen
          name="DataCleanup"
          component={DataCleanupScreen}
          options={{ title: "Data Cleanup" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
