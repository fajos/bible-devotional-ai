import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Directory, Paths } from 'expo-file-system';
import { API_CONFIG } from './config';

/**
 * Expo 54 FileSystem API Migration.
 * AGENT: Standardize storage architecture to use new File and Directory classes.
 */

// Simple in-memory store for passing data between screens
let currentDevotionalData = null;

// File Names
const FAVORITES_FILE = 'favorites.json';
const SAVED_DEVOTIONALS_FILE = 'saved_devotionals.json';
const HIGHLIGHTS_FILE = 'highlights.json';
const LAST_READ_FILE = 'last_read.json';
const DAILY_DEVOTIONAL_FILE = 'daily_devotional.json';
const PRAYER_JOURNAL_FILE = 'prayer_journal.json';

// Legacy keys for migration
const FAVORITE_BIBLES_KEY = 'favorite_bibles';
const LEGACY_SAVED_DEVOTIONALS_KEY = 'savedDevotionals';
const PREFERRED_VERSION_KEY = 'preferred_bible_version';
const AUDIO_PREFS_KEY = 'audio_preferences';

const BASE_DIR = Paths.document; // Persistent storage
const BIBLE_CACHE_DIR = new Directory(Paths.cache, 'bible_cache');

let _bibleCacheDirValidated = false;

export const storeDevotional = (data) => {
  currentDevotionalData = data;
};

export const getStoredDevotional = () => {
  return currentDevotionalData;
};

export const clearStoredDevotional = () => {
  currentDevotionalData = null;
};

// --- Favorite Bibles ---

export const setPreferredBibleVersion = async (versionId) => {
  try {
    await AsyncStorage.setItem(PREFERRED_VERSION_KEY, versionId);
  } catch (error) {
    console.error('Error saving preferred version:', error);
  }
};

export const getPreferredBibleVersion = async () => {
  try {
    const saved = await AsyncStorage.getItem(PREFERRED_VERSION_KEY);
    return saved || 'NKJV'; // Default to NKJV
  } catch (error) {
    return 'NKJV';
  }
};

// --- Audio Preferences ---

