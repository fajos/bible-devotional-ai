// services/bibleApi.js
import { API_CONFIG } from './config';
import store from './store';

const BASE_URL = API_CONFIG.BIBLE_API.baseUrl;

const LOCAL_BIBLE_DATA = {
  'LOCAL_FLV': require('../assets/bible/FLV_NT.json')
};

const STANDARD_BIBLE_CHAPTERS = {
  'Genesis': 50, 'Exodus': 40, 'Leviticus': 27, 'Numbers': 36, 'Deuteronomy': 34,
  'Joshua': 24, 'Judges': 21, 'Ruth': 4, '1 Samuel': 31, '2 Samuel': 24,
  '1 Kings': 22, '2 Kings': 25, '1 Chronicles': 29, '2 Chronicles': 36,
  'Ezra': 10, 'Nehemiah': 13, 'Esther': 10, 'Job': 42, 'Psalms': 150,
  'Proverbs': 31, 'Ecclesiastes': 12, 'Song of Solomon': 8, 'Isaiah': 66,
  'Jeremiah': 52, 'Lamentations': 5, 'Ezekiel': 48, 'Daniel': 12,
  'Hosea': 14, 'Joel': 3, 'Amos': 9, 'Obadiah': 1, 'Jonah': 4,
  'Micah': 7, 'Nahum': 3, 'Habakkuk': 3, 'Zephaniah': 3, 'Haggai': 2,
  'Zechariah': 14, 'Malachi': 4, 'Matthew': 28, 'Mark': 16, 'Luke': 24,
  'John': 21, 'Acts': 28, 'Romans': 16, '1 Corinthians': 16, '2 Corinthians': 13,
  'Galatians': 6, 'Ephesians': 6, 'Philippians': 4, 'Colossians': 4,
  '1 Thessalonians': 5, '2 Thessalonians': 3, '1 Timothy': 6, '2 Timothy': 4,
  'Titus': 3, 'Philemon': 1, 'Hebrews': 13, 'James': 5, '1 Peter': 5,
  '2 Peter': 3, '1 John': 5, '2 John': 1, '3 John': 1, 'Jude': 1,
  'Revelation': 22
};

const BIBLE_BOOKS_BY_ID = {
  1: 'Genesis', 2: 'Exodus', 3: 'Leviticus', 4: 'Numbers', 5: 'Deuteronomy',
  6: 'Joshua', 7: 'Judges', 8: 'Ruth', 9: '1 Samuel', 10: '2 Samuel',
  11: '1 Kings', 12: '2 Kings', 13: '1 Chronicles', 14: '2 Chronicles',
  15: 'Ezra', 16: 'Nehemiah', 17: 'Esther', 18: 'Job', 19: 'Psalms',
  20: 'Proverbs', 21: 'Ecclesiastes', 22: 'Song of Solomon', 23: 'Isaiah',
  24: 'Jeremiah', 25: 'Lamentations', 26: 'Ezekiel', 27: 'Daniel',
  28: 'Hosea', 29: 'Joel', 30: 'Amos', 31: 'Obadiah', 32: 'Jonah',
  33: 'Micah', 34: 'Nahum', 35: 'Habakkuk', 36: 'Zephaniah', 37: 'Haggai',
  38: 'Zechariah', 39: 'Malachi', 40: 'Matthew', 41: 'Mark', 42: 'Luke',
  43: 'John', 44: 'Acts', 45: 'Romans', 46: '1 Corinthians', 47: '2 Corinthians',
  48: 'Galatians', 49: 'Ephesians', 50: 'Philippians', 51: 'Colossians',
  52: '1 Thessalonians', 53: '2 Thessalonians', 54: '1 Timothy', 55: '2 Timothy',
  56: 'Titus', 57: 'Philemon', 58: 'Hebrews', 59: 'James', 60: '1 Peter',
  61: '2 Peter', 62: '1 John', 63: '2 John', 64: '3 John', 65: 'Jude',
  66: 'Revelation'
};

