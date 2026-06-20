import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';
import Store from './store';
import BibleApi from './bibleApi';

export const runHighlightStressTest = async (count = 5000) => {
  console.log(`Starting highlight stress test with ${count} items...`);
  const startTime = Date.now();

  // Distribute highlights across several books for a realistic test
  const books = ['GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'MAT', 'MAR', 'LUK', 'JOH', 'ROM'];
  const highlights = {};
  for (let i = 0; i < count; i++) {
    const book = books[i % books.length];
    const chapter = Math.floor(i / 100) + 1;
    const verse = (i % 100) + 1;
    const verseId = `${book}.${chapter}.${verse}`;

    highlights[verseId] = {
      bibleId: 'de4e12af7f28f599-01',
      verseId,
      color: i % 2 === 0 ? 'yellow' : 'green',
      updatedAt: new Date().toISOString(),
    };
  }

  const generateTime = Date.now();
  console.log(`Generated ${count} highlights across ${books.length} books in ${generateTime - startTime}ms`);

  await Store.saveHighlights(highlights);
  const saveTime = Date.now();
  console.log(`Saved ${count} highlights to FileSystem (chunked) in ${saveTime - generateTime}ms`);

  const loadedHighlights = await Store.getHighlights();
  const loadTime = Date.now();
  console.log(`Loaded ${count} highlights from FileSystem in ${loadTime - saveTime}ms`);

  const integrity = Object.keys(loadedHighlights).length === count;
  console.log(`Data integrity check: ${integrity ? 'PASSED' : 'FAILED'}`);

  return {
    count,
    books: books.length,
    generateTime: generateTime - startTime,
    saveTime: saveTime - generateTime,
    loadTime: loadTime - saveTime,
    integrity
  };
};

export const verifyHighlightMigration = async () => {
  console.log('Starting migration verification test...');
  const BASE_DIR = Paths.document;
  const HIGHLIGHTS_FILE = 'highlights.json';
  const LEGACY_KEY = 'bible_highlights';

  try {
    // 1. Setup: Clear everything
    await Store.clearHighlights();

    // 2. Setup: Create legacy FileSystem data
    const legacyFSData = {
      'GEN.1.1': { bibleId: 'v1', verseId: 'GEN.1.1', color: 'red', updatedAt: new Date().toISOString() },
      'MAT.5.1': { bibleId: 'v1', verseId: 'MAT.5.1', color: 'blue', updatedAt: new Date().toISOString() }
    };
    const oldFile = new File(BASE_DIR, HIGHLIGHTS_FILE);
    await oldFile.write(JSON.stringify(legacyFSData));
    console.log('Legacy FileSystem file created.');

    // 3. Setup: Create legacy AsyncStorage data
    const legacyASData = {
      'JOH.3.16': { bibleId: 'v1', verseId: 'JOH.3.16', color: 'gold', updatedAt: new Date().toISOString() }
    };
    await AsyncStorage.setItem(LEGACY_KEY, JSON.stringify(legacyASData));
    console.log('Legacy AsyncStorage entry created.');

    // 4. Action: Trigger migration via getHighlights
    console.log('Triggering migration...');
    const result = await Store.getHighlights();

    // 5. Verification
    const hasGEN = result['GEN.1.1']?.color === 'red';
    const hasMAT = result['MAT.5.1']?.color === 'blue';
    const hasJOH = result['JOH.3.16']?.color === 'gold';

    const fsFileDeleted = !oldFile.exists;
    const asKeyDeleted = (await AsyncStorage.getItem(LEGACY_KEY)) === null;

    const migrationSuccessful = hasGEN && hasMAT && hasJOH && fsFileDeleted && asKeyDeleted;

    console.log('Migration Results:', {
      hasGEN, hasMAT, hasJOH,
      fsFileDeleted,
      asKeyDeleted,
      migrationSuccessful
    });

    return {
      success: migrationSuccessful,
      details: { hasGEN, hasMAT, hasJOH, fsFileDeleted, asKeyDeleted }
    };
  } catch (error) {
    console.error('Migration verification FAILED:', error);
    return { success: false, error: error.message };
  }
};

export const runBibleDownloadTest = async (bibleId, onProgress) => {
  console.log(`Starting Bible download test for ${bibleId}...`);
  const startTime = Date.now();

  try {
    const success = await BibleApi.downloadBible(bibleId, (progress, message) => {
      console.log(`Download Progress: ${(progress * 100).toFixed(2)}% - ${message}`);
      if (onProgress) onProgress(progress, message);
    });

    const endTime = Date.now();
    console.log(`Bible download test ${success ? 'PASSED' : 'FAILED'} in ${(endTime - startTime) / 1000}s`);

    return {
      success,
      duration: (endTime - startTime) / 1000,
    };
  } catch (error) {
    console.error('Bible download test CRASHED:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
