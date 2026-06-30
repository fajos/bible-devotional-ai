import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as Speech from 'expo-speech';
import React, { JSX, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import { BACKGROUND_OPTIONS, FONT_OPTIONS, TEXT_COLOR_OPTIONS } from '../../constants/sharing';
import { COLORS, FONTS, SHADOWS, SPACING, isTablet } from '../../constants/theme';
import * as store from '../../services/store';
import bibleApi from '../../services/bibleApi';
import { useAppTheme } from '../../context/ThemeContext';
import ScripturePreviewModal from '../../components/ScripturePreviewModal';
import { wrapScriptures } from '../../utils/scriptureParser';

const { width } = Dimensions.get('window');

interface KeyVerse {
  reference: string;
  text: string;
}

interface VerseItem {
  reference: string;
  text?: string;
  explanation?: string;
}

interface Devotional {
  id: string;
  date: string;
  topic?: string;
  keyVerse?: KeyVerse | null;
  content?: string;
  historicalContext?: string;
  theologicalInsight?: string;
  oldTestamentShadows?: string;
  newTestamentFulfillment?: string;
  crossReferences: string[];
  application?: string;
  prayer?: string;
  questions?: string[];
  bibleVersion?: string;
  verses: VerseItem[];
  type?: string;
  character?: string;
  biblicalNarrative?: string;
  strengthsAndVirtues?: string[];
  failuresAndLessons?: string[];
  christConnection?: string;
}

interface StudyKeyVerse {
  reference: string;
  actualText?: string;
  context?: string;
}

interface StudyData {
  id: string;
  type?: string;
  date?: string;
  topic?: string;
  keyVerses?: StudyKeyVerse[];
  studyNotes?: string;
  introduction?: string;
  rawContent?: string;
  historicalContext?: string;
  theologicalInsight?: string;
  oldTestamentShadows?: string;
  oldTestamentRefs?: string;
  newTestamentFulfillment?: string;
  newTestamentRefs?: string;
  crossReferences?: string[];
  practicalApplication?: string;
  application?: string;
  prayerPoints?: string[];
  prayer?: string;
  discussionQuestions?: string[];
  bibleVersion?: string;
  verses?: VerseItem[];
  content?: string;
  reference?: string;
}

type BackgroundOption = typeof BACKGROUND_OPTIONS[number];

type DevotionalSource = Devotional | StudyData;

const markdownStyles = StyleSheet.create({
  body: {
    color: COLORS.primary,
    fontSize: 16,
    lineHeight: 24,
  },
  heading1: {
    color: COLORS.goldDark,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 10,
  },
  heading2: {
    color: COLORS.goldDark,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    marginBottom: 12,
  },
  strong: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});

export default function DevotionalDetailScreen(): JSX.Element {
    const { colors, isDarkMode } = useAppTheme();
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [devotional, setDevotional] = useState<Devotional | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [isSaved, setIsSaved] = useState<boolean>(false);
    const [showFullContent, setShowFullContent] = useState<boolean>(false);
    const viewShotRef = useRef<React.ElementRef<typeof ViewShot> | null>(null);

    const [selectedBackground, setSelectedBackground] = useState<BackgroundOption>(BACKGROUND_OPTIONS[0]);
    const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0]);
    const [selectedTextColor, setSelectedTextColor] = useState(TEXT_COLOR_OPTIONS[0]);
    const [shareModalVisible, setShareModalVisible] = useState<boolean>(false);

    const [isSavingImage, setIsSavingImage] = useState<boolean>(false);

    const [isSpeaking, setIsSpeaking] = useState(false);
    const isSpeakingRef = useRef<boolean>(false);

    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewReference, setPreviewReference] = useState<string | null>(null);

    const isLightBg: boolean = selectedBackground.id === 'parchment';
    const textColor: string = isLightBg ? COLORS.primary : COLORS.white;
    const goldColor: string = isLightBg ? COLORS.goldDark : COLORS.gold;

    useEffect(() => {
      loadDevotional();
    }, [id]);

    useEffect(() => {
        if (devotional && !devotional.keyVerse?.text) {
            fetchMissingVerseText(devotional).then(updated => {
                if (updated.keyVerse?.text) {
                    setDevotional(updated);
                }
            });
        }
    }, [devotional?.id]);

  // Format study data to match devotional display format
const adaptStudyToDevotional = (study: StudyData): Devotional => {
  return {
    id: study.id,
    date: study.date || new Date().toISOString(),
    topic: study.topic,
    keyVerse: (study.keyVerses && study.keyVerses[0]) ? {
      reference: study.keyVerses[0].reference,
      text: study.keyVerses[0].actualText || study.keyVerses[0].context || '',
    } : (study.reference ? { reference: study.reference, text: '' } : null),
    content: study.content || study.studyNotes || study.introduction || study.rawContent,
    historicalContext: study.historicalContext,
    theologicalInsight: study.theologicalInsight,
    oldTestamentShadows: study.oldTestamentShadows || study.oldTestamentRefs,
    newTestamentFulfillment: study.newTestamentFulfillment || study.newTestamentRefs,
    crossReferences: study.crossReferences || [],
    application: study.practicalApplication || study.application,
    prayer: study.prayerPoints?.join('\n') || study.prayer,
    questions: study.discussionQuestions,
    bibleVersion: study.bibleVersion,
    verses: study.verses || [],
  };
};

const repairMalformedData = (data: Devotional): Devotional => {
  const clean = (text?: string) => {
    if (!text) return text;
    return text
      .replace(/^THEOLOGICAL_TITLE:?\s*/i, '')
      .replace(/^THEOLOGICAL TITLE:?\s*/i, '')
      .replace(/^CHARACTER:?\s*/i, '')
      .replace(/^KEY_VERSE:?\s*/i, '')
      .replace(/^KEY VERSE:?\s*/i, '')
      .replace(/[\[\]]/g, '')
      .trim();
  };

  return {
    ...data,
    topic: clean(data.topic),
    character: clean(data.character),
    keyVerse: data.keyVerse ? {
      ...data.keyVerse,
      reference: clean(data.keyVerse.reference) || ''
    } : data.keyVerse
  };
};