// Yoruba Book Mapping for robust lookup
const YORUBA_BOOK_MAP = {
  'genesis': 'Gẹ́nẹ́sísì', 'exodus': 'Ékísódù', 'leviticus': 'Léfítíkù', 'numbers': 'Numeri', 'deuteronomy': 'Deuteronomi',
  'joshua': 'Joṣua', 'judges': 'Àwọn Onídàájọ́', 'ruth': 'Rúùtù', '1 samuel': '1 Sámúẹ́lì', '2 samuel': '2 Sámúẹ́lì',
  '1 kings': '1 Àwọn Ọba', '2 kings': '2 Àwọn Ọba', '1 chronicles': '1 Àwọn Kíróníkà', '2 chronicles': '2 Àwọn Kíróníkà',
  'ezra': 'Ẹ́sírà', 'nehemiah': 'Nehemáyà', 'esther': 'Ẹ́sítà', 'job': 'Jóòbù', 'psalms': 'Sáàmù', 'psalm': 'Sáàmù',
  'proverbs': 'Òwe', 'ecclesiastes': 'Oníwàásù', 'song of solomon': 'Orin Sólómọ́nì', 'isaiah': 'Aísáyà',
  'jeremiah': 'Jeremáyà', 'lamentations': 'Ìdárò Jeremáyà', 'ezekiel': 'Ẹ́sékíẹ́lì', 'daniel': 'Dáníẹ́lì',
  'hosea': 'Hósíà', 'joel': 'Jóẹ́lì', 'amos': 'Ámọ́sì', 'obadiah': 'Òbadáyà', 'jonah': 'Jónà',
  'micah': 'Míkà', 'nahum': 'Náhúmù', 'habakkuk': 'Hábákúkù', 'zephaniah': 'Sẹfanáyà', 'haggai': 'Hágáì',
  'zechariah': 'Sẹkaráyà', 'malachi': 'Málákì', 'matthew': 'Mátíù', 'matiu': 'Mátíù', 'mark': 'Máàkù', 'maaku': 'Máàkù',
  'luke': 'Lúùkù', 'luku': 'Lúùkù', 'john': 'Jòhánù', 'johanu': 'Jòhánù', 'johannu': 'Jòhánù', 'acts': 'Àwọn Ìṣe',
  'romans': 'Róòmù', '1 corinthians': '1 Kọ́ríńtì', '2 corinthians': '2 Kọ́ríńtì', 'galatians': 'Gálátíà',
  'ephesians': 'Éfésù', 'philippians': 'Fílí́pì', 'colossians': 'Kólósè', '1 thessalonians': '1 Tẹsalóníkà',
  '2 thessalonians': '2 Tẹsalóníkà', '1 timothy': '1 Tímótì', '2 timothy': '2 Tímótì', 'titus': 'Títù',
  'philemon': 'Fílímọ́nì', 'hebrews': 'Hébérù', 'james': 'Jákọ́bù', '1 peter': '1 Pétérù', '2 peter': '2 Pétérù',
  '1 john': '1 Jòhánù', '1 johannu': '1 Jòhánù', '2 john': '2 Jòhánù', '2 johannu': '2 Jòhánù', '3 john': '3 Jòhánù',
  '3 johannu': '3 Jòhánù', 'jude': 'Júdà', 'revelation': 'Ìfihàn'
};

class BibleAPIService {
  constructor() {
    // bolls.life is keyless
  }

  // Get all available Bibles
  async getBibles() {
    try {
      const cacheKey = 'bible_list_full';
      const cached = await store.getCachedData(cacheKey);
      if (cached) return cached;

      const versions = API_CONFIG.BIBLE_API.versions;
      const names = API_CONFIG.BIBLE_API.versionNames;

      const bibles = Object.keys(versions).map(id => ({
        id: versions[id],
        name: names[id],
        abbreviation: id,
        language: { name: (id === 'YOR' || id === 'GH_YOR') ? 'Yoruba' : 'English' }
      }));

      await store.setCachedData(cacheKey, bibles);
      return bibles;
    } catch (error) {
      console.error('Error fetching Bibles:', error);
      return [];
    }
  }

  // Get specific Bible details
  async getBible(bibleId) {
    if (!bibleId) return null;
    const bibles = await this.getBibles();
    // Try exact ID match first, then abbreviation match
    const found = bibles.find(b => b.id === bibleId) || bibles.find(b => b.abbreviation === bibleId);
    if (found) return found;

    // Fallback: search in config if not in the list for some reason
    const versions = API_CONFIG.BIBLE_API.versions;
    const names = API_CONFIG.BIBLE_API.versionNames;

    // Check if bibleId is an abbreviation
    if (versions[bibleId]) {
        return {
            id: versions[bibleId],
            name: names[bibleId],
            abbreviation: bibleId,
            language: { name: 'English' }
        };
    }

    // Check if bibleId is a GH_ ID
    const abbr = Object.keys(versions).find(key => versions[key] === bibleId);
    if (abbr) {
        return {
            id: bibleId,
            name: names[abbr],
            abbreviation: abbr,
            language: { name: 'English' }
        };
    }

    return null;
  }

