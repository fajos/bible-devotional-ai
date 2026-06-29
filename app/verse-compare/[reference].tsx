import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';
import bibleApi from '../../services/bibleApi';
import * as store from '../../services/store';

interface BibleVersion {
  id: string;
  name: string;
  fullName?: string;
  abbreviation?: string;
}

interface Verse {
  number: string;
  text: string;
}

interface FormattedVerse {
  content?: string;
  verses?: Verse[];
  reference?: string;
}

interface VerseComparison {
  bibleName: string;
  bibleFullName?: string;
  text: string;
  verses?: Verse[];
  reference: string;
}

const POPULAR_BIBLES: BibleVersion[] = [
  { id: 'GH_AMP', name: 'AMP', fullName: 'Amplified Bible' },
  { id: 'MSG', name: 'MSG', fullName: 'The Message' },
  { id: 'GH_KJV', name: 'KJV', fullName: 'King James Version' },
  { id: 'GH_GNT', name: 'GNT', fullName: 'Good News Translation' },
  { id: 'GH_NLT', name: 'NLT', fullName: 'New Living Translation' },
];

export default function VerseCompareScreen() {
  const { colors, isDarkMode } = useAppTheme();
  const { reference } = useLocalSearchParams<{ reference: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState<boolean>(true);
  const [results, setResults] = useState<VerseComparison[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadComparisons();
  }, [reference]);

  const loadComparisons = async () => {
    setLoading(true);
    setError(null);
    try {
      const savedBibles = await store.getFavoriteBibles();
      const biblesToCompare = savedBibles.length > 0 ? savedBibles : POPULAR_BIBLES;

      const comparisons = await Promise.all(
        biblesToCompare.map(async (bible: { id: any; name: any; abbreviation: any; fullName: any; }) => {
          try {
            const verse = await bibleApi.getFormattedVerse(bible.id, reference);
            return {
              bibleName: bible.name || bible.abbreviation,
              bibleFullName: bible.fullName || bible.name,
              text: verse?.content || 'Verse not found in this version.',
              verses: verse?.verses || [],
              reference: verse?.reference || reference,
            };
          } catch (err) {
            return {
              bibleName: bible.name || bible.abbreviation,
              text: 'Error loading verse.',
              reference: reference,
            };
          }
        })
      );

      setResults(comparisons);
    } catch (err) {
      setError('Failed to load verse comparisons.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onShare = async () => {
    try {
      const shareMessage = results
        .map(r => `[${r.bibleName}] ${r.reference}\n${r.text}`)
        .join('\n\n');

      await Share.share({
        message: `${reference} Comparison:\n\n${shareMessage}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      <View style={[styles.header, { backgroundColor: isDarkMode ? colors.surface : COLORS.primary, paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.gold} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{reference}</Text>
        <TouchableOpacity style={styles.shareButton} onPress={onShare}>
          <Ionicons name="share-outline" size={24} color={COLORS.gold} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center1}>
          <ActivityIndicator size="large" color={COLORS.gold} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Comparing versions...</Text>
        </View>
      ) : error ? (
        <View style={styles.center1}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadComparisons}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {results.map((result, index) => (
            <View key={index} style={[styles.comparisonCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.cardHeader, { borderBottomColor: colors.offWhite }]}>
                <Text style={[styles.bibleName, { color: isDarkMode ? colors.gold : colors.primary }]}>{result.bibleName}</Text>
                <Text style={[styles.bibleFullName, { color: colors.textSecondary }]}>{result.bibleFullName}</Text>
              </View>
              {result.verses && result.verses.length > 0 ? (
                <View style={styles.versesContainer}>
                  {result.verses.map((v, i) => (
                    <Text key={i} style={[styles.verseText, { color: colors.text }]}>
                      <Text style={styles.verseNumber}>{v.number} </Text>
                      {v.text}
                    </Text>
                  ))}
                </View>
              ) : (
                <Text style={[styles.verseText, { color: colors.text }]}>{result.text}</Text>
              )}
            </View>
          ))}
          <View style={styles.footerSpace} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  shareButton: {
    padding: 8,
    marginRight: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gold,
    flex: 1,
    textAlign: 'center',
  },
  center1: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: COLORS.gold,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  comparisonCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
    borderBottomWidth: 1,
    paddingBottom: 4,
  },
  bibleName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  bibleFullName: {
    fontSize: 12,
  },
  verseText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  versesContainer: {
    marginTop: 4,
  },
  verseNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gold,
    verticalAlign: 'top',
  },
  footerSpace: {
    height: 40,
  },
});
