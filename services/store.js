// services/store.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Directory, Paths } from 'expo-file-system';

// Simple in-memory store for passing data between screens
let currentDevotionalData = null;

const FAVORITE_BIBLES_KEY = 'favorite_bibles';
const SAVED_DEVOTIONALS_FILE = 'saved_devotionals.json';

/**
 * Use the new Expo 54 API.
 */
const BASE_DIR = Paths.document; // Persistent storage
const BIBLE_CACHE_DIR = new Directory(Paths.cache, 'bible_cache');

export const storeDevotional = (data) => {
  currentDevotionalData = data;
};

export const getStoredDevotional = () => {
  return currentDevotionalData;
};

export const clearStoredDevotional = () => {
  currentDevotionalData = null;
};

// Favorite Bibles (Small enough for AsyncStorage, but we wrap it for safety)
export const setFavoriteBibles = async (bibles) => {
  try {
    await AsyncStorage.setItem(FAVORITE_BIBLES_KEY, JSON.stringify(bibles));
  } catch (error) {
    if (error.message.includes('SQLITE_FULL')) {
      console.warn('AsyncStorage full, falling back to FileSystem for favorites');
      const file = new File(BASE_DIR, 'favorites.json');
      await file.write(JSON.stringify(bibles));
    }
    console.error('Error saving favorite bibles:', error);
  }
};

export const getFavoriteBibles = async () => {
  try {
    const saved = await AsyncStorage.getItem(FAVORITE_BIBLES_KEY);
    if (!saved) {
      const file = new File(BASE_DIR, 'favorites.json');
      if (file.exists) {
        return JSON.parse(await file.text());
      }
    }
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    return [];
  }
};

// --- Library Management (Moved to FileSystem to prevent SQLITE_FULL) ---

export const getSavedDevotionals = async () => {
  try {
    const file = new File(BASE_DIR, SAVED_DEVOTIONALS_FILE);
    if (file.exists) {
      const content = await file.text();
      return JSON.parse(content);
    }

    // Migration: Check legacy AsyncStorage library
    const legacy = await AsyncStorage.getItem('savedDevotionals');
    if (legacy) {
      const parsed = JSON.parse(legacy);
      await saveLibrary(parsed); // Move to FS
      await AsyncStorage.removeItem('savedDevotionals').catch(() => {});
      return parsed;
    }
    return [];
  } catch (e) {
    console.error('Error loading library:', e);
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

// --- Cache Management ---

export const getCachedData = async (key) => {
  try {
    const safeKey = key.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.json';
    const file = new File(BIBLE_CACHE_DIR, safeKey);

    if (file.exists) {
      return JSON.parse(await file.text());
    }

    const legacyData = await AsyncStorage.getItem('bible_cache_' + key);
    return legacyData ? JSON.parse(legacyData) : null;
  } catch (e) {
    return null;
  }
};

export const setCachedData = async (key, data) => {
  try {
    if (!BIBLE_CACHE_DIR.exists) {
      await BIBLE_CACHE_DIR.create({ idempotent: true });
    }

    const safeKey = key.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.json';
    const file = new File(BIBLE_CACHE_DIR, safeKey);
    await file.write(JSON.stringify(data));

    await AsyncStorage.removeItem('bible_cache_' + key).catch(() => {});
  } catch (e) {
    console.error('Write cache error:', e);
  }
};

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

export const clearAllFileSystemData = async () => {
  try {
    const filesToClear = [SAVED_DEVOTIONALS_FILE, 'favorites.json'];
    for (const fileName of filesToClear) {
      const file = new File(BASE_DIR, fileName);
      if (file.exists) {
        await file.delete();
      }
    }
    await clearCache();
  } catch (e) {
    console.error('Error clearing FS data:', e);
    throw e;
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
  getCachedData,
  setCachedData,
  getCacheSize,
  formatSize,
  clearCache,
  clearAllFileSystemData,
};
