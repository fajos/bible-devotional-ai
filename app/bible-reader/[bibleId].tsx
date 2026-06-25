import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as Speech from 'expo-speech';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import { COLORS, FONTS, SHADOWS } from '../../constants/theme';
import bibleApi from '../../services/bibleApi';
import openaiService from '../../services/openai';
import store from '../../services/store';

const { width, height } = Dimensions.get('window');

const HIGHLIGHT_COLORS = [
  { id: 'none', color: 'transparent', label: 'Clear' },
  { id: 'yellow', color: '#FFF176', label: 'Yellow' },
  { id: 'green', color: '#A5D6A7', label: 'Green' },
  { id: 'blue', color: '#90CAF9', label: 'Blue' },
  { id: 'pink', color: '#F48FB1', label: 'Pink' },
  { id: 'purple', color: '#E1BEE7', label: 'Purple' },
  { id: 'orange', color: '#FFCC80', label: 'Orange' },
  { id: 'teal', color: '#B2DFDB', label: 'Teal' },
];

const BACKGROUND_OPTIONS = [
  { id: 'navy', color: '#1B1B3A', type: 'color', label: 'Navy' },
  { id: 'parchment', color: '#F5E6CC', type: 'color', label: 'Parchment' },
  { id: 'burgundy', color: '#4A0E0E', type: 'color', label: 'Burgundy' },
  { id: 'stone', url: 'https://images.unsplash.com/photo-1517867065801-e20f409696b0?q=80&w=1080', type: 'image', label: 'Stone' },
  { id: 'ancient', url: 'https://images.unsplash.com/photo-1524334228333-0f6db392f8a1?q=80&w=1080', type: 'image', label: 'Ancient' },
  { id: 'mountain', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1080', type: 'image', label: 'Mountain' },
  { id: 'nebula', url: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?q=80&w=1080', type: 'image', label: 'Nebula' },
];

interface BibleInfo {
  id: string;
  name: string;
  abbreviation?: string;
}

interface Book {
  id: string;
  name: string;
}

interface Chapter {
  id: string;
  number: string;
}

interface Verse {
  id: string;
  number: string;
  text: string;
}

interface Highlight {
  color: string;
}

export default function BibleReaderScreen() {
  const { bibleId, reference } = useLocalSearchParams<{ bibleId: string; reference?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [bible, setBible] = useState<BibleInfo | null>(null);
  const [allBibles, setAllBibles] = useState<BibleInfo[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [highlights, setHighlights] = useState<Record<string, Highlight>>({});

  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);

  const [selectorVisible, setSelectorVisible] = useState(false);
  const [selectorType, setSelectorType] = useState<'book' | 'chapter' | 'version'>('book');

  const [selectedVerses, setSelectedVerses] = useState<string[]>([]);
  const [highlightModalVisible, setHighlightModalVisible] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSpeakingRef = useRef<boolean>(false);
  const viewShotRef = useRef<any>(null);

  const [selectedBackground, setSelectedBackground] = useState(BACKGROUND_OPTIONS[0]);
  const [shareModalVisible, setShareModalVisible] = useState(false);

  const isLightBg = selectedBackground.id === 'parchment';
  const textColor = isLightBg ? COLORS.primary : COLORS.white;
  const goldColor = isLightBg ? COLORS.goldDark : COLORS.gold;

  useEffect(() => {
    loadInitialData();
  }, [bibleId, reference]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const bibleData = await bibleApi.getBible(bibleId);
      setBible(bibleData);

      const biblesList = await bibleApi.getBibles();
      setAllBibles(biblesList);

      const booksData = await bibleApi.getBooks(bibleId);
      setBooks(booksData);

      if (booksData.length > 0) {
        // Try to load reference if provided
        let bookToSelect = null;
        let chapterToSelect = null;

        if (reference) {
          // Robust parsing for "Book Chapter:Verse" or "Book Chapter-Chapter" or "1 Book Chapter"
          const parts = reference.trim().split(/\s+/);
          if (parts.length >= 2) {
            // Last part usually contains chapter/verse: "1:1-5" or "1-2" or "1"
            const lastPart = parts[parts.length - 1];
            const bookName = parts.slice(0, parts.length - 1).join(' ');

            // Extract chapter number: "1:5-10" -> "1", "1-2" -> "1", "5" -> "5"
            const chapterNum = lastPart.split(/[:\-]/)[0];

            const normalizedBookName = bookName.toLowerCase().trim();

            // Priority matching
            // 1. Exact match (case insensitive)
            bookToSelect = booksData.find(b =>
              b.name.toLowerCase() === normalizedBookName ||
              b.id.toLowerCase() === normalizedBookName ||
              (b.shortName && b.shortName.toLowerCase() === normalizedBookName)
            );

            // 2. Singular/Plural match for Psalms/Psalm
            if (!bookToSelect) {
              bookToSelect = booksData.find(b => {
                const bName = b.name.toLowerCase();
                return bName === normalizedBookName + 's' ||
                       normalizedBookName === bName + 's';
              });
            }

            // 3. Prefix match (e.g. "Gen" for "Genesis")
            if (!bookToSelect) {
              bookToSelect = booksData.find(b =>
                b.name.toLowerCase().startsWith(normalizedBookName) ||
                (b.shortName && b.shortName.toLowerCase().startsWith(normalizedBookName))
              );
            }

            if (bookToSelect) {
              const chaptersData = await bibleApi.getChapters(bibleId, bookToSelect.id);
              setChapters(chaptersData);
              chapterToSelect = chaptersData.find(c => c.number === chapterNum);
            }
          }
        }

        if (!bookToSelect) {
          // Try to load last read state
          const lastRead = await store.getLastReadState();

          bookToSelect = currentBook
            ? booksData.find(b => b.name === currentBook.name || b.id === currentBook.id)
            : null;

          // If no book in memory, try to load from saved state
          if (!bookToSelect && lastRead) {
            bookToSelect = booksData.find(b => b.id === lastRead.bookId);
          }

          // Fallback to Genesis
          if (!bookToSelect) {
             bookToSelect = booksData.find(b => b.name === 'Genesis' || b.id === 'GEN') || booksData[0];
          }

          const chaptersData = await bibleApi.getChapters(bibleId, bookToSelect.id);
          setChapters(chaptersData);

          if (lastRead && lastRead.bookId === bookToSelect.id) {
            chapterToSelect = chaptersData.find(c => c.id === lastRead.chapterId);
          }
        }

        // Optimization: Load highlights only for the specific book
        if (bookToSelect) {
          const bookHighlights = await store.getHighlightsForBook(bookToSelect.id);
          setHighlights(bookHighlights);
        }

        setCurrentBook(bookToSelect);

        if (!chapterToSelect && chapters.length > 0) {
          chapterToSelect = chapters[0];
        }

        if (chapterToSelect) {
          await selectChapter(chapterToSelect, bibleId, bookToSelect.id);
        } else {
          // Fallback if chapter not found in the book
          const chaps = await bibleApi.getChapters(bibleId, bookToSelect.id);
          setChapters(chaps);
          await selectChapter(chaps[0], bibleId, bookToSelect.id);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      setLoading(false);
    }
  };

  const selectBible = (newBibleId: string) => {
    setSelectorVisible(false);
    router.setParams({ bibleId: newBibleId });
  };

  const selectBook = async (book: Book, targetChapterIndex = 0) => {
    setCurrentBook(book);
    setSelectorType('chapter');

    // Optimization: Load highlights for the new book immediately
    const bookHighlights = await store.getHighlightsForBook(book.id);
    setHighlights(bookHighlights);

    const chaptersData = await bibleApi.getChapters(bibleId, book.id);
    setChapters(chaptersData);

    if (chaptersData.length > 0) {
      const index = targetChapterIndex === -1 ? chaptersData.length - 1 : targetChapterIndex;
      await selectChapter(chaptersData[index], bibleId, book.id);
    }
  };

  const selectChapter = async (chapter: Chapter, forcedBibleId?: string, forcedBookId?: string) => {
    if (!chapter) {
      console.error('selectChapter called with null chapter');
      return;
    }
    setLoading(true);
    const activeBibleId = forcedBibleId || bibleId;
    setCurrentChapter(chapter);
    setSelectorVisible(false);
    setSelectedVerses([]); // Clear selection when changing chapter

    // Save last read state
    const bookId = forcedBookId || currentBook?.id;
    if (bookId && chapter.id) {
      store.setLastReadState({
        bibleId: activeBibleId,
        bookId: bookId,
        chapterId: chapter.id,
        timestamp: new Date().toISOString()
      });
    }

    try {
      const versesData = await bibleApi.getChapterVersesParsed(activeBibleId, bookId, chapter.id);
      setVerses(versesData.filter((verse): verse is Verse => verse !== null));
    } catch (error) {
      console.error('Error loading chapter content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVersePress = (verse: Verse) => {
    const verseId = verse.id;
    const isSelecting = !selectedVerses.includes(verseId);

    if (isSelecting) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setSelectedVerses(current =>
      isSelecting
        ? [...current, verseId]
        : current.filter(id => id !== verseId)
    );
  };

  const applyHighlight = async (color: string | null) => {
    if (selectedVerses.length === 0) return;

    const highlightColor =
      color === 'transparent' ? null : (color as unknown as null | undefined);

    await store.applyBulkHighlights(
      bibleId,
      selectedVerses,
      highlightColor
    );

    // Re-load only current book highlights for performance
    if (currentBook) {
      const bookHighlights = await store.getHighlightsForBook(currentBook.id);
      setHighlights(bookHighlights);
    }

    setHighlightModalVisible(false);
    setSelectedVerses([]);
  };

  const closeHighlightModal = () => {
    setHighlightModalVisible(false);
    // We don't clear selectedVerses here so user can keep selecting
  };

  const goToNextChapter = async () => {
    if (!currentBook || !currentChapter) return;
    const currentChapterIndex = chapters.findIndex(c => c.id === currentChapter.id);
    if (currentChapterIndex < chapters.length - 1) {
      await selectChapter(chapters[currentChapterIndex + 1]);
    } else {
      const currentBookIndex = books.findIndex(b => b.id === currentBook.id);
      if (currentBookIndex < books.length - 1) {
        await selectBook(books[currentBookIndex + 1], 0);
      }
    }
  };

  const goToPreviousChapter = async () => {
    if (!currentBook || !currentChapter) return;
    const currentChapterIndex = chapters.findIndex(c => c.id === currentChapter.id);
    if (currentChapterIndex > 0) {
      await selectChapter(chapters[currentChapterIndex - 1]);
    } else {
      const currentBookIndex = books.findIndex(b => b.id === currentBook.id);
      if (currentBookIndex > 0) {
        await selectBook(books[currentBookIndex - 1], -1);
      }
    }
  };

  const toggleSelector = (type: 'book' | 'chapter' | 'version') => {
    Haptics.selectionAsync();
    setSelectorType(type);
    setSelectorVisible(true);
  };

  const explainSelection = async () => {
    if (selectedVerses.length === 0) return;

    setAiLoading(true);
    setAiModalVisible(true);
    setAiExplanation(null);

    try {
      const selectedVersesData = verses.filter(v => selectedVerses.includes(v.id));
      const verseText = selectedVersesData.map(v => v.text).join(' ');
      const reference = `${currentBook?.name} ${currentChapter?.number}:${selectedVersesData[0].number}${selectedVersesData.length > 1 ? '-' + selectedVersesData[selectedVersesData.length - 1].number : ''}`;

      const explanation = await openaiService.explainVerse(verseText, reference, bible?.abbreviation || 'NKJV');
      setAiExplanation(explanation);
    } catch (error) {
      console.error('AI Explanation Error:', error);
      Alert.alert('Error', 'Failed to get AI explanation. Please check your internet connection.');
      setAiModalVisible(false);
    } finally {
      setAiLoading(false);
    }
  };

  const saveAiInsight = async () => {
    if (!aiExplanation) return;
    try {
      const selectedVersesData = verses.filter(v => selectedVerses.includes(v.id));
      const reference = `${currentBook?.name} ${currentChapter?.number}:${selectedVersesData[0].number}${selectedVersesData.length > 1 ? '-' + selectedVersesData[selectedVersesData.length - 1].number : ''}`;

      const itemToSave = {
        id: `ai-insight-${Date.now()}`,
        type: 'study',
        topic: `Insight: ${reference}`,
        content: aiExplanation,
        date: new Date().toISOString(),
        bibleVersion: bible?.abbreviation || 'NKJV',
        reference: reference
      };

      await store.toggleSaveDevotional(itemToSave);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'This insight has been saved to your library.');
    } catch (error) {
      console.error('Error saving insight:', error);
      Alert.alert('Error', 'Failed to save insight.');
    }
  };

  const shareAiInsight = async () => {
    if (!aiExplanation) return;
    try {
      const selectedVersesData = verses.filter(v => selectedVerses.includes(v.id));
      const reference = `${currentBook?.name} ${currentChapter?.number}:${selectedVersesData[0].number}${selectedVersesData.length > 1 ? '-' + selectedVersesData[selectedVersesData.length - 1].number : ''}`;

      const shareContent = `AI Verse Insight: ${reference}\n\n${aiExplanation}\n\nShared from Bible Devotional AI`;

      await Sharing.shareAsync('', {
        dialogTitle: `Share Insight: ${reference}`,
        UTI: 'public.plain-text',
        mimeType: 'text/plain',
        content: shareContent
      } as any);
    } catch (error) {
      // expo-sharing might need a local file for some platforms if content is large,
      // but usually simple text works via Share API from react-native if expo-sharing fails on string.
      // Trying React Native's Share as fallback.
      try {
        const { Share } = require('react-native');
        const selectedVersesData = verses.filter(v => selectedVerses.includes(v.id));
        const reference = `${currentBook?.name} ${currentChapter?.number}:${selectedVersesData[0].number}${selectedVersesData.length > 1 ? '-' + selectedVersesData[selectedVersesData.length - 1].number : ''}`;
        await Share.share({
          message: `AI Verse Insight: ${reference}\n\n${aiExplanation}\n\nShared from Bible Devotional AI`,
          title: `Insight: ${reference}`
        });
      } catch (innerError) {
        console.error('Share error:', innerError);
        Alert.alert('Error', 'Failed to share insight.');
      }
    }
  };

  const captureAndShareImage = async () => {
    try {
      if (viewShotRef.current) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Delay to ensure the background is fully rendered before capture
        setTimeout(async () => {
          const uri = await viewShotRef.current.capture();
          await Sharing.shareAsync(uri);
        }, 200);
      }
    } catch (error) {
      console.error('Capture error:', error);
      Alert.alert('Error', 'Failed to generate share image.');
    }
  };

  const toggleSpeech = async () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      return;
    }

    if (verses.length === 0) return;

    setIsSpeaking(true);
    isSpeakingRef.current = true;

    try {
      // Speak verses one by one to avoid length limits and provide better control
      for (let i = 0; i < verses.length; i++) {
        // Check if we should still be speaking (in case user stopped it)
        if (!isSpeakingRef.current) break;

        await new Promise((resolve, reject) => {
          Speech.speak(verses[i].text, {
            onDone: () => resolve(true),
            onStopped: () => {
              resolve(false);
            },
            onError: (error) => {
              console.error('Speech Error:', error);
              reject(error);
            },
          });
        });

        // Short pause between verses for natural flow
        if (isSpeakingRef.current && i < verses.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    } catch (error) {
      console.error('TTS Error:', error);
      Alert.alert('Speech Error', 'There was a problem playing the audio.');
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

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gold} />
        </TouchableOpacity>

        <View style={styles.selectorContainer}>
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => toggleSelector('book')}
          >
            <Text style={styles.selectorText} numberOfLines={1}>
              {currentBook?.name || '...'}
            </Text>
            <Ionicons name="chevron-down" size={14} color={COLORS.gold} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => toggleSelector('chapter')}
          >
            <Text style={styles.selectorText}>
              {currentChapter?.number || ''}
            </Text>
            <Ionicons name="chevron-down" size={14} color={COLORS.gold} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.headerRight}
          onPress={() => toggleSelector('version')}
        >
            <Text style={styles.versionAbbr}>{bible?.abbreviation || ''}</Text>
            <Ionicons name="chevron-down" size={10} color={COLORS.gold} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.speechButton}
          onPress={toggleSpeech}
        >
          <Ionicons name={isSpeaking ? "stop-circle" : "volume-high"} size={24} color={COLORS.gold} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.gold} />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.readerContent}>
            <Text style={styles.chapterHeader}>
              {currentBook?.name} {currentChapter?.number}
            </Text>

            <View style={styles.versesContainer}>
              {verses.map((verse) => {
                const highlight = highlights[verse.id];
                const isSelected = selectedVerses.includes(verse.id);

                return (
                  <TouchableOpacity
                    key={verse.id}
                    activeOpacity={0.7}
                    onPress={() => handleVersePress(verse)}
                    style={styles.verseWrapper}
                  >
                    <View style={[
                      styles.verseTextContainer,
                      highlight && { backgroundColor: highlight.color }
                    ]}>
                      <Text style={styles.verseNumber}>{verse.number}</Text>
                      <Text style={[
                        styles.verseText,
                        isSelected && styles.selectedVerseUnderline
                      ]}>
                        {' '}{verse.text}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.footerSpace} />
          </ScrollView>

          {/* Hidden ViewShot for Image Generation */}
          {selectedVerses.length > 0 && (
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
                    <Text style={[styles.shareCardText, { color: textColor }]}>
                      {verses.filter(v => selectedVerses.includes(v.id)).map(v => v.text).join(' ')}
                    </Text>

                    <View style={[styles.shareCardDivider, { backgroundColor: goldColor }]} />

                    <Text style={[styles.shareCardReference, { color: goldColor }]}>
                      {currentBook?.name} {currentChapter?.number}:{verses.filter(v => selectedVerses.includes(v.id))[0]?.number}{selectedVerses.length > 1 ? '-' + verses.filter(v => selectedVerses.includes(v.id))[selectedVerses.length - 1]?.number : ''}
                    </Text>
                    <Text style={[styles.shareCardVersion, { color: isLightBg ? 'rgba(0,0,0,0.5)' : 'rgba(255, 255, 255, 0.5)' }]}>
                      {bible?.abbreviation || 'NKJV'}
                    </Text>
                  </View>

                  <View style={styles.shareCardFooter}>
                    <Ionicons name="sparkles" size={24} color={goldColor} />
                    <Text style={[styles.shareCardAppName, { color: isLightBg ? 'rgba(0,0,0,0.3)' : 'rgba(212, 175, 55, 0.7)' }]}>BIBLE DEVOTIONAL AI</Text>
                  </View>
                </View>
              </View>
            </ViewShot>
          )}

          {/* Navigation Footer */}
          <View style={styles.navFooter}>
            {selectedVerses.length > 0 ? (
              <View style={styles.bulkHighlightToolbar}>
                <TouchableOpacity
                  style={styles.aiAssistButton}
                  onPress={explainSelection}
                >
                  <Ionicons name="sparkles" size={20} color={COLORS.white} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.aiAssistButton, { marginLeft: 10, backgroundColor: COLORS.primaryLight }]}
                  onPress={() => setShareModalVisible(true)}
                >
                  <Ionicons name="image-outline" size={20} color={COLORS.gold} />
                </TouchableOpacity>

                <View style={styles.toolbarDivider} />

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.bulkColorRow}
                  style={{ flex: 1 }}
                >
                  {HIGHLIGHT_COLORS.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.toolbarColorCircle,
                        { backgroundColor: c.color },
                        c.id === 'none' && styles.toolbarClearCircle
                      ]}
                      onPress={() => applyHighlight(c.color)}
                    >
                      {c.id === 'none' && <Ionicons name="trash-outline" size={20} color={COLORS.gray} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity
                  style={styles.closeSelectionButton}
                  onPress={() => setSelectedVerses([])}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={28} color={COLORS.grayLight} />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={goToPreviousChapter}
                  disabled={books.findIndex(b => b.id === currentBook?.id) === 0 && chapters.findIndex(c => c.id === currentChapter?.id) === 0}
                >
                  <Ionicons name="chevron-back" size={24} color={COLORS.gold} />
                  <Text style={styles.navButtonText}>Prev</Text>
                </TouchableOpacity>

                <View style={styles.navDivider} />

                <TouchableOpacity
                  style={styles.navButton}
                  onPress={goToNextChapter}
                  disabled={
                    books.findIndex(b => b.id === currentBook?.id) === books.length - 1 &&
                    chapters.findIndex(c => c.id === currentChapter?.id) === chapters.length - 1
                  }
                >
                  <Text style={styles.navButtonText}>Next</Text>
                  <Ionicons name="chevron-forward" size={24} color={COLORS.gold} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </>
      )}

      {/* Highlight Modal */}
      <Modal
        visible={highlightModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeHighlightModal}
      >
        <TouchableOpacity
          style={styles.highlightModalOverlay}
          activeOpacity={1}
          onPress={closeHighlightModal}
        >
          <View style={styles.highlightPalette}>
            <Text style={styles.highlightTitle}>Highlight {selectedVerses.length} {selectedVerses.length === 1 ? 'Verse' : 'Verses'}</Text>
            <View style={styles.colorRow}>
              {HIGHLIGHT_COLORS.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c.color },
                    c.id === 'none' && styles.clearCircle
                  ]}
                  onPress={() => applyHighlight(c.color)}
                >
                  {c.id === 'none' && <Ionicons name="close" size={20} color={COLORS.gray} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* AI Explanation Modal */}
      <Modal
        visible={aiModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAiModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '70%' }]}>
            <View style={styles.modalHeader}>
              <View style={styles.aiTitleRow}>
                <Ionicons name="sparkles" size={20} color={COLORS.goldDark} style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>AI Verse Insight</Text>
              </View>
              <View style={styles.aiHeaderActions}>
                <TouchableOpacity onPress={saveAiInsight} style={styles.aiHeaderButton}>
                  <Ionicons name="bookmark-outline" size={20} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={shareAiInsight} style={styles.aiHeaderButton}>
                  <Ionicons name="share-social-outline" size={20} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setAiModalVisible(false)} style={styles.aiHeaderButton}>
                  <Ionicons name="close" size={24} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {aiLoading ? (
              <View style={styles.aiLoadingContainer}>
                <ActivityIndicator size="large" color={COLORS.gold} />
                <Text style={styles.aiLoadingText}>Consulting the scriptures...</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Markdown style={markdownStyles}>
                  {aiExplanation || ''}
                </Markdown>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Share Modal */}
      <Modal
        visible={shareModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShareModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Verse Image</Text>
              <TouchableOpacity onPress={() => setShareModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.sharePreviewContainer}>
                <View style={[styles.sharePreviewCard, { backgroundColor: selectedBackground.type === 'color' ? selectedBackground.color : COLORS.primary }]}>
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
                    <Text style={[styles.sharePreviewText, { color: textColor }]} numberOfLines={6}>
                      {verses.filter(v => selectedVerses.includes(v.id)).map(v => v.text).join(' ')}
                    </Text>
                    <Text style={[styles.sharePreviewRef, { color: goldColor }]}>
                      {currentBook?.name} {currentChapter?.number}:{verses.filter(v => selectedVerses.includes(v.id))[0]?.number}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.sectionLabel}>Select Background</Text>
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
                    <Text style={styles.bgOptionLabel}>{bg.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.confirmShareButton}
                onPress={captureAndShareImage}
              >
                <Ionicons name="share-social" size={22} color={COLORS.white} />
                <Text style={styles.confirmShareText}>Share Now</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Book/Chapter Selector Modal */}
      <Modal
        visible={selectorVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectorVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectorType === 'book' ? 'Select Book' :
                 selectorType === 'chapter' ? `Select Chapter: ${currentBook?.name}` :
                 'Select Version'}
              </Text>
              <TouchableOpacity onPress={() => setSelectorVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.gridContainer}>
              {selectorType === 'book' ? (
                books.map((book) => (
                  <TouchableOpacity
                    key={book.id}
                    style={[
                      styles.gridItem,
                      currentBook?.id === book.id && styles.gridItemActive
                    ]}
                    onPress={() => selectBook(book)}
                  >
                    <Text style={[
                      styles.gridItemText,
                      currentBook?.id === book.id && styles.gridItemTextActive
                    ]}>
                      {book.name}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : selectorType === 'chapter' ? (
                chapters.map((chapter) => (
                  <TouchableOpacity
                    key={chapter.id}
                    style={[
                      styles.chapterBox,
                      currentChapter?.id === chapter.id && styles.chapterBoxActive
                    ]}
                    onPress={() => selectChapter(chapter)}
                  >
                    <Text style={[
                      styles.chapterBoxText,
                      currentChapter?.id === chapter.id && styles.chapterBoxTextActive
                    ]}>
                      {chapter.number}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                allBibles.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    style={[
                      styles.gridItem,
                      bible?.id === b.id && styles.gridItemActive
                    ]}
                    onPress={() => selectBible(b.id)}
                  >
                    <View style={styles.versionItemRow}>
                      <Text style={[
                        styles.gridItemText,
                        bible?.id === b.id && styles.gridItemTextActive,
                        { fontWeight: 'bold' }
                      ]}>
                        {b.abbreviation || b.name}
                      </Text>
                      <Text style={[
                        styles.versionFullName,
                        bible?.id === b.id && styles.gridItemTextActive
                      ]} numberOfLines={1}>
                        {b.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
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
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 15,
    ...SHADOWS.medium,
  },
  backButton: {
    padding: 8,
  },
  selectorContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  selectorText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
    marginRight: 4,
  },
  headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.1)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
  },
  versionAbbr: {
      color: COLORS.gold,
      fontSize: 12,
      fontWeight: 'bold',
      marginRight: 4,
  },
  speechButton: {
    padding: 8,
    marginLeft: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  readerContent: {
    padding: 24,
    paddingBottom: 100,
  },
  chapterHeader: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 24,
    textAlign: 'center',
  },
  versesContainer: {
    flexDirection: 'column',
  },
  verseWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  verseNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.goldDark,
    marginRight: 8,
    marginTop: 4,
  },
  verseTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  verseText: {
    fontSize: 19,
    lineHeight: 30,
    color: COLORS.primary,
    fontFamily: FONTS.scripture?.regular || 'System',
    flex: 1,
  },
  selectedVerseUnderline: {
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
    textDecorationColor: COLORS.gold,
  },
  footerSpace: {
    height: 100,
  },
  // Navigation Footer
  navFooter: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    ...SHADOWS.large,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  navButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
    marginHorizontal: 8,
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
    fontSize: 52,
    fontFamily: FONTS.scripture?.regular || 'System',
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
  highlightActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    backgroundColor: COLORS.goldDark,
    borderRadius: 30,
  },
  bulkHighlightToolbar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  aiAssistButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.goldDark,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  toolbarDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 10,
  },
  bulkColorRow: {
    alignItems: 'center',
    paddingRight: 15,
  },
  toolbarColorCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginHorizontal: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbarClearCircle: {
    backgroundColor: COLORS.offWhite,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeSelectionButton: {
    paddingLeft: 10,
  },
  navDivider: {
    width: 1,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  // Highlight Modal
  highlightModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightPalette: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 20,
    width: '80%',
    alignItems: 'center',
    ...SHADOWS.large,
  },
  highlightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 20,
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    ...SHADOWS.small,
  },
  clearCircle: {
    backgroundColor: COLORS.offWhite,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: 40,
  },
  gridItem: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  gridItemActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  gridItemText: {
    fontSize: 16,
    color: COLORS.primary,
  },
  gridItemTextActive: {
    fontWeight: 'bold',
    color: COLORS.goldDark,
  },
  versionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  versionFullName: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: 12,
    flex: 1,
  },
  chapterBox: {
    width: '20%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    margin: '2.5%',
  },
  chapterBoxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chapterBoxText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  chapterBoxTextActive: {
    color: COLORS.white,
  },
  aiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  aiHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiHeaderButton: {
    padding: 8,
    marginLeft: 4,
  },
  aiLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  aiLoadingText: {
    marginTop: 16,
    color: COLORS.gray,
    fontSize: 16,
    fontStyle: 'italic',
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
