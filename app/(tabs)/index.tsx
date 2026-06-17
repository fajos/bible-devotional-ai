// app/(tabs)/index.js
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Animated,
    Dimensions,
    Share
} from 'react-native';
import { COLORS, FONTS, SHADOWS, SPACING } from '../../constants/theme';
import { generateDailyDevotional } from '../../services/devotionalEngine';
import { storeDevotional } from '../../services/store';

const { width } = Dimensions.get('window');

const MOODS = [
  { id: 'anxious', label: 'Anxious', icon: 'leaf-outline', color: '#4A90E2', verse: "Peace I leave with you; my peace I give you.", ref: "John 14:27" },
  { id: 'tired', label: 'Tired', icon: 'bed-outline', color: '#F5A623', verse: "Come to me, all you who are weary and burdened.", ref: "Matthew 11:28" },
  { id: 'joyful', label: 'Joyful', icon: 'sunny-outline', color: '#7ED321', verse: "The joy of the Lord is your strength.", ref: "Nehemiah 8:10" },
  { id: 'lost', label: 'Lost', icon: 'compass-outline', color: '#BD10E0', verse: "Your word is a lamp for my feet, a light on my path.", ref: "Psalm 119:105" },
];

export default function DailyDevotionalScreen() {
  const [devotional, setDevotional] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Opening the Word...');
  const [selectedMood, setSelectedMood] = useState(null);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const router = useRouter();

  useEffect(() => {
    if (selectedMood) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedMood]);

  const loadingMessages = [
    'Opening the Word...',
    'Seeking wisdom...',
    'Preparing your daily bread...',
    'Gathering scripture...',
    'Crafting your devotional...',
    'Almost ready...',
  ];

  useEffect(() => {
    loadCachedDevotional();
  }, []);

  useEffect(() => {
    if (loading) {
      let index = 0;
      const interval = setInterval(() => {
        index = (index + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[index]);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const loadCachedDevotional = async () => {
    try {
      const today = new Date().toDateString();
      const cachedData = await AsyncStorage.getItem(`daily_${today}`);
      
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        setDevotional(parsed);
        setLoading(false);
        return;
      }
    } catch (error) {
      console.log('No cache found, generating new devotional');
    }
    
    loadDevotional();
  };

  const loadDevotional = async () => {
    setLoading(true);
    try {
      // Generate devotional with KJV as default for verse text to save API credits
      const result = await generateDailyDevotional('KJV');
      setDevotional(result);
      
      // Cache for today (no version in key since it's one per day)
      const today = new Date().toDateString();
      await AsyncStorage.setItem(`daily_${today}`, JSON.stringify(result));
    } catch (error) {
      console.error('Failed to load devotional:', error);
      alert('Unable to generate devotional. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDevotional();
  };

  const handleShareVerse = async (verse, ref, version) => {
    try {
      await Share.share({
        message: `"${verse}" - ${ref} (${version})\n\nShared via Bible Devotional AI`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Ionicons name="book" size={60} color={COLORS.gold} />
          <ActivityIndicator 
            size="large" 
            color={COLORS.gold} 
            style={styles.spinner}
          />
          <Text style={styles.loadingText}>{loadingMessage}</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.gold}
          colors={[COLORS.gold]}
        />
      }
    >
      {/* Date Header */}
      <View style={styles.dateHeader}>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
        <Text style={styles.dateSubtext}>Your Daily Bread</Text>
      </View>

      {/* Devotional Card */}
      {devotional && (
        <View style={styles.cardWrapper}>
          <TouchableOpacity
            style={styles.devotionalCard}
            onPress={() => {
  storeDevotional(devotional);
  router.push(`/devotional/${devotional.id}`);
}}
            activeOpacity={0.95}
          >
            <View style={styles.goldAccent} />
            <View style={styles.cardContent}>
              <Text style={styles.topicTitle}>{devotional.topic}</Text>

              {devotional.keyVerse && (
                <View style={styles.verseContainer}>
                  <Ionicons name="bookmark" size={20} color={COLORS.gold} style={styles.verseIcon} />
                  <View style={styles.verseTextContainer}>
                    <View style={styles.verseRefRow}>
                      <Text style={styles.verseReference}>{devotional.keyVerse.reference}</Text>
                      <Text style={styles.versionTag}>{devotional.bibleVersion || 'KJV'}</Text>
                    </View>
                    <Text style={styles.verseText}>"{devotional.keyVerse.text}"</Text>
                  </View>
                </View>
              )}

              <Text style={styles.previewText} numberOfLines={6}>
                {devotional.content}
              </Text>

              <View style={styles.readMoreContainer}>
                <Text style={styles.readMoreText}>Read Full Devotional</Text>
                <Ionicons name="arrow-forward" size={16} color={COLORS.gold} />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/search')}>
          <View style={styles.actionIconContainer}>
            <Ionicons name="search" size={24} color={COLORS.gold} />
          </View>
          <Text style={styles.actionText}>Search Topic</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/library')}>
          <View style={styles.actionIconContainer}>
            <Ionicons name="bookmarks" size={24} color={COLORS.gold} />
          </View>
          <Text style={styles.actionText}>My Library</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onRefresh}>
          <View style={styles.actionIconContainer}>
            <Ionicons name="refresh" size={24} color={COLORS.gold} />
          </View>
          <Text style={styles.actionText}>New Devotional</Text>
        </TouchableOpacity>
      </View>

      {/* Today's Prayer */}
      {devotional?.prayer && (
        <View style={styles.prayerContainer}>
          <View style={styles.prayerHeader}>
            <Ionicons name="hand-left" size={20} color={COLORS.gold} />
            <Text style={styles.prayerTitle}>Today's Prayer</Text>
          </View>
          {devotional.prayer.split('\n\n').map((paragraph, index) => (
            <Text key={index} style={styles.prayerText}>
              {paragraph.trim()}
            </Text>
          ))}
        </View>
      )}

      {/* Verse of the Day - Relocated from Explore */}
      <View style={styles.dailyCard}>
        <View style={styles.dailyBadge}>
          <Text style={styles.dailyBadgeText}>VERSE OF THE DAY</Text>
        </View>
        <Text style={styles.dailyVerse}>
          "For I know the plans I have for you,” declares the Lord, “plans to prosper you and not to harm you, plans to give you hope and a future."
        </Text>
        <Text style={styles.dailyRef}>Jeremiah 29:11 (KJV)</Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => handleShareVerse("For I know the plans I have for you,” declares the Lord, “plans to prosper you and not to harm you, plans to give you hope and a future.", "Jeremiah 29:11", "KJV")}
        >
           <Ionicons name="share-social-outline" size={20} color={COLORS.gold} />
           <Text style={styles.shareText}>Share Grace</Text>
        </TouchableOpacity>
      </View>

      {/* Mood Selector - Relocated from Explore */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How are you feeling?</Text>
        <View style={styles.moodGrid}>
          {MOODS.map((mood) => (
            <TouchableOpacity
              key={mood.id}
              style={[
                styles.moodButton,
                selectedMood?.id === mood.id && { backgroundColor: mood.color }
              ]}
              onPress={() => setSelectedMood(mood)}
            >
              <Ionicons
                name={mood.icon as any}
                size={24}
                color={selectedMood?.id === mood.id ? COLORS.white : mood.color}
              />
              <Text style={[
                styles.moodLabel,
                selectedMood?.id === mood.id && { color: COLORS.white }
              ]}>{mood.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedMood && (
          <Animated.View style={[styles.moodInspiration, { opacity: fadeAnim }]}>
            <Ionicons name="quote" size={24} color={selectedMood.color} style={styles.quoteIcon} />
            <Text style={styles.moodVerse}>{selectedMood.verse}</Text>
            <Text style={[styles.moodRef, { color: selectedMood.color }]}>{selectedMood.ref}</Text>
            <TouchableOpacity
              style={[styles.studyLinkedButton, { borderColor: selectedMood.color }]}
              onPress={() => router.push({ pathname: '/search', params: { q: `Overcoming ${selectedMood.label} with God's word` } })}
            >
              <Text style={[styles.studyLinkedText, { color: selectedMood.color }]}>Deep Dive Study</Text>
              <Ionicons name="arrow-forward" size={16} color={selectedMood.color} />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
  },
  contentContainer: {
    paddingBottom: SPACING.xxl,
  },
  
  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  loadingContent: {
    alignItems: 'center',
  },
  spinner: {
    marginVertical: SPACING.lg,
  },
  loadingText: {
    fontSize: FONTS.ui.size.large,
    color: COLORS.gold,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: FONTS.ui.size.small,
    color: COLORS.grayLight,
    marginTop: SPACING.sm,
  },
  
  // Date Header
  dateHeader: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
  },
  dateText: {
    fontSize: FONTS.ui.size.large,
    color: COLORS.gold,
    fontWeight: '600',
    textAlign: 'center',
  },
  dateSubtext: {
    fontSize: FONTS.ui.size.small,
    color: COLORS.grayLight,
    marginTop: SPACING.xs,
  },
  
  // Devotional Card
  cardWrapper: {
    marginHorizontal: SPACING.md,
    marginTop: -30,
  },
  devotionalCard: {
    backgroundColor: COLORS.parchment,
    borderRadius: 20,
    ...SHADOWS.large,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.parchmentDark,
  },
  goldAccent: {
    height: 4,
    backgroundColor: COLORS.gold,
    width: '100%',
  },
  cardContent: {
    padding: SPACING.lg,
  },
  topicTitle: {
    fontSize: FONTS.ui.size.xlarge,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  
  // Key Verse
  verseContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.offWhite,
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
  },
  verseIcon: {
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  verseTextContainer: {
    flex: 1,
  },
  verseReference: {
    fontSize: FONTS.ui.size.small,
    fontWeight: '700',
    color: COLORS.goldDark,
  },
  verseRefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  versionTag: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.gold,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verseText: {
    fontSize: FONTS.scripture.size.medium,
    fontFamily: FONTS.scripture.regular,
    color: COLORS.primary,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  
  // Preview
  previewText: {
    fontSize: FONTS.ui.size.medium,
    color: COLORS.grayDark,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  
  // Read More
  readMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.offWhite,
    paddingTop: SPACING.md,
  },
  readMoreText: {
    fontSize: FONTS.ui.size.small,
    color: COLORS.gold,
    fontWeight: '600',
    marginRight: SPACING.xs,
  },
  
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xl,
    marginHorizontal: SPACING.md,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: 16,
    ...SHADOWS.small,
    flex: 1,
    marginHorizontal: 4,
    minHeight: 90,
    justifyContent: 'center',
  },
  actionIconContainer: {
    marginBottom: SPACING.xs,
  },
  actionText: {
    fontSize: FONTS.ui.size.tiny,
    color: COLORS.primary,
    fontWeight: '600',
  },
  
  // Version Selector
  versionSelector: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  versionTitle: {
    fontSize: FONTS.ui.size.small,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  versionScrollContent: {
    paddingRight: SPACING.md,
  },
  versionChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
  },
  selectedVersionChip: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  versionChipText: {
    fontSize: FONTS.ui.size.small,
    color: COLORS.grayDark,
    fontWeight: '500',
  },
  selectedVersionChipText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  
  // Prayer
  prayerContainer: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    padding: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.gold,
  },
  prayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  prayerTitle: {
    fontSize: FONTS.ui.size.medium,
    color: COLORS.gold,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  prayerText: {
    fontSize: FONTS.ui.size.medium,
    color: COLORS.white,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },

  // Verse of the Day
  dailyCard: {
    marginTop: SPACING.xl,
    marginHorizontal: SPACING.md,
    backgroundColor: COLORS.parchment,
    borderRadius: 20,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: COLORS.parchmentDark,
  },
  dailyBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  dailyBadgeText: {
    color: COLORS.goldDark,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  dailyVerse: {
    fontSize: 20,
    fontFamily: 'serif',
    color: COLORS.primary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 30,
  },
  dailyRef: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.goldDark,
    marginTop: SPACING.md,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.lg,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  shareText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.goldDark,
  },

  // Mood Section
  section: {
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  moodGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodButton: {
    width: (width - 64) / 4,
    aspectRatio: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  moodLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    color: COLORS.grayDark,
  },
  moodInspiration: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 16,
    ...SHADOWS.small,
    alignItems: 'center',
  },
  quoteIcon: {
    marginBottom: 8,
    opacity: 0.3,
  },
  moodVerse: {
    fontSize: 18,
    color: COLORS.primary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 26,
  },
  moodRef: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
  },
  studyLinkedButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  studyLinkedText: {
    fontSize: 12,
    fontWeight: '700',
    marginRight: 4,
  },
});
