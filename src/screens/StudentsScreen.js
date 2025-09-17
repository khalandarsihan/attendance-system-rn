import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function StudentsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>👥 Student Management</Text>
        <Text style={styles.subtitle}>Coming Soon</Text>
        <Text style={styles.description}>
          Add and manage students here
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 48, marginBottom: 16 },
  subtitle: { fontSize: 24, fontWeight: 'bold', color: '#2E7D32', marginBottom: 8 },
  description: { fontSize: 16, color: '#666', textAlign: 'center' },
});
