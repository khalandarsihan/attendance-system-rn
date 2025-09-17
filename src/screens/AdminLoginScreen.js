// src/screens/AdminLoginScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdminLoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Admin credentials - you can modify these
  const adminCredentials = {
    username: 'admin',
    password: 'admin123',
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    setIsLoading(true);

    if (username === adminCredentials.username && password === adminCredentials.password) {
      try {
        // Store admin session
        const adminSession = {
          role: 'admin',
          username: username,
          loginTime: new Date().toISOString(),
        };
        
        await AsyncStorage.setItem('adminSession', JSON.stringify(adminSession));
        
        // Navigate to admin panel
        navigation.replace('AdminPanel');
      } catch (error) {
        Alert.alert('Error', 'Failed to login. Please try again.');
      }
    } else {
      Alert.alert('Invalid Credentials', 'Please check your username and password');
    }

    setIsLoading(false);
  };

  const quickLogin = () => {
    setUsername('admin');
    setPassword('admin123');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>TechEthica</Text>
        <Text style={styles.subtitle}>Admin Panel</Text>
        <Text style={styles.tagline}>Sunnah & Science Research Labs</Text>
      </View>

      <View style={styles.loginForm}>
        <Text style={styles.formTitle}>Administrator Login</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.disabledButton]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.loginButtonText}>
            {isLoading ? 'Logging in...' : 'Admin Login'}
          </Text>
        </TouchableOpacity>

        {/* Quick Login for Demo */}
        <View style={styles.quickLoginSection}>
          <Text style={styles.quickLoginTitle}>Quick Login (Demo)</Text>
          <TouchableOpacity
            style={styles.quickLoginButton}
            onPress={quickLogin}
          >
            <Text style={styles.quickLoginText}>Use Default Credentials</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.teacherButton}
          onPress={() => navigation.navigate('TeacherLogin')}
        >
          <Text style={styles.teacherButtonText}>Teacher Portal</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Default credentials: admin / admin123
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#1565C0',
    padding: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 20,
    color: '#BBDEFB',
    marginTop: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#90CAF9',
    fontStyle: 'italic',
    marginTop: 4,
  },
  loginForm: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DDD',
    elevation: 2,
  },
  loginButton: {
    backgroundColor: '#1565C0',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#AAA',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quickLoginSection: {
    marginTop: 32,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 2,
  },
  quickLoginTitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  quickLoginButton: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1565C0',
    alignItems: 'center',
  },
  quickLoginText: {
    color: '#1565C0',
    fontWeight: '600',
  },
  teacherButton: {
    backgroundColor: '#2E7D32',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  teacherButtonText: {
    color: 'white',
    fontSize: 16,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
  },
});