export const setAudioPreferences = async (prefs) => {
  try {
    await AsyncStorage.setItem(AUDIO_PREFS_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.error('Error saving audio prefs:', error);
  }
};

export const getAudioPreferences = async () => {
  try {
    const saved = await AsyncStorage.getItem(AUDIO_PREFS_KEY);
    return saved ? JSON.parse(saved) : {
      voiceIdentifier: null,
      rate: 0.9,
      pitch: 1.0,
      gender: 'female'
    };
  } catch (error) {
    return { voiceIdentifier: null, rate: 0.9, pitch: 1.0, gender: 'female' };
  }
};

export const setFavoriteBibles = async (bibles) => {
  try {
    const file = new File(BASE_DIR, FAVORITES_FILE);
    await file.write(JSON.stringify(bibles));
    // Clean up legacy if it exists
    await AsyncStorage.removeItem(FAVORITE_BIBLES_KEY);
  } catch (error) {
    console.error('Error saving favorite bibles to FS:', error);
  }
};

export const getFavoriteBibles = async () => {
  try {
    const file = new File(BASE_DIR, FAVORITES_FILE);
    let bibles = [];

    if (file.exists) {
      bibles = JSON.parse(await file.text());
    } else {
      // Migration: Check legacy AsyncStorage
      const saved = await AsyncStorage.getItem(FAVORITE_BIBLES_KEY);
      if (saved) {
        bibles = JSON.parse(saved);
        await setFavoriteBibles(bibles);
      }
    }

    // Filter out invalid/removed versions (like BBE or TLB)
    const validIds = Object.values(API_CONFIG.BIBLE_API.versions);
    return bibles.filter(b => validIds.includes(b.id));
  } catch (error) {
    return [];
  }
};

// --- Library Management ---

export const getSavedDevotionals = async () => {
  try {
    const file = new File(BASE_DIR, SAVED_DEVOTIONALS_FILE);
    if (file.exists) {
      const content = await file.text();
      return JSON.parse(content);
    }

    // Migration: Check legacy AsyncStorage library
    const legacy = await AsyncStorage.getItem(LEGACY_SAVED_DEVOTIONALS_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      await saveLibrary(parsed); // Move to FS
      await AsyncStorage.removeItem(LEGACY_SAVED_DEVOTIONALS_KEY);
      return parsed;
    }
    return [];
  } catch (e) {
    console.error('Error loading library from FS:', e);
    return [];
  }
};

export const saveLibrary = async (devotionals) => {
  try {
    const file = new File(BASE_DIR, SAVED_DEVOTIONALS_FILE);
    await file.write(JSON.stringify(devotionals));
  } catch (e) {
    console.error('Error saving library to FS:', e);
    throw e;
  }
};

export const toggleSaveDevotional = async (devotional) => {
  const library = await getSavedDevotionals();
  const isSaved = library.some(item => item.id === devotional.id);

  let newLibrary;
  if (isSaved) {
    newLibrary = library.filter(item => item.id !== devotional.id);
  } else {
    newLibrary = [...library, { ...devotional, savedAt: new Date().toISOString() }];
  }

  await saveLibrary(newLibrary);
  return !isSaved;
};

// --- Highlight Management ---

/**
 * Returns statistics about the highlights storage.
 */
export const getHighlightStats = async () => {
  try {
    await ensureHighlightsDir();
    const files = await HIGHLIGHTS_DIR.list();
    let totalHighlights = 0;
    let fileCount = 0;

    for (const item of files) {
      if (item instanceof File && item.name.endsWith('.json')) {
        try {
          const content = await item.text();
          const chunk = JSON.parse(content);
          totalHighlights += Object.keys(chunk).length;
          fileCount++;
        } catch (e) {
          // Skip malformed files
        }
      }
    }
    return { totalHighlights, fileCount };
  } catch (e) {
    return { totalHighlights: 0, fileCount: 0 };
  }
};

const HIGHLIGHTS_DIR = new Directory(BASE_DIR, 'highlights');
let _highlightsDirValidated = false;

const ensureHighlightsDir = async () => {
  if (!_highlightsDirValidated) {
    try {
      if (!HIGHLIGHTS_DIR.exists) {
        await HIGHLIGHTS_DIR.create({ idempotent: true });
      }
      _highlightsDirValidated = true;
    } catch (e) {
      console.error('Error creating highlights directory:', e);
    }
  }
};

const getHighlightChunkFileForBook = (bookId) => {
  return new File(HIGHLIGHTS_DIR, `${bookId}.json`);
};

const getBookFromVerseId = (verseId) => {
  if (!verseId) return 'unknown';
  const parts = verseId.split('.');
  // Bolls API verse ID: BIBLE.BOOK.CHAPTER.VERSE -> index 1
  // Canonical verse ID: BOOK.CHAPTER.VERSE -> index 0
  if (parts.length >= 4) return parts[1];
  return parts[0];
};

/**
 * Migration helper to split a single highlights object into book-based chunks.
 */
const migrateHighlightsToChunks = async (highlights) => {
  if (!highlights || Object.keys(highlights).length === 0) return;

  await ensureHighlightsDir();
  const chunks = {};

  // Group highlights by book
  for (const [verseId, data] of Object.entries(highlights)) {
    const book = getBookFromVerseId(verseId);
    if (!chunks[book]) chunks[book] = {};
    chunks[book][verseId] = data;
  }

  // Write each chunk to its respective file
  for (const [book, data] of Object.entries(chunks)) {
    const file = getHighlightChunkFileForBook(book);
    let existing = {};
    if (file.exists) {
      try {
        existing = JSON.parse(await file.text());
      } catch (e) {
        console.error(`Error parsing chunk ${book}:`, e);
      }
    }
    await file.write(JSON.stringify({ ...existing, ...data }));
  }
};

export const getHighlights = async () => {
  try {
    await ensureHighlightsDir();

    // 1. Migration from old single FileSystem file
    const oldFile = new File(BASE_DIR, HIGHLIGHTS_FILE);
    if (oldFile.exists) {
      try {
        const oldData = JSON.parse(await oldFile.text());
        await migrateHighlightsToChunks(oldData);
        await oldFile.delete();
      } catch (e) {
        console.error('Error migrating highlights file:', e);
      }
    }

    // 2. Migration from legacy AsyncStorage
    const legacy = await AsyncStorage.getItem('bible_highlights');
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy);
        await migrateHighlightsToChunks(parsed);
        await AsyncStorage.removeItem('bible_highlights');
      } catch (e) {
        console.error('Error migrating legacy highlights:', e);
      }
    }

    // 3. Read all chunks and merge into a single object for the UI
    // Note: For very large sets (10k+), the reader should be updated
    // to load only the current book's highlights using getHighlightsForBook.
    const highlights = {};
    const files = await HIGHLIGHTS_DIR.list();
    for (const item of files) {
      if (item instanceof File && item.name.endsWith('.json')) {
        try {
          const content = await item.text();
          const chunk = JSON.parse(content);
          Object.assign(highlights, chunk);
        } catch (e) {
          console.error(`Error reading highlight chunk ${item.name}:`, e);
        }
      }
    }
    return highlights;
  } catch (e) {
    console.error('Error loading highlights from FS:', e);
    return {};
  }
};

