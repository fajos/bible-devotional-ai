import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { COLORS, FONTS, SHADOWS, SPACING, isTablet } from '../../constants/theme';
import * as store from '../../services/store';
import notifications, { REMINDER_TYPES } from '../../services/notifications';
import { useAppTheme } from '../../context/ThemeContext';
import openaiService from '../../services/openai';
import ScripturePreviewModal from '../../components/ScripturePreviewModal';
import { wrapScriptures } from '../../utils/scriptureParser';

interface Prayer {
  id: string;
  text: string;
  date: string;
  isAnswered: boolean;
}

export default function PrayerJournalScreen() {
  const { colors, isDarkMode } = useAppTheme();
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPrayer, setNewPrayer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);

  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);

  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewReference, setPreviewReference] = useState<string | null>(null);
  const [preferredVersion, setPreferredVersion] = useState('NKJV');
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    loadPrayers();
    loadReminderSettings();
    loadVersion();
  }, []);

  const loadVersion = async () => {
    const version = await store.getPreferredBibleVersion();
    setPreferredVersion(version);
  };

  const loadReminderSettings = async () => {
    const settings = await notifications.getReminderSettings();
    if (settings[REMINDER_TYPES.PRAYER]) {
      setReminderEnabled(settings[REMINDER_TYPES.PRAYER].enabled);
      if (settings[REMINDER_TYPES.PRAYER].hour !== undefined) {
        const time = new Date();
        time.setHours(settings[REMINDER_TYPES.PRAYER].hour);
        time.setMinutes(settings[REMINDER_TYPES.PRAYER].minute || 0);
        setReminderTime(time);
      }
    }
  };

  const toggleReminder = async (value: boolean) => {
    if (value) {
      if (Platform.OS === 'ios') {
        setShowPicker(true);
      } else {
        // On Android, show picker first then schedule
        setShowPicker(true);
      }
    } else {
      await notifications.cancelReminder(REMINDER_TYPES.PRAYER);
      setReminderEnabled(false);
    }
  };

  const onTimeChange = async (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios'); // Keep open on iOS, close on Android

    if (event.type === 'set' && selectedDate) {
      setReminderTime(selectedDate);
      const success = await notifications.scheduleDailyReminder(
        REMINDER_TYPES.PRAYER,
        selectedDate.getHours(),
        selectedDate.getMinutes()
      );
      if (success) {
        setReminderEnabled(true);
      } else {
        setReminderEnabled(false);
        Alert.alert('Permission Denied', 'Please enable notifications in settings.');
      }
    } else if (event.type === 'dismissed' && !reminderEnabled) {
      setReminderEnabled(false);
    }
  };

  const loadPrayers = async () => {
    const saved = await store.getPrayers();
    setPrayers(saved);
  };

  const savePrayers = async (updatedPrayers: Prayer[]) => {
    await store.savePrayers(updatedPrayers);
    setPrayers(updatedPrayers);
  };

  const addPrayer = () => {
    if (!newPrayer.trim()) return;

    const prayer: Prayer = {
      id: Date.now().toString(),
      text: newPrayer.trim(),
      date: new Date().toISOString(),
      isAnswered: false,
    };

    const updated = [prayer, ...prayers];
    savePrayers(updated);
    setNewPrayer('');
    setModalVisible(false);
  };

  const inspirePrayer = async () => {
    if (!newPrayer.trim()) {
      Alert.alert('Inspiration Needed', 'Please enter a brief concern or topic (e.g. "Peace at work") first.');
      return;
    }

    setAiLoading(true);
    try {
      const version = await store.getPreferredBibleVersion();
      const prayer = await openaiService.generatePrayer(newPrayer, version);
      setNewPrayer(prayer);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Prayer inspiration error:', error);
      Alert.alert('Error', 'Failed to get prayer inspiration. Please check your connection.');
    } finally {
      setAiLoading(false);
    }
  };

  const toggleAnswered = (id: string) => {
    const updated = prayers.map(p =>
      p.id === id ? { ...p, isAnswered: !p.isAnswered } : p
    );
    savePrayers(updated);
  };

  const deletePrayer = (id: string) => {
    Alert.alert('Delete Prayer', 'Remove this prayer from your journal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updated = prayers.filter(p => p.id !== id);
          savePrayers(updated);
        }
      }
    ]);
  };

  const renderItem = ({ item }: { item: Prayer }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }, item.isAnswered && [styles.answeredCard, { backgroundColor: isDarkMode ? colors.primaryDark : '#F1F8E9' }]]}
      onPress={() => {
        setSelectedPrayer(item);
        setDetailVisible(true);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.date, { color: colors.textSecondary }]}>{new Date(item.date).toLocaleDateString()}</Text>
        <TouchableOpacity onPress={() => deletePrayer(item.id)}>
          <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <Text
        style={[styles.prayerText, { color: colors.text }, item.isAnswered && styles.strikeText]}
        numberOfLines={4}
        ellipsizeMode="tail"
      >
        {item.text}
      </Text>

      <View style={[styles.cardFooter, { borderTopColor: colors.offWhite }]}>
        <TouchableOpacity
          style={[styles.answeredButton, item.isAnswered && styles.answeredButtonActive]}
          onPress={() => toggleAnswered(item.id)}
        >
          <Ionicons
            name={item.isAnswered ? "checkmark-circle" : "radio-button-off"}
            size={20}
            color={item.isAnswered ? COLORS.white : COLORS.gold}
          />
          <Text style={[styles.answeredButtonText, item.isAnswered && styles.answeredButtonTextActive]}>
            {item.isAnswered ? 'Answered' : 'Answered?'}
          </Text>
        </TouchableOpacity>

        <View style={styles.viewDetailsRow}>
          <Text style={styles.viewDetailsText}>View Details</Text>
          <Ionicons name="chevron-forward" size={14} color={COLORS.gold} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.offWhite }]}>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Prayer Journal</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Keep track of your conversations with God</Text>
        </View>
        <View style={styles.reminderToggle}>
          {reminderEnabled && (
            <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.timeDisplay}>
              <Text style={styles.timeText}>
                {reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
          )}
          <Ionicons name="notifications-outline" size={20} color={reminderEnabled ? COLORS.gold : colors.textSecondary} />
          <Switch
            value={reminderEnabled}
            onValueChange={toggleReminder}
            trackColor={{ false: '#D1D1D1', true: COLORS.gold }}
            thumbColor={COLORS.white}
            style={{ transform: [{ scaleX: .8 }, { scaleY: .8 }] }}
          />
        </View>
      </View>

      {showPicker && (
        <DateTimePicker
          value={reminderTime}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange}
        />
      )}

      <FlatList
        key={isTablet ? 'tablet' : 'phone'}
        data={prayers}
        numColumns={isTablet ? 2 : 1}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={isTablet ? { gap: SPACING.md } : null}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="hand-left-outline" size={60} color={colors.textSecondary} style={{ opacity: 0.5 }} />
            <Text style={[styles.emptyText, { color: colors.text }]}>Your prayer journal is empty.</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>&quot;Ask and it will be given to you...&quot;</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: isDarkMode ? colors.gold : colors.primary }]}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={30} color={isDarkMode ? colors.primary : COLORS.white} />
      </TouchableOpacity>

      <ScripturePreviewModal
        visible={previewVisible}
        reference={previewReference}
        onClose={() => setPreviewVisible(false)}
        bibleVersion={preferredVersion}
      />

      {/* Prayer Detail Modal */}
      <Modal
        visible={detailVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, maxHeight: '80%' }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {selectedPrayer ? new Date(selectedPrayer.date).toLocaleDateString() : 'Prayer'}
              </Text>
              <TouchableOpacity onPress={() => setDetailVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.fullPrayerText, { color: colors.text }]}>
                {selectedPrayer ? wrapScriptures(selectedPrayer.text).split(/(\[\[.*?\]\])/g).map((part, i) => {
                  if (part.startsWith('[[') && part.endsWith(']]')) {
                    const ref = part.slice(2, -2);
                    return (
                      <Text
                        key={i}
                        style={{ color: COLORS.goldDark, fontWeight: 'bold', textDecorationLine: 'underline' }}
                        onPress={() => {
                          setPreviewReference(ref);
                          setPreviewVisible(true);
                          Haptics.selectionAsync();
                        }}
                      >
                        {ref}
                      </Text>
                    );
                  }
                  return part;
                }) : ''}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>New Prayer Request</Text>
              <TouchableOpacity
                style={[styles.inspireButton, aiLoading && styles.inspireButtonDisabled]}
                onPress={inspirePrayer}
                disabled={aiLoading}
              >
                {aiLoading ? (
                  <ActivityIndicator size="small" color={COLORS.gold} />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={16} color={COLORS.gold} />
                    <Text style={styles.inspireText}>Inspire</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: colors.offWhite, color: colors.text, borderColor: colors.offWhite }]}
              placeholder="What are you praying for? (e.g. 'Patience for my family')"
              placeholderTextColor={colors.textSecondary}
              multiline
              value={newPrayer}
              onChangeText={setNewPrayer}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={addPrayer}
              >
                <Text style={styles.saveButtonText}>Add Prayer</Text>
              </TouchableOpacity>
            </View>
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
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  reminderToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeDisplay: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.goldDark,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.small,
  },
  answeredCard: {
    opacity: 0.8,
    backgroundColor: '#F1F8E9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  date: {
    fontSize: 12,
    color: COLORS.gray,
  },
  prayerText: {
    fontSize: 16,
    color: COLORS.primary,
    lineHeight: 24,
    marginBottom: 16,
  },
  strikeText: {
    textDecorationLine: 'line-through',
    color: COLORS.gray,
  },
  answeredButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gold,
    alignSelf: 'flex-start',
  },
  answeredButtonActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  answeredButtonText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.gold,
  },
  answeredButtonTextActive: {
    color: COLORS.white,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.goldDark,
    marginRight: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.large,
  },
  empty: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 16,
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.gray,
    fontStyle: 'italic',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    ...SHADOWS.large,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  inspireButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  inspireButtonDisabled: {
    opacity: 0.5,
  },
  inspireText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.goldDark,
    marginLeft: 4,
  },
  input: {
    height: 120,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    backgroundColor: '#fafafa',
  },
  fullPrayerText: {
    fontSize: 18,
    lineHeight: 28,
    fontStyle: 'italic',
    paddingBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 12,
  },
  cancelButton: {},
  cancelButtonText: {
    color: COLORS.gray,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: COLORS.gold,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});
