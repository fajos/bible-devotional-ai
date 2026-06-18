// app/(tabs)/library.js
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS, FONTS, SHADOWS, SPACING } from '../../constants/theme';
import * as store from '../../services/store';

export default function LibraryScreen() {
  const [savedItems, setSavedItems] = useState([]);
  const router = useRouter();
  const navigation = useNavigation();

  useEffect(() => {
    loadSavedItems();
    
    // Reload when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadSavedItems();
    });

    return unsubscribe;
  }, [navigation]);

  const loadSavedItems = async () => {
    try {
      const items = await store.getSavedDevotionals();
      if (items) {
        // Sort by saved date, newest first
        const sortedItems = [...items].sort((a, b) => new Date(b.savedAt || b.date) - new Date(a.savedAt || a.date));
        setSavedItems(sortedItems);
      }
    } catch (error) {
      console.error('Error loading library:', error);
    }
  };

  const deleteItem = async (id) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this from your library?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const updated = savedItems.filter(item => item.id !== id);
            await store.saveLibrary(updated);
            setSavedItems(updated);
          }
        }
      ]
    );
  };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.itemCard}
            onPress={() => {
                store.storeDevotional(item);
                router.push(`/devotional/${item.id}`);
            }}
        >
            <View style={styles.itemHeader}>
        <View style={styles.itemType}>
          <Ionicons 
            name={item.type === 'study' ? 'school' : 'book'} 
            size={16} 
            color={COLORS.gold} 
          />
          <Text style={styles.itemTypeText}>
            {item.type === 'study' ? 'Study' : 'Devotional'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => deleteItem(item.id)}>
          <Ionicons name="trash-outline" size={18} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <Text style={styles.itemTopic}>{item.topic}</Text>
      
      {item.content && (
        <Text style={styles.itemPreview} numberOfLines={2}>
          {item.content}
        </Text>
      )}

      <View style={styles.itemFooter}>
        <Text style={styles.itemDate}>
          {new Date(item.savedAt || item.date).toLocaleDateString()}
        </Text>
        {item.bibleVersion && (
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>{item.bibleVersion}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (savedItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="bookmarks" size={80} color={COLORS.grayLight} />
        <Text style={styles.emptyTitle}>Your Library is Empty</Text>
        <Text style={styles.emptyText}>
          Save devotionals and studies to build your personal Bible study library
        </Text>
        <TouchableOpacity 
          style={styles.browseButton}
          onPress={() => router.push('/search')}
        >
          <Text style={styles.browseButtonText}>Browse Studies</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={savedItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
  },
  listContainer: {
    padding: SPACING.md,
  },
  itemCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  itemType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemTypeText: {
    fontSize: FONTS.ui.size.tiny,
    color: COLORS.gold,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  itemTopic: {
    fontSize: FONTS.ui.size.large,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  itemPreview: {
    fontSize: FONTS.ui.size.small,
    color: COLORS.gray,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemDate: {
    fontSize: FONTS.ui.size.tiny,
    color: COLORS.gray,
  },
  versionBadge: {
    backgroundColor: COLORS.offWhite,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  versionText: {
    fontSize: FONTS.ui.size.tiny,
    color: COLORS.goldDark,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONTS.ui.size.large,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: SPACING.lg,
  },
  emptyText: {
    fontSize: FONTS.ui.size.medium,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 22,
  },
  browseButton: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.gold,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 8,
  },
  browseButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
});