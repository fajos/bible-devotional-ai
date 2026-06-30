// app/(tabs)/index.js
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { JSX, useEffect, useRef, useState } from 'react';
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
  View
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import { BACKGROUND_OPTIONS, FONT_OPTIONS, TEXT_COLOR_OPTIONS } from '../../constants/sharing';
import { COLORS, SHADOWS, SPACING, isTablet } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';
import { generateDailyDevotional, getOrGenerateVOTD, getWeeklyCharacterSpotlight } from '../../services/devotionalEngine';
import * as store from '../../services/store';

const { width } = Dimensions.get('window');

const MAX_CONTENT_WIDTH = 700;
const contentWidth = isTablet ? Math.min(width * 0.8, MAX_CONTENT_WIDTH) : width;
const sideMargin = (width - contentWidth) / 2;

const MOODS: Mood[] = [
  { id: 'anxious', label: 'Anxious', icon: 'leaf-outline', color: '#4A90E2', verse: "Peace I leave with you; my peace I give you.", ref: "John 14:27" },
  { id: 'tired', label: 'Tired', icon: 'bed-outline', color: '#F5A623', verse: "Come to me, all you who are weary and burdened.", ref: "Matthew 11:28" },
  { id: 'joyful', label: 'Joyful', icon: 'sunny-outline', color: '#7ED321', verse: "The joy of the Lord is your strength.", ref: "Nehemiah 8:10" },
  { id: 'lost', label: 'Lost', icon: 'compass-outline', color: '#BD10E0', verse: "Your word is a lamp for my feet, a light on my path.", ref: "Psalm 119:105" },
];

interface DailyVerse {
  text: string;
  ref: string;
  version: string;
  reflection?: string;
  challenge?: string;
}

const DAILY_VERSES: DailyVerse[] = [
  { text: "For I know the thoughts that I think toward you, says the LORD, thoughts of peace and not of evil, to give you a future and a hope.", ref: "Jeremiah 29:11", version: "NKJV" },
  { text: "The LORD is my shepherd; I shall not want.", ref: "Psalm 23:1", version: "NKJV" },
  { text: "I can do all things through Christ who strengthens me.", ref: "Philippians 4:13", version: "NKJV" },
  { text: "And we know that all things work together for good to those who love God, to those who are the called according to His purpose.", ref: "Romans 8:28", version: "NKJV" },
  { text: "Trust in the LORD with all your heart, And lean not on your own understanding; In all your ways acknowledge Him, And He shall direct your paths.", ref: "Proverbs 3:5-6", version: "NKJV" },
  { text: "But those who wait on the LORD Shall renew their strength; They shall mount up with wings like eagles, They shall run and not be weary, They shall walk and not faint.", ref: "Isaiah 40:31", version: "NKJV" },
  { text: "Be strong and of good courage, do not fear nor be afraid of them; for the LORD your God, He is the One who goes with you. He will not leave you nor forsake you.", ref: "Deuteronomy 31:6", version: "NKJV" },
  { text: "The grass withers, the flower fades, But the word of our God stands forever.", ref: "Isaiah 40:8", version: "NKJV" },
  { text: "But seek first the kingdom of God and His righteousness, and all these things shall be added to you.", ref: "Matthew 6:33", version: "NKJV" },
  { text: "He has shown you, O man, what is good; And what does the LORD require of you But to do justly, To love mercy, And to walk humbly with your God?", ref: "Micah 6:8", version: "NKJV" },
  { text: "Therefore, if anyone is in Christ, he is a new creation; old things have passed away; behold, all things have become new.", ref: "2 Corinthians 5:17", version: "NKJV" },
  { text: "Let your light so shine before men, that they may see your good works and glorify your Father in heaven.", ref: "Matthew 5:16", version: "NKJV" },
  { text: "The name of the LORD is a strong tower; The righteous run to it and are safe.", ref: "Proverbs 18:10", version: "NKJV" },
  { text: "Jesus Christ is the same yesterday, today, and forever.", ref: "Hebrews 13:8", version: "NKJV" },
  { text: "God is our refuge and strength, A very present help in trouble.", ref: "Psalm 46:1", version: "NKJV" },
  { text: "The Lord is not slack concerning His promise, as some count slackness, but is longsuffering toward us, not willing that any should perish but that all should come to repentance.", ref: "2 Peter 3:9", version: "NKJV" },
  { text: "I have been crucified with Christ; it is no longer I who live, but Christ lives in me; and the life which I now live in the flesh I live by faith in the Son of God, who loved me and gave Himself for me.", ref: "Galatians 2:20", version: "NKJV" },
  { text: "For God has not given us a spirit of fear, but of power and of love and of a sound mind.", ref: "2 Timothy 1:7", version: "NKJV" },
  { text: "Your word is a lamp to my feet And a light to my path.", ref: "Psalm 119:105", version: "NKJV" },
  { text: "Rejoice in the Lord always. Again I will say, rejoice!", ref: "Philippians 4:4", version: "NKJV" },
  { text: "Wait on the LORD; Be of good courage, And He shall strengthen your heart; Wait, I say, on the LORD!", ref: "Psalm 27:14", version: "NKJV" },
  { text: "In the beginning was the Word, and the Word was with God, and the Word was God.", ref: "John 1:1", version: "NKJV" },
  { text: "And the Word became flesh and dwelt among us, and we beheld His glory, the glory as of the only begotten of the Father, full of grace and truth.", ref: "John 1:14", version: "NKJV" },
  { text: "For by grace you have been saved through faith, and that not of yourselves; it is the gift of God, not of works, lest anyone should boast.", ref: "Ephesians 2:8-9", version: "NKJV" },
  { text: "Bless the LORD, O Soul; And all that is within me, bless His holy name!", ref: "Psalm 103:1", version: "NKJV" },
  { text: "Set your mind on things above, not on things on the earth.", ref: "Colossians 3:2", version: "NKJV" },
  { text: "Great is Your faithfulness.", ref: "Lamentations 3:23", version: "NKJV" },
  { text: "The LORD your God in your midst, The Mighty One, will save; He will rejoice over you with gladness, He will quiet you with His love, He will triumph over you with singing.", ref: "Zephaniah 3:17", version: "NKJV" },
  { text: "So then faith comes by hearing, and hearing by the word of God.", ref: "Romans 10:17", version: "NKJV" },
  { text: "And do not be conformed to this world, but be transformed by the renewing of your mind, that you may prove what is that good and acceptable and perfect will of God.", ref: "Romans 12:2", version: "NKJV" },
  { text: "Be kind to one another, tenderhearted, forgiving one another, even as God in Christ forgave you.", ref: "Ephesians 4:32", version: "NKJV" }
];

