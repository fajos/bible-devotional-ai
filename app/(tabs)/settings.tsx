// app/(tabs)/settings.js
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../../constants/theme';
import { clearAllFileSystemData, clearCache, formatSize, getCacheSize } from '../../services/store';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [defaultVersion, setDefaultVersion] = useState('NKJV');
  const [loading, setLoading] = useState(true);
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheSize, setCacheSize] = useState('0 B');

  useEffect(() => {
    loadSettings();
    updateCacheSize();
  }, []);

  const updateCacheSize = async () => {
    const size = await getCacheSize();
    setCacheSize(formatSize(size));
  };

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('appSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setNotifications(settings.notifications ?? true);
        setAutoSave(settings.autoSave ?? true);
        setDefaultVersion(settings.defaultVersion ?? 'NKJV');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (updates) => {
    try {
      const currentSettings = {
        notifications,
        autoSave,
        defaultVersion,
        ...updates
      };
      await AsyncStorage.setItem('appSettings', JSON.stringify(currentSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const toggleNotifications = (value) => {
    setNotifications(value);
    saveSettings({ notifications: value });
  };

  const toggleAutoSave = (value) => {
    setAutoSave(value);
    saveSettings({ autoSave: value });
  };

  const updateVersion = (version) => {
    setDefaultVersion(version);
    saveSettings({ defaultVersion: version });
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all saved devotionals, favorites, and cached data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              setClearingCache(true);
              const settings = JSON.stringify({ notifications, autoSave, defaultVersion });

              // Clear FileSystem data
              await clearAllFileSystemData();

              // Clear AsyncStorage
              await AsyncStorage.clear();

              // Restore settings after clear
              await AsyncStorage.setItem('appSettings', settings);
              Alert.alert('Success', 'All data has been cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            } finally {
              setClearingCache(false);
            }
          }
        }
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Bible Cache',
      'This will remove all locally stored Bible verses. They will be downloaded again when needed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            try {
              setClearingCache(true);
              await clearCache();
              await updateCacheSize();
              Alert.alert('Success', 'Bible cache cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            } finally {
              setClearingCache(false);
            }
          }
        }
      ]
    );
  };

  if (loading) return null;

  return (
    <ScrollView style={styles.container}>
      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PREFERENCES</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Daily Notifications</Text>
            <Text style={styles.settingDescription}>Receive daily devotional reminders</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={toggleNotifications}
            trackColor={{ false: COLORS.grayLight, true: COLORS.gold }}
            thumbColor={notifications ? COLORS.primary : COLORS.white}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Auto-Save Studies</Text>
            <Text style={styles.settingDescription}>Automatically save generated studies</Text>
          </View>
          <Switch
            value={autoSave}
            onValueChange={toggleAutoSave}
            trackColor={{ false: COLORS.grayLight, true: COLORS.gold }}
            thumbColor={autoSave ? COLORS.primary : COLORS.white}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Default Bible Version</Text>
            <Text style={styles.settingDescription}>Version used for verse display</Text>
          </View>
          <Text style={styles.settingValue}>{defaultVersion}</Text>
        </View>
      </View>

      {/* Bible Versions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>BIBLE VERSIONS</Text>
        {['NKJV', 'MSG', 'AMP', 'KJV', 'NIV', 'ESV', 'NLT'].map((version) => (
          <TouchableOpacity
            key={version}
            style={styles.versionItem}
            onPress={() => updateVersion(version)}
          >
            <Text style={styles.versionName}>{version}</Text>
            {defaultVersion === version && (
              <Ionicons name="checkmark-circle" size={24} color={COLORS.gold} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Data Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DATA MANAGEMENT</Text>
        
        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleClearCache}
          disabled={clearingCache}
        >
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Clear Bible Cache</Text>
            <Text style={styles.settingDescription}>Free up space ({cacheSize})</Text>
          </View>
          {clearingCache ? (
            <ActivityIndicator size="small" color={COLORS.gold} />
          ) : (
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dangerButton, { marginTop: SPACING.md }]}
          onPress={clearAllData}
          disabled={clearingCache}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
          <Text style={styles.dangerButtonText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ABOUT</Text>
        <View style={styles.aboutContainer}>
          <Ionicons name="book" size={40} color={COLORS.gold} />
          <Text style={styles.appName}>Bible Devotional AI</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appDescription}>
            AI-powered Bible study and devotional app. Generate personalized studies 
            based on any topic, with verified scripture from multiple Bible versions.
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          "Your word is a lamp to my feet and a light to my path."
        </Text>
        <Text style={styles.footerReference}>Psalm 119:105</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
  },
  section: {
    backgroundColor: COLORS.white,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.ui.size.tiny,
    fontWeight: '700',
    color: COLORS.gray,
    marginBottom: SPACING.md,
    letterSpacing: 1,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.offWhite,
  },
  settingInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  settingLabel: {
    fontSize: FONTS.ui.size.medium,
    color: COLORS.primary,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: FONTS.ui.size.tiny,
    color: COLORS.gray,
    marginTop: 2,
  },
  settingValue: {
    fontSize: FONTS.ui.size.medium,
    color: COLORS.gold,
    fontWeight: '600',
  },
  versionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.offWhite,
  },
  versionName: {
    fontSize: FONTS.ui.size.medium,
    color: COLORS.primary,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.offWhite,
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  dangerButtonText: {
    color: COLORS.error,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  aboutContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  appName: {
    fontSize: FONTS.ui.size.xlarge,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: SPACING.sm,
  },
  appVersion: {
    fontSize: FONTS.ui.size.small,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  appDescription: {
    fontSize: FONTS.ui.size.small,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 20,
  },
  footer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FONTS.ui.size.small,
    color: COLORS.gray,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  footerReference: {
    fontSize: FONTS.ui.size.tiny,
    color: COLORS.gold,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
});