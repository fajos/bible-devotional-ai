// screens/Settings.js
import { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator
} from 'react-native';
import Store from '../services/store';
import { runHighlightStressTest, runBibleDownloadTest, verifyHighlightMigration } from '../services/stressTest';

export default function Settings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [isTesting, setIsTesting] = useState(false);

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
              await Store.clearAllFileSystemData();
              Alert.alert('Success', 'All data has been cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          }
        }
      ]
    );
  };

  const clearHighlights = () => {
    Alert.alert(
      'Clear Highlights',
      'This will remove all your verse highlights. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await Store.clearHighlights();
              Alert.alert('Success', 'Highlights cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear highlights');
            }
          }
        }
      ]
    );
  };

  const clearCache = () => {
    Alert.alert(
      'Clear Bible Cache',
      'This will remove all downloaded offline Bibles. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            try {
              await Store.clearCache();
              Alert.alert('Success', 'Cache cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          }
        }
      ]
    );
  };

  const runTests = async () => {
    setIsTesting(true);
    try {
      // 1. Run Migration Verification
      console.log('Running Migration Verification...');
      const migrationResult = await verifyHighlightMigration();

      if (!migrationResult.success) {
        Alert.alert('Migration Test Failed', JSON.stringify(migrationResult.details));
        setIsTesting(false);
        return;
      }

      // 2. Run Stress Test
      console.log('Running Stress Test...');
      const highlightResult = await runHighlightStressTest(5000); // 5000 for final verification

      Alert.alert(
        'Test Results',
        `Migration: PASSED\n\nStress Test (5000 items):\n- Integrity: ${highlightResult.integrity ? 'Pass' : 'Fail'}\n- Save: ${highlightResult.saveTime}ms\n- Load: ${highlightResult.loadTime}ms\n\nStarting Bible download test (KJV)...`
      );

      const downloadResult = await runBibleDownloadTest('de4e12af7f28f599-01');
      Alert.alert(
        'Bible Download Result',
        `Success: ${downloadResult.success}\nDuration: ${downloadResult.duration}s`
      );
    } catch (error) {
      Alert.alert('Test Failed', error.message);
    } finally {
      setIsTesting(false);
    }
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

        <View style={styles.rowButtons}>
          <TouchableOpacity
            style={[styles.smallButton, { backgroundColor: '#f39c12' }]}
            onPress={clearHighlights}
          >
            <Text style={styles.buttonText}>Clear Highlights</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.smallButton, { backgroundColor: '#7f8c8d' }]}
            onPress={clearCache}
          >
            <Text style={styles.buttonText}>Clear Cache</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, { marginTop: 10, backgroundColor: '#3498db' }]}
          onPress={runTests}
          disabled={isTesting}
        >
          {isTesting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Run Stress Tests</Text>
          )}
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
    fontSize: 14,
    fontWeight: '600',
  },
  rowButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  smallButton: {
    flex: 0.48,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
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