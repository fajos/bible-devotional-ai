const INITIAL_PLAN = [
  { day: 1, title: "The Creation", readings: [{ ref: "Genesis 1-2", type: "OT" }, { ref: "Matthew 1", type: "NT" }, { ref: "Psalm 1", type: "Psalm" }] },
  { day: 2, title: "The Fall", readings: [{ ref: "Genesis 3-5", type: "OT" }, { ref: "Matthew 2", type: "NT" }, { ref: "Psalm 2", type: "Psalm" }] },
  { day: 3, title: "Noah and the Flood", readings: [{ ref: "Genesis 6-8", type: "OT" }, { ref: "Matthew 3", type: "NT" }, { ref: "Psalm 3", type: "Psalm" }] },
  { day: 4, title: "God's Covenant with Noah", readings: [{ ref: "Genesis 9-11", type: "OT" }, { ref: "Matthew 4", type: "NT" }, { ref: "Psalm 4", type: "Psalm" }] },
  { day: 5, title: "The Call of Abram", readings: [{ ref: "Genesis 12-14", type: "OT" }, { ref: "Matthew 5:1-26", type: "NT" }, { ref: "Psalm 5", type: "Psalm" }] },
  { day: 6, title: "God's Covenant with Abram", readings: [{ ref: "Genesis 15-17", type: "OT" }, { ref: "Matthew 5:27-48", type: "NT" }, { ref: "Psalm 6", type: "Psalm" }] },
  { day: 7, title: "Sodom and Gomorrah", readings: [{ ref: "Genesis 18-19", type: "OT" }, { ref: "Matthew 6:1-18", type: "NT" }, { ref: "Psalm 7", type: "Psalm" }] },
  { day: 8, title: "Isaac and Ishmael", readings: [{ ref: "Genesis 20-22", type: "OT" }, { ref: "Matthew 6:19-34", type: "NT" }, { ref: "Psalm 8", type: "Psalm" }] },
  { day: 9, title: "A Wife for Isaac", readings: [{ ref: "Genesis 23-24", type: "OT" }, { ref: "Matthew 7", type: "NT" }, { ref: "Psalm 9", type: "Psalm" }] },
  { day: 10, title: "Jacob and Esau", readings: [{ ref: "Genesis 25-26", type: "OT" }, { ref: "Matthew 8:1-17", type: "NT" }, { ref: "Psalm 10", type: "Psalm" }] },
  { day: 11, title: "Jacob's Deception", readings: [{ ref: "Genesis 27-28", type: "OT" }, { ref: "Matthew 8:18-34", type: "NT" }, { ref: "Psalm 11", type: "Psalm" }] },
  { day: 12, title: "Jacob's Wives", readings: [{ ref: "Genesis 29-30", type: "OT" }, { ref: "Matthew 9:1-17", type: "NT" }, { ref: "Psalm 12", type: "Psalm" }] },
  { day: 13, title: "Jacob Flees from Laban", readings: [{ ref: "Genesis 31-32", type: "OT" }, { ref: "Matthew 9:18-38", type: "NT" }, { ref: "Psalm 13", type: "Psalm" }] },
  { day: 14, title: "Jacob Meets Esau", readings: [{ ref: "Genesis 33-35", type: "OT" }, { ref: "Matthew 10:1-20", type: "NT" }, { ref: "Psalm 14", type: "Psalm" }] },
  { day: 15, title: "Joseph's Dreams", readings: [{ ref: "Genesis 36-37", type: "OT" }, { ref: "Matthew 10:21-42", type: "NT" }, { ref: "Psalm 15", type: "Psalm" }] },
  { day: 16, title: "Judah and Tamar", readings: [{ ref: "Genesis 38-40", type: "OT" }, { ref: "Matthew 11", type: "NT" }, { ref: "Psalm 16", type: "Psalm" }] },
  { day: 17, title: "Pharaoh's Dreams", readings: [{ ref: "Genesis 41-42", type: "OT" }, { ref: "Matthew 12:1-23", type: "NT" }, { ref: "Psalm 17", type: "Psalm" }] },
  { day: 18, title: "Joseph's Brothers in Egypt", readings: [{ ref: "Genesis 43-45", type: "OT" }, { ref: "Matthew 12:24-50", type: "NT" }, { ref: "Psalm 18:1-20", type: "Psalm" }] },
  { day: 19, title: "Jacob Moves to Egypt", readings: [{ ref: "Genesis 46-48", type: "OT" }, { ref: "Matthew 13:1-30", type: "NT" }, { ref: "Psalm 18:21-50", type: "Psalm" }] },
  { day: 20, title: "Jacob's Blessing and Death", readings: [{ ref: "Genesis 49-50", type: "OT" }, { ref: "Matthew 13:31-58", type: "NT" }, { ref: "Psalm 19", type: "Psalm" }] },
  { day: 21, title: "The Birth of Moses", readings: [{ ref: "Exodus 1-3", type: "OT" }, { ref: "Matthew 14:1-21", type: "NT" }, { ref: "Psalm 20", type: "Psalm" }] },
  { day: 22, title: "Moses and Aaron", readings: [{ ref: "Exodus 4-6", type: "OT" }, { ref: "Matthew 14:22-36", type: "NT" }, { ref: "Psalm 21", type: "Psalm" }] },
  { day: 23, title: "The Plagues Begin", readings: [{ ref: "Exodus 7-8", type: "OT" }, { ref: "Matthew 15:1-20", type: "NT" }, { ref: "Psalm 22:1-11", type: "Psalm" }] },
  { day: 24, title: "More Plagues", readings: [{ ref: "Exodus 9-10", type: "OT" }, { ref: "Matthew 15:21-39", type: "NT" }, { ref: "Psalm 22:12-31", type: "Psalm" }] },
  { day: 25, title: "The Passover", readings: [{ ref: "Exodus 11-12", type: "OT" }, { ref: "Matthew 16", type: "NT" }, { ref: "Psalm 23", type: "Psalm" }] },
  { day: 26, title: "Crossing the Red Sea", readings: [{ ref: "Exodus 13-15", type: "OT" }, { ref: "Matthew 17", type: "NT" }, { ref: "Psalm 24", type: "Psalm" }] },
  { day: 27, title: "Manna and Quail", readings: [{ ref: "Exodus 16-18", type: "OT" }, { ref: "Matthew 18:1-20", type: "NT" }, { ref: "Psalm 25", type: "Psalm" }] },
  { day: 28, title: "The Ten Commandments", readings: [{ ref: "Exodus 19-20", type: "OT" }, { ref: "Matthew 18:21-35", type: "NT" }, { ref: "Psalm 26", type: "Psalm" }] },
  { day: 29, title: "Laws for Israel", readings: [{ ref: "Exodus 21-22", type: "OT" }, { ref: "Matthew 19", type: "NT" }, { ref: "Psalm 27", type: "Psalm" }] },
  { day: 30, title: "The Covenant Confirmed", readings: [{ ref: "Exodus 23-24", type: "OT" }, { ref: "Matthew 20:1-16", type: "NT" }, { ref: "Psalm 28", type: "Psalm" }] },
  { day: 31, title: "The Tabernacle", readings: [{ ref: "Exodus 25-26", type: "OT" }, { ref: "Matthew 20:17-34", type: "NT" }, { ref: "Psalm 29", type: "Psalm" }] }
];

