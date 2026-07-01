import { Ionicons } from '@expo/vector-icons';
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
import { COLORS, SHADOWS, SPACING } from '../constants/theme';
import { useAppTheme } from '../context/ThemeContext';
import bibleApi from '../services/bibleApi';
import * as store from '../services/store';

interface ScripturePreviewModalProps {
  visible: boolean;
  reference: string | null;
  onClose: () => void;
  bibleVersion?: string;
}

interface VerseItem {
  number: number | null;
  text: string;
}

export default function ScripturePreviewModal({
  visible,
  reference,
  onClose,
  bibleVersion
}: ScripturePreviewModalProps) {
  const { colors, isDarkMode } = useAppTheme();
  const [loading, setLoading] = useState(false);
  const [verseData, setVerseData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && reference) {
      loadVerse();
    } else {
      setVerseData(null);
      setError(null);
    }
  }, [visible, reference]);

  const loadVerse = async () => {
    if (!reference) return;
    setLoading(true);
    setError(null);
    try {
      let version = bibleVersion || 'NKJV';
      const prefs = await store.getPreferredBibleVersion();
      if (prefs && !bibleVersion) {
        version = prefs;
      }

      // Clean reference - remove any leading/trailing AI artifacts that wrapScriptures might have missed
      const cleanRef = reference.replace(/[\[\]]/g, '').trim();

      const activeBibleId = await bibleApi.resolveBibleId(version);
      const data = await bibleApi.getFormattedVerse(activeBibleId, cleanRef);

      if (data && (data.verses?.length > 0 || data.content)) {
        setVerseData(data);
      } else {
        setError('Verse content not available in this version.');
      }
    } catch (err) {
      console.error('Error loading preview verse:', err);
      setError('Failed to load verse.');
    } finally {
      setLoading(false);
    }
  };

  const getVerses = (): VerseItem[] => {
    if (verseData?.verses?.length > 0) {
      return verseData.verses;
    }
    // Fallback: treat the whole content as one block with no verse number
    return [{ number: null, text: verseData?.content || '' }];
  };

  return (
    <Modal
  visible={visible}
  transparent={true}
  animationType="fade"
  onRequestClose={onClose}
>
  <View style={styles.overlay}>
    <TouchableOpacity
      style={StyleSheet.absoluteFillObject}
      activeOpacity={1}
      onPress={onClose}
    />
    <View style={[styles.content, { backgroundColor: colors.surface }]}>
      <View style={[styles.header, { borderBottomColor: colors.offWhite }]}>
        <Text style={[styles.title, { color: colors.text }]}>{reference}</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.gold} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Fetching scripture...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
          </View>
        ) : verseData ? (
          <ScrollView
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.scrollContent}
          >
            {getVerses().map((verse, i) => (
              <Text key={i} style={styles.verseLine}>
                {verse.number != null && (
                  <Text style={[styles.verseNum, { color: colors.gold }]}>
                    {verse.number}{' '}
                  </Text>
                )}
                <Text style={[styles.verseText, { color: colors.text }]}>
                  {verse.text.trim()}
                </Text>
              </Text>
            ))}
            <Text style={[styles.versionLabel, { color: colors.gold }]}>
              {verseData.copyright || bibleVersion || 'NKJV'}
            </Text>
          </ScrollView>
        ) : null}
      </View>
    </View>
  </View>
</Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
content: {
  width: '100%',
  maxWidth: 500,
  maxHeight: '60%',     // ← back here where it belongs
  borderRadius: 20,
  ...SHADOWS.large,
},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  body: {
    maxHeight: 420,        // ← ScrollView now has a bounded parent
    minHeight: 150,
    padding: SPACING.lg,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 150,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  errorText: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 14,
  },
  verseLine: {
    marginBottom: 10,
  },
  verseNum: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 22,
  },
  verseText: {
    fontSize: 18,
    lineHeight: 28,
    //fontStyle: 'italic',
    fontFamily: 'serif',
  },
  versionLabel: {
    marginTop: 15,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
    letterSpacing: 1,
  },
});