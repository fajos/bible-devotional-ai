// services/bibleApi.js
import { API_CONFIG } from './config';
import store from './store';

const BASE_URL = API_CONFIG.BIBLE_API.baseUrl;

class BibleAPIService {
  constructor() {
    this.headers = {
      'api-key': API_CONFIG.BIBLE_API.apiKey,
    };
  }

  // Get all available Bibles
  async getBibles() {
    try {
      const cacheKey = 'bibles_list';
      let bibles = await store.getCachedData(cacheKey);

      // If we have cached data, we still check for duplicates just in case
      if (bibles && bibles.length > 0) {
        const uniqueBibles = new Map();
        let hadDuplicates = false;
        bibles.forEach(bible => {
          const name = (bible.name || '').trim().toLowerCase();
          const lang = (bible.language?.name || '').toLowerCase();
          const key = `${name}-${lang}`;

          if (!uniqueBibles.has(key)) {
            uniqueBibles.set(key, bible);
          } else {
            hadDuplicates = true;
            // Prefer the one with an abbreviation or the one that isn't "audio"
            const existing = uniqueBibles.get(key);
            if ((!existing.abbreviation && bible.abbreviation) ||
                (existing.type === 'audio' && bible.type !== 'audio')) {
              uniqueBibles.set(key, bible);
            }
          }
        });

        if (hadDuplicates) {
          bibles = Array.from(uniqueBibles.values());
          await store.setCachedData(cacheKey, bibles);
        }
        return bibles;
      }

      const response = await fetch(`${BASE_URL}/bibles`, {
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      bibles = data.data || [];

      // Filter duplicates by name and language to clean up the list
      if (bibles.length > 0) {
        const uniqueBibles = new Map();
        bibles.forEach(bible => {
          const name = (bible.name || '').trim().toLowerCase();
          const lang = (bible.language?.name || '').toLowerCase();
          const key = `${name}-${lang}`;

          if (!uniqueBibles.has(key)) {
            uniqueBibles.set(key, bible);
          } else {
            const existing = uniqueBibles.get(key);
            if ((!existing.abbreviation && bible.abbreviation) ||
                (existing.type === 'audio' && bible.type !== 'audio')) {
              uniqueBibles.set(key, bible);
            }
          }
        });
        bibles = Array.from(uniqueBibles.values());

        // Cache the deduplicated list
        await store.setCachedData(cacheKey, bibles);
      }

      return bibles;
    } catch (error) {
      console.error('Error fetching Bibles:', error);
      return [];
    }
  }

  // Get specific Bible details
  async getBible(bibleId) {
    try {
      const cacheKey = `bible_${bibleId}`;
      const cached = await store.getCachedData(cacheKey);
      if (cached) return cached;

      const response = await fetch(`${BASE_URL}/bibles/${bibleId}`, {
        headers: this.headers,
      });

      if (!response.ok) return null;

      const data = await response.json();

      if (data.data) {
        await store.setCachedData(cacheKey, data.data);
      }
      return data.data;
    } catch (error) {
      console.error('Error fetching Bible:', error);
      return null;
    }
  }

  // Get all books of a Bible
  async getBooks(bibleId) {
    try {
      const cacheKey = `books_${bibleId}`;
      const cached = await store.getCachedData(cacheKey);
      if (cached) return cached;

      const response = await fetch(`${BASE_URL}/bibles/${bibleId}/books`, {
        headers: this.headers,
      });

      if (!response.ok) return [];

      const data = await response.json();
      const books = data.data || [];

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
    try {
      const cacheKey = `chapters_${bibleId}_${bookId}`;
      const cached = await store.getCachedData(cacheKey);
      if (cached) return cached;

      const response = await fetch(
        `${BASE_URL}/bibles/${bibleId}/books/${bookId}/chapters`,
        { headers: this.headers }
      );

      if (!response.ok) return [];

      const data = await response.json();
      const chapters = data.data || [];

      if (chapters.length > 0) {
        await store.setCachedData(cacheKey, chapters);
      }
      return chapters;
    } catch (error) {
      console.error('Error fetching chapters:', error);
      return [];
    }
  }

  // Get full chapter content
  async getChapter(bibleId, chapterId) {
    try {
      const cacheKey = `content_${bibleId}_${chapterId}`;
      const cached = await store.getCachedData(cacheKey);
      if (cached) return cached;

      // Requesting 'text' format is much cleaner for the reader
      const response = await fetch(
        `${BASE_URL}/bibles/${bibleId}/chapters/${chapterId}?content-type=text&include-notes=false&include-titles=true&include-chapter-numbers=false&include-verse-numbers=true`,
        { headers: this.headers }
      );

      if (!response.ok) return null;

      const data = await response.json();

      if (data.data) {
        await store.setCachedData(cacheKey, data.data);
      }
      return data.data;
    } catch (error) {
      console.error('Error fetching chapter:', error);
      return null;
    }
  }

  // Pre-cache a Bible's full content (Books, Chapters, and Text)
  async downloadBible(bibleId, onProgress) {
    try {
      // 1. Get and cache books
      const books = await this.getBooks(bibleId);
      if (onProgress) onProgress(0.05, 'Preparing books...');

      // 2. Map out all chapters first
      const allChapters = [];
      for (const book of books) {
        const chapters = await this.getChapters(bibleId, book.id);
        chapters.forEach(c => {
          allChapters.push({ ...c, bookName: book.name });
        });
      }

      const total = allChapters.length;
      if (onProgress) onProgress(0.1, `Starting download of ${total} chapters...`);

      // 3. Download chapter contents in chunks to avoid overwhelming the API/device
      for (let i = 0; i < allChapters.length; i++) {
        const chapter = allChapters[i];

        // This will fetch from API and save to AsyncStorage via our cached getChapter method
        await this.getChapter(bibleId, chapter.id);

        if (onProgress && (i % 10 === 0 || i === total - 1)) {
          const progress = 0.1 + (0.9 * (i + 1) / total);
          onProgress(progress, `Downloading ${chapter.bookName} ${chapter.number}...`);
        }

        // Small throttle to stay within API rate limits
        if (i % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 30));
        }
      }

      // Mark as fully downloaded
      const downloadedBibles = await store.getCachedData('downloaded_bibles') || [];
      if (!downloadedBibles.includes(bibleId)) {
        await store.setCachedData('downloaded_bibles', [...downloadedBibles, bibleId]);
      }

      return true;
    } catch (error) {
      console.error('Error downloading Bible:', error);
      return false;
    }
  }

  async isBibleDownloaded(bibleId) {
    try {
      const downloadedBibles = await store.getCachedData('downloaded_bibles') || [];
      return downloadedBibles.includes(bibleId);
    } catch (e) {
      return false;
    }
  }

  // Get verses from a chapter
  async getChapterVerses(bibleId, chapterId) {
    try {
      const response = await fetch(
        `${BASE_URL}/bibles/${bibleId}/chapters/${chapterId}/verses`,
        { headers: this.headers }
      );
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching verses:', error);
      return [];
    }
  }

  // Get specific verse by ID
  async getVerse(bibleId, verseId) {
    try {
      const response = await fetch(
        `${BASE_URL}/bibles/${bibleId}/verses/${verseId}`,
        { headers: this.headers }
      );
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching verse:', error);
      return null;
    }
  }

  // Search for verses
  async searchVerses(bibleId, query) {
    try {
      const params = new URLSearchParams({
        query: query,
        limit: '20',
      });

      const response = await fetch(
        `${BASE_URL}/bibles/${bibleId}/search?${params}`,
        { headers: this.headers }
      );
      const data = await response.json();

      if (data.data?.verses) {
        return data.data.verses;
      }

      // The search results might be in a different format
      if (data.data?.passages) {
        return data.data.passages;
      }

      return [];
    } catch (error) {
      console.error('Error searching verses:', error);
      return [];
    }
  }

  getPublicApiVersion(bibleId, bibleName = '') {
    const mapping = {
      'de4e12af7f28f599-01': 'kjv', // KJV
      '685d1470fe4d5c3b-01': 'asv', // ASV
      '9874583577d0571f-01': 'web', // WEB
      '9874583577d0571f-02': 'web', // WEB
    };

    if (mapping[bibleId]) return mapping[bibleId];

    // Try name matching if provided
    const name = bibleName.toLowerCase();
    if (name.includes('world english bible')) return 'web';
    if (name.includes('king james version') && !name.includes('new')) return 'kjv';
    if (name.includes('bible in basic english')) return 'bbe';
    if (name.includes('open english bible')) return 'oeb';

    return null;
  }

  // Parse a Bible reference like "John 3:16" into components
  parseReference(reference) {
    // Clean the reference
    const cleanRef = reference.trim();

    // Match patterns like "John 3:16" or "1 Kings 3:16-17"
    const match = cleanRef.match(/^(\d?\s*[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?$/);

    if (match) {
      return {
        book: match[1].trim(),
        chapter: parseInt(match[2]),
        startVerse: parseInt(match[3]),
        endVerse: match[4] ? parseInt(match[4]) : null,
      };
    }

    // Match "John 3" (chapter only)
    const chapterMatch = cleanRef.match(/^(\d?\s*[A-Za-z]+)\s+(\d+)$/);
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

  // Find book ID from book name
  async findBookId(bibleId, bookName) {
    try {
      const books = await this.getBooks(bibleId);

      // Try exact match first
      let book = books.find(b =>
        b.name.toLowerCase() === bookName.toLowerCase() ||
        b.abbreviation?.toLowerCase() === bookName.toLowerCase()
      );

      // Try partial match
      if (!book) {
        book = books.find(b =>
          b.name.toLowerCase().includes(bookName.toLowerCase()) ||
          bookName.toLowerCase().includes(b.name.toLowerCase())
        );
      }

      return book?.id || null;
    } catch (error) {
      console.error('Error finding book:', error);
      return null;
    }
  }

  // Find chapter ID
  async findChapterId(bibleId, bookId, chapterNumber) {
    try {
      const chapters = await this.getChapters(bibleId, bookId);
      const chapter = chapters.find(c =>
        c.number === chapterNumber.toString() ||
        c.reference?.endsWith(`${chapterNumber}`)
      );
      return chapter?.id || null;
    } catch (error) {
      console.error('Error finding chapter:', error);
      return null;
    }
  }

  // Strip HTML tags and decode entities
  stripHtml(html) {
    if (!html) return '';

    let text = html;

    // 1. Replace paragraph and break tags with newlines
    text = text.replace(/<(p|br|div)[^>]*>/gi, '\n');

    // 2. Remove all other tags
    text = text.replace(/<[^>]*>/g, '');

    // 3. Decode common HTML entities
    text = text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&rsquo;/g, "'")
      .replace(/&lsquo;/g, "'")
      .replace(/&rdquo;/g, '"')
      .replace(/&ldquo;/g, '"')
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–')
      .replace(/&nbsp;/g, ' ');

    // 4. Clean up whitespace: multiple spaces -> single space, multiple newlines -> double newline
    text = text.replace(/[ \t]+/g, ' ');
    text = text.replace(/\n\s*\n/g, '\n\n');

    return text.trim();
  }

  // Get verse text using the correct API format
  async getFormattedVerse(bibleId, reference, bibleName = '') {
    try {
      console.log(`Looking up: "${reference}" in Bible ${bibleId} (${bibleName})`);

      // Try Free Public API first for compatible versions to save quota
      const publicVersion = this.getPublicApiVersion(bibleId, bibleName);
      if (publicVersion) {
        try {
          const response = await fetch(`${API_CONFIG.BIBLE_API.PUBLIC_API.baseUrl}/${encodeURIComponent(reference)}?translation=${publicVersion}`);
          if (response.ok) {
            const data = await response.json();
            console.log('Fetched from Free Public API');
            return {
              reference: data.reference,
              content: data.text.trim(),
              verses: data.verses.map(v => ({ text: v.text.trim(), reference: `${v.book_name} ${v.chapter}:${v.verse}` })),
              copyright: 'Public Domain / Free License',
            };
          }
        } catch (e) {
          console.warn('Public API fallback failed, trying api.bible');
        }
      }

      // Fallback to api.bible for NKJV, etc.
      const searchResults = await this.searchVerses(bibleId, reference);
      // ... rest of existing code ...

      if (searchResults && searchResults.length > 0) {
        const firstResult = searchResults[0];
        console.log('Search result found');

        // Clean the content - prioritize content (HTML) for better stripping of headers
        let cleanContent = '';
        if (firstResult.content) {
          cleanContent = this.stripHtml(firstResult.content);
        } else if (firstResult.text) {
          cleanContent = this.stripHtml(firstResult.text);
        }

        // Also clean any verses in the array
        const cleanVerses = searchResults.map(v => ({
          ...v,
          text: v.content ? this.stripHtml(v.content) : (v.text ? this.stripHtml(v.text) : ''),
          content: v.content ? this.stripHtml(v.content) : '',
        }));

        return {
          reference: firstResult.reference || reference,
          content: cleanContent,
          verses: cleanVerses,
          copyright: firstResult.copyright || '',
        };
      }

      // If search doesn't work, try parsing and looking up manually
      const parsed = this.parseReference(reference);

      if (!parsed) {
        console.log('Could not parse reference');
        return null;
      }

      console.log('Parsed reference:', parsed);

      // Find the book
      const bookId = await this.findBookId(bibleId, parsed.book);
      if (!bookId) {
        console.log('Book not found:', parsed.book);
        return null;
      }

      // Find the chapter
      const chapterId = await this.findChapterId(bibleId, bookId, parsed.chapter);
      if (!chapterId) {
        console.log('Chapter not found:', parsed.chapter);
        return null;
      }

      // Get verses from this chapter
      const allVerses = await this.getChapterVerses(bibleId, chapterId);

      if (allVerses && allVerses.length > 0) {
        // Filter to the specific verse(s) we want
        let relevantVerses;
        if (parsed.startVerse && parsed.endVerse) {
          relevantVerses = allVerses.filter(v => {
            const verseNum = parseInt(v.reference?.split(':').pop());
            return verseNum >= parsed.startVerse && verseNum <= parsed.endVerse;
          });
        } else if (parsed.startVerse) {
          relevantVerses = allVerses.filter(v => {
            const verseNum = parseInt(v.reference?.split(':').pop());
            return verseNum === parsed.startVerse;
          });
        } else {
          // Return whole chapter
          relevantVerses = allVerses;
        }

        if (relevantVerses.length > 0) {
          const cleanVerses = relevantVerses.map(v => ({
            ...v,
            text: v.text ? this.stripHtml(v.text) : '',
            content: v.content ? this.stripHtml(v.content) : '',
          }));

          const combinedText = cleanVerses
            .map(v => v.text || v.content || '')
            .join(' ');

          return {
            reference: reference,
            content: this.stripHtml(combinedText),
            verses: cleanVerses,
            copyright: relevantVerses[0]?.copyright || '',
          };
        }
      }

      console.log('No verses found for reference');
      return null;

    } catch (error) {
      console.error('Error in getFormattedVerse:', error);
      return null;
    }
  }

  // Get multiple verses at once
  async getMultipleVerses(bibleId, references) {
    const verses = [];

    for (const ref of references) {
      try {
        const verse = await this.getFormattedVerse(bibleId, ref);
        if (verse) {
          verses.push(verse);
        }
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error fetching verse ${ref}:`, error);
      }
    }

    return verses;
  }
}

export default new BibleAPIService();