  // Helper for local JSON search (FLV or GitHub versions)
  searchLocalData(activeBibleId, bibleData, query, page = 1, isFlv = false) {
    try {
      const results = [];
      const lowerQuery = query.toLowerCase();

      // Iterate through books, chapters, and verses
      for (const bookName in bibleData) {
        const chapters = bibleData[bookName];
        if (!chapters || typeof chapters !== 'object') continue;

        for (const chapterNum in chapters) {
          const verses = chapters[chapterNum];
          if (!verses || typeof verses !== 'object') continue;

          for (const verseNum in verses) {
            const rawText = verses[verseNum];
            if (!rawText || typeof rawText !== 'string') continue;

            if (rawText.toLowerCase().includes(lowerQuery)) {
              // Determine bookId (Bolls style if possible, or fallback)
              const bookIdMatch = Object.entries(BIBLE_BOOKS_BY_ID).find(
                ([id, name]) => name.toLowerCase() === bookName.toLowerCase()
              );

              results.push({
                id: `${activeBibleId}-${bookName}-${chapterNum}-${verseNum}`,
                text: isFlv ? this.cleanLocalText(rawText) : this.stripHtml(rawText),
                bookId: bookIdMatch ? bookIdMatch[0] : bookName,
                bookName: bookName,
                chapter: parseInt(chapterNum),
                verse: parseInt(verseNum),
                reference: `${bookName} ${chapterNum}:${verseNum}`
              });
            }
          }
        }
      }

      // Pagination for local results
      const itemsPerPage = 20;
      const totalResults = results.length;
      const totalPages = Math.ceil(totalResults / itemsPerPage);
      const paginatedResults = results.slice((page - 1) * itemsPerPage, page * itemsPerPage);

      return {
        results: paginatedResults,
        totalPages: totalPages,
        totalResults: totalResults
      };
    } catch (error) {
      console.error(`Local search error for ${activeBibleId}:`, error);
      return { results: [], totalPages: 0, totalResults: 0 };
    }
  }

  // Search for verses by keyword
  async search(bibleId, query, page = 1) {
    if (!bibleId || !query) return { results: [], totalPages: 0, totalResults: 0 };
    const activeBibleId = await this.resolveBibleId(bibleId);

    // 1. Check for Local/GitHub versions to support offline search
    if (activeBibleId === 'LOCAL_FLV' || activeBibleId.startsWith('GH_')) {
      const isFlv = activeBibleId === 'LOCAL_FLV';
      const data = isFlv ? LOCAL_BIBLE_DATA['LOCAL_FLV'] : await this.getGitHubBibleData(activeBibleId);

      if (data) {
        return this.searchLocalData(activeBibleId, data, query, page, isFlv);
      }
    }

    // 2. Fallback to Bolls API Search for other versions (online)
    // Strip GH_ prefix just in case we didn't have data cached but want to try remote
    const bollsId = activeBibleId.startsWith('GH_') ? activeBibleId.replace('GH_', '') : activeBibleId;

    try {
      const response = await fetch(`${BASE_URL}/search/${bollsId}/?search=${encodeURIComponent(query)}&page=${page}`);
      if (!response.ok) return { results: [], totalPages: 0, totalResults: 0 };

      const data = await response.json();
      // Bolls search returns { results: [...], total_pages: X }
      // Each result: { pk: verse_id, text: "...", book: book_id, chapter: chap_num, verse: verse_num }
      return {
        results: (data.results || []).map(r => ({
          id: r.pk,
          text: this.stripHtml(r.text),
          bookId: r.book,
          bookName: BIBLE_BOOKS_BY_ID[r.book] || `Book ${r.book}`,
          chapter: r.chapter,
          verse: r.verse,
          reference: `${BIBLE_BOOKS_BY_ID[r.book] || r.book} ${r.chapter}:${r.verse}`
        })),
        totalPages: data.total_pages || 0,
        totalResults: data.total_results || 0
      };
    } catch (error) {
      console.error('Bolls search error:', error);
      return { results: [], totalPages: 0, totalResults: 0 };
    }
  }

  // Resolve bibleId to internal ID if abbreviation was passed
  async resolveBibleId(bibleId) {
    if (!bibleId) return null;
    if (bibleId.startsWith('GH_') || bibleId === 'LOCAL_FLV') return bibleId;

    const bibles = await this.getBibles();
    const found = bibles.find(b => b.abbreviation === bibleId);
    return found ? found.id : bibleId;
  }

