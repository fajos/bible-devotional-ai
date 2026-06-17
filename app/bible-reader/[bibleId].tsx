import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SHADOWS, SPACING } from '../../constants/theme';
import bibleApi from '../../services/bibleApi';

export default function BibleReaderScreen() {
  const { bibleId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [bible, setBible] = useState(null);
  const [allBibles, setAllBibles] = useState([]);
  const [books, setBooks] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [chapterContent, setChapterContent] = useState('');

  const [currentBook, setCurrentBook] = useState(null);
  const [currentChapter, setCurrentChapter] = useState(null);

  const [selectorVisible, setSelectorVisible] = useState(false);
  const [selectorType, setSelectorType] = useState('book'); // 'book', 'chapter', or 'version'

  useEffect(() => {
    loadInitialData();
  }, [bibleId]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const bibleData = await bibleApi.getBible(bibleId);
      setBible(bibleData);

      // Fetch all bibles for the switcher (optional: filter by language or favorites)
      const biblesList = await bibleApi.getBibles();
      setAllBibles(biblesList);

      const booksData = await bibleApi.getBooks(bibleId);
      setBooks(booksData);

      if (booksData.length > 0) {
        // If we're already reading something, try to stay at that book/chapter
        let bookToSelect = currentBook
          ? booksData.find(b => b.name === currentBook.name || b.id === currentBook.id)
          : null;

        if (!bookToSelect) {
           bookToSelect = booksData.find(b => b.name === 'Genesis' || b.id === 'GEN') || booksData[0];
        }

        // We need to fetch chapters for this new bible/book combo
        const chaptersData = await bibleApi.getChapters(bibleId, bookToSelect.id);
        setChapters(chaptersData);
        setCurrentBook(bookToSelect);

        let chapterToSelect = currentChapter
          ? chaptersData.find(c => c.number === currentChapter.number)
          : chaptersData[0];

        if (!chapterToSelect) chapterToSelect = chaptersData[0];

        await selectChapter(chapterToSelect, bibleId);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectBible = (newBibleId) => {
    setSelectorVisible(false);
    router.setParams({ bibleId: newBibleId });
  };

  const selectBook = async (book, targetChapterIndex = 0) => {
    setCurrentBook(book);
    setSelectorType('chapter');
    const chaptersData = await bibleApi.getChapters(bibleId, book.id);
    setChapters(chaptersData);

    if (chaptersData.length > 0) {
      // If targetChapterIndex is -1, it means we want the last chapter (for "previous" from next book)
      const index = targetChapterIndex === -1 ? chaptersData.length - 1 : targetChapterIndex;
      await selectChapter(chaptersData[index]);
    }
  };

  const selectChapter = async (chapter, forcedBibleId = null) => {
    setLoading(true);
    const activeBibleId = forcedBibleId || bibleId;
    setCurrentChapter(chapter);
    setSelectorVisible(false);

    try {
      // Use the chapter content endpoint
      const data = await bibleApi.getChapter(activeBibleId, chapter.id);
      if (data && data.content) {
        setChapterContent(bibleApi.stripHtml(data.content));
      } else {
        // Fallback
        const passage = await bibleApi.getFormattedVerse(activeBibleId, chapter.reference, bible?.name);
        setChapterContent(passage?.content || 'Text not available.');
      }
    } catch (error) {
      console.error('Error loading chapter content:', error);
      setChapterContent('Error loading text.');
    } finally {
      setLoading(false);
    }
  };

  const goToNextChapter = async () => {
    if (!currentBook || !currentChapter) return;

    const currentChapterIndex = chapters.findIndex(c => c.id === currentChapter.id);

    if (currentChapterIndex < chapters.length - 1) {
      // Next chapter in same book
      await selectChapter(chapters[currentChapterIndex + 1]);
    } else {
      // Next book
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
      // Previous chapter in same book
      await selectChapter(chapters[currentChapterIndex - 1]);
    } else {
      // Previous book
      const currentBookIndex = books.findIndex(b => b.id === currentBook.id);
      if (currentBookIndex > 0) {
        await selectBook(books[currentBookIndex - 1], -1);
      }
    }
  };

  const toggleSelector = (type) => {
    setSelectorType(type);
    setSelectorVisible(true);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* This ensures the Expo Router header is hidden even if _layout fails to catch it */}
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
            <Text style={styles.chapterText}>
              {chapterContent}
            </Text>
            <View style={styles.footerSpace} />
          </ScrollView>

          {/* Navigation Footer */}
          <View style={styles.navFooter}>
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
          </View>
        </>
      )}

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
  chapterText: {
    fontSize: 19,
    lineHeight: 32,
    color: COLORS.primary,
    fontFamily: FONTS.scripture?.regular || 'System',
    textAlign: 'justify',
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
  navDivider: {
    width: 1,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.2)',
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
});