const otRemaining = [];
for (let c = 27; c <= 40; c++) otRemaining.push({ book: "Exodus", chap: c });
const otBooks = [
  { name: "Leviticus", chaps: 27 }, { name: "Numbers", chaps: 36 }, { name: "Deuteronomy", chaps: 34 },
  { name: "Joshua", chaps: 24 }, { name: "Judges", chaps: 21 }, { name: "Ruth", chaps: 4 },
  { name: "1 Samuel", chaps: 31 }, { name: "2 Samuel", chaps: 24 }, { name: "1 Kings", chaps: 22 },
  { name: "2 Kings", chaps: 25 }, { name: "1 Chronicles", chaps: 29 }, { name: "2 Chronicles", chaps: 36 },
  { name: "Ezra", chaps: 10 }, { name: "Nehemiah", chaps: 13 }, { name: "Esther", chaps: 10 },
  { name: "Job", chaps: 42 }, { name: "Isaiah", chaps: 66 }, { name: "Jeremiah", chaps: 52 },
  { name: "Lamentations", chaps: 5 }, { name: "Ezekiel", chaps: 48 }, { name: "Daniel", chaps: 12 },
  { name: "Hosea", chaps: 14 }, { name: "Joel", chaps: 3 }, { name: "Amos", chaps: 9 },
  { name: "Obadiah", chaps: 1 }, { name: "Jonah", chaps: 4 }, { name: "Micah", chaps: 7 },
  { name: "Nahum", chaps: 3 }, { name: "Habakkuk", chaps: 3 }, { name: "Zephaniah", chaps: 3 },
  { name: "Haggai", chaps: 2 }, { name: "Zechariah", chaps: 14 }, { name: "Malachi", chaps: 4 }
];
otBooks.forEach(b => {
  for (let c = 1; c <= b.chaps; c++) otRemaining.push({ book: b.name, chap: c });
});