const isStudyData = (data: DevotionalSource): data is StudyData => {
  return data.type === 'study' ||
    'keyVerses' in data ||
    'studyNotes' in data ||
    'discussionQuestions' in data ||
    'prayerPoints' in data;
};

const resolveDevotional = (data: DevotionalSource): Devotional => {
  let resolved: Devotional;
  if (data.type === 'character_spotlight') {
    resolved = data as any as Devotional;
  } else {
    resolved = isStudyData(data) ? adaptStudyToDevotional(data) : data;
  }
  return repairMalformedData(resolved);
};

const fetchMissingVerseText = async (devotional: Devotional): Promise<Devotional> => {
  if (devotional.keyVerse && devotional.keyVerse.reference && !devotional.keyVerse.text) {
    try {
      let bibleId = devotional.bibleVersion || 'NKJV';

      // Resolve abbreviation to actual ID if possible
      const { API_CONFIG } = require('../../services/config');
      if (API_CONFIG.BIBLE_API.versions[bibleId]) {
          bibleId = API_CONFIG.BIBLE_API.versions[bibleId];
      }

      const verseData = await bibleApi.getFormattedVerse(bibleId, devotional.keyVerse.reference);
      if (verseData && verseData.content) {
        return {
          ...devotional,
          keyVerse: {
            ...devotional.keyVerse,
            text: verseData.content
          }
        };
      }
    } catch (e) {
      console.error('Error fetching missing verse text:', e);
    }
  }
  return devotional;
};

