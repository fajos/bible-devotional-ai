import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter, useNavigation } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SHADOWS, SPACING } from '../../constants/theme';
import { BIBLE_IN_ONE_YEAR, getDayOfYear } from '../../constants/bibleInOneYear';
import * as store from '../../services/store';

export default function BibleInOneYearScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [currentDay, setCurrentDay] = useState(getDayOfYear());

  useEffect(() => {
    loadProgress();

    // Refresh progress whenever the screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadProgress();
    });

    return unsubscribe;
  }, [navigation]);

  const loadProgress = async () => {
    const progress = await store.getCachedData('bible_year_progress') || [];
    setCompletedDays(progress);
  };

  const jumpToToday = () => {
    const todayIndex = BIBLE_IN_ONE_YEAR.findIndex(d => d.day === currentDay);
    if (todayIndex !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index: todayIndex,
        animated: true,
        viewPosition: 0 // Align Today to the top of the screen
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const toggleDay = async (day: number) => {
    const isCompleted = completedDays.includes(day);
    let newProgress;
    if (isCompleted) {
      newProgress = completedDays.filter(d => d !== day);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      newProgress = [...completedDays, day];
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setCompletedDays(newProgress);
    await store.setCachedData('bible_year_progress', newProgress);
  };

  const renderItem = ({ item }: { item: typeof BIBLE_IN_ONE_YEAR[0] }) => {
    const isCompleted = completedDays.includes(item.day);
    const isToday = item.day === currentDay;

    return (
      <TouchableOpacity
        style={[
          styles.dayCard,
          isCompleted && styles.dayCardCompleted,
          isToday && styles.dayCardToday
        ]}
        onPress={() => router.push({
          pathname: '/bible-in-one-year/day',
          params: { day: item.day }
        })}
      >
        <View style={styles.dayInfo}>
          <View style={[styles.dayBadge, isCompleted && styles.dayBadgeCompleted]}>
            <Text style={styles.dayBadgeText}>DAY {item.day}</Text>
          </View>
          <Text style={styles.dayTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.dayReferences}>
            {item.readings.map(r => r.ref).join(' • ')}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => toggleDay(item.day)}
          style={styles.checkButton}
        >
          <Ionicons
            name={isCompleted ? "checkmark-circle" : "ellipse-outline"}
            size={28}
            color={isCompleted ? COLORS.success : COLORS.grayLight}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: 'Bible in One Year',
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.gold,
      }} />

      <FlatList
        ref={flatListRef}
        data={BIBLE_IN_ONE_YEAR}
        renderItem={renderItem}
        keyExtractor={item => item.day.toString()}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + SPACING.xl }
        ]}
        getItemLayout={(data, index) => ({
          length: 112, // Exact card height + margin
          offset: 112 * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          const offset = info.index * 112;
          flatListRef.current?.scrollToOffset({ offset, animated: false });
        }}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>Your Yearly Journey</Text>
                <Text style={styles.headerSubtitle}>
                  Walk through the entire Word of God, day by day.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.todayButton}
                onPress={jumpToToday}
              >
                <Ionicons name="today" size={20} color={COLORS.white} />
                <Text style={styles.todayButtonText}>Today</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.progressContainer}>
               <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.min(100, (completedDays.length / 365) * 100)}%` }]} />
               </View>
               <View style={styles.progressLabelRow}>
                  <Text style={styles.progressDetailText}>{completedDays.length} / 365 Days</Text>
                  <Text style={styles.progressText}>{Math.round((completedDays.length / 365) * 100)}% Complete</Text>
               </View>
            </View>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
  },
  listContent: {
    padding: SPACING.md,
  },
  header: {
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    ...SHADOWS.small,
  },
  headerTitle: {
    fontSize: FONTS.ui.size.xlarge,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: FONTS.ui.size.small,
    color: COLORS.gray,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  todayButton: {
    backgroundColor: COLORS.gold,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    ...SHADOWS.small,
  },
  todayButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 4,
  },
  progressContainer: {
    marginTop: SPACING.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.grayLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.gold,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  progressDetailText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.gray,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.goldDark,
  },
  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 16,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
    height: 96, // Fixed height for reliable scrolling
  },
  dayCardToday: {
    borderLeftColor: COLORS.gold,
    backgroundColor: '#FFFBEB',
  },
  dayCardCompleted: {
    opacity: 0.8,
  },
  dayInfo: {
    flex: 1,
  },
  dayBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  dayBadgeCompleted: {
    backgroundColor: COLORS.grayLight,
  },
  dayBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },
  dayTitle: {
    fontSize: FONTS.ui.size.medium,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 2,
  },
  dayReferences: {
    fontSize: FONTS.ui.size.small,
    color: COLORS.goldDark,
    fontWeight: '500',
  },
  checkButton: {
    marginLeft: SPACING.md,
  },
});
