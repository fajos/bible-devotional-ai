// app/(tabs)/search.js
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS, FONTS, SHADOWS, SPACING } from '../../constants/theme';
import bibleAPIService from '../../services/bibleApi';
import openaiService from '../../services/openai';
import * as store from '../../services/store';

export default function SearchScreen() {
  const { q } = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (q) {
      setSearchQuery(q);
      // Automatically trigger search if query is provided
      // Wait a bit for layout
      setTimeout(() => {
        handleSearch(q);
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

  // First, validate if the topic is biblical
  const validateBiblicalTopic = async (topic) => {
    try {
      const validationPrompt = `Is "${topic}" a biblical topic, person, event, or concept found in the Bible? 
      Answer with ONLY "YES" or "NO". 
      If it's a general life question (like "how to be happy"), determine if the Bible addresses this topic.`;
      
      const response = await openaiService.generateContent(validationPrompt);
      return response.trim().toUpperCase().includes('YES');
    } catch (error) {
      console.error('Validation error:', error);
      return false;
    }
  };

  // Generate study content
  const generateStudyContent = async (topic) => {
    try {
      return await openaiService.generateBibleStudy(topic);
    } catch (error) {
      console.error('Generation error:', error);
      throw error;
    }
  };

  // Parse the AI response into structured data
  const parseStudyContent = (content, topic) => {
    const stripMarkdown = (text) => {
      if (!text) return '';
      return text
        .replace(/#+\s/g, '') // Remove markdown headers
        .replace(/\*\*/g, '') // Remove bold
        .replace(/\*/g, '')   // Remove italics
        .replace(/__/g, '')   // Remove underline
        .replace(/`/g, '')    // Remove code ticks
        .replace(/^[\s-•*]+/, '') // Remove leading bullets/dashes/asterisks
        .trim();
    };

    const study = {
      id: `study_${Date.now()}`,
      date: new Date().toISOString(),
      topic: stripMarkdown(topic),
      type: 'study',
      content: '',
      keyVerse: null,
      verses: [],
      historicalContext: '',
      oldTestamentShadows: '',
      newTestamentFulfillment: '',
      application: '',
      prayer: '',
      questions: [],
      prayerPoints: [],
      bibleVersion: 'KJV',
    };

    const sections = content.split('\n\n');
    let currentSection = '';

    const lines = content.split('\n');

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (trimmed.startsWith('TOPIC:')) {
        study.topic = stripMarkdown(trimmed.replace('TOPIC:', ''));
      } else if (trimmed.startsWith('KEY_VERSE:')) {
        const verseRef = stripMarkdown(trimmed.replace('KEY_VERSE:', ''));
        study.keyVerse = { reference: verseRef, text: '' };
      } else if (trimmed.startsWith('INTRODUCTION:')) {
        currentSection = 'introduction';
      } else if (trimmed.startsWith('KEY_VERSES:')) {
        currentSection = 'verses';
      } else if (trimmed.startsWith('HISTORICAL_CONTEXT:')) {
        currentSection = 'historicalContext';
      } else if (trimmed.startsWith('OLD_TESTAMENT_SHADOWS:')) {
        currentSection = 'otShadows';
      } else if (trimmed.startsWith('NEW_TESTAMENT_FULFILLMENT:')) {
        currentSection = 'ntFulfillment';
      } else if (trimmed.startsWith('STUDY_NOTES:')) {
        currentSection = 'content';
      } else if (trimmed.startsWith('PRACTICAL_APPLICATION:')) {
        currentSection = 'application';
      } else if (trimmed.startsWith('DISCUSSION_QUESTIONS:')) {
        currentSection = 'questions';
      } else if (trimmed.startsWith('PRAYER_POINTS:')) {
        currentSection = 'prayerPoints';
      } else {
        switch (currentSection) {
          case 'introduction':
            study.introduction = (study.introduction ? study.introduction + '\n' : '') + stripMarkdown(trimmed);
            break;
          case 'content':
            study.content += (study.content ? '\n\n' : '') + stripMarkdown(trimmed);
            break;
          case 'historicalContext':
            study.historicalContext += (study.historicalContext ? ' ' : '') + stripMarkdown(trimmed);
            break;
          case 'otShadows':
            study.oldTestamentShadows += (study.oldTestamentShadows ? ' ' : '') + stripMarkdown(trimmed);
            break;
          case 'ntFulfillment':
            study.newTestamentFulfillment += (study.newTestamentFulfillment ? ' ' : '') + stripMarkdown(trimmed);
            break;
          case 'verses':
            if (trimmed.startsWith('-')) {
              const part = trimmed.substring(1).trim(); // Remove leading dash
              // Try to find the separator between reference and explanation
              // We look for ": " or " - " which are common separators
              let separatorIndex = part.indexOf(': ');
              let sepLen = 2;

              if (separatorIndex === -1) {
                separatorIndex = part.indexOf(' - ');
                sepLen = 3;
              }

              if (separatorIndex !== -1) {
                study.verses.push({
                  reference: stripMarkdown(part.substring(0, separatorIndex)),
                  explanation: stripMarkdown(part.substring(separatorIndex + sepLen)),
                });
              } else {
                study.verses.push({ reference: stripMarkdown(part), explanation: '' });
              }
            }
            break;
          case 'application':
            study.application += (study.application ? '\n' : '') + stripMarkdown(trimmed);
            break;
          case 'questions':
            if (trimmed.match(/^\d\./)) {
              study.questions.push(stripMarkdown(trimmed.replace(/^\d\.\s*/, '')));
            }
            break;
          case 'prayerPoints':
            if (trimmed.startsWith('-')) {
              study.prayerPoints.push(stripMarkdown(trimmed.replace(/^-\s*/, '')));
            }
            break;
        }
      }
    });

    return study;
  };

  // Fetch actual Bible verse text
const fetchVerseTexts = async (study) => {
  try {
    // We'll use a free version (KJV) for search results to save API credits
    // unless the user has specifically requested a version (feature for later)
    const preferredVersionId = 'de4e12af7f28f599-01'; // King James Version (Free fallback)
    const preferredName = 'King James Version';

    // Fetch key verse
    if (study.keyVerse?.reference) {
      console.log('Fetching key verse:', study.keyVerse.reference);
      try {
        const verseData = await bibleAPIService.getFormattedVerse(
          preferredVersionId,
          study.keyVerse.reference,
          preferredName
        );
        console.log('Key verse data:', verseData);
        
        if (verseData && verseData.content) {
          // Clean up the verse text - remove HTML tags if any
          const cleanText = verseData.content.replace(/<[^>]*>/g, '').trim();
          study.keyVerse.text = cleanText;
        } else if (verseData && verseData.text) {
          study.keyVerse.text = verseData.text;
        } else {
          console.log('No verse data returned for key verse');
          study.keyVerse.text = 'Verse text unavailable';
        }
      } catch (verseError) {
        console.error('Error fetching key verse:', verseError);
        study.keyVerse.text = 'Error loading verse';
      }
    }

    // Fetch other verses
    if (study.verses && study.verses.length > 0) {
      for (let verse of study.verses) {
        if (verse.reference) {
          console.log('Fetching verse:', verse.reference);
          try {
            const verseData = await bibleAPIService.getFormattedVerse(
              preferredVersionId,
              verse.reference,
              preferredName
            );
            
            if (verseData && verseData.content) {
              const cleanText = verseData.content.replace(/<[^>]*>/g, '').trim();
              verse.text = cleanText;
            } else if (verseData && verseData.text) {
              verse.text = verseData.text;
            } else {
              verse.text = 'Verse text unavailable';
            }
          } catch (verseError) {
            console.error(`Error fetching verse ${verse.reference}:`, verseError);
            verse.text = 'Error loading verse';
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in fetchVerseTexts:', error);
  }
  
  return study;
};

  const handleSearch = async (overrideQuery) => {
    // Determine the query, ensuring we handle string overrides vs event objects from UI components
    const queryToUse = typeof overrideQuery === 'string' ? overrideQuery : searchQuery;

    if (!queryToUse || !queryToUse.trim()) {
      Alert.alert('Please Enter a Topic', 'Type a biblical topic, person, or question to study.');
      return;
    }

    setLoading(true);
    const trimmedQuery = queryToUse.trim();
    try {
      // Step 1: Validate if topic is biblical
      const isBiblical = await validateBiblicalTopic(trimmedQuery);
      
      if (!isBiblical) {
        Alert.alert(
          'Not a Biblical Topic',
          `"${trimmedQuery}" doesn't appear to be a biblical topic. Please try searching for:\n\n• A biblical person (e.g., Moses, David, Paul)\n• A biblical concept (e.g., faith, grace, salvation)\n• A Bible story or event\n• A spiritual question the Bible addresses`,
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      // Step 2: Generate study content
      const aiContent = await generateStudyContent(trimmedQuery);
      
      // Step 3: Parse the content
      let study = parseStudyContent(aiContent, trimmedQuery);
      
      // Step 4: Fetch actual Bible verses
      study = await fetchVerseTexts(study);
      
      // Step 5: Save to storage and navigate
      store.storeDevotional(study);
setLoading(false);
router.push(`/devotional/${study.id}`);
      
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert(
        'Error',
        'Unable to generate study. Please check your internet connection and try again.'
      );
      setLoading(false);
    }
  };

  const handleTopicPress = (topic) => {
    setSearchQuery(topic.query);
    handleSearch(topic.query);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Header */}
        <View style={styles.searchHeader}>
          <Text style={styles.headerTitle}>Explore the Word</Text>
          <Text style={styles.headerSubtitle}>
            Search any biblical topic, person, or question
          </Text>
        </View>

        {/* Search Input */}
        <View style={styles.searchInputContainer}>
          <View style={styles.inputWrapper}>
            <Ionicons name="search" size={20} color={COLORS.gray} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="e.g., Faith, David and Goliath, How to forgive..."
              placeholderTextColor={COLORS.gray}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={COLORS.gray} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.searchButton, loading && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color={COLORS.white} />
                <Text style={styles.searchButtonText}>Generate Study</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Popular Topics */}
        <View style={styles.topicsSection}>
          <Text style={styles.sectionTitle}>Popular Topics</Text>
          <View style={styles.topicsGrid}>
            {popularTopics.map((topic, index) => (
              <TouchableOpacity
                key={index}
                style={styles.topicCard}
                onPress={() => handleTopicPress(topic)}
              >
                <Text style={styles.topicIcon}>{topic.icon}</Text>
                <Text style={styles.topicLabel}>{topic.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Search Tips */}
        <View style={styles.tipsSection}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb" size={20} color={COLORS.gold} />
            <Text style={styles.tipsTitle}>Search Tips</Text>
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipItem}>
              <Text style={styles.tipHighlight}>Be specific:</Text> "Sermon on the Mount" vs just "Jesus"
            </Text>
            <Text style={styles.tipItem}>
              <Text style={styles.tipHighlight}>Ask questions:</Text> "How to overcome fear biblically?"
            </Text>
            <Text style={styles.tipItem}>
              <Text style={styles.tipHighlight}>Name people:</Text> "Life lessons from Joseph"
            </Text>
            <Text style={styles.tipItem}>
              <Text style={styles.tipHighlight}>Explore themes:</Text> "Covenants in the Bible"
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
    marginHorizontal: SPACING.md,
    marginTop: -25,
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
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  topicsSection: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.ui.size.large,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  topicCard: {
    width: '23%',
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
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
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