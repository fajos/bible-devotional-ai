// app/(tabs)/settings.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../../constants/theme';
import { clearAllFileSystemData, clearCache, clearHighlights, formatSize, getCacheSize } from '../../services/store';

export default function SettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheSize, setCacheSize] = useState('0 B');

  useEffect(() => {
    updateCacheSize();
    setLoading(false);
  }, []);

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

  if (loading) return null;

  return (
    <ScrollView style={styles.container}>
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
          style={styles.settingItem}
          onPress={handleClearHighlights}
          disabled={clearingCache}
        >
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Clear All Highlights</Text>
            <Text style={styles.settingDescription}>Remove all verse color markings</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
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
