import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SHADOWS, SPACING } from '../../constants/theme';
import * as store from '../../services/store';

interface DayData {
  day: number;
  title: string;
  reference: string;
  devotional: string;
  reflection: string;
}

interface StoredDevotional {
  id: string;
  data: {
    days: DayData[];
  };
}

interface ReadingPlanDayParams {
  planId: string;
  day: string;
}

export default function ReadingPlanDayScreen() {
  const params = useLocalSearchParams() as unknown as ReadingPlanDayParams;
  const { planId, day } = params;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [dayData, setDayData] = useState<DayData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDayData();
  }, [planId, day]);

  const loadDayData = async (): Promise<void> => {
    try {
      const storedPlan: StoredDevotional | null = store.getStoredDevotional();
      if (storedPlan && storedPlan.id === planId) {
        const dayInfo: DayData | undefined = storedPlan.data.days.find(
          (d: DayData) => d.day === parseInt(day as string)
        );
        setDayData(dayInfo ?? null);
      }
    } catch (error) {
      console.error('Error loading day data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  if (!dayData) return null;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: `Day ${day}`,
        headerTintColor: COLORS.gold,
        headerStyle: { backgroundColor: COLORS.primary }
      }} />

      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: insets.bottom + SPACING.xl }}>
        <View style={styles.contentCard}>
          <Text style={styles.title}>{dayData.title}</Text>

          <TouchableOpacity
            style={styles.referenceCard}
            onPress={() => router.push(`/bible-reader/NKJV?reference=${encodeURIComponent(dayData.reference)}`)}
          >
            <Ionicons name="book" size={24} color={COLORS.gold} />
            <View style={styles.referenceTextContainer}>
              <Text style={styles.referenceLabel}>TODAY'S READING</Text>
              <Text style={styles.referenceText}>{dayData.reference}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.grayLight} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Devotional Thought</Text>
          {dayData.devotional.split('\n\n').map((p, i) => (
            <Text key={i} style={styles.devotionalText}>{p.trim()}</Text>
          ))}

          <View style={styles.reflectionCard}>
            <Text style={styles.reflectionLabel}>REFLECTION</Text>
            <Text style={styles.reflectionText}>{dayData.reflection}</Text>
          </View>

          <TouchableOpacity
            style={styles.completeButton}
            onPress={async () => {
              const progress: number[] = (await store.getCachedData(`plan_progress_${planId}`)) || [];
              if (!progress.includes(parseInt(day as string))) {
                await store.cacheData(`plan_progress_${planId}`, [...progress, parseInt(day as string)]);
              }
              router.back();
            }}
          >
            <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
            <Text style={styles.completeButtonText}>Complete Day {day}</Text>
          </TouchableOpacity>
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
  contentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.xl,
    ...SHADOWS.medium,
  },
  title: {
    fontSize: FONTS.ui.size.xlarge,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.lg,
  },
  referenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  referenceTextContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  referenceLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.goldDark,
    letterSpacing: 1,
  },
  referenceText: {
    fontSize: FONTS.ui.size.large,
    fontWeight: '700',
    color: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.offWhite,
    marginVertical: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONTS.ui.size.large,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  devotionalText: {
    fontSize: FONTS.ui.size.medium,
    color: COLORS.grayDark,
    lineHeight: 26,
    marginBottom: SPACING.md,
  },
  reflectionCard: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    borderRadius: 12,
    marginTop: SPACING.xl,
  },
  reflectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.gold,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  reflectionText: {
    fontSize: FONTS.ui.size.medium,
    color: COLORS.white,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  completeButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.success,
    padding: SPACING.md,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xxl,
    ...SHADOWS.small,
  },
  completeButtonText: {
    color: COLORS.white,
    fontSize: FONTS.ui.size.medium,
    fontWeight: '700',
    marginLeft: SPACING.sm,
  },
});
