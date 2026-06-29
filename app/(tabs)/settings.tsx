import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';
import notifications, { REMINDER_TYPES } from '../../services/notifications';
import {
  clearAllFileSystemData,
  clearCache,
  clearHighlights,
  formatSize,
  getAudioPreferences,
  getCacheSize,
  getPreferredBibleVersion,
  setAudioPreferences,
  setPreferredBibleVersion
} from '../../services/store';

export default function SettingsScreen() {
  const { isDarkMode, toggleDarkMode, colors } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheSize, setCacheSize] = useState('0 B');
  const [devotionalReminder, setDevotionalReminder] = useState(false);
  const [readingPlanReminder, setReadingPlanReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [readingPlanTime, setReadingPlanTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerType, setPickerType] = useState<'devotional' | 'reading_plan'>('devotional');
  const [preferredVersion, setPreferredVersion] = useState('NKJV');
  const [audioPrefs, setAudioPrefs] = useState({ gender: 'female', rate: 0.9, voiceIdentifier: null });
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      await updateCacheSize();
      await loadNotificationSettings();
      const version = await getPreferredBibleVersion();
      setPreferredVersion(version);
      const aPrefs = await getAudioPreferences();
      setAudioPrefs(aPrefs);

      const voices = await Speech.getAvailableVoicesAsync();
      setAvailableVoices(voices.filter(v => v.language.toLowerCase().startsWith('en')));

      setLoading(false);
    };
    init();
  }, []);

  const loadNotificationSettings = async () => {
    const settings = await notifications.getReminderSettings();

    if (settings[REMINDER_TYPES.DEVOTIONAL]) {
      setDevotionalReminder(settings[REMINDER_TYPES.DEVOTIONAL].enabled);
      if (settings[REMINDER_TYPES.DEVOTIONAL].hour !== undefined) {
        const time = new Date();
        time.setHours(settings[REMINDER_TYPES.DEVOTIONAL].hour);
        time.setMinutes(settings[REMINDER_TYPES.DEVOTIONAL].minute || 0);
        setReminderTime(time);
      }
    }

    if (settings[REMINDER_TYPES.READING_PLAN]) {
      setReadingPlanReminder(settings[REMINDER_TYPES.READING_PLAN].enabled);
      if (settings[REMINDER_TYPES.READING_PLAN].hour !== undefined) {
        const time = new Date();
        time.setHours(settings[REMINDER_TYPES.READING_PLAN].hour);
        time.setMinutes(settings[REMINDER_TYPES.READING_PLAN].minute || 0);
        setReadingPlanTime(time);
      }
    }
  };

  const toggleDevotionalReminder = async (value: boolean) => {
    if (value) {
      setPickerType('devotional');
      setShowPicker(true);
    } else {
      await notifications.cancelReminder(REMINDER_TYPES.DEVOTIONAL);
      setDevotionalReminder(false);
    }
  };

  const toggleReadingPlanReminder = async (value: boolean) => {
    if (value) {
      setPickerType('reading_plan');
      setShowPicker(true);
    } else {
      await notifications.cancelReminder(REMINDER_TYPES.READING_PLAN);
      setReadingPlanReminder(false);
    }
  };

  const onTimeChange = async (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');

    if (event.type === 'set' && selectedDate) {
      const type = pickerType === 'devotional' ? REMINDER_TYPES.DEVOTIONAL : REMINDER_TYPES.READING_PLAN;

      if (pickerType === 'devotional') setReminderTime(selectedDate);
      else setReadingPlanTime(selectedDate);

      const success = await notifications.scheduleDailyReminder(
        type,
        selectedDate.getHours(),
        selectedDate.getMinutes()
      );

      if (success) {
        if (pickerType === 'devotional') setDevotionalReminder(true);
        else setReadingPlanReminder(true);
      } else {
        if (pickerType === 'devotional') setDevotionalReminder(false);
        else setReadingPlanReminder(false);
        Alert.alert('Permission Denied', 'Please enable notifications in settings.');
      }
    } else if (event.type === 'dismissed') {
      if (pickerType === 'devotional' && !devotionalReminder) setDevotionalReminder(false);
      if (pickerType === 'reading_plan' && !readingPlanReminder) setReadingPlanReminder(false);
    }
  };

  const updateCacheSize = async () => {
    const size = await getCacheSize();
    setCacheSize(formatSize(size));
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all saved devotionals, favorites, highlights, and cached data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              setClearingCache(true);
              // Clear FileSystem data
              await clearAllFileSystemData();
              // Clear AsyncStorage
              await AsyncStorage.clear();

              await updateCacheSize();
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

  const handleClearHighlights = () => {
    Alert.alert(
      'Clear All Highlights',
      'This will permanently delete all verse highlights across all Bible versions. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              setClearingCache(true);
              await clearHighlights();
              await updateCacheSize();
              Alert.alert('Success', 'All highlights have been cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear highlights');
            } finally {
              setClearingCache(false);
            }
          }
        }
      ]
    );
  };

  const handleVersionChange = async (versionId: string) => {
    try {
      await setPreferredBibleVersion(versionId);
      setPreferredVersion(versionId);
      Haptics.selectionAsync();
    } catch (error) {
      console.error('Failed to update version:', error);
    }
  };

  const handleAudioPrefChange = async (newPrefs: any) => {
    try {
      const updated = { ...audioPrefs, ...newPrefs };
      await setAudioPreferences(updated);
      setAudioPrefs(updated);
      Haptics.selectionAsync();

      // If voice was changed, do a quick test
      if (newPrefs.voiceIdentifier) {
        Speech.stop();
        Speech.speak("The Lord is my shepherd", {
          voice: newPrefs.voiceIdentifier,
          rate: updated.rate,
        });
      }
    } catch (error) {
      console.error('Failed to update audio prefs:', error);
    }
  };

  const APP_VERSIONS = [
    { id: 'NKJV', name: 'NKJV' },
    { id: 'NIV', name: 'NIV' },
    { id: 'GNT', name: 'GNT' },
    { id: 'KJV', name: 'KJV' },
    { id: 'AMP', name: 'AMP' },
    { id: 'MSG', name: 'MSG' },
  ];

  if (loading) return null;

  const dynamicStyles = {
    container: { backgroundColor: colors.background },
    section: { backgroundColor: colors.surface },
    settingLabel: { color: colors.text },
    settingDescription: { color: colors.textSecondary },
    sectionTitle: { color: colors.gold },
    appName: { color: colors.text },
    appDescription: { color: colors.textSecondary },
    footerText: { color: colors.textSecondary },
    versionChip: (isSelected: boolean) => ({
      backgroundColor: isSelected ? colors.gold : colors.offWhite,
      borderColor: isSelected ? colors.gold : colors.grayLight,
    }),
    versionChipText: (isSelected: boolean) => ({
      color: isSelected ? colors.white : colors.text,
    })
  };

  return (
    <ScrollView style={[styles.container, dynamicStyles.container]}>
      {/* App Appearance Section */}
      <View style={[styles.section, dynamicStyles.section]}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>APPEARANCE</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>Dark Mode</Text>
            <Text style={[styles.settingDescription, dynamicStyles.settingDescription]}>Use dark theme throughout the app</Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: '#D1D1D1', true: COLORS.gold }}
            thumbColor={COLORS.white}
          />
        </View>
      </View>

      {/* Global Preferences */}
      <View style={[styles.section, dynamicStyles.section]}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>GLOBAL PREFERENCES</Text>
        <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>Preferred Bible Version</Text>
            <Text style={[styles.settingDescription, dynamicStyles.settingDescription]}>Default version for search and devotionals</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.versionRow}>
          {APP_VERSIONS.map((v) => (
            <TouchableOpacity
              key={v.id}
              style={[
                styles.versionChip,
                dynamicStyles.versionChip(preferredVersion === v.id)
              ]}
              onPress={() => handleVersionChange(v.id)}
            >
              <Text style={[
                styles.versionChipText,
                dynamicStyles.versionChipText(preferredVersion === v.id)
              ]}>{v.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Audio Settings */}
      <View style={[styles.section, dynamicStyles.section]}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>AUDIO SETTINGS</Text>

        <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>Reading Speed</Text>
            <Text style={[styles.settingDescription, dynamicStyles.settingDescription]}>Adjust the pace of the narration</Text>
          </View>
        </View>
        <View style={styles.speedRow}>
          {[
            { label: 'Slow', value: 0.7 },
            { label: 'Normal', value: 0.9 },
            { label: 'Fast', value: 1.1 }
          ].map((speed) => (
            <TouchableOpacity
              key={speed.label}
              style={[
                styles.speedChip,
                audioPrefs.rate === speed.value && styles.speedChipActive,
                { backgroundColor: audioPrefs.rate === speed.value ? COLORS.gold : colors.offWhite }
              ]}
              onPress={() => handleAudioPrefChange({ rate: speed.value })}
            >
              <Text style={[
                styles.speedChipText,
                audioPrefs.rate === speed.value && styles.speedChipTextActive,
                { color: audioPrefs.rate === speed.value ? COLORS.white : colors.text }
              ]}>{speed.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {availableVoices.length > 0 && (
          <>
            <View style={[styles.settingItem, { borderBottomWidth: 0, marginTop: SPACING.sm }]}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>Narration Voice</Text>
                <Text style={[styles.settingDescription, dynamicStyles.settingDescription]}>Pick a high-quality voice installed on your device</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.voiceRow}>
              {availableVoices.map((v) => {
                const isSelected = audioPrefs.voiceIdentifier === v.identifier;
                const isHighQual = v.quality === Speech.VoiceQuality.Enhanced || v.name.includes('Premium');
                return (
                  <TouchableOpacity
                    key={v.identifier}
                    style={[
                      styles.voiceChip,
                      isSelected && styles.voiceChipActive,
                      { backgroundColor: isSelected ? COLORS.gold : colors.offWhite }
                    ]}
                    onPress={() => handleAudioPrefChange({ voiceIdentifier: v.identifier })}
                  >
                    <Text style={[
                      styles.voiceChipText,
                      isSelected && styles.voiceChipTextActive,
                      { color: isSelected ? COLORS.white : colors.text }
                    ]}>
                      {v.name.includes('SMTg02') ? 'Male (Deep)' :
                       v.name.includes('SMTg01') ? 'Female (Soft)' :
                       v.name.includes('samantha') ? 'Samantha' :
                       v.name.includes('daniel') ? 'Daniel' :
                       v.name.replace('English (United States)', 'US').replace('English (United Kingdom)', 'UK').split('-').pop() || v.name}
                    </Text>
                    {isHighQual && <Ionicons name="sparkles" size={10} color={isSelected ? COLORS.white : COLORS.gold} style={{ marginLeft: 4 }} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}
      </View>

      {/* Notifications Section */}
      <View style={[styles.section, dynamicStyles.section]}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>NOTIFICATIONS</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>Daily Devotional Reminder</Text>
            <Text style={[styles.settingDescription, dynamicStyles.settingDescription]}>Get notified to start your daily study</Text>
          </View>
          <View style={styles.switchContainer}>
            {devotionalReminder && (
              <TouchableOpacity onPress={() => { setPickerType('devotional'); setShowPicker(true); }} style={styles.timeDisplay}>
                <Text style={styles.timeText}>
                  {reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
            )}
            <Switch
              value={devotionalReminder}
              onValueChange={toggleDevotionalReminder}
              trackColor={{ false: '#D1D1D1', true: COLORS.gold }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>Reading Plan Reminder</Text>
            <Text style={[styles.settingDescription, dynamicStyles.settingDescription]}>Stay on track with your yearly journey</Text>
          </View>
          <View style={styles.switchContainer}>
            {readingPlanReminder && (
              <TouchableOpacity onPress={() => { setPickerType('reading_plan'); setShowPicker(true); }} style={styles.timeDisplay}>
                <Text style={styles.timeText}>
                  {readingPlanTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
            )}
            <Switch
              value={readingPlanReminder}
              onValueChange={toggleReadingPlanReminder}
              trackColor={{ false: '#D1D1D1', true: COLORS.gold }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>

        {showPicker && (
          <DateTimePicker
            value={pickerType === 'devotional' ? reminderTime : readingPlanTime}
            mode="time"
            is24Hour={false}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onTimeChange}
          />
        )}
      </View>

      {/* Data Management */}
      <View style={[styles.section, dynamicStyles.section]}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>DATA MANAGEMENT</Text>
        
        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleClearCache}
          disabled={clearingCache}
        >
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>Clear Bible Cache</Text>
            <Text style={[styles.settingDescription, dynamicStyles.settingDescription]}>Free up space ({cacheSize})</Text>
          </View>
          {clearingCache ? (
            <ActivityIndicator size="small" color={COLORS.gold} />
          ) : (
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleClearHighlights}
          disabled={clearingCache}
        >
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>Clear All Highlights</Text>
            <Text style={[styles.settingDescription, dynamicStyles.settingDescription]}>Remove all verse color markings</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dangerButton, { marginTop: SPACING.md, backgroundColor: colors.offWhite }]}
          onPress={clearAllData}
          disabled={clearingCache}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
          <Text style={styles.dangerButtonText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>

      {/* About Section */}
<View style={[styles.section, dynamicStyles.section]}>
  <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>ABOUT</Text>
  <View style={styles.aboutContainer}>
    <Ionicons name="book" size={40} color={COLORS.gold} />
    <Text style={[styles.appName, dynamicStyles.appName]}>Bible Devotional AI</Text>
    <Text style={styles.appVersion}>Version 1.0.0</Text>
    <Text style={[styles.appDescription, dynamicStyles.appDescription]}>
      AI-powered Bible study and devotional app. Generate personalized studies
      based on any topic, with verified scripture from multiple Bible versions.
    </Text>
  </View>

  {/* Divider */}
  <View style={[styles.aboutDivider, { backgroundColor: colors.offWhite }]} />

  {/* Developer Info */}
  <View style={styles.developerContainer}>
    <Text style={[styles.developerLabel, { color: colors.textSecondary }]}>Developed by</Text>
    <Text style={[styles.developerName, { color: colors.text }]}>Fajostech</Text>

    <TouchableOpacity
      style={[styles.websiteButton, { borderColor: colors.gold }]}
      onPress={() => {
        const { Linking } = require('react-native');
        Linking.openURL('https://fajostech.com');
      }}
    >
      <Ionicons name="globe-outline" size={14} color={COLORS.gold} />
      <Text style={styles.websiteText}>fajostech.com</Text>
    </TouchableOpacity>
  </View>


</View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, dynamicStyles.footerText]}>
          &quot;Your word is a lamp to my feet and a light to my path.&quot;
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
  aboutDivider: {
  height: 1,
  marginVertical: SPACING.md,
},
developerContainer: {
  alignItems: 'center',
  paddingBottom: SPACING.md,
},
developerLabel: {
  fontSize: FONTS.ui.size.tiny,
  letterSpacing: 0.5,
  marginBottom: 4,
},
developerName: {
  fontSize: FONTS.ui.size.large,
  fontWeight: '700',
  marginBottom: SPACING.sm,
},
websiteButton: {
  flexDirection: 'row',
  alignItems: 'center',
  borderWidth: 1,
  borderRadius: 20,
  paddingHorizontal: 14,
  paddingVertical: 6,
  gap: 6,
},
websiteText: {
  fontSize: FONTS.ui.size.small,
  fontWeight: '600',
  color: COLORS.gold,
},
legalRow: {
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  paddingBottom: SPACING.sm,
  gap: 8,
},
legalLink: {
  fontSize: FONTS.ui.size.tiny,
  textDecorationLine: 'underline',
},
legalDot: {
  fontSize: FONTS.ui.size.small,
},
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeDisplay: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.goldDark,
  },
  versionRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.sm,
  },
  versionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  versionChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  genderToggle: {
    flexDirection: 'row',
  },
  genderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  genderButtonActive: {
    backgroundColor: COLORS.gold,
  },
  genderButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gold,
    marginLeft: 4,
  },
  genderButtonTextActive: {
    color: COLORS.white,
  },
  speedRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.sm,
  },
  speedChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  speedChipActive: {
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  speedChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  speedChipTextActive: {
    fontWeight: '700',
  },
  voiceRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.sm,
  },
  voiceChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceChipActive: {
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  voiceChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  voiceChipTextActive: {
    fontWeight: '700',
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