const ntRemaining = [];
for (let c = 21; c <= 28; c++) ntRemaining.push({ book: "Matthew", chap: c });
const ntBooks = [
  { name: "Mark", chaps: 16 }, { name: "Luke", chaps: 24 }, { name: "John", chaps: 21 },
  { name: "Acts", chaps: 28 }, { name: "Romans", chaps: 16 }, { name: "1 Corinthians", chaps: 16 },
  { name: "2 Corinthians", chaps: 13 }, { name: "Galatians", chaps: 6 }, { name: "Ephesians", chaps: 6 },
  { name: "Philippians", chaps: 4 }, { name: "Colossians", chaps: 4 }, { name: "1 Thessalonians", chaps: 5 },
  { name: "2 Thessalonians", chaps: 3 }, { name: "1 Timothy", chaps: 6 }, { name: "2 Timothy", chaps: 4 },
  { name: "Titus", chaps: 3 }, { name: "Philemon", chaps: 1 }, { name: "Hebrews", chaps: 13 },
  { name: "James", chaps: 5 }, { name: "1 Peter", chaps: 5 }, { name: "2 Peter", chaps: 3 },
  { name: "1 John", chaps: 5 }, { name: "2 John", chaps: 1 }, { name: "3 John", chaps: 1 },
  { name: "Jude", chaps: 1 }, { name: "Revelation", chaps: 22 }
];
ntBooks.forEach(b => {
  for (let c = 1; c <= b.chaps; c++) ntRemaining.push({ book: b.name, chap: c });
});

const wisdomRemaining = [];
for (let c = 30; c <= 150; c++) wisdomRemaining.push({ book: "Psalm", chap: c });
const wisdomBooks = [
  { name: "Proverbs", chaps: 31 }, { name: "Ecclesiastes", chaps: 12 }, { name: "Song of Solomon", chaps: 8 }
];
wisdomBooks.forEach(b => {
  for (let c = 1; c <= b.chaps; c++) wisdomRemaining.push({ book: b.name, chap: c });
});

let otIdx = 0;
let ntIdx = 0;
let wisdomIdx = 0;

export const BIBLE_IN_ONE_YEAR = [...INITIAL_PLAN];

for (let day = 32; day <= 365; day++) {
  let otRef = "";
  let c1 = otRemaining[otIdx % otRemaining.length];
  otIdx++;
  let c2 = otRemaining[otIdx % otRemaining.length];

  if (c1.book === c2.book) {
    otRef = `${c1.book} ${c1.chap}-${c2.chap}`;
    otIdx++;
  } else {
    otRef = `${c1.book} ${c1.chap}`;
  }

  let n = ntRemaining[ntIdx % ntRemaining.length];
  ntIdx++;
  let ntRef = `${n.book} ${n.chap}`;

  let w = wisdomRemaining[wisdomIdx % wisdomRemaining.length];
  wisdomIdx++;
  let wisdomRef = `${w.book} ${w.chap}`;

  BIBLE_IN_ONE_YEAR.push({
    day: day,
    title: `Journey through ${c1.book}`,
    readings: [
      { ref: otRef, type: "OT" },
      { ref: ntRef, type: "NT" },
      { ref: wisdomRef, type: "Psalm" }
    ]
  });
}

export const getDayOfYear = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = (now - start) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  return day === 0 ? 1 : day > 365 ? 365 : day;
};