  // Get all books of a Bible
  async getBooks(bibleId) {
    if (!bibleId) return [];

    const activeBibleId = await this.resolveBibleId(bibleId);

    // Handle local Bible
    if (activeBibleId === 'LOCAL_FLV') {
      const data = LOCAL_BIBLE_DATA['LOCAL_FLV'];
      return Object.keys(data).map((bookName, index) => {
        const bookChapters = Object.keys(data[bookName]).length;
        // NT books usually start from index 40 (Matthew)
        const bookId = 40 + index;
        return {
          id: String(bookId),
          name: bookName,
          shortName: bookName,
          standardName: bookName,
          abbreviation: bookName.substring(0, 3).toUpperCase(),
          number: bookId,
          chapters: bookChapters
        };
      });
    }

    // Handle GitHub Hosted Bible
    if (activeBibleId.startsWith('GH_')) {
        try {
            const cacheKey = `books_github_${activeBibleId}`;
            const cached = await store.getCachedData(cacheKey);
            if (cached) return cached;

            const data = await this.getGitHubBibleData(activeBibleId);
            if (!data) return [];

            const books = Object.keys(data).map(bookName => {
                const chapters = Object.keys(data[bookName]).length;
                const bookIdMatch = Object.entries(BIBLE_BOOKS_BY_ID).find(([id, name]) => name.toLowerCase() === bookName.toLowerCase());
                const bookId = bookIdMatch ? bookIdMatch[0] : bookName;

                return {
                    id: String(bookId),
                    name: bookName,
                    shortName: bookName,
                    standardName: BIBLE_BOOKS_BY_ID[bookId] || bookName,
                    abbreviation: bookName.substring(0, 3).toUpperCase(),
                    number: parseInt(bookId) || 0,
                    chapters: chapters
                };
            });

            if (books.length > 0) {
                await store.setCachedData(cacheKey, books);
            }
            return books;
        } catch (error) {
            console.error('Error fetching GitHub books:', error);
            return [];
        }
    }

    try {
      const cacheKey = `books_bolls_${activeBibleId}`;
      const cached = await store.getCachedData(cacheKey);

      // Force refresh if cached data is missing chapters for first few books
      if (cached && Array.isArray(cached) && cached.length > 0) {
        const gen = cached.find(b =>
          String(b.name).toLowerCase() === 'genesis' ||
          String(b.shortName).toLowerCase() === 'genesis' ||
          String(b.id) === '1'
        );
        if (gen && gen.chapters > 0) {
           return cached;
        }
        console.log(`Cache for ${activeBibleId} seems invalid (missing chapters), refreshing...`);
      }

      const response = await fetch(`${BASE_URL}/get-books/${activeBibleId}/`);
      if (!response.ok) {
        if (response.status !== 404) {
          console.error(`Bolls API fetch books failed for ${activeBibleId}: ${response.status}`);
        }
        return [];
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        console.error(`Bolls API error: get-books for ${activeBibleId} returned non-array`, data);
        return [];
      }

      const books = data.map(b => {
        // Handle various ID fields. Bolls uses 'pk' or 'bookid' usually.
        const bookid = b.pk || b.bookid || b.book_id || b.id || b.number;
        if (bookid === undefined || bookid === null) return null;

        const bidInt = parseInt(bookid);
        const standardName = !isNaN(bidInt) ? BIBLE_BOOKS_BY_ID[bidInt] : null;

        const rawName = b.name || b.book_name || b.title || '';
        const normalizedName = this.normalizeBookName(rawName);

        // Prefer standard name for UI to avoid ceremonial prefixes
        const name = standardName || normalizedName || rawName;

        // Use API chapter count or fallback to standard counts
        let rawChapters = b.chapters || b.chapters_count || b.chapter_count || b.chaps || 0;
        let chapters = parseInt(rawChapters);

        if (isNaN(chapters) || chapters <= 0) {
          chapters = STANDARD_BIBLE_CHAPTERS[normalizedName] || STANDARD_BIBLE_CHAPTERS[standardName] || 0;
        }

        return {
          id: String(bookid),
          name: name,
          shortName: normalizedName,
          standardName: standardName,
          abbreviation: (name || '').substring(0, 3).toUpperCase(),
          number: bidInt,
          chapters: chapters
        };
      }).filter(Boolean);

      if (books.length > 0) {
        await store.setCachedData(cacheKey, books);
      }
      return books;
    } catch (error) {
      console.error('Error fetching books:', error);
      return [];
    }
  }

  // Get chapters of a book
  async getChapters(bibleId, bookId) {
    if (!bibleId || !bookId) return [];
    const activeBibleId = await this.resolveBibleId(bibleId);
    try {
      const books = await this.getBooks(activeBibleId);
      if (!books || books.length === 0) return [];

      const search = String(bookId).toLowerCase();
      // Try exact matches first
      let book = books.find(b =>
        String(b.id).toLowerCase() === search ||
        String(b.name).toLowerCase() === search ||
        (b.shortName && b.shortName.toLowerCase() === search) ||
        (b.standardName && b.standardName.toLowerCase() === search)
      );

      // Fallback for partial name matches
      if (!book) {
        book = books.find(b =>
          (b.name && String(b.name).toLowerCase().includes(search)) ||
          (b.standardName && String(b.standardName).toLowerCase().includes(search))
        );
      }

      if (!book) {
        console.warn(`Book not found: ${bookId} in bible ${bibleId}`);
        return [];
      }

      // If we have the chapters count from the book list, use it
      if (book.chapters && book.chapters > 0) {
        return Array.from({ length: book.chapters }, (_, i) => ({
          id: (i + 1).toString(),
          number: (i + 1).toString()
        }));
      }

      // Last resort fallback
      return [{ id: '1', number: '1' }];
    } catch (error) {
      console.error('Error fetching chapters:', error);
      return [];
    }
  }

