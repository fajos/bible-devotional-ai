// screens/Settings.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function Settings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoSave, setAutoSave] = useState(true);

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to delete all saved devotionals and settings? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Success', 'All data has been cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingLabel}>Daily Notifications</Text>
            <Text style={styles.settingDescription}>Receive daily devotional reminders</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#767577', true: '#4A90E2' }}
          />
        </View>

        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Text style={styles.settingDescription}>Switch to dark theme</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: '#767577', true: '#4A90E2' }}
          />
        </View>

        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingLabel}>Auto-Save Studies</Text>
            <Text style={styles.settingDescription}>Automatically save generated studies</Text>
          </View>
          <Switch
            value={autoSave}
            onValueChange={setAutoSave}
            trackColor={{ false: '#767577', true: '#4A90E2' }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        
        <TouchableOpacity style={styles.button} onPress={clearAllData}>
          <Text style={styles.buttonText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.aboutInfo}>
          <Text style={styles.appName}>Bible Devotional AI</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.description}>
            An AI-powered Bible study and devotional app that generates personalized
            studies based on any topic, person, or question from Scripture.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          "Your word is a lamp to my feet and a light to my path." - Psalm 119:105
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginBottom: 15,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  button: {
    backgroundColor: '#E74C3C',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  aboutInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  version: {
    fontSize: 14,
    color: '#999',
    marginBottom: 15,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});