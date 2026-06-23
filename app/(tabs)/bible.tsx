import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, SPACING } from '../../constants/theme';
import bibleAPIService from '../../services/bibleApi';
import store from '../../services/store';
import { API_CONFIG } from '../../services/config';

interface Bible {
  id: string;
  name: string;
  abbreviation?: string;
  language: {
    name: string;
  };
}

interface FavoriteBible {
  id: string;
  name: string;
  fullName: string;
}

interface DownloadStatus {
  progress: number;
  status: string;
}

export default function BibleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [bibles, setBibles] = useState<Bible[]>([]);
  const [filteredBibles, setFilteredBibles] = useState<Bible[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<FavoriteBible[]>([]);
  const [quickCompareRef, setQuickCompareRef] = useState('');
  const [downloadedIds, setDownloadedIds] = useState<string[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, DownloadStatus>>({}); // { bibleId: { progress, status } }

  useEffect(() => {
    loadBibles();
    loadFavorites();
    loadDownloadedList();
  }, []);

  const loadDownloadedList = async () => {
    const downloaded: string[] = await store.getCachedData('downloaded_bibles') || [];
    // Ensure all downloaded IDs are still valid according to config
    const validIds = Object.values(API_CONFIG.BIBLE_API.versions) as string[];
    const filtered = downloaded.filter((id: string) => validIds.includes(id));

    if (filtered.length !== downloaded.length) {
      await store.setCachedData('downloaded_bibles', filtered);
    }
    setDownloadedIds(filtered);
  };

  const loadFavorites = async () => {
    const savedFavs = await store.getFavoriteBibles();
    setFavorites(savedFavs || []);
  };

  const handleQuickCompare = () => {
    if (!quickCompareRef.trim()) {
      Alert.alert('Enter Reference', 'Please enter a verse (e.g., John 3:16)');
      return;
    }
    router.push(`/verse-compare/${encodeURIComponent(quickCompareRef.trim())}`);
  };

  const loadBibles = async () => {
    setLoading(true);
    const data = await bibleAPIService.getBibles();
    // Sort so English bibles are first or filter to major ones
    const sorted = data.sort((a: Bible, b: Bible) => {
        if (a.language.name === 'English' && b.language.name !== 'English') return -1;
        if (a.language.name !== 'English' && b.language.name === 'English') return 1;
        return a.name.localeCompare(b.name);
    });
    setBibles(sorted);
    setFilteredBibles(sorted);
    setLoading(false);
  };

  const toggleFavorite = async (bible: Bible) => {
    const isFav = favorites.some(f => f.id === bible.id);
    let newFavs: FavoriteBible[];
    if (isFav) {
      newFavs = favorites.filter(f => f.id !== bible.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      if (favorites.length >= 5) {
        Alert.alert('Limit Reached', 'You can select up to 5 favorite versions for comparison.');
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      newFavs = [...favorites, {
        id: bible.id,
        name: bible.abbreviation || bible.name.substring(0, 4),
        fullName: bible.name
      }];
    }
    setFavorites(newFavs);
    await store.setFavoriteBibles(newFavs);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!text) {
      setFilteredBibles(bibles);
      return;
    }
    const filtered = bibles.filter(bible =>
      bible.name.toLowerCase().includes(text.toLowerCase()) ||
      bible.abbreviation?.toLowerCase().includes(text.toLowerCase()) ||
      bible.language.name.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredBibles(filtered);
  };

  const handleDownload = async (bible: Bible) => {
    if (downloadProgress[bible.id]) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await bibleAPIService.downloadBible(bible.id, (progress: number, status: string) => {
        setDownloadProgress(prev => ({
          ...prev,
          [bible.id]: { progress, status }
        }));
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDownloadedIds(prev => [...prev, bible.id]);
      setDownloadProgress(prev => {
        const next = { ...prev };
        delete next[bible.id];
        return next;
      });
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download Bible structure.');
      setDownloadProgress(prev => {
        const next = { ...prev };
        delete next[bible.id];
        return next;
      });
    }
  };

  const renderBibleItem = ({ item }: { item: Bible }) => {
    const isFav = favorites.some(f => f.id === item.id);
    const isDownloaded = downloadedIds.includes(item.id) || item.id === 'LOCAL_FLV';
    const status = downloadProgress[item.id];
    const isLocal = item.id === 'LOCAL_FLV';

    const navigateToBible = async () => {
      // Check if we have a last read state for this bible version
      const lastRead = await store.getLastReadState();
      if (lastRead && lastRead.bibleId === item.id) {
        // We could potentially pass the book/chapter info,
        // but the reader screen already handles loading from storage.
      }
      router.push(`/bible-reader/${item.id}`);
    };

    return (
      <View style={[styles.bibleCard, isFav && styles.bibleCardActive]}>
        <TouchableOpacity
          style={styles.bibleInfo}
          onPress={navigateToBible}
        >
          <View style={styles.bibleTitleRow}>
            <Text style={[styles.bibleName, isFav && styles.bibleNameActive]}>{item.name}</Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={isFav ? 'rgba(255,255,255,0.5)' : COLORS.grayLight}
            />
          </View>
          <View style={styles.bibleMeta}>
              <View style={[styles.badge, isFav && styles.badgeActive]}>
                  <Text style={[styles.badgeText, isFav && styles.badgeTextActive]}>{item.abbreviation}</Text>
              </View>
              <Text style={[styles.languageText, isFav && styles.languageTextActive]}>{item.language.name}</Text>
              {isDownloaded && (
                <View style={styles.downloadBadge}>
                  <Ionicons name="cloud-done" size={12} color={isFav ? COLORS.gold : COLORS.goldDark} />
                  <Text style={[styles.downloadBadgeText, isFav && styles.downloadBadgeTextActive]}>Offline</Text>
                </View>
              )}
          </View>
          {status && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${status.progress * 100}%` }]} />
              <Text style={styles.progressText}>{status.status}</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.actionButtons}>
          {!isDownloaded && !status && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDownload(item)}
            >
              <Ionicons
                name="cloud-download-outline"
                size={22}
                color={isFav ? COLORS.white : COLORS.gray}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => toggleFavorite(item)}
          >
            <Ionicons
              name={isFav ? "star" : "star-outline"}
              size={22}
              color={isFav ? COLORS.gold : COLORS.gray}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Holy Bible</Text>
        <View style={styles.hintContainer}>
          <View style={styles.hintItem}>
            <View style={styles.hintIconCircle}>
              <Ionicons name="book" size={12} color={COLORS.primary} />
            </View>
            <Text style={styles.headerSubtitle}>Tap a Bible version to start reading</Text>
          </View>
          <View style={styles.hintItem}>
            <View style={styles.hintIconCircle}>
              <Ionicons name="star" size={12} color={COLORS.primary} />
            </View>
            <Text style={styles.headerSubtitle}>Star up to 5 versions to compare verses</Text>
          </View>
          <View style={styles.hintItem}>
            <View style={styles.hintIconCircle}>
              <Ionicons name="cloud-download" size={12} color={COLORS.primary} />
            </View>
            <Text style={styles.headerSubtitle}>Download versions for offline access</Text>
          </View>
        </View>
      </View>

      {/* Quick Compare Tool */}
      {favorites.length > 0 && (
        <View style={styles.quickCompareContainer}>
          <Text style={styles.sectionLabel}>QUICK VERSE STUDY</Text>
          <View style={styles.quickCompareRow}>
            <TextInput
              style={styles.quickCompareInput}
              placeholder="e.g. Romans 8:28"
              value={quickCompareRef}
              onChangeText={setQuickCompareRef}
              placeholderTextColor={COLORS.gray}
            />
            <TouchableOpacity
              style={styles.quickCompareButton}
              onPress={handleQuickCompare}
            >
              <Text style={styles.quickCompareButtonText}>Compare</Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.quickCompareHint}>
            Uses your {favorites.length} selected version{favorites.length > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.gray} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search versions (e.g. NIV, Spanish...)"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.gold} />
          <Text style={styles.loadingText}>Fetching available Bibles...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBibles}
          keyExtractor={(item) => item.id}
          renderItem={renderBibleItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.center}>
            <Text style={styles.emptyText}>No versions found matching &quot;{searchQuery}&quot;</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.gold,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.grayLight,
  },
  hintContainer: {
    marginTop: 12,
    gap: 6,
  },
  hintItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hintIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    margin: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: 12,
    ...SHADOWS.small,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.primary,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  bibleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 16,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  bibleCardActive: {
    backgroundColor: COLORS.primary,
  },
  bibleInfo: {
    flex: 1,
  },
  bibleTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  bibleName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  bibleNameActive: {
    color: COLORS.white,
  },
  bibleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  badgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgeText: {
    color: COLORS.goldDark,
    fontSize: 10,
    fontWeight: '800',
  },
  badgeTextActive: {
    color: COLORS.gold,
  },
  languageText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  languageTextActive: {
    color: COLORS.grayLight,
  },
  downloadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  downloadBadgeText: {
    fontSize: 10,
    color: COLORS.goldDark,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  downloadBadgeTextActive: {
    color: COLORS.gold,
  },
  progressContainer: {
    marginTop: 8,
    height: 14,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 7,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: COLORS.gold,
  },
  progressText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    zIndex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.gray,
    fontSize: 16,
  },
  // Quick Compare Styles
  quickCompareContainer: {
    backgroundColor: COLORS.white,
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: 16,
    ...SHADOWS.small,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.goldDark,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  quickCompareRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickCompareInput: {
    flex: 1,
    height: 44,
    backgroundColor: COLORS.offWhite,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    fontSize: 16,
    color: COLORS.primary,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  quickCompareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    height: 44,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    marginLeft: SPACING.sm,
  },
  quickCompareButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    marginRight: 4,
  },
  quickCompareHint: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 8,
    fontStyle: 'italic',
  }
});