const loadDevotional = async (): Promise<void> => {
  try {
    // First, try to get from the in-memory store (most recent)
    let storedData: DevotionalSource | null = store.getStoredDevotional();
    
    if (storedData && storedData.id === id) {
      let devotionalData = resolveDevotional(storedData);
      devotionalData = await fetchMissingVerseText(devotionalData);
      setDevotional(devotionalData);
      checkIfSaved(devotionalData.id);
      setLoading(false);
      return;
    }

    // If not in store, check today's cached devotional
    const today: string = new Date().toDateString();
    let cachedData: DevotionalSource | null = await store.getCachedData(`daily_${today}`);
    
    if (cachedData) {
      if (cachedData.id === id) {
        let devotionalData = resolveDevotional(cachedData);
        devotionalData = await fetchMissingVerseText(devotionalData);
        setDevotional(devotionalData);
        checkIfSaved(devotionalData.id);
        setLoading(false);
        return;
      }
    }

    // Check saved devotionals in library
    const saved: DevotionalSource[] = await store.getSavedDevotionals();
    if (saved && saved.length > 0) {
      let found: DevotionalSource | undefined = saved.find(item => item.id === id);
      if (found) {
        let devotionalData = resolveDevotional(found);
        devotionalData = await fetchMissingVerseText(devotionalData);
        setDevotional(devotionalData);
        setIsSaved(true);
        setLoading(false);
        return;
      }
    }

    // Not found anywhere
    setLoading(false);
    Alert.alert(
      'Not Found',
      'This devotional could not be loaded.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  } catch (error) {
    console.error('Error loading devotional:', error);
    setLoading(false);
  }
};

  const checkIfSaved = async (devotionalId: string): Promise<void> => {
    try {
      const saved: DevotionalSource[] = await store.getSavedDevotionals();
      setIsSaved(saved.some(item => item.id === devotionalId));
    } catch (error) {
      console.error('Error checking saved:', error);
    }
  };

  const toggleSave = async (): Promise<void> => {
    if (!devotional) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const newSavedState = await store.toggleSaveDevotional(devotional);
      setIsSaved(newSavedState);

      Alert.alert(
        newSavedState ? 'Saved' : 'Removed',
        newSavedState ? 'Devotional added to your library' : 'Devotional removed from your library'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update library');
    }
  };

  const handleShare = async (): Promise<void> => {
    if (!devotional) return;

    try {
      const version: string = devotional.bibleVersion || 'KJV';

      let shareContent: string = `📖 ${devotional.topic?.startsWith('Insight:') ? 'INSIGHT' : 'STUDY'}: ${devotional.topic}\n`;
      if (devotional.date) {
        shareContent += `${new Date(devotional.date).toLocaleDateString()}\n`;
      }
      shareContent += `\n`;

      if (devotional.keyVerse) {
        shareContent += `📌 KEY VERSE: ${devotional.keyVerse.reference} (${version})\n`;
        shareContent += `"${devotional.keyVerse.text}"\n\n`;
      }

      if (devotional.content) {
        shareContent += `${devotional.topic?.startsWith('Insight:') ? '💡 AI INSIGHT' : '📝 DEVOTIONAL CONTENT'}\n${devotional.content}\n\n`;
      }

      if (devotional.historicalContext) {
        shareContent += `📜 HISTORICAL CONTEXT\n${devotional.historicalContext}\n\n`;
      }

      if (devotional.theologicalInsight) {
        shareContent += `💡 THEOLOGICAL INSIGHT\n${devotional.theologicalInsight}\n\n`;
      }

      if (devotional.application) {
        shareContent += `🌱 LIFE APPLICATION\n${devotional.application}\n\n`;
      }

      if (devotional.prayer) {
        shareContent += `🙏 PRAYER\n${devotional.prayer}\n\n`;
      }

      if (devotional.questions && devotional.questions.length > 0) {
        shareContent += `❓ REFLECTION QUESTIONS\n${devotional.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\n`;
      }

      shareContent += `Generated by Bible Devotional AI`;

      await Share.share({
        message: shareContent,
        title: devotional.topic,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const captureAndShareImage = async (): Promise<void> => {
    try {
      if (viewShotRef.current) {
        setIsSavingImage(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Delay to ensure the modal state is stable and rendering is complete
        setTimeout(async () => {
          try {
            // @ts-ignore
            const uri: string = await viewShotRef.current.capture();
            await Sharing.shareAsync(uri);
          } catch (e) {
            console.error('Capture inner error:', e);
            Alert.alert('Error', 'Failed to capture screen.');
          } finally {
            setIsSavingImage(false);
          }
        }, 500);
      }
    } catch (error) {
      console.error('Capture error:', error);
      setIsSavingImage(false);
      Alert.alert('Error', 'Failed to generate share image.');
    }
  };

  const stopSpeech = async () => {
    isSpeakingRef.current = false;
    setIsSpeaking(false);
    try {
      await Speech.stop();
    } catch (e) {
      console.log('Stop error:', e);
    }
  };

  const toggleSpeech = async () => {
    if (isSpeaking || isSpeakingRef.current) {
      await stopSpeech();
      return;
    }

    if (!devotional) return;

    // 1. Prepare parts to read
    const textParts = [];
    if (devotional.topic) textParts.push(devotional.topic);
    if (devotional.character) textParts.push(`Bible Character Spotlight: ${devotional.character}`);
    if (devotional.keyVerse?.reference) textParts.push(`Key Verse: ${devotional.keyVerse.reference}`);
    if (devotional.keyVerse?.text) textParts.push(devotional.keyVerse.text);
    if (devotional.biblicalNarrative) textParts.push(`Biblical Narrative: ${devotional.biblicalNarrative}`);
    if (devotional.strengthsAndVirtues && devotional.strengthsAndVirtues.length > 0) {
      textParts.push("Strengths and Virtues:");
      devotional.strengthsAndVirtues.forEach(s => textParts.push(s));
    }
    if (devotional.failuresAndLessons && devotional.failuresAndLessons.length > 0) {
      textParts.push("Failures and Lessons:");
      devotional.failuresAndLessons.forEach(l => textParts.push(l));
    }
    if (devotional.christConnection) textParts.push(`Christ Connection: ${devotional.christConnection}`);
    if (devotional.content) textParts.push(devotional.content);
    if (devotional.historicalContext) textParts.push(`Historical Context: ${devotional.historicalContext}`);
    if (devotional.theologicalInsight) textParts.push(`Theological Insight: ${devotional.theologicalInsight}`);
    if (devotional.application) textParts.push(`Life Application: ${devotional.application}`);
    if (devotional.prayer) textParts.push(`Prayer: ${devotional.prayer}`);

    if (textParts.length === 0) return;

    // 2. Setup
    setIsSpeaking(true);
    isSpeakingRef.current = true;
    await Speech.stop();

    try {
      const prefs = await store.getAudioPreferences();
      const voiceId = prefs?.voiceIdentifier;
      const rate = prefs?.rate || 0.9;

      // 3. Narration Loop
      for (const part of textParts) {
        if (!isSpeakingRef.current) break;

        // Clean text of markdown/custom brackets
        const cleanText = part
          .replace(/\[\[|\]\]/g, '')
          .replace(/\*\*|\*|_|#/g, '')
          .trim();

        if (!cleanText) continue;

        await new Promise((resolve) => {
          Speech.speak(cleanText, {
            voice: voiceId,
            rate: rate,
            onDone: () => resolve(true),
            onStopped: () => {
              isSpeakingRef.current = false;
              resolve(false);
            },
            onError: (err) => {
              console.error('Speech part error:', err);
              resolve(false);
            }
          });
        });

        if (!isSpeakingRef.current) break;
      }
    } catch (error) {
      console.error('TTS Detail Error:', error);
    } finally {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    }
  };

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  if (loading) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.gold} />
    </View>
  );
}

if (!devotional) {
  return (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle" size={60} color={COLORS.gray} />
      <Text style={styles.errorText}>Devotional not found</Text>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

return (
  <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
    {/* Header Section */}
    <View style={styles.header}>
      <View style={[styles.headerOverlay, { paddingTop: insets.top + SPACING.md }]}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.gold} />
        </TouchableOpacity>

        {devotional.type === 'character_spotlight' && (
          <Text style={styles.headerSubtitle}>Weekly Character Spotlight</Text>
        )}
        <Text style={styles.headerTitle}>
          {devotional.character || devotional.topic || 'Devotional'}
        </Text>
        <View style={styles.headerMeta}>
          <View style={styles.versionBadge}>
            <Ionicons name="book" size={14} color={COLORS.gold} />
            <Text style={styles.versionText}>
              {devotional.type === 'character_spotlight' ? devotional.topic : (devotional.bibleVersion || devotional.type || 'Study')}
            </Text>
          </View>
        </View>
      </View>
    </View>

    {/* Action Buttons */}
    <View style={[styles.actionsBar, { backgroundColor: colors.surface }]}>
      <TouchableOpacity
        style={[styles.actionButton, isSaved && styles.actionButtonActive]}
        onPress={toggleSave}
      >
        <Ionicons
          name={isSaved ? 'bookmark' : 'bookmark-outline'}
          size={20}
          color={isSaved ? COLORS.white : COLORS.gold}
        />
        <Text style={[styles.actionButtonText, isSaved && styles.actionButtonTextActive]}>
          {isSaved ? 'Saved' : 'Save'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, isSpeaking && styles.actionButtonActive]}
        onPress={toggleSpeech}
      >
        <Ionicons
          name={isSpeaking ? 'stop-circle' : 'volume-high-outline'}
          size={20}
          color={isSpeaking ? COLORS.white : COLORS.gold}
        />
        <Text style={[styles.actionButtonText, isSpeaking && styles.actionButtonTextActive]}>
          {isSpeaking ? 'Stop' : 'Listen'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
        <Ionicons name="share-outline" size={20} color={COLORS.gold} />
        <Text style={styles.actionButtonText}>Text</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={() => setShareModalVisible(true)}>
        <Ionicons name="image-outline" size={20} color={COLORS.gold} />
        <Text style={styles.actionButtonText}>Image</Text>
      </TouchableOpacity>
    </View>

    {/* Shareable Card (Hidden or just for capture) */}
    <ViewShot
      ref={viewShotRef}
      options={{ format: 'png', quality: 1.0 }}
      style={styles.shareCardContainer}
    >
      <View style={[styles.shareCard, { backgroundColor: selectedBackground.type === 'color' ? selectedBackground.color : COLORS.primary }]}>
        {selectedBackground.type === 'image' && (
          <Image
            source={{ uri: selectedBackground.url }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        )}
        <View style={[
          styles.shareCardBorder,
          { backgroundColor: isLightBg ? 'rgba(255,255,255,0.2)' : 'transparent' }
        ]}>
          <Ionicons name="chatbox-ellipses" size={60} color={isLightBg ? 'rgba(0,0,0,0.1)' : 'rgba(212, 175, 55, 0.3)'} style={styles.quoteIcon} />

          <View style={styles.shareCardBody}>
            <Text style={[
              styles.shareCardText,
              {
                color: selectedTextColor.color,
                fontFamily: selectedFont.family,
                fontStyle: (selectedFont as any).style || 'normal'
              }
            ]}>
              {devotional.keyVerse?.text}
            </Text>

            <View style={[styles.shareCardDivider, { backgroundColor: selectedTextColor.color === '#FFFFFF' ? goldColor : selectedTextColor.color }]} />

            <Text style={[styles.shareCardReference, { color: selectedTextColor.color === '#FFFFFF' ? goldColor : selectedTextColor.color }]}>
              {devotional.keyVerse?.reference}
            </Text>
            <Text style={[styles.shareCardVersion, { color: selectedTextColor.color, opacity: 0.6 }]}>
              {devotional.bibleVersion || 'NKJV'}
            </Text>
          </View>

          <View style={styles.shareCardFooter}>
            <Ionicons name="sparkles" size={24} color={goldColor} />
            <Text style={[styles.shareCardAppName, { color: isLightBg ? 'rgba(0,0,0,0.3)' : 'rgba(212, 175, 55, 0.7)' }]}>BIBLE DEVOTIONAL AI</Text>
          </View>
        </View>
      </View>
    </ViewShot>

    {/* Key Verse - if exists */}
    {devotional.keyVerse && devotional.keyVerse.reference && (
      <View style={styles.keyVerseSection}>
        <View style={styles.keyVerseHeader}>
          <Ionicons name="bookmark" size={24} color={COLORS.gold} />
          <Text style={[styles.keyVerseTitle, { color: colors.text }]}>Key Verse</Text>
        </View>
        <TouchableOpacity
          style={[styles.keyVerseCard, { backgroundColor: colors.surface }]}
          onPress={() => {
            const reference = devotional.keyVerse?.reference;
            if (reference) {
              router.push(`/verse-compare/${encodeURIComponent(reference)}`);
            }
          }}
        >
          <View style={styles.keyVerseRefRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.keyVerseReference, { color: isDarkMode ? colors.gold : COLORS.goldDark }]}>
                {devotional.keyVerse?.reference}
              </Text>
              <Text style={styles.versionTagSmall}>
                ({devotional.bibleVersion || 'KJV'})
              </Text>
            </View>
            <View style={[styles.compareBadge, { backgroundColor: isDarkMode ? 'rgba(212, 175, 55, 0.2)' : 'rgba(212, 175, 55, 0.1)' }]}>
              <Text style={[styles.compareBadgeText, { color: isDarkMode ? colors.gold : COLORS.goldDark }]}>COMPARE</Text>
              <Ionicons name="chevron-forward" size={12} color={isDarkMode ? colors.gold : COLORS.gold} />
            </View>
          </View>
          {devotional.keyVerse.text ? (
            <Text
              style={[styles.keyVerseText, { color: colors.text }]}
              numberOfLines={6}
              ellipsizeMode="tail"
            >
              "{devotional.keyVerse.text}"
            </Text>
          ) : (
            <Text style={styles.keyVerseTextLoading}>
              Verse text loading...
            </Text>
          )}
        </TouchableOpacity>
      </View>
    )}

    {/* Historical & Theological Context */}
    {devotional.biblicalNarrative && (
      <View style={styles.contextSection}>
        <View style={[styles.contextCard, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="journal" size={20} color={COLORS.gold} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Biblical Narrative</Text>
          </View>
          <Text style={[styles.contextText, { color: colors.text }]}>
            {wrapScriptures(devotional.biblicalNarrative).split(/(\[\[.*?\]\])/g).map((part, i) => {
              if (part.startsWith('[[') && part.endsWith(']]')) {
                const ref = part.slice(2, -2);
                return (
                  <Text
                    key={i}
                    style={{ color: COLORS.goldDark, fontWeight: 'bold', textDecorationLine: 'underline' }}
                    onPress={() => {
                      setPreviewReference(ref);
                      setPreviewVisible(true);
                      Haptics.selectionAsync();
                    }}
                  >
                    {ref}
                  </Text>
                );
              }
              return part;
            })}
          </Text>
        </View>
      </View>
    )}

    {devotional.strengthsAndVirtues && devotional.strengthsAndVirtues.length > 0 && (
      <View style={styles.contextSection}>
        <View style={[styles.contextCard, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trending-up" size={20} color={COLORS.gold} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Strengths & Virtues</Text>
          </View>
          {devotional.strengthsAndVirtues.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.gold} style={{ marginTop: 2 }} />
              <Text style={[styles.listItemText, { color: colors.text }]}>{item}</Text>
            </View>
          ))}
        </View>
      </View>
    )}

    {devotional.failuresAndLessons && devotional.failuresAndLessons.length > 0 && (
      <View style={styles.contextSection}>
        <View style={[styles.contextCard, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="warning" size={20} color={COLORS.gold} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Failures & Lessons</Text>
          </View>
          {devotional.failuresAndLessons.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <Ionicons name="information-circle" size={16} color={COLORS.goldDark} style={{ marginTop: 2 }} />
              <Text style={[styles.listItemText, { color: colors.text }]}>{item}</Text>
            </View>
          ))}
        </View>
      </View>
    )}

    {devotional.christConnection && (
      <View style={styles.contextSection}>
        <View style={[styles.synthesisCard, { backgroundColor: isDarkMode ? colors.surface : COLORS.primaryLight }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="infinite" size={20} color={COLORS.gold} />
            <Text style={[styles.sectionTitle, { color: isDarkMode ? colors.text : COLORS.white }]}>Christ Connection</Text>
          </View>
          <Text style={[styles.synthesisText, { color: isDarkMode ? colors.text : COLORS.white }]}>
            {wrapScriptures(devotional.christConnection).split(/(\[\[.*?\]\])/g).map((part, i) => {
              if (part.startsWith('[[') && part.endsWith(']]')) {
                const ref = part.slice(2, -2);
                return (
                  <Text
                    key={i}
                    style={{ color: COLORS.gold, fontWeight: 'bold', textDecorationLine: 'underline' }}
                    onPress={() => {
                      setPreviewReference(ref);
                      setPreviewVisible(true);
                      Haptics.selectionAsync();
                    }}
                  >
                    {ref}
                  </Text>
                );
              }
              return part;
            })}
          </Text>
        </View>
      </View>
    )}

    {(devotional.historicalContext || devotional.theologicalInsight) && (
      <View style={styles.contextSection}>
        {devotional.historicalContext && (
          <View style={[styles.contextCard, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="map" size={20} color={COLORS.gold} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Historical Context</Text>
            </View>
            <Text style={[styles.contextText, { color: colors.text }]}>
              {wrapScriptures(devotional.historicalContext).split(/(\[\[.*?\]\])/g).map((part, i) => {
                if (part.startsWith('[[') && part.endsWith(']]')) {
                  const ref = part.slice(2, -2);
                  return (
                    <Text
                      key={i}
                      style={{ color: COLORS.goldDark, fontWeight: 'bold', textDecorationLine: 'underline' }}
                      onPress={() => {
                        setPreviewReference(ref);
                        setPreviewVisible(true);
                        Haptics.selectionAsync();
                      }}
                    >
                      {ref}
                    </Text>
                  );
                }
                return part;
              })}
            </Text>
          </View>
        )}
        {devotional.theologicalInsight && (
          <View style={[styles.contextCard, { marginTop: SPACING.md, backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="infinite" size={20} color={COLORS.gold} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Theological Insight</Text>
            </View>
            <Text style={[styles.contextText, { color: colors.text }]}>
              {wrapScriptures(devotional.theologicalInsight).split(/(\[\[.*?\]\])/g).map((part, i) => {
                if (part.startsWith('[[') && part.endsWith(']]')) {
                  const ref = part.slice(2, -2);
                  return (
                    <Text
                      key={i}
                      style={{ color: COLORS.goldDark, fontWeight: 'bold', textDecorationLine: 'underline' }}
                      onPress={() => {
                        setPreviewReference(ref);
                        setPreviewVisible(true);
                        Haptics.selectionAsync();
                      }}
                    >
                      {ref}
                    </Text>
                  );
                }
                return part;
              })}
            </Text>
          </View>
        )}
      </View>
    )}

    {/* Main Content - Always show this */}
    {devotional.type !== 'character_spotlight' && (
      <View style={styles.contentSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="document-text" size={20} color={COLORS.gold} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {devotional.topic?.startsWith('Insight:') ? 'AI Verse Insight' : 'Exegesis & Study Notes'}
          </Text>
        </View>
        <View style={[styles.contentCard, { backgroundColor: colors.surface }]}>
          {devotional.content ? (
            <Markdown
              style={{
                ...markdownStyles,
                body: { ...markdownStyles.body, color: colors.text },
                strong: { ...markdownStyles.strong, color: isDarkMode ? colors.gold : COLORS.primary }
              }}
              rules={{
                text: (node, children, parent, styles) => {
                  const text = node.content;
                  if (!text) return null;

                  const parts = text.split(/(\[\[.*?\]\])/g);
                  return (
                    <Text key={node.key} style={styles.body}>
                      {parts.map((part: string, i: number) => {
                        if (part.startsWith('[[') && part.endsWith(']]')) {
                          const ref = part.slice(2, -2);
                          return (
                            <Text
                              key={i}
                              style={{ color: COLORS.goldDark, fontWeight: 'bold', textDecorationLine: 'underline' }}
                              onPress={() => {
                                setPreviewReference(ref);
                                setPreviewVisible(true);
                                Haptics.selectionAsync();
                              }}
                            >
                              {ref}
                            </Text>
                          );
                        }
                        return part;
                      })}
                    </Text>
                  );
                }
              }}
            >
              {wrapScriptures(devotional.content)}
            </Markdown>
          ) : (
            <Text style={[styles.contentText, { color: colors.textSecondary }]}>Content loading...</Text>
          )}
        </View>
      </View>
    )}

    {/* Synthesis Box with click support */}
    {(devotional.oldTestamentShadows || devotional.newTestamentFulfillment) && (
      <View style={styles.synthesisSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="git-compare" size={20} color={COLORS.gold} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>OT Shadow & NT Fulfillment</Text>
        </View>
        <View style={[styles.synthesisCard, { backgroundColor: isDarkMode ? colors.surface : COLORS.primaryLight }]}>
          {devotional.oldTestamentShadows && (
            <View style={styles.synthesisBox}>
              <Text style={styles.synthesisLabel}>OLD TESTAMENT SHADOW</Text>
              <Text style={[styles.synthesisText, { color: isDarkMode ? colors.text : COLORS.white }]}>
                {wrapScriptures(devotional.oldTestamentShadows).split(/(\[\[.*?\]\])/g).map((part, i) => {
                  if (part.startsWith('[[') && part.endsWith(']]')) {
                    const ref = part.slice(2, -2);
                    return (
                      <Text
                        key={i}
                        style={{ color: COLORS.gold, fontWeight: 'bold', textDecorationLine: 'underline' }}
                        onPress={() => {
                          setPreviewReference(ref);
                          setPreviewVisible(true);
                          Haptics.selectionAsync();
                        }}
                      >
                        {ref}
                      </Text>
                    );
                  }
                  return part;
                })}
              </Text>
            </View>
          )}
          {devotional.newTestamentFulfillment && (
            <View style={[styles.synthesisBox, { borderTopWidth: 1, borderTopColor: 'rgba(212, 175, 55, 0.2)', paddingTop: SPACING.md, marginTop: SPACING.md }]}>
              <Text style={styles.synthesisLabel}>NEW TESTAMENT FULFILLMENT</Text>
              <Text style={[styles.synthesisText, { color: isDarkMode ? colors.text : COLORS.white }]}>
                {wrapScriptures(devotional.newTestamentFulfillment).split(/(\[\[.*?\]\])/g).map((part, i) => {
                  if (part.startsWith('[[') && part.endsWith(']]')) {
                    const ref = part.slice(2, -2);
                    return (
                      <Text
                        key={i}
                        style={{ color: COLORS.gold, fontWeight: 'bold', textDecorationLine: 'underline' }}
                        onPress={() => {
                          setPreviewReference(ref);
                          setPreviewVisible(true);
                          Haptics.selectionAsync();
                        }}
                      >
                        {ref}
                      </Text>
                    );
                  }
                  return part;
                })}
              </Text>
            </View>
          )}
        </View>
      </View>
    )}

    {/* Verses - if exists */}
    {devotional.verses && devotional.verses.length > 0 && (
      <View style={styles.crossRefSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="git-branch" size={20} color={COLORS.gold} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Bible Verses</Text>
        </View>
        {devotional.verses.map((verse, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.crossRefCard, { backgroundColor: colors.surface }]}
            onPress={() => {
              setPreviewReference(verse.reference);
              setPreviewVisible(true);
              Haptics.selectionAsync();
            }}
          >
            <View style={styles.crossRefNumber}>
              <Text style={styles.crossRefNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.crossRefContent}>
              <Text style={[styles.crossRefReference, { color: colors.text }]}>{verse.reference}</Text>
              {verse.text && (
                <Text style={[styles.crossRefText, { color: colors.text }]} numberOfLines={3}>
                  "{verse.text}"
                </Text>
              )}
              {verse.explanation && verse.explanation !== verse.text && (
                <Text style={[styles.crossRefExplanation, { color: colors.text, opacity: 0.8 }]}>{verse.explanation}</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    )}

    {/* Application - if exists */}
    {devotional.application && (
      <View style={styles.applicationSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="bulb" size={20} color={COLORS.gold} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Life Application</Text>
        </View>
        <View style={[styles.applicationCard, { backgroundColor: isDarkMode ? colors.surface : colors.primary }]}>
          {devotional.application.split('\n\n').map((paragraph, index) => (
            <Text key={index} style={[styles.applicationText, { color: isDarkMode ? colors.text : COLORS.white }]}>
              {paragraph.trim()}
            </Text>
          ))}
        </View>
      </View>
    )}

    {/* Prayer - if exists */}
    {devotional.prayer && (
      <View style={styles.prayerSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="hand-left" size={20} color={COLORS.gold} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Prayer</Text>
        </View>
        <View style={[styles.prayerCard, { backgroundColor: colors.surface }]}>
          {devotional.prayer.split('\n\n').map((paragraph, index) => (
            <Text key={index} style={[styles.prayerText, { color: colors.text }]}>
              {paragraph.trim()}
            </Text>
          ))}
        </View>
      </View>
    )}

    {/* Questions - if exists */}
    {devotional.questions && devotional.questions.length > 0 && (
      <View style={styles.questionsSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="chatbubbles" size={20} color={COLORS.gold} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Reflection Questions</Text>
        </View>
        {devotional.questions.map((question, index) => (
          <View key={index} style={[styles.questionCard, { backgroundColor: colors.surface }]}>
            <Text style={styles.questionNumber}>Q{index + 1}</Text>
            <Text style={[styles.questionText, { color: colors.text }]}>{question}</Text>
          </View>
        ))}
      </View>
    )}

    {/* Bottom Actions */}
    <View style={styles.bottomActions}>
      <TouchableOpacity
        style={[styles.generateNewButton, { backgroundColor: isDarkMode ? colors.surface : colors.primary }]}
        onPress={() => router.push('/search')}
      >
        <Ionicons name="search" size={20} color={isDarkMode ? colors.gold : COLORS.white} />
        <Text style={[styles.generateNewText, { color: isDarkMode ? colors.gold : COLORS.white }]}>Search New Topic</Text>
      </TouchableOpacity>
    </View>

    <ScripturePreviewModal
      visible={previewVisible}
      reference={previewReference}
      onClose={() => setPreviewVisible(false)}
      bibleVersion={devotional.bibleVersion}
    />

    {/* Share Modal */}
    <Modal
      visible={shareModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShareModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { height: '80%', backgroundColor: colors.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.offWhite }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Share Verse Image</Text>
            <TouchableOpacity onPress={() => setShareModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.sharePreviewContainer}>
              <View style={[styles.sharePreviewCard, { backgroundColor: selectedBackground.type === 'color' ? selectedBackground.color : colors.primary }]}>
                {selectedBackground.type === 'image' && (
                  <Image
                    source={{ uri: selectedBackground.url }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  />
                )}
                <View style={[
                  styles.sharePreviewCardBorder,
                  { backgroundColor: isLightBg ? 'rgba(255,255,255,0.2)' : 'transparent' }
                ]}>
                  <Text
                    style={[
                      styles.sharePreviewText,
                      {
                        color: selectedTextColor.color,
                        fontFamily: selectedFont.family,
                        fontStyle: (selectedFont as any).style || 'normal'
                      }
                    ]}
                    numberOfLines={6}
                  >
                    {devotional.keyVerse?.text}
                  </Text>
                  <Text style={[styles.sharePreviewRef, { color: selectedTextColor.color === '#FFFFFF' ? goldColor : selectedTextColor.color }]}>
                    {devotional.keyVerse?.reference}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={[styles.sectionLabel, { color: colors.text }]}>Select Background</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bgOptionsScroll}
            >
              {BACKGROUND_OPTIONS.map((bg) => (
                <TouchableOpacity
                  key={bg.id}
                  style={[
                    styles.bgOptionCard,
                    selectedBackground.id === bg.id && styles.bgOptionCardActive
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedBackground(bg);
                  }}
                >
                  {bg.type === 'image' ? (
                    <Image source={{ uri: bg.url }} style={styles.bgOptionThumb} />
                  ) : (
                    <View style={[styles.bgOptionThumb, { backgroundColor: bg.color }]} />
                  )}
                  <Text style={[styles.bgOptionLabel, { color: colors.textSecondary }]}>{bg.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.sectionLabel, { color: colors.text }]}>Select Font</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bgOptionsScroll}
            >
              {FONT_OPTIONS.map((font) => (
                <TouchableOpacity
                  key={font.id}
                  style={[
                    styles.fontOptionCard,
                    { backgroundColor: colors.offWhite },
                    selectedFont.id === font.id && [styles.fontOptionCardActive, { backgroundColor: isDarkMode ? colors.gold : colors.primary }]
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedFont(font);
                  }}
                >
                  <Text style={[
                    styles.fontOptionLabel,
                    { fontFamily: font.family, fontStyle: (font as any).style || 'normal', color: colors.text },
                    selectedFont.id === font.id && styles.fontOptionLabelActive
                  ]}>
                    {font.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.sectionLabel, { color: colors.text }]}>Select Text Color</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bgOptionsScroll}
            >
              {TEXT_COLOR_OPTIONS.map((color) => (
                <TouchableOpacity
                  key={color.id}
                  style={[
                    styles.colorOptionCard,
                    selectedTextColor.id === color.id && styles.colorOptionCardActive
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedTextColor(color);
                  }}
                >
                  <View style={[styles.colorOptionThumb, { backgroundColor: color.color }]} />
                  <Text style={[styles.colorOptionLabel, { color: colors.textSecondary }]}>{color.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.confirmShareButton, isSavingImage && { opacity: 0.7 }]}
              onPress={captureAndShareImage}
              disabled={isSavingImage}
            >
              {isSavingImage ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Ionicons name="share-social" size={22} color={COLORS.white} />
              )}
              <Text style={styles.confirmShareText}>
                {isSavingImage ? 'Preparing Image...' : 'Share Now'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
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
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  
  // Loading & Error
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.offWhite,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: FONTS.ui.size.large,
    color: COLORS.gray,
    marginTop: SPACING.md,
  },
  backButton: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.gold,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 8,
  },
  backButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  
  // Header
  header: {
    backgroundColor: COLORS.primary,
    minHeight: 200,
  },
  headerOverlay: {
    padding: SPACING.xl,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    marginLeft: -SPACING.sm,
  },
  headerDate: {
    fontSize: FONTS.ui.size.small,
    color: COLORS.grayLight,
    marginBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONTS.ui.size.title,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  headerSubtitle: {
    fontSize: FONTS.ui.size.tiny,
    color: COLORS.gold,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  versionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 15,
  },
  versionText: {
    fontSize: FONTS.ui.size.tiny,
    color: COLORS.gold,
    marginLeft: SPACING.xs,
    fontWeight: '600',
  },
  
  // Actions Bar
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: SPACING.md,
    marginTop: -20,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.sm,
    ...SHADOWS.medium,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  actionButtonActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  actionButtonText: {
    fontSize: FONTS.ui.size.small,
    color: COLORS.gold,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  actionButtonTextActive: {
    color: COLORS.white,
  },
  
  // Key Verse
  keyVerseSection: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  keyVerseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  keyVerseTitle: {
    fontSize: FONTS.ui.size.large,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  keyVerseCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.gold,
    ...SHADOWS.small,
  },
  keyVerseReference: {
    fontSize: FONTS.ui.size.medium,
    fontWeight: '700',
    color: COLORS.goldDark,
  },
  versionTagSmall: {
    fontSize: 10,
    color: COLORS.gold,
    marginLeft: 6,
    fontWeight: '600',
  },
  keyVerseRefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  compareBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  compareBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.goldDark,
    marginRight: 2,
  },
  keyVerseText: {
    fontSize: FONTS.scripture.size.large,
    fontFamily: FONTS.scripture.regular,
    color: COLORS.primary,
    fontStyle: 'italic',
    lineHeight: 30,
  },
  keyVerseTextLoading: {
    fontSize: FONTS.ui.size.medium,
    color: COLORS.gray,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  copyrightText: {
    fontSize: FONTS.ui.size.tiny,
    color: COLORS.gray,
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  },
  
  // Content
  contentSection: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.ui.size.large,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  contentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  contentText: {
    fontSize: FONTS.ui.size.medium,
    color: COLORS.grayDark,
    lineHeight: 26,
    marginBottom: SPACING.md,
  },
  readMoreLink: {
    color: COLORS.gold,
    fontWeight: '600',
    marginTop: SPACING.sm,
  },
  
  // Cross References
  crossRefSection: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  crossRefCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  crossRefNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  crossRefNumberText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONTS.ui.size.small,
  },
  crossRefContent: {
    flex: 1,
  },
  crossRefReference: {
    fontSize: FONTS.ui.size.medium,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  crossRefText: {
    fontSize: FONTS.ui.size.small,
    color: COLORS.grayDark,
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  crossRefExplanation: {
    fontSize: FONTS.ui.size.tiny,
    color: COLORS.gray,
  },
  
  // Application
  applicationSection: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  applicationCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.gold,
  },
  applicationText: {
    fontSize: FONTS.ui.size.medium,
    color: COLORS.white,
    lineHeight: 24,
    marginBottom: SPACING.sm,
  },
  
  // Prayer
  prayerSection: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  prayerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gold,
    ...SHADOWS.small,
  },
  prayerText: {
    fontSize: FONTS.ui.size.medium,
    color: COLORS.primary,
    fontStyle: 'italic',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  
  // Questions
  questionsSection: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  questionCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  questionNumber: {
    fontSize: FONTS.ui.size.small,
    fontWeight: '700',
    color: COLORS.gold,
    marginRight: SPACING.md,
    marginTop: 2,
  },
  questionText: {
    flex: 1,
    fontSize: FONTS.ui.size.medium,
    color: COLORS.grayDark,
    lineHeight: 22,
  },
  
  // Bottom Actions
  bottomActions: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.xl,
  },

  // New Sections Styles
  contextSection: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  contextCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  contextText: {
    fontSize: FONTS.ui.size.medium,
    color: COLORS.grayDark,
    lineHeight: 24,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    paddingRight: SPACING.sm,
  },
  listItemText: {
    fontSize: FONTS.ui.size.medium,
    lineHeight: 22,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  synthesisSection: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  synthesisCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  synthesisBox: {
    flex: 1,
  },
  synthesisLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.gold,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  synthesisText: {
    fontSize: FONTS.ui.size.medium,
    color: COLORS.white,
    lineHeight: 22,
    fontStyle: 'italic',
  },

  generateNewButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  generateNewText: {
    color: COLORS.white,
    fontSize: FONTS.ui.size.medium,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  // Share Card Styles
  shareCardContainer: {
    position: 'absolute',
    left: -3000,
    width: 1080,
  },
  shareCard: {
    backgroundColor: COLORS.primary,
    padding: 40,
    width: 1080,
    height: 1350, // 4:5 aspect ratio
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareCardBorder: {
    flex: 1,
    width: '100%',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    borderRadius: 20,
    padding: 80,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
  },
  quoteIcon: {
    marginBottom: 20,
  },
  shareCardBody: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  shareCardText: {
    color: COLORS.white,
    fontSize: 58,
    fontFamily: FONTS.scripture?.regular || 'System',
    fontStyle: 'italic',
    lineHeight: 88,
    textAlign: 'center',
    marginBottom: 40,
  },
  shareCardDivider: {
    width: 120,
    height: 3,
    backgroundColor: COLORS.gold,
    marginVertical: 40,
    borderRadius: 2,
  },
  shareCardReference: {
    color: COLORS.gold,
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
  },
  shareCardVersion: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 10,
    letterSpacing: 4,
  },
  shareCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
  },
  shareCardAppName: {
    color: 'rgba(212, 175, 55, 0.7)',
    fontSize: 24,
    fontWeight: '800',
    marginLeft: 15,
    letterSpacing: 6,
  },
  // Modal Overlay & Basic Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  // Share Modal Styles
  sharePreviewContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sharePreviewCard: {
    width: width * 0.7,
    aspectRatio: 4/5,
    borderRadius: 12,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  sharePreviewCardBorder: {
    flex: 1,
    margin: 15,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    borderRadius: 8,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sharePreviewText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
    fontFamily: 'serif',
  },
  sharePreviewRef: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 10,
    letterSpacing: 1,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
  },
  bgOptionsScroll: {
    paddingBottom: 10,
  },
  bgOptionCard: {
    width: 80,
    alignItems: 'center',
    marginRight: 12,
  },
  bgOptionCardActive: {
    transform: [{ scale: 1.05 }],
  },
  bgOptionThumb: {
    width: 70,
    height: 70,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 6,
  },
  bgOptionLabel: {
    fontSize: 11,
    color: COLORS.grayDark,
    fontWeight: '500',
  },
  fontOptionCard: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.offWhite,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  fontOptionCardActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  fontOptionLabel: {
    fontSize: 14,
    color: COLORS.primary,
  },
  fontOptionLabelActive: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  colorOptionCard: {
    width: 60,
    alignItems: 'center',
    marginRight: 12,
  },
  colorOptionCardActive: {
    transform: [{ scale: 1.05 }],
  },
  colorOptionThumb: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 6,
  },
  colorOptionLabel: {
    fontSize: 10,
    color: COLORS.grayDark,
  },
  confirmShareButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 25,
    marginBottom: 10,
  },
  confirmShareText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