  // Get full chapter content
  async getChapter(bibleId, bookId, chapterNumber) {
    if (!bibleId || !bookId || !chapterNumber) return null;

    const activeBibleId = await this.resolveBibleId(bibleId);

    // Handle local Bible
    if (activeBibleId === 'LOCAL_FLV') {
      const data = LOCAL_BIBLE_DATA['LOCAL_FLV'];
      let bookName = BIBLE_BOOKS_BY_ID[bookId];

      // Fallback: try to find by ID if bookId is actually a name
      if (!bookName) {
        bookName = Object.keys(data).find(name => name.toLowerCase() === String(bookId).toLowerCase());
      }

      if (bookName && data[bookName] && data[bookName][chapterNumber]) {
        const chapterData = data[bookName][chapterNumber];
        return Object.keys(chapterData).map(vNum => ({
          verse: parseInt(vNum),
          text: this.cleanLocalText(chapterData[vNum])
        }));
      }
      return null;
    }

    // Handle GitHub Hosted Bible
    if (activeBibleId.startsWith('GH_')) {
        try {
            const cacheKey = `content_github_${activeBibleId}_${bookId}_${chapterNumber}`;
            const cached = await store.getCachedData(cacheKey);
            if (cached) return cached;

            const data = await this.getGitHubBibleData(activeBibleId);
            if (!data) return null;

            let bookName = BIBLE_BOOKS_BY_ID[bookId];
            if (!bookName) {
                bookName = Object.keys(data).find(name => name.toLowerCase() === String(bookId).toLowerCase());
            }

            if (bookName && data[bookName] && data[bookName][chapterNumber]) {
                const chapterData = data[bookName][chapterNumber];
                const verses = Object.keys(chapterData).map(vNum => ({
                    verse: parseInt(vNum),
                    text: this.stripHtml(chapterData[vNum] || '').trim()
                }));
                if (verses.length > 0) {
                    await store.setCachedData(cacheKey, verses);
                }
                return verses;
            }
            return null;
        } catch (error) {
            console.error('Error fetching GitHub chapter:', error);
            return null;
        }
    }

    try {
      const cacheKey = `content_bolls_${activeBibleId}_${bookId}_${chapterNumber}`;
      const cached = await store.getCachedData(cacheKey);
      if (cached) return cached;

      const response = await fetch(`${BASE_URL}/get-chapter/${activeBibleId}/${bookId}/${chapterNumber}/`);
      if (!response.ok) return null;

      const data = await response.json();
      if (data && data.length > 0) {
        await store.setCachedData(cacheKey, data);
      }
      return data;
    } catch (error) {
      console.error('Error fetching chapter:', error);
      return null;
    }
  }

  // Get parsed verses for a chapter
  async getChapterVersesParsed(bibleId, bookId, chapterNumber) {
    try {
      const activeBibleId = await this.resolveBibleId(bibleId);
      const data = await this.getChapter(activeBibleId, bookId, chapterNumber);
      if (!data || !Array.isArray(data)) return [];

      return data.map(v => {
        if (!v) return null;
        return {
          id: `${activeBibleId}.${bookId}.${chapterNumber}.${v.verse || '0'}`,
          number: (v.verse || '').toString(),
          text: this.stripHtml(v.text || '').trim()
        };
      }).filter(Boolean);
    } catch (error) {
      console.error('Error parsing chapter verses:', error);
      return [];
    }
  }

