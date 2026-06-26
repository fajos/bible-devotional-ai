// app/(tabs)/search.tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import * as Haptics from 'expo-haptics';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS, FONTS, SHADOWS, SPACING, isTablet } from '../../constants/theme';
import { generateBibleStudy, generateReadingPlan } from '../../services/devotionalEngine';
import openaiService from '../../services/openai';
import * as store from '../../services/store';
import { useAppTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');
const MAX_CONTENT_WIDTH = 600;
const sideMargin = isTablet ? (width - MAX_CONTENT_WIDTH) / 2 : SPACING.md;

export default function SearchScreen() {
  const { colors, isDarkMode } = useAppTheme();
  const { q, mode } = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState(mode === 'plan' ? 'plan' : 'study'); // 'study' or 'plan'
  const [planDuration, setPlanDuration] = useState(7);
  const router = useRouter();

  useEffect(() => {
    if (mode === 'plan') {
      setSearchMode('plan');
    }
  }, [mode]);

  useEffect(() => {
    if (q) {
      const queryStr = Array.isArray(q) ? q[0] : q;
      setSearchQuery(queryStr);
      setTimeout(() => {
        handleSearch(queryStr);
      }, 500);
    }
  }, [q]);

  const popularTopics = [
    { icon: '🙏', label: 'Faith', query: 'Faith in God' },
    { icon: '❤️', label: 'Love', query: 'God\'s Love' },
    { icon: '🕊️', label: 'Holy Spirit', query: 'The Holy Spirit' },
    { icon: '✝️', label: 'Salvation', query: 'Salvation through Jesus' },
    { icon: '📖', label: 'Prayer', query: 'Power of Prayer' },
    { icon: '🌟', label: 'Hope', query: 'Hope in God' },
    { icon: '🛡️', label: 'Spiritual Armor', query: 'Armor of God' },
    { icon: '🍇', label: 'Fruits of Spirit', query: 'Fruits of the Spirit' },
    { icon: '👑', label: 'Kingdom of God', query: 'Kingdom of God' },
    { icon: '💪', label: 'Strength', query: 'Strength in the Lord' },
    { icon: '😇', label: 'Angels', query: 'Angels in the Bible' },
    { icon: '🔥', label: 'Moses', query: 'Life of Moses' },
  ];

  const handleSearch = async (overrideQuery?: string) => {
    const queryToUse = overrideQuery || searchQuery;

    if (!queryToUse || !queryToUse.trim()) {
      Alert.alert('Please Enter a Topic', 'Type a biblical topic, person, or question to study.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    const trimmedQuery = queryToUse.trim();
    try {
      // Step 1: Validate if topic is biblical
      const isBiblical = await openaiService.validateBiblicalTopic(trimmedQuery);

      if (!isBiblical) {
        Alert.alert(
          'Not a Biblical Topic',
          `"${trimmedQuery}" doesn't appear to be a biblical topic. Please try searching for:\n\n• A biblical person (e.g., Moses, David, Paul)\n• A biblical concept (e.g., faith, grace, salvation)\n• A Bible story or event\n• A spiritual question the Bible addresses`,
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      if (searchMode === 'plan') {
        const preferredVersion = await store.getPreferredBibleVersion();
        const plan = await generateReadingPlan(trimmedQuery, planDuration, preferredVersion);
        const planId = plan.id;

        // Use a slight delay before navigation for smoother transition feeling
        // This is where a cross-fade would be initiated if using a custom navigator
        await store.storeDevotional({
          id: planId,
          type: 'reading_plan',
          data: plan
        });

        setTimeout(() => {
          setLoading(false);
          router.push(`/reading-plan/${planId}`);
        }, 100);
        return;
      }

      // Step 2: Generate study content
      const preferredVersion = await store.getPreferredBibleVersion();
      const study = await generateBibleStudy(trimmedQuery, preferredVersion);

      // Step 3: Save to storage and navigate
      await store.storeDevotional(study);

      setTimeout(() => {
        setLoading(false);
        router.push(`/devotional/${study.id}`);
      }, 100);

    } catch (error) {
      console.error('Search error:', error);
      Alert.alert(
        'Error',
        'Unable to generate content. Please check your internet connection and try again.'
      );
      setLoading(false);
    }
  };

  const handleTopicPress = (topic: { query: string }) => {
    setSearchQuery(topic.query);
    handleSearch(topic.query);
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.searchHeader}>
          <Text style={styles.headerTitle}>
            {searchMode === 'plan' ? 'Personal Reading Plans' : 'Explore the Word'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {searchMode === 'plan'
              ? `Generate a ${planDuration}-day theological journey. Explore how the "Whole Counsel of God" speaks to your specific situation or season.`
              : 'Deep-dive into the original context, Hebrew/Greek meanings, and the unfolding story of God\'s redemption.'}
          </Text>
        </View>

        <View style={styles.searchInputContainer}>
          <View style={styles.modeSelectionContainer}>
            <TouchableOpacity
              style={[
                styles.modeCard,
                { backgroundColor: colors.surface },
                searchMode === 'study' && [styles.modeCardActive, { backgroundColor: isDarkMode ? colors.primaryLight : COLORS.primary }]
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSearchMode('study');
              }}
            >
              <View style={[styles.modeIconCircle, searchMode === 'study' && styles.modeIconCircleActive]}>
                <Ionicons name="book" size={24} color={searchMode === 'study' ? COLORS.white : COLORS.gold} />
              </View>
              <Text style={[styles.modeCardTitle, { color: colors.text }, searchMode === 'study' && styles.modeCardTitleActive]}>AI Study</Text>
              <Text style={[styles.modeCardDesc, { color: colors.textSecondary }, searchMode === 'study' && styles.modeCardDescActive]}>Theological deep-dive</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeCard,
                { backgroundColor: colors.surface },
                searchMode === 'plan' && [styles.modeCardActive, { backgroundColor: isDarkMode ? colors.primaryLight : COLORS.primary }]
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSearchMode('plan');
              }}
            >
              <View style={[styles.modeIconCircle, searchMode === 'plan' && styles.modeIconCircleActive]}>
                <Ionicons name="calendar" size={24} color={searchMode === 'plan' ? COLORS.white : COLORS.gold} />
              </View>
              <Text style={[styles.modeCardTitle, { color: colors.text }, searchMode === 'plan' && styles.modeCardTitleActive]}>Reading Plan</Text>
              <Text style={[styles.modeCardDesc, { color: colors.textSecondary }, searchMode === 'plan' && styles.modeCardDescActive]}>Custom roadmap</Text>
            </TouchableOpacity>
          </View>

          {searchMode === 'plan' && (
            <View style={[styles.durationSelector, { backgroundColor: colors.surface }]}>
              <Text style={[styles.durationLabel, { color: colors.text }]}>Plan Duration (Days):</Text>
              <View style={styles.durationOptions}>
                {[3, 5, 7, 14, 21, 30].map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.durationOption, planDuration === d && styles.durationOptionActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setPlanDuration(d);
                    }}
                  >
                    <Text style={[styles.durationOptionText, planDuration === d && styles.durationOptionTextActive]}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={[styles.inputWrapper, { backgroundColor: colors.surface }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={
                searchMode === 'plan'
                  ? "e.g. Sovereignty, The Covenants"
                  : "Topic (e.g. Romans 8 Exegesis)"
              }
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => handleSearch(searchQuery)}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.searchButton, loading && styles.searchButtonDisabled]}
            onPress={() => handleSearch(searchQuery)}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingButtonContent}>
                <ActivityIndicator size="small" color={COLORS.white} />
                <Text style={styles.searchButtonText}>Preparing your {searchMode === 'plan' ? 'Plan' : 'Study'}...</Text>
              </View>
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color={COLORS.white} />
                <Text style={styles.searchButtonText}>
                    {searchMode === 'plan' ? `Generate ${planDuration}-Day Plan` : 'Generate AI Study'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.topicsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Popular Topics</Text>
          <View style={styles.topicsGrid}>
            {popularTopics.map((topic, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.topicCard, { backgroundColor: colors.surface }]}
                onPress={() => handleTopicPress(topic)}
              >
                <Text style={styles.topicIcon}>{topic.icon}</Text>
                <Text style={[styles.topicLabel, { color: colors.text }]}>{topic.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.tipsSection}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb" size={20} color={COLORS.gold} />
            <Text style={[styles.tipsTitle, { color: colors.text }]}>Search Tips</Text>
          </View>
          <View style={[styles.tipCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.tipItem, { color: colors.textSecondary }]}>
              <Text style={[styles.tipHighlight, { color: colors.text }]}>Be specific:</Text> "Sermon on the Mount" vs just "Jesus"
            </Text>
            <Text style={[styles.tipItem, { color: colors.textSecondary }]}>
              <Text style={[styles.tipHighlight, { color: colors.text }]}>Ask questions:</Text> "How to overcome fear biblically?"
            </Text>
            <Text style={[styles.tipItem, { color: colors.textSecondary }]}>
              <Text style={[styles.tipHighlight, { color: colors.text }]}>Name people:</Text> "Life lessons from Joseph"
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: SPACING.xxl,
  },
  searchHeader: {
    backgroundColor: COLORS.primary,
    padding: SPACING.xl,
    paddingTop: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: FONTS.ui.size.xlarge,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  headerSubtitle: {
    fontSize: FONTS.ui.size.small,
    color: COLORS.grayLight,
    lineHeight: 20,
  },
  searchInputContainer: {
    marginHorizontal: sideMargin,
    marginTop: -25,
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    width: isTablet ? MAX_CONTENT_WIDTH : width - (SPACING.md * 2),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    ...SHADOWS.medium,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONTS.ui.size.medium,
    color: COLORS.primary,
  },
  searchButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    padding: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
    ...SHADOWS.small,
  },
  searchButtonDisabled: {
    opacity: 0.7,
  },
  searchButtonText: {
    color: COLORS.white,
    fontSize: FONTS.ui.size.medium,
    fontWeight: '700',
    marginLeft: SPACING.sm,
  },
  loadingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeSelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  modeCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.small,
  },
  modeCardActive: {
    borderColor: COLORS.gold,
    backgroundColor: COLORS.primary,
  },
  modeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  modeIconCircleActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  modeCardTitle: {
    fontSize: FONTS.ui.size.medium,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 2,
  },
  modeCardTitleActive: {
    color: COLORS.white,
  },
  modeCardDesc: {
    fontSize: 10,
    color: COLORS.gray,
    textAlign: 'center',
  },
  modeCardDescActive: {
    color: COLORS.grayLight,
  },
  durationSelector: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 12,
    ...SHADOWS.small,
  },
  durationLabel: {
    fontSize: FONTS.ui.size.small,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  durationOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  durationOption: {
    width: 40,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationOptionActive: {
    backgroundColor: COLORS.gold,
  },
  durationOptionText: {
    fontSize: FONTS.ui.size.small,
    color: COLORS.gold,
    fontWeight: '700',
  },
  durationOptionTextActive: {
    color: COLORS.white,
  },
  topicsSection: {
    marginHorizontal: sideMargin,
    marginTop: SPACING.lg,
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    width: isTablet ? MAX_CONTENT_WIDTH : width - (SPACING.md * 2),
  },
  sectionTitle: {
    fontSize: FONTS.ui.size.large,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.md,
    textAlign: isTablet ? 'center' : 'left',
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  topicCard: {
    width: isTablet ? '24%' : '31%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  topicIcon: {
    fontSize: 30,
    marginBottom: SPACING.xs,
  },
  topicLabel: {
    fontSize: FONTS.ui.size.tiny,
    color: COLORS.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  tipsSection: {
    marginHorizontal: sideMargin,
    marginTop: SPACING.lg,
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    width: isTablet ? MAX_CONTENT_WIDTH : width - (SPACING.md * 2),
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  tipsTitle: {
    fontSize: FONTS.ui.size.large,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  tipCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  tipItem: {
    fontSize: FONTS.ui.size.small,
    color: COLORS.grayDark,
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  tipHighlight: {
    fontWeight: '700',
    color: COLORS.primary,
  },
});