/**
 * Loads highlights for a specific book to optimize reader performance.
 */
export const getHighlightsForBook = async (bookId) => {
  try {
    await ensureHighlightsDir();
    const file = getHighlightChunkFileForBook(bookId);
    if (file.exists) {
      return JSON.parse(await file.text());
    }
    return {};
  } catch (e) {
    return {};
  }
};

/**
 * Optimized for performance: only writes the affected book's chunk.
 */
export const saveHighlights = async (highlights) => {
  try {
    await migrateHighlightsToChunks(highlights);
  } catch (e) {
    console.error('Error saving highlights to FS:', e);
  }
};

export const toggleHighlight = async (bibleId, verseId, color = null) => {
  await ensureHighlightsDir();
  const bookId = getBookFromVerseId(verseId);
  const file = getHighlightChunkFileForBook(bookId);

  let chunk = {};
  if (file.exists) {
    try {
      chunk = JSON.parse(await file.text());
    } catch (e) {
      chunk = {};
    }
  }

  const key = verseId;
  const isRemoving = !color || color === 'transparent';

  if (isRemoving && chunk[key]) {
    delete chunk[key];
  } else if (!isRemoving) {
    chunk[key] = {
      bibleId,
      verseId,
      color,
      updatedAt: new Date().toISOString(),
    };
  }

  await file.write(JSON.stringify(chunk));

  // Return the full set to keep compatibility with existing UI
  // Future: Optimization could return only the updated chunk if UI is updated.
  return await getHighlights();
};

export const applyBulkHighlights = async (bibleId, verseIds, color = null) => {
  await ensureHighlightsDir();
  const now = new Date().toISOString();
  const isRemoving = !color || color === 'transparent';

  // Group by book to minimize file writes
  const byBook = {};
  verseIds.forEach(verseId => {
    const bookId = getBookFromVerseId(verseId);
    if (!byBook[bookId]) byBook[bookId] = [];
    byBook[bookId].push(verseId);
  });

  for (const [bookId, ids] of Object.entries(byBook)) {
    const file = getHighlightChunkFileForBook(bookId);
    let chunk = {};
    if (file.exists) {
      try {
        chunk = JSON.parse(await file.text());
      } catch (e) {
        chunk = {};
      }
    }

    ids.forEach(vId => {
      if (isRemoving) {
        delete chunk[vId];
      } else {
        chunk[vId] = {
          bibleId,
          verseId: vId,
          color,
          updatedAt: now,
        };
      }
    });
    await file.write(JSON.stringify(chunk));
  }

  return await getHighlights();
};

// --- Cache Management ---