  // Offline Download logic
  async downloadBible(bibleId, onProgress) {
    try {
      if (onProgress) onProgress(0, 'Initializing...');

      const books = await this.getBooks(bibleId);
      if (!books || books.length === 0) {
        throw new Error('Could not fetch books for this Bible.');
      }

      if (onProgress) onProgress(0.05, `Starting download of ${books.length} books...`);

      let completedChapters = 0;
      const totalChapters = books.reduce((acc, book) => acc + (book.chapters || 0), 0);

      for (let i = 0; i < books.length; i++) {
        const book = books[i];
        const chapterCount = book.chapters || 0;

        for (let ch = 1; ch <= chapterCount; ch++) {
          // getChapter handles caching internally
          await this.getChapter(bibleId, book.id, ch);
          completedChapters++;

          // Report progress every 5 chapters or at the end of a book
          if (completedChapters % 5 === 0 || ch === chapterCount) {
            const progress = 0.05 + (completedChapters / totalChapters) * 0.90;
            if (onProgress) {
              onProgress(
                progress,
                `Downloading ${book.name} (${ch}/${chapterCount})`
              );
            }
          }
        }
      }

      // Mark as downloaded in store
      const downloaded = await store.getCachedData('downloaded_bibles') || [];
      if (!downloaded.includes(bibleId)) {
        await store.setCachedData('downloaded_bibles', [...downloaded, bibleId]);
      }

      if (onProgress) onProgress(1, 'Download Complete');
      return true;
    } catch (error) {
      console.error(`Error downloading Bible ${bibleId}:`, error);
      if (onProgress) onProgress(0, `Error: ${error.message}`);
      return false;
    }
  }

