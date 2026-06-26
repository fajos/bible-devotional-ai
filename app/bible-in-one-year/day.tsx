import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState, useRef } from 'react';
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
import { Image } from 'expo-image';
import ViewShot from 'react-native-view-shot';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SHADOWS, SPACING, isTablet } from '../../constants/theme';
import { BIBLE_IN_ONE_YEAR } from '../../constants/bibleInOneYear';
import { BACKGROUND_OPTIONS, FONT_OPTIONS, TEXT_COLOR_OPTIONS } from '../../constants/sharing';
import openaiService from '../../services/openai';
import * as store from '../../services/store';
import { useAppTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function BibleInOneYearDayScreen() {
  const { colors, isDarkMode } = useAppTheme();
  const { day } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dayNum = parseInt(day as string);
  const dayData = BIBLE_IN_ONE_YEAR.find(d => d.day === dayNum);

  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState(BACKGROUND_OPTIONS[0]);
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0]);
  const [selectedTextColor, setSelectedTextColor] = useState(TEXT_COLOR_OPTIONS[0]);
  const viewShotRef = useRef<any>(null);

  const isLightBg = selectedBackground.id === 'parchment';
  const textColor = isLightBg ? COLORS.primary : COLORS.white;
  const goldColor = isLightBg ? COLORS.goldDark : COLORS.gold;

  useEffect(() => {
    loadCachedInsight();
    checkCompletion();
  }, [dayNum]);

  const checkCompletion = async () => {
    const progress = await store.getCachedData('bible_year_progress') || [];
    setIsCompleted(progress.includes(dayNum));
  };

  const loadCachedInsight = async () => {
    const cached = await store.getCachedData(`bible_year_insight_${dayNum}`);
    if (cached) setAiInsight(cached);
  };

  const generateInsight = async () => {
    if (!dayData) return;
    setLoadingInsight(true);
    try {
      const prompt = `Provide a concise but profound theological connection between these three readings for a "Bible in One Year" plan:
      1. OT: ${dayData.readings.find(r => r.type === 'OT')?.ref}
      2. NT: ${dayData.readings.find(r => r.type === 'NT')?.ref}
      3. Psalm/Proverb: ${dayData.readings.find(r => r.type === 'Psalm')?.ref}

      Focus on how they reveal a unified theme of God's character or the story of redemption. Keep it to 3-4 paragraphs. Use Markdown.`;

      const response = await openaiService.generateContent(prompt);
      setAiInsight(response);
      await store.setCachedData(`bible_year_insight_${dayNum}`, response);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingInsight(false);
    }
  };

  const captureAndShareImage = async () => {
    try {
      if (viewShotRef.current) {
        // Delay to ensure rendering
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

  const getCleanText = (text: string) => {
    if (!text) return '';
    return text
      .replace(/#+\s/g, '')        // Remove headers
      .replace(/\*\*/g, '')       // Remove bold
      .replace(/__/g, '')         // Remove underline
      .replace(/\*/g, '')         // Remove italics
      .replace(/`/g, '')          // Remove code
      .replace(/^[ \t]*[-*+]\s+/gm, '• ') // Normalize bullets
      .trim();
  };

  if (!dayData) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{
        title: `Day ${dayNum}`,
        headerStyle: { backgroundColor: isDarkMode ? colors.surface : COLORS.primary },
        headerTintColor: COLORS.gold,
      }} />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACING.xl }]}>
        <View style={[styles.headerCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.dayTitle, { color: colors.text }]}>{dayData.title}</Text>
          <View style={[styles.divider, { backgroundColor: colors.offWhite }]} />

          <Text style={styles.sectionTitle}>Daily Readings</Text>
          {dayData.readings.map((reading, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.readingRow, { backgroundColor: colors.offWhite }]}
              onPress={async () => {
                const version = await store.getPreferredBibleVersion();
                router.push(`/bible-reader/${version}?reference=${encodeURIComponent(reading.ref)}`);
              }}
            >
              <View style={[styles.typeBadge, { backgroundColor: reading.type === 'NT' ? COLORS.gold : (isDarkMode ? colors.primaryLight : COLORS.primaryLight) }]}>
                <Text style={styles.typeText}>{reading.type}</Text>
              </View>
              <Text style={[styles.readingRef, { color: colors.text }]}>{reading.ref}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.insightSection, { backgroundColor: isDarkMode ? colors.surface : colors.primary }]}>
          <View style={styles.insightHeader}>
             <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="sparkles" size={20} color={COLORS.gold} />
                <Text style={styles.insightTitle}>AI Spiritual Insight</Text>
             </View>
             {aiInsight && (
               <TouchableOpacity onPress={() => setShareModalVisible(true)}>
                 <Ionicons name="share-social-outline" size={22} color={COLORS.gold} />
               </TouchableOpacity>
             )}
          </View>

          {aiInsight ? (
            <View style={styles.insightContent}>
              <Text style={[styles.insightText, { color: isDarkMode ? colors.text : COLORS.white }]}>{getCleanText(aiInsight)}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.generateButton, { backgroundColor: isDarkMode ? colors.background : 'rgba(255,255,255,0.1)' }]}
              onPress={generateInsight}
              disabled={loadingInsight}
            >
              {loadingInsight ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.generateButtonText}>Generate Deep Connection</Text>
                  <Text style={styles.tokenHint}>(Uses AI tokens)</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.completeButton, isCompleted && [styles.completedButton, { backgroundColor: colors.grayLight }]]}
          onPress={async () => {
            if (!isCompleted) {
              const progress = await store.getCachedData('bible_year_progress') || [];
              if (!progress.includes(dayNum)) {
                await store.setCachedData('bible_year_progress', [...progress, dayNum]);
              }
            }
            router.back();
          }}
        >
          <Ionicons
            name={isCompleted ? "checkmark-circle" : "checkmark-done"}
            size={24}
            color={COLORS.white}
          />
          <Text style={styles.completeButtonText}>
            {isCompleted ? "Completed" : "Finish Today's Reading"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Sharing Modal */}
      <Modal
        visible={shareModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShareModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '80%', backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.offWhite }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Share Insight</Text>
              <TouchableOpacity onPress={() => setShareModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.sharePreviewContainer}>
                <ViewShot
                  ref={viewShotRef}
                  options={{ format: 'png', quality: 1.0 }}
                  style={[styles.sharePreviewCard, { backgroundColor: selectedBackground.type === 'color' ? selectedBackground.color : colors.primary }]}
                >
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
                    <Text style={[styles.sharePreviewTitle, { color: goldColor }]}>
                      DAY {dayNum}: {dayData.title}
                    </Text>
                    <Text
                      style={[
                        styles.sharePreviewText,
                        {
                          color: selectedTextColor.color,
                          fontFamily: selectedFont.family,
                          fontStyle: (selectedFont as any).style || 'normal'
                        }
                      ]}
                      numberOfLines={12}
                    >
                      {aiInsight ? getCleanText(aiInsight) : ''}
                    </Text>
                    <View style={[styles.shareCardFooter, { marginTop: 20 }]}>
                        <Ionicons name="sparkles" size={16} color={selectedTextColor.color === '#FFFFFF' ? goldColor : selectedTextColor.color} />
                        <Text style={[styles.shareCardAppName, { color: selectedTextColor.color, opacity: 0.6 }]}>BIBLE DEVOTIONAL AI</Text>
                    </View>
                  </View>
                </ViewShot>
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
                    onPress={() => setSelectedBackground(bg)}
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
                    onPress={() => setSelectedFont(font)}
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
                    <Text style={styles.colorOptionLabel}>{color.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.confirmShareButton}
                onPress={captureAndShareImage}
              >
                <Ionicons name="share-social" size={22} color={COLORS.white} />
                <Text style={styles.confirmShareText}>Share Image</Text>
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
  content: {
    padding: SPACING.lg,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  headerCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    borderRadius: 24,
    ...SHADOWS.medium,
    marginBottom: SPACING.lg,
  },
  dayTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.offWhite,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.goldDark,
    letterSpacing: 1,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
  },
  readingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.offWhite,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: SPACING.md,
    minWidth: 50,
    alignItems: 'center',
  },
  typeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
  },
  readingRef: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  insightSection: {
    backgroundColor: COLORS.primary,
    padding: SPACING.xl,
    borderRadius: 24,
    ...SHADOWS.medium,
    marginBottom: SPACING.lg,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  insightTitle: {
    color: COLORS.gold,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: SPACING.sm,
  },
  insightContent: {
    marginTop: SPACING.sm,
  },
  insightText: {
    color: COLORS.white,
    fontSize: 15,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  generateButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: 12,
    padding: SPACING.xl,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  generateButtonText: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: '700',
  },
  tokenHint: {
    color: COLORS.grayLight,
    fontSize: 10,
    marginTop: 4,
  },
  completeButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.success,
    padding: SPACING.lg,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
    ...SHADOWS.medium,
  },
  completedButton: {
    backgroundColor: COLORS.gray,
  },
  completeButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: SPACING.sm,
  },
  // Modal & Sharing Styles
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
  sharePreviewContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sharePreviewCard: {
    width: width * 0.8,
    aspectRatio: 4/5,
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  sharePreviewCardBorder: {
    flex: 1,
    margin: 15,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    borderRadius: 12,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sharePreviewTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 15,
    letterSpacing: 1,
    textAlign: 'center',
  },
  sharePreviewText: {
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  shareCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareCardAppName: {
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 8,
    letterSpacing: 4,
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
