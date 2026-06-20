import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SHADOWS, SPACING } from '../../constants/theme';
import * as store from '../../services/store';

interface ReadingPlanDay {
  day: number;
  title: string;
  reference: string;
}

interface ReadingPlan {
  title: string;
  description: string;
  days: ReadingPlanDay[];
}

interface SavedDevotional {
  id: string;
  type: 'reading_plan' | string;
  data: ReadingPlan;
}

export default function ReadingPlanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [plan, setPlan] = useState<ReadingPlan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    loadPlan();
  }, [id]);

  const loadPlan = async (): Promise<void> => {
    try {
      const saved: SavedDevotional[] = await store.getSavedDevotionals();
      setIsSaved(saved.some(item => item.id === id));

      // In a real app, we'd fetch from storage or API
      const storedPlan = store.getStoredDevotional() as SavedDevotional | null;

      if (storedPlan && storedPlan.id === id && storedPlan.type === 'reading_plan') {
        setPlan(storedPlan.data);
        // Load completion status
        const progress = await store.getCachedData(`plan_progress_${id}`) as number[] | null;
        if (progress) setCompletedDays(progress);
      } else {
        // Fallback or search in saved plans
        const saved: SavedDevotional[] = await store.getSavedDevotionals();
        const found = saved.find(item => item.id === id && item.type === 'reading_plan');
        if (found) {
          setPlan(found.data);
          // Ensure the in-memory store is updated so day view can find it
          store.storeDevotional(found);
          const progress = await store.getCachedData(`plan_progress_${id}`) as number[] | null;
          if (progress) setCompletedDays(progress);
        } else {
           Alert.alert('Error', 'Reading plan not found.');
           router.back();
        }
      }
    } catch (error) {
      console.error('Error loading plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDayCompletion = async (dayNum: number): Promise<void> => {
    const isNowCompleted = !completedDays.includes(dayNum);
    let newCompleted: number[];

    if (isNowCompleted) {
      newCompleted = [...completedDays, dayNum];
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      newCompleted = completedDays.filter(d => d !== dayNum);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setCompletedDays(newCompleted);
    await store.setCachedData(`plan_progress_${id}`, newCompleted);
  };

  const toggleSave = async (): Promise<void> => {
    if (!plan) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const saved = await store.toggleSaveDevotional({
      id,
      type: 'reading_plan',
      data: plan
    });
    setIsSaved(saved);
    Alert.alert(
      saved ? 'Plan Saved' : 'Plan Removed',
      saved ? 'This reading plan is now in your library.' : 'This plan has been removed from your library.'
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  if (!plan) return null;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + SPACING.xl }}>
        <View style={[styles.header, { paddingTop: insets.top + 60 }]}>
          <View style={styles.headerButtonsRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerRoundButton}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.gold} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleSave}
              style={styles.headerRoundButton}
            >
              <Ionicons
                name={isSaved ? "bookmark" : "bookmark-outline"}
                size={24}
                color={COLORS.gold}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.planTitle}>{plan.title}</Text>
          <Text style={styles.planDescription}>{plan.description}</Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${(completedDays.length / plan.days.length) * 100}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {completedDays.length} of {plan.days.length} days completed
            </Text>
          </View>
        </View>

        <View style={styles.daysList}>
          {plan.days.map((day) => {
            const isCompleted = completedDays.includes(day.day);
            return (
              <TouchableOpacity
                key={day.day}
                style={[styles.dayCard, isCompleted && styles.dayCardCompleted]}
                onPress={() => router.push({
                  pathname: `/reading-plan/day`,
                  params: { planId: id, day: day.day }
                })}
              >
                <View style={styles.dayHeader}>
                  <View style={[styles.dayBadge, isCompleted && styles.dayBadgeCompleted]}>
                    <Text style={styles.dayBadgeText}>DAY {day.day}</Text>
                  </View>
                  <TouchableOpacity onPress={() => toggleDayCompletion(day.day)}>
                    <Ionicons
                      name={isCompleted ? "checkmark-circle" : "ellipse-outline"}
                      size={28}
                      color={isCompleted ? COLORS.success : COLORS.grayLight}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={styles.dayTitle}>{day.title}</Text>
                <View style={styles.referenceRow}>
                  <Ionicons name="book-outline" size={16} color={COLORS.gold} />
                  <Text style={styles.dayReference}>{day.reference}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...SHADOWS.medium,
  },
  headerButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    marginHorizontal: -SPACING.sm,
  },
  headerRoundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planTitle: {
    fontSize: FONTS.ui.size.title,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  planDescription: {
    fontSize: FONTS.ui.size.medium,
    color: COLORS.grayLight,
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  progressContainer: {
    marginTop: SPACING.md,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.gold,
  },
  progressText: {
    color: COLORS.white,
    fontSize: FONTS.ui.size.tiny,
    marginTop: SPACING.xs,
    fontWeight: '600',
  },
  daysList: {
    padding: SPACING.md,
  },
  dayCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  dayCardCompleted: {
    opacity: 0.8,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  dayBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 6,
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
    fontSize: FONTS.ui.size.large,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  referenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayReference: {
    fontSize: FONTS.ui.size.small,
    color: COLORS.goldDark,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
});