  // Get verse text using the Bolls API
  async getFormattedVerse(bibleId, reference) {
    try {
      if (!reference || !bibleId) return null;

      const activeBibleId = await this.resolveBibleId(bibleId);

      // Clean reference from common AI additions
      const cleanRef = reference.replace(/\([^)]*\)/g, '').trim();
      const parsed = this.parseReference(cleanRef);
      if (!parsed) return null;

      // Special handling for local or GitHub Bible
      if (activeBibleId === 'LOCAL_FLV' || activeBibleId.startsWith('GH_')) {
          let data;
          let copyright;

          if (activeBibleId === 'LOCAL_FLV') {
              data = LOCAL_BIBLE_DATA['LOCAL_FLV'];
              copyright = "The Father's Life Version";
          } else {
              data = await this.getGitHubBibleData(activeBibleId);
              copyright = API_CONFIG.BIBLE_API.versionNames[Object.keys(API_CONFIG.BIBLE_API.versions).find(key => API_CONFIG.BIBLE_API.versions[key] === activeBibleId)];
          }

          if (!data) return null;

          const bookSearch = parsed.book.toLowerCase().trim();

          // 1. Try static Yoruba mapping first (most reliable for GH_YOR)
          let mappedBook = YORUBA_BOOK_MAP[bookSearch];

          // If not found, try to find by normalized English key (e.g. "1st samuel" -> "1 samuel")
          if (!mappedBook) {
              const cleanSearch = bookSearch.replace(/st|nd|rd|th/g, '').replace(/\s+/g, ' ');
              mappedBook = YORUBA_BOOK_MAP[cleanSearch];
          }

          // Ultra-robust matching: normalize everything (remove accents/diacritics)
          const normalize = (str) => {
            if (!str) return '';
            return str.normalize("NFD")
               .replace(/[\u0300-\u036f]/g, "")
               .toLowerCase()
               .trim();
          };

          const normalizedBookSearch = normalize(bookSearch);

          // Find the book name in the data keys
          const availableBooks = Object.keys(data);
          const bookName = mappedBook && data[mappedBook] ? mappedBook : availableBooks.find(name => {
            const lowerName = name.toLowerCase().trim();
            const normalizedName = normalize(lowerName);

            // Try 1: Exact match or mapped match
            if (lowerName === bookSearch || lowerName === mappedBook?.toLowerCase()) return true;

            // Try 2: Normalized exact match (ignores accents)
            if (normalizedName === normalizedBookSearch) return true;

            // Try 3: Normalized partial match (e.g. "Maatiu" matches "Iwe Maatiu")
            if (normalizedName.includes(normalizedBookSearch) || normalizedBookSearch.includes(normalizedName)) return true;

            return false;
          });

          if (!bookName) {
            console.log(`[YOR Fix] Could not find book "${bookSearch}" (${normalizedBookSearch}) in Yoruba Bible.`);
            console.log(`[YOR Fix] Available books: ${availableBooks.slice(0, 5).join(', ')}...`);
          }

          if (bookName && data[bookName] && data[bookName][parsed.chapter]) {
              const chapterData = data[bookName][parsed.chapter];

              if (parsed.startVerse) {
                  if (parsed.endVerse) {
                      // Range
                      const verses = [];
                      for (let v = parsed.startVerse; v <= parsed.endVerse; v++) {
                          const vRaw = chapterData[v];
                          const vText = activeBibleId === 'LOCAL_FLV' ? this.cleanLocalText(vRaw) : this.stripHtml(vRaw || '');
                          if (vText) verses.push({ text: vText, number: v });
                      }
                      const text = verses.map(v => v.text).join(' ');
                      return {
                          reference: reference,
                          content: text,
                          text: text,
                          verses: verses,
                          copyright: copyright
                      };
                  } else {
                      // Single verse
                      const vRaw = chapterData[parsed.startVerse];
                      const vText = activeBibleId === 'LOCAL_FLV' ? this.cleanLocalText(vRaw) : this.stripHtml(vRaw || '');
                      if (!vText) return null;
                      return {
                          reference: reference,
                          content: vText,
                          text: vText,
                          verses: [{ text: vText, number: parsed.startVerse }],
                          copyright: copyright
                      };
                  }
              } else {
                  // Whole chapter
                  const verses = Object.keys(chapterData).map(v => ({
                      text: activeBibleId === 'LOCAL_FLV' ? this.cleanLocalText(chapterData[v]) : this.stripHtml(chapterData[v] || ''),
                      number: parseInt(v)
                  }));
                  const text = verses.map(v => v.text).join(' ');
                  return {
                      reference: reference,
                      content: text,
                      text: text,
                      verses: verses,
                      copyright: copyright
                  };
              }
          }
          return null;
      }

      const books = await this.getBooks(activeBibleId);
      if (!books || books.length === 0) return null;

      const search = parsed.book.toLowerCase().trim();

      let book = books.find(b =>
        b.name.toLowerCase() === search ||
        b.shortName.toLowerCase() === search ||
        String(b.id) === search
      );

      if (!book) {
        // Fallback for common variants
        const variants = {
          'psalms': 'psalm',
          'revelations': 'revelation',
          'songs of solomon': 'song of solomon',
          'solomon': 'song of solomon'
        };
        const normalizedSearch = variants[search] || search;
        book = books.find(b =>
          b.name.toLowerCase().includes(normalizedSearch) ||
          normalizedSearch.includes(b.name.toLowerCase())
        );
      }

      if (!book) return null;

      if (parsed.chapter) {
        if (parsed.startVerse) {
          if (parsed.endVerse) {
            // Range
            const chapter = await this.getChapter(activeBibleId, book.id, parsed.chapter);
            if (!chapter) return null;

            const filtered = chapter.filter(v => v.verse >= parsed.startVerse && v.verse <= parsed.endVerse);
            const text = filtered.map(v => this.stripHtml(v.text)).join(' ');

            return {
              reference: reference,
              content: text,
              text: text,
              verses: filtered.map(v => ({ text: this.stripHtml(v.text), number: v.verse })),
              copyright: 'Bolls.life'
            };
          } else {
            // Single verse
            const response = await fetch(`${BASE_URL}/get-text/${activeBibleId}/${book.id}/${parsed.chapter}/${parsed.startVerse}/`);
            if (!response.ok) {
              const chapter = await this.getChapter(activeBibleId, book.id, parsed.chapter);
              const v = chapter?.find(v => v.verse === parsed.startVerse);
              if (!v) return null;
              return {
                reference: reference,
                content: this.stripHtml(v.text),
                text: this.stripHtml(v.text),
                verses: [{ text: this.stripHtml(v.text), number: v.verse }],
                copyright: 'Bolls.life'
              };
            }
            const v = await response.json();
            return {
              reference: reference,
              content: this.stripHtml(v.text),
              text: this.stripHtml(v.text),
              verses: [{ text: this.stripHtml(v.text), number: v.verse }],
              copyright: 'Bolls.life'
            };
          }
        } else {
          // Whole chapter
          const chapter = await this.getChapter(activeBibleId, book.id, parsed.chapter);
          if (!chapter) return null;
          const text = chapter.map(v => this.stripHtml(v.text)).join(' ');
          return {
            reference: reference,
            content: text,
            text: text,
            verses: chapter.map(v => ({ text: this.stripHtml(v.text), number: v.verse })),
            copyright: 'Bolls.life'
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error in getFormattedVerse:', error);
      return null;
    }
  }

  async getMultipleVerses(bibleId, references) {
    if (!references || !Array.isArray(references)) return [];
    try {
      const results = [];
      for (const ref of references) {
        if (!ref) continue;
        const verse = await this.getFormattedVerse(bibleId, ref);
        if (verse) results.push(verse);
        else results.push({ reference: ref, text: 'Content unavailable', content: 'Content unavailable' });
      }
      return results;
    } catch (error) {
      console.error('Error in getMultipleVerses:', error);
      return [];
    }
  }

  async getGitHubBibleData(bibleId) {
      try {
          const fileName = API_CONFIG.BIBLE_API.GITHUB_API.mappings[bibleId];
          if (!fileName) return null;

          const cacheKey = `full_bible_github_${bibleId}`;
          const cached = await store.getCachedData(cacheKey);
          if (cached) return cached;

          const url = `${API_CONFIG.BIBLE_API.GITHUB_API.baseUrl}/${encodeURIComponent(fileName)}`;
          const response = await fetch(url);
          if (!response.ok) return null;

          let data = await response.json();
          if (!data) return null;

          // Normalize Yoruba structure (Array of {bookName, details: Verse[]}) to standard structure
          if (Array.isArray(data) && data.length > 0 && data[0].details) {
              console.log("Normalizing Yoruba Bible structure...");
              const normalized = {};
              data.forEach(book => {
                  const bookName = book.bookName;
                  normalized[bookName] = {};
                  book.details.forEach(v => {
                      if (!normalized[bookName][v.chapter]) {
                          normalized[bookName][v.chapter] = {};
                      }
                      normalized[bookName][v.chapter][v.verse] = v.text;
                  });
              });
              data = normalized;
          }

          if (data) {
              await store.setCachedData(cacheKey, data);
          }
          return data;
      } catch (error) {
          console.error(`Error fetching GitHub Bible data for ${bibleId}:`, error);
          return null;
      }
  }

  parseReference(reference) {
    if (!reference) return null;
    const cleanRef = reference.trim();

    // Enhanced Pattern: Supports Unicode for non-English book names (e.g. Yoruba Gẹ́nẹ́sísì)
    // Pattern: "John 3:16" or "1 John 1:9" or "Gẹ́nẹ́sísì 1:1"
    const match = cleanRef.match(/^(\d?\s*[^\d\s\W]+(?:\s*[^\d\s\W]+)*)\s+(\d+):(\d+)(?:-(\d+))?$/u);
    if (match) {
      return {
        book: match[1].trim(),
        chapter: parseInt(match[2]),
        startVerse: parseInt(match[3]),
        endVerse: match[4] ? parseInt(match[4]) : null,
      };
    }

    // Pattern: "Psalm 23"
    const chapterMatch = cleanRef.match(/^(\d?\s*[^\d\s\W]+(?:\s*[^\d\s\W]+)*)\s+(\d+)$/u);
    if (chapterMatch) {
      return {
        book: chapterMatch[1].trim(),
        chapter: parseInt(chapterMatch[2]),
        startVerse: null,
        endVerse: null,
      };
    }
    return null;
  }

  cleanLocalText(text) {
    if (!text) return '';
    // Strip uppercase book names at the end of the string
    // Matches a space followed by one of the NT book names in caps at the very end
    const bookPattern = /\s+(MATTHEW|MARK|LUKE|JOHN|ACTS|ROMANS|1 CORINTHIANS|2 CORINTHIANS|GALATIANS|EPHESIANS|PHILIPPIANS|COLOSSIANS|1 THESSALONIANS|2 THESSALONIANS|1 TIMOTHY|2 TIMOTHY|TITUS|PHILEMON|HEBREWS|JAMES|1 PETER|2 PETER|1 JOHN|2 JOHN|3 JOHN|JUDE|REVELATION)$/;
    return text.replace(bookPattern, '').trim();
  }

  stripHtml(html) {
    if (!html) return '';
    return html
      .replace(/<S>\d+<\/S>/g, '') // Strip Strong's numbers
      .replace(/<sup[^>]*>.*?<\/sup>/g, '') // Strip footnotes
      .replace(/<[^>]*>/g, '') // Strip all other HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  normalizeBookName(name) {
    if (!name) return '';
    let clean = name;

    // Ceremonial prefixes in NKJV/KJV
    const ceremonial = [
      /^The (?:First|Second|Third|Fourth|Fifth) Book of Moses called /i,
      /^The (?:First|Second) Book of the Kings/i,
      /^The (?:First|Second) Book of the Chronicles/i,
      /^The (?:First|Second|Third) Epistle of /i,
      /^The (?:General )?Epistle of (?:Paul the Apostle to the |Paul to the |James|Peter|John|Jude)/i,
      /^The Gospel According to (?:Saint )?/i,
      /^The (?:Holy )?Revelation of (?:Saint )?John(?: the Divine)?/i,
      /^The Proverbs/i,
      /^The Song of Solomon/i,
      /^The Lamentations of Jeremiah/i,
      /^The Acts of the Apostles/i,
      /^The Book of /i,
      /^The SONG OF /i,
      /^The /i
    ];

    ceremonial.forEach(regex => {
      clean = clean.replace(regex, '');
    });

    // Strip "called ..." at the end if it exists (e.g. Genesis)
    clean = clean.replace(/ Called [A-Z]+$/i, '');

    // Handle Revelation specifically
    if (clean.toLowerCase().includes('revelation')) {
        return 'Revelation';
    }

    return clean
      .replace(/According to Saint /g, '')
      .replace(/According to /g, '')
      .trim();
  }
}

const bibleApi = new BibleAPIService();
export default bibleApi;