type Mood = {
  id: string;
  label: string;
  icon: string;
  color: string;
  verse: string;
  ref: string;
};

interface KeyVerse {
  text: string;
  reference: string;
}

interface Devotional {
  id?: string;
  topic: string;
  keyVerse?: KeyVerse;
  bibleVersion?: string;
  content: string;
  prayer?: string;
}

interface CharacterSpotlight {
  id: string;
  character: string;
  topic: string; // Theological title
  keyVerse: { reference: string; text?: string };
  biblicalNarrative: string;
  strengthsAndVirtues: string[];
  failuresAndLessons: string[];
  christConnection: string;
  application: string;
  prayer: string;
  type: string;
}

export default function DailyDevotionalScreen(): JSX.Element {
  const { colors, isDarkMode } = useAppTheme();
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [characterSpotlight, setCharacterSpotlight] = useState<CharacterSpotlight | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMessage, setLoadingMessage] = useState<string>('Opening the Word...');
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [readingProgress, setReadingProgress] = useState<any>(null);

  const [votd, setVotd] = useState<DailyVerse>(DAILY_VERSES[0]);
  const router = useRouter();
  const viewShotRef = useRef<any>(null);
  const [isSavingImage, setIsSavingImage] = useState<boolean>(false);

  const [selectedBackground, setSelectedBackground] = useState(BACKGROUND_OPTIONS[0]);
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0]);
  const [selectedTextColor, setSelectedTextColor] = useState(TEXT_COLOR_OPTIONS[0]);
  const [shareModalVisible, setShareModalVisible] = useState(false);

  const isLightBg = selectedBackground.id === 'parchment';

  useEffect(() => {
    loadCachedDevotional();
    loadReadingProgress();
    loadVOTD();
    loadCharacterSpotlight();
  }, []);

  const loadCharacterSpotlight = async () => {
    try {
      const preferredVersion = await store.getPreferredBibleVersion();
      const data = await getWeeklyCharacterSpotlight(preferredVersion);
      if (data) {
        setCharacterSpotlight(data as any);
      }
    } catch (error) {
      console.error('Failed to load character spotlight:', error);
    }
  };

  const loadVOTD = async () => {
    try {
      const data = await getOrGenerateVOTD();
      if (data) {
        // Clean the text from any existing quotation marks to avoid duplicates in UI
        const cleanText = data.text ? data.text.replace(/^["']|["']$/g, '').trim() : '';

        setVotd({
          text: cleanText,
          ref: data.reference,
          version: data.version || 'NKJV',
          reflection: data.reflection,
          challenge: data.challenge
        });
      }
    } catch (error) {
      console.error('Failed to load VOTD:', error);
      // Fallback already set by default state
    }
  };

  const loadReadingProgress = async () => {
    const progress = await store.getCachedData('bible_year_progress') || [];
    setReadingProgress(progress);
  };

  useEffect(() => {
    const loadingMessages = [
      'Opening the Word...',
      'Gathering scripture...',
      'Preparing your daily bread...',
      'Consulting the theologians...',
      'Shining light on the text...'
    ];

    if (loading) {
      let index = 0;
      const interval = setInterval(() => {
        index = (index + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[index]);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const loadCachedDevotional = async (): Promise<void> => {
    try {
      const today = new Date().toDateString();
      const cachedData = await store.getCachedData(`daily_${today}`);
      const preferredVersion = await store.getPreferredBibleVersion();

      // Ensure we only use cached data if it's the correct version
      if (cachedData && cachedData.bibleVersion === preferredVersion) {
        setDevotional(cachedData);
        setLoading(false);
        return;
      } else {
        // Fallback to daily devotional file if no cache entry exists for today's version
        const dailyFile = await store.getDailyDevotional();
        if (dailyFile && dailyFile.date === today && dailyFile.devotional?.bibleVersion === preferredVersion) {
          setDevotional(dailyFile.devotional);
          setLoading(false);
          return;
        }
      }
    } catch (error) {
      console.log('No valid cache found, generating new devotional');
    }
    
    loadDevotional();
  };

  const loadDevotional = async (): Promise<void> => {
    setLoading(true);
    try {
      const preferredVersion = await store.getPreferredBibleVersion();
      // Generate devotional with preferred version
      const result = await generateDailyDevotional(preferredVersion);

      // Ensure the result has the ID set correctly for routing
      if (!result.id) {
        result.id = `daily_${new Date().toDateString().replace(/\s/g, '_')}`;
      }

      setDevotional(result);
      
      // Cache for today
      const today = new Date().toDateString();
      await store.setCachedData(`daily_${today}`, result);
      await store.setDailyDevotional(today, result);
    } catch (error) {
      console.error('Failed to load devotional:', error);
      Alert.alert('Error', 'Unable to generate devotional. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShareVerse = async (verse: string, ref: string, version: string): Promise<void> => {
    Alert.alert(
      'Share Grace',
      'How would you like to share this verse?',
      [
        {
          text: 'Text Copy',
          onPress: () => {
            const message = `"${verse}" - ${ref} (${version})\n\nShared from Bible Devotional AI`;
            Share.share({ message });
          }
        },
        {
          text: 'Social Image',
          onPress: () => {
             setShareModalVisible(true);
          }
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const captureAndShareImage = async () => {
    try {
      if (viewShotRef.current) {
        setIsSavingImage(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Delay to ensure rendering
        setTimeout(async () => {
          try {
            const uri = await viewShotRef.current.capture();
            await Sharing.shareAsync(uri);
          } catch (e) {
            console.error('Capture inner error:', e);
            Alert.alert('Error', 'Failed to capture image.');
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

  const getProgressStats = () => {
    if (!readingProgress || !Array.isArray(readingProgress)) return { total: 0, percent: 0 };
    const daysCompleted = readingProgress.length;
    const percent = Math.round((daysCompleted / 365) * 100);
    return { total: daysCompleted, percent };
  };

  const stats = getProgressStats();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Daily Devotional</Text>
              <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
            </View>
            
          </View>

          {/* Journey Dashboard */}
          <TouchableOpacity
            style={styles.journeyCard}
            onPress={() => router.push('/bible-in-one-year')}
            activeOpacity={0.8}
          >
            <View style={styles.journeyInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.journeyTitle}>Bible in One Year</Text>
                <Ionicons name="chevron-forward" size={14} color={COLORS.gold} style={{ marginLeft: 4 }} />
              </View>
              <Text style={styles.journeyProgress}>{stats.total} of 365 Days Finished</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.max(stats.percent, 5)}%` }]} />
              <Text style={styles.progressPercent}>{stats.percent}%</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          {/* Date Header */}
          <View style={styles.dateHeader}>
            <Text style={styles.dateTextLabel}>
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
                style={[styles.devotionalCard, { backgroundColor: colors.parchment, borderColor: colors.parchmentDark }]}
                onPress={() => {
                  store.storeDevotional(devotional);
                  router.push(`/devotional/${devotional.id}`);
                }}
                activeOpacity={0.95}
              >
                <View style={styles.goldAccent} />
                <View style={styles.cardContent}>
                  <Text style={[styles.topicTitle, { color: isDarkMode ? colors.gold : colors.primary }]}>{devotional.topic}</Text>

                  {devotional.keyVerse && (
                    <View style={[styles.verseContainer, { backgroundColor: isDarkMode ? colors.primaryDark : colors.offWhite }]}>
                      <Ionicons name="bookmark" size={20} color={COLORS.gold} style={styles.verseIcon} />
                      <View style={styles.verseTextContainer}>
                        <View style={styles.verseRefRow}>
                          <Text style={[styles.verseReference, { color: isDarkMode ? colors.gold : COLORS.goldDark }]}>{devotional.keyVerse.reference}</Text>
                          <Text style={styles.versionTag}>{devotional.bibleVersion || 'NKJV'}</Text>
                        </View>
                        <Text style={[styles.verseText, { color: colors.text }]}>"{devotional.keyVerse.text}"</Text>
                      </View>
                    </View>
                  )}

                  <Text style={[styles.previewText, { color: colors.text }]} numberOfLines={6}>
                    {devotional.content}
                  </Text>

                  <View style={[styles.readMoreContainer, { borderTopColor: colors.offWhite }]}>
                    <Text style={styles.readMoreText}>Read Full Devotional</Text>
                    <Ionicons name="arrow-forward" size={16} color={COLORS.gold} />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.surface }]} onPress={() => router.push('/search')}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="search" size={24} color={COLORS.gold} />
              </View>
              <Text style={[styles.actionText, { color: colors.text }]}>Search Topic</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.surface }]} onPress={() => router.push('/library')}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="bookmarks" size={24} color={COLORS.gold} />
              </View>
              <Text style={[styles.actionText, { color: colors.text }]}>My Library</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.surface }]} onPress={() => router.push('/bible-in-one-year')}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="calendar" size={24} color={COLORS.gold} />
              </View>
              <Text style={[styles.actionText, { color: colors.text }]}>Yearly Plan</Text>
            </TouchableOpacity>
          </View>

          {/* Today's Prayer */}
          {devotional?.prayer && (
            <View style={[styles.prayerContainer, { backgroundColor: isDarkMode ? colors.surface : colors.primary }]}>
              <View style={styles.prayerHeader}>
                <Ionicons name="hand-left" size={20} color={COLORS.gold} />
                <Text style={styles.prayerTitle}>Today's Prayer</Text>
              </View>
              {devotional.prayer.split('\n\n').map((paragraph, index) => (
                <Text key={index} style={[styles.prayerText, { color: isDarkMode ? colors.text : COLORS.white }]}>
                  {paragraph.trim()}
                </Text>
              ))}
            </View>
          )}

          {/* Weekly Character Spotlight */}
          {characterSpotlight && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Weekly Spotlight</Text>
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.characterCard, { backgroundColor: colors.surface }]}
                onPress={() => {
                  store.storeDevotional(characterSpotlight as any);
                  router.push(`/devotional/${characterSpotlight.id}`);
                }}
                activeOpacity={0.9}
              >
                <View style={styles.characterIconContainer}>
                  <Ionicons name="person" size={32} color={COLORS.gold} />
                </View>
                <View style={styles.characterInfo}>
                  <Text style={[styles.characterName, { color: colors.text }]}>{characterSpotlight.character}</Text>
                  <Text style={[styles.characterTitle, { color: COLORS.goldDark }]}>{characterSpotlight.topic}</Text>
                  <Text style={[styles.characterLesson, { color: colors.textSecondary }]} numberOfLines={2}>
                    {characterSpotlight.application}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          <View style={[styles.dailyCard, { backgroundColor: colors.parchment, borderColor: colors.parchmentDark }]}>
            <View style={[styles.dailyBadge, { backgroundColor: isDarkMode ? 'rgba(212, 175, 55, 0.2)' : 'rgba(212, 175, 55, 0.1)' }]}>
              <Text style={[styles.dailyBadgeText, { color: isDarkMode ? colors.gold : COLORS.goldDark }]}>VERSE OF THE DAY</Text>
            </View>
            <Text style={[styles.dailyVerse, { color: colors.text }]}>
              "{votd.text}"
            </Text>
            <Text style={[styles.dailyRef, { color: isDarkMode ? colors.gold : COLORS.goldDark }]}>{votd.ref} ({votd.version})</Text>

            {votd.reflection && (
              <View style={styles.votdContent}>
                <Text style={[styles.votdReflection, { color: colors.text }]}>{votd.reflection}</Text>
                {votd.challenge && (
                  <View style={[styles.challengeBox, { backgroundColor: isDarkMode ? 'rgba(212, 175, 55, 0.1)' : 'rgba(212, 175, 55, 0.05)' }]}>
                    <Text style={[styles.challengeTitle, { color: COLORS.gold }]}>DAILY CHALLENGE</Text>
                    <Text style={[styles.challengeText, { color: colors.text }]}>{votd.challenge}</Text>
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[styles.shareActionBtn, { backgroundColor: colors.surface }]}
              onPress={() => handleShareVerse(votd.text, votd.ref, votd.version)}
            >
               <Ionicons name="share-social-outline" size={20} color={COLORS.gold} />
               <Text style={[styles.shareText, { color: isDarkMode ? colors.gold : COLORS.goldDark }]}>Share Grace</Text>
            </TouchableOpacity>
          </View>

          {/* Mood Selector - Relocated from Explore */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>How are you feeling?</Text>
            <View style={styles.moodGrid}>
              {MOODS.map((mood) => (
                <TouchableOpacity
                  key={mood.id}
                  style={[
                    styles.moodButton,
                    { backgroundColor: colors.surface },
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
                    { color: colors.textSecondary },
                    selectedMood?.id === mood.id && { color: COLORS.white }
                  ]}>{mood.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedMood && (
              <View style={[styles.moodResult, { backgroundColor: colors.surface }]}>
                <Ionicons name="chatbox-ellipses" size={40} color={selectedMood.color} style={styles.quoteIcon} />
                <Text style={[styles.moodVerse, { color: colors.text }]}>"{selectedMood.verse}"</Text>
                <Text style={[styles.moodRef, { color: selectedMood.color }]}>{selectedMood.ref}</Text>

                <TouchableOpacity
                  style={[styles.studyLinkedButton, { borderColor: selectedMood.color }]}
                  onPress={() => {
                    // Logic to jump to a study or search this topic
                    router.push(`/search?q=${selectedMood.label}`);
                  }}
                >
                  <Text style={[styles.studyLinkedText, { color: selectedMood.color }]}>Study {selectedMood.label}</Text>
                  <Ionicons name="arrow-forward" size={14} color={selectedMood.color} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Hidden ViewShot for Image Generation */}
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
            <Ionicons name="chatbox-ellipses" size={60} color={isLightBg ? 'rgba(0,0,0,0.1)' : 'rgba(212, 175, 55, 0.3)'} style={styles.quoteIconBig} />

            <View style={styles.shareCardBody}>
              <Text style={[
                styles.shareCardText,
                {
                  color: selectedTextColor.color,
                  fontFamily: selectedFont.family,
                  fontStyle: (selectedFont as any).style || 'normal'
                }
              ]}>
                {votd.text}
              </Text>

              <View style={[styles.shareCardDivider, { backgroundColor: selectedTextColor.color === '#FFFFFF' ? COLORS.gold : selectedTextColor.color }]} />

              <Text style={[styles.shareCardReference, { color: selectedTextColor.color === '#FFFFFF' ? COLORS.gold : selectedTextColor.color }]}>
                {votd.ref}
              </Text>
              <Text style={[styles.shareCardVersion, { color: selectedTextColor.color, opacity: 0.6 }]}>
                {votd.version}
              </Text>
            </View>

            <View style={styles.shareCardFooter}>
              <Ionicons name="sparkles" size={24} color={COLORS.gold} />
              <Text style={[styles.shareCardAppName, { color: isLightBg ? 'rgba(0,0,0,0.3)' : 'rgba(212, 175, 55, 0.7)' }]}>BIBLE DEVOTIONAL AI</Text>
            </View>
          </View>
        </View>
      </ViewShot>

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
                      {votd.text}
                    </Text>
                    <Text style={[styles.sharePreviewRef, { color: selectedTextColor.color === '#FFFFFF' ? COLORS.gold : selectedTextColor.color }]}>
                      {votd.ref} ({votd.version})
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
                    onPress={() => setSelectedTextColor(color)}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...SHADOWS.medium,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.white,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.grayLight,
    marginTop: 4,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Journey Dashboard Styles
  journeyCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  journeyInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  journeyTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  journeyProgress: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '600',
  },
  progressTrack: {
    height: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  progressFill: {
    height: 8,
    backgroundColor: COLORS.gold,
    borderRadius: 4,
  },
  progressPercent: {
    position: 'absolute',
    right: 10,
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.white,
  },

  contentContainer: {
    paddingHorizontal: 20,
    marginTop: -10,
  },
  dateHeader: {
    marginTop: 30,
    marginBottom: 15,
  },
  dateTextLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.goldDark,
    letterSpacing: 1,
  },
  dateSubtext: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 4,
  },
  cardWrapper: {
    ...SHADOWS.medium,
    marginBottom: 20,
  },
  devotionalCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  goldAccent: {
    height: 6,
    backgroundColor: COLORS.gold,
  },
  cardContent: {
    padding: 20,
  },
  topicTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 15,
  },
  verseContainer: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  verseIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  verseTextContainer: {
    flex: 1,
  },
  verseRefRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  verseReference: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: 8,
  },
  versionTag: {
    fontSize: 10,
    color: COLORS.gold,
    fontWeight: '800',
  },
  verseText: {
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  previewText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  readMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 15,
    borderTopWidth: 1,
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.goldDark,
  },
  
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  actionButton: {
    width: '31%',
    padding: 15,
    borderRadius: 16,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },

  prayerContainer: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 30,
    ...SHADOWS.medium,
  },
  prayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  prayerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.gold,
    marginLeft: 10,
  },
  prayerText: {
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 10,
  },

  dailyCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 30,
    ...SHADOWS.small,
  },
  dailyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 15,
  },
  dailyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  dailyVerse: {
    fontSize: 20,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 30,
    fontFamily: 'serif',
    marginBottom: 15,
  },
  dailyRef: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 20,
  },
  votdContent: {
    width: '100%',
    marginBottom: 20,
    alignItems: 'center',
  },
  votdReflection: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  challengeBox: {
    width: '100%',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  challengeTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  challengeText: {
    fontSize: 14,
    lineHeight: 20,
  },
  shareActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  shareText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },

  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 15,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 8,
  },
  newBadge: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
  },
  characterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    ...SHADOWS.small,
  },
  characterIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  characterInfo: {
    flex: 1,
    marginRight: 8,
  },
  characterName: {
    fontSize: 18,
    fontWeight: '800',
  },
  characterTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  characterLesson: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
  moodGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodButton: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  moodLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
  },
  moodResult: {
    marginTop: SPACING.md,
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

  // Share Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
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
  },
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
    fontWeight: '500',
  },
  fontOptionCard: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  fontOptionCardActive: {
    borderColor: COLORS.gold,
  },
  fontOptionLabel: {
    fontSize: 14,
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
    marginTop: 20,
    marginBottom: 20,
  },
  loadingText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    fontStyle: 'italic',
  },

  // Share Card Styles (Hidden)
  shareCardContainer: {
    position: 'absolute',
    left: -3000,
    width: 1080,
  },
  shareCard: {
    backgroundColor: COLORS.primary,
    padding: 40,
    width: 1080,
    height: 1350,
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
  quoteIconBig: {
    marginBottom: 20,
  },
  shareCardBody: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  shareCardText: {
    color: COLORS.white,
    fontSize: 52,
    fontFamily: 'serif',
    fontStyle: 'italic',
    lineHeight: 78,
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
});
