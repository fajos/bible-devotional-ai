// utils/scriptureParser.js

/**
 * Regex for matching Bible book names including those with numbers (1 John, etc.)
 */
const BOOK_NAMES = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
  '1\\s*Samuel', '2\\s*Samuel', '1\\s*Kings', '2\\s*Kings', '1\\s*Chronicles', '2\\s*Chronicles',
  'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms?', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
  'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah',
  'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1\\s*Corinthians', '2\\s*Corinthians',
  'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1\\s*Thessalonians', '2\\s*Thessalonians',
  '1\\s*Timothy', '2\\s*Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1\\s*Peter', '2\\s*Peter',
  '1\\s*John', '2\\s*John', '3\\s*John', 'Jude', 'Revelations?'
];

/**
 * Patterns to match scripture references like "John 3:16" or "1 John 1:9" or "Genesis 1:1-5"
 * Also matches "Psalm 23"
 */
const SCRIPTURE_REGEX = new RegExp(
  `\\b(${BOOK_NAMES.join('|')})\\s+\\d+(?::\\d+(?:-\\d+)?)?\\b`,
  'gi'
);

/**
 * Parses text and wraps scripture references with a link-like structure for the Markdown renderer
 * @param {string} text - The raw text or markdown
 * @returns {string} - Text with scripture references formatted as [[Book Chapter:Verse]]
 */
export const wrapScriptures = (text) => {
  if (!text) return '';

  // Replace references with a custom bracket format that we can handle in Markdown or UI
  // We use [[Reference]] as a convention
  return text.replace(SCRIPTURE_REGEX, (match) => {
    return `[[${match}]]`;
  });
};

/**
 * Standardizes a reference for API calls
 */
export const normalizeReference = (ref) => {
  if (!ref) return '';
  return ref.trim()
    .replace(/\s+/g, ' ')
    .replace(/\[\[|\]\]/g, ''); // Remove our custom brackets
};