export const getCachedData = async (key) => {
  try {
    if (!_bibleCacheDirValidated) {
      await BIBLE_CACHE_DIR.create({ idempotent: true });
      _bibleCacheDirValidated = true;
    }

    const safeKey = key.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.json';
    const file = new File(BIBLE_CACHE_DIR, safeKey);

    if (file.exists) {
      return JSON.parse(await file.text());
    }

    const legacyData = await AsyncStorage.getItem('bible_cache_' + key);
    if (legacyData) {
      try {
        const parsed = JSON.parse(legacyData);
        await setCachedData(key, parsed);
        await AsyncStorage.removeItem('bible_cache_' + key);
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  } catch (e) {
    return null;
  }
};

export const cacheData = (key, data) => setCachedData(key, data);

export const setCachedData = async (key, data) => {
  try {
    if (!_bibleCacheDirValidated) {
      await BIBLE_CACHE_DIR.create({ idempotent: true });
      _bibleCacheDirValidated = true;
    }

    const safeKey = key.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.json';
    const file = new File(BIBLE_CACHE_DIR, safeKey);
    await file.write(JSON.stringify(data));

    await AsyncStorage.removeItem('bible_cache_' + key);
  } catch (e) {
    console.error('Write cache error:', e);
  }
};

// --- Storage Utils & Size Helpers ---

/**
 * Calculates the total size of a directory recursively.
 */
const getDirSize = async (directory) => {
  try {
    if (!directory.exists) return 0;
    let size = 0;
    const contents = await directory.list();
    for (const item of contents) {
      if (item instanceof File) {
        const info = await item.info;
        size += info.size || 0;
      } else if (item instanceof Directory) {
        size += await getDirSize(item);
      }
    }
    return size;
  } catch (e) {
    return 0;
  }
};

export const getCacheSize = async () => {
  return await getDirSize(BIBLE_CACHE_DIR);
};

export const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const clearCache = async () => {
  try {
    if (BIBLE_CACHE_DIR.exists) {
      await BIBLE_CACHE_DIR.delete();
      // Re-create it so it's ready for use
      await BIBLE_CACHE_DIR.create({ idempotent: true });
    }
  } catch (e) {
    console.error('Error clearing cache:', e);
    throw e;
  }
};

export const clearHighlights = async () => {
  try {
    // 1. Clear the chunked directory
    if (HIGHLIGHTS_DIR.exists) {
      await HIGHLIGHTS_DIR.delete();
      _highlightsDirValidated = false;
    }

    // 2. Clear the old legacy file if it exists
    const file = new File(BASE_DIR, HIGHLIGHTS_FILE);
    if (file.exists) {
      await file.delete();
    }
  } catch (e) {
    console.error('Error clearing highlights:', e);
    throw e;
  }
};

export const clearAllFileSystemData = async () => {
  try {
    const filesToClear = [
      SAVED_DEVOTIONALS_FILE,
      FAVORITES_FILE,
      LAST_READ_FILE,
      DAILY_DEVOTIONAL_FILE
    ];
    for (const fileName of filesToClear) {
      const file = new File(BASE_DIR, fileName);
      if (file.exists) {
        await file.delete();
      }
    }
    await clearHighlights();
    await clearCache();
  } catch (e) {
    console.error('Error clearing FS data:', e);
    throw e;
  }
};

// --- Daily Devotional ---
export const getDailyDevotional = async () => {
  try {
    const file = new File(BASE_DIR, DAILY_DEVOTIONAL_FILE);
    if (file.exists) {
      return JSON.parse(await file.text());
    }

    // Migration
    const cached = await AsyncStorage.getItem('dailyDevotional');
    if (cached) {
      const parsed = JSON.parse(cached);
      await setDailyDevotional(parsed.date, parsed.devotional);
      await AsyncStorage.removeItem('dailyDevotional');
      return parsed;
    }
    return null;
  } catch (e) {
    return null;
  }
};

// --- Prayer Journal ---
export const getPrayers = async () => {
  try {
    const file = new File(BASE_DIR, PRAYER_JOURNAL_FILE);
    if (file.exists) {
      return JSON.parse(await file.text());
    }

    // Migration
    const legacy = await AsyncStorage.getItem('prayer_journal');
    if (legacy) {
      const parsed = JSON.parse(legacy);
      await savePrayers(parsed);
      await AsyncStorage.removeItem('prayer_journal');
      return parsed;
    }
    return [];
  } catch (e) {
    return [];
  }
};

export const savePrayers = async (prayers) => {
  try {
    const file = new File(BASE_DIR, PRAYER_JOURNAL_FILE);
    await file.write(JSON.stringify(prayers));
  } catch (e) {
    console.error('Error saving prayers to FS:', e);
  }
};

export const setDailyDevotional = async (date, devotional) => {
  try {
    const file = new File(BASE_DIR, DAILY_DEVOTIONAL_FILE);
    await file.write(JSON.stringify({ date, devotional }));
  } catch (e) {
    console.error('Error saving daily devotional to FS:', e);
  }
};

// --- Last Read State ---
export const setLastReadState = async (state) => {
  try {
    const file = new File(BASE_DIR, LAST_READ_FILE);
    await file.write(JSON.stringify(state));
  } catch (e) {
    console.error('Error saving last read state to FS:', e);
  }
};

export const getLastReadState = async () => {
  try {
    const file = new File(BASE_DIR, LAST_READ_FILE);
    if (file.exists) {
      const state = JSON.parse(await file.text());
      // Validate against current versions
      const validIds = Object.values(API_CONFIG.BIBLE_API.versions);
      if (state && state.bibleId && !validIds.includes(state.bibleId)) {
        return null;
      }
      return state;
    }
    return null;
  } catch (e) {
    return null;
  }
};

export default {
  storeDevotional,
  getStoredDevotional,
  clearStoredDevotional,
  setFavoriteBibles,
  getFavoriteBibles,
  getSavedDevotionals,
  saveLibrary,
  toggleSaveDevotional,
  getHighlights,
  getHighlightsForBook,
  saveHighlights,
  toggleHighlight,
  applyBulkHighlights,
  getHighlightStats,
  getCachedData,
  setCachedData,
  getCacheSize,
  formatSize,
  clearCache,
  clearAllFileSystemData,
  clearHighlights,
  setLastReadState,
  getLastReadState,
  getDailyDevotional,
  setDailyDevotional,
  getPrayers,
  savePrayers,
  getAudioPreferences,
  setAudioPreferences,
  getPreferredBibleVersion,
  setPreferredBibleVersion,
};
