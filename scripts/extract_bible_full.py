import pypdf
import os
import re
import json

pdf_path = r"C:\Users\fajos\Downloads\Documents\Fathers-Life-New-Testament-4th-edition.pdf"
output_path = r"C:\Users\fajos\OneDrive\Documents\Project\BibleDevotionalAI\assets\bible\FLV_NT.json"

# Ensure directory exists
os.makedirs(os.path.dirname(output_path), exist_ok=True)

# Order is important: more specific names first
books_list = [
    ("FIRST CORINTHIANS", "1 Corinthians"),
    ("SECOND CORINTHIANS", "2 Corinthians"),
    ("FIRST THESSALONIANS", "1 Thessalonians"),
    ("SECOND THESSALONIANS", "2 Thessalonians"),
    ("FIRST TIMOTHY", "1 Timothy"),
    ("SECOND TIMOTHY", "2 Timothy"),
    ("FIRST PETER", "1 Peter"),
    ("SECOND PETER", "2 Peter"),
    ("FIRST JOHN", "1 John"),
    ("SECOND JOHN", "2 John"),
    ("THIRD JOHN", "3 John"),
    ("MATTHEW", "Matthew"),
    ("MARK", "Mark"),
    ("LUKE", "Luke"),
    ("JOHN", "John"),
    ("ACTS", "Acts"),
    ("ROMANS", "Romans"),
    ("GALATIANS", "Galatians"),
    ("EPHESIANS", "Ephesians"),
    ("PHILIPPIANS", "Philippians"),
    ("COLOSSIANS", "Colossians"),
    ("TITUS", "Titus"),
    ("PHILEMON", "Philemon"),
    ("HEBREWS", "Hebrews"),
    ("JAMES", "James"),
    ("JUDE", "Jude"),
    ("REVELATION", "Revelation"),
    ("CORINTHIANS (1)", "1 Corinthians"),
    ("CORINTHIANS (2)", "2 Corinthians"),
    ("THESSALONIANS (1)", "1 Thessalonians"),
    ("THESSALONIANS (2)", "2 Thessalonians"),
    ("TIMOTHY (1)", "1 Timothy"),
    ("TIMOTHY (2)", "2 Timothy"),
    ("PETER (1)", "1 Peter"),
    ("PETER (2)", "2 Peter"),
    ("JOHN (1)", "1 John"),
    ("JOHN (2)", "2 John"),
    ("JOHN (3)", "3 John"),
]

# Sort by key length descending to ensure longest matches are tried first
books_list.sort(key=lambda x: len(x[0]), reverse=True)

def extract():
    if not os.path.exists(pdf_path):
        print(f"File not found: {pdf_path}")
        return

    reader = pypdf.PdfReader(pdf_path)
    bible_data = {}

    current_book = None
    current_chapter = None
    current_verse = None

    verse_regex = re.compile(r"(?<!\()(\d+):(\d+)")

    print("Starting extraction...")

    for page_num in range(36, len(reader.pages)): # Start from Matthew 1
        page = reader.pages[page_num]
        text = page.extract_text()
        if not text:
            continue

        # Split by "CHAPTER X"
        parts = re.split(r"(CHAPTER\s+\d+)", text, flags=re.IGNORECASE)

        for i, part in enumerate(parts):
            if i % 2 == 1: # This is the "CHAPTER X" part
                chap_num = re.search(r"\d+", part).group()

                # The book name is usually just before this
                # Check the text before "CHAPTER X"
                text_before = parts[i-1].strip().upper()
                lines_before = text_before.split('\n')

                new_book = None
                # Try to find a book match in the last few lines before "CHAPTER"
                candidate_text = " ".join(lines_before[-3:]) if len(lines_before) > 3 else " ".join(lines_before)

                for key, val in books_list:
                    if key in candidate_text:
                        new_book = val
                        break

                if new_book:
                    current_book = new_book

                if current_book:
                    current_chapter = chap_num
                    if current_book not in bible_data:
                        bible_data[current_book] = {}
                    if current_chapter not in bible_data[current_book]:
                        bible_data[current_book][current_chapter] = {}
                    current_verse = None
            else:
                # Verse text
                matches = list(verse_regex.finditer(part))
                pos = 0
                for j, match in enumerate(matches):
                    v_chap = match.group(1)
                    v_num = match.group(2)

                    prefix = part[pos:match.start()].strip()
                    if prefix and current_book and current_chapter and current_verse:
                        bible_data[current_book][current_chapter][current_verse] += " " + prefix

                    # Ensure chapter matches current context to avoid refs
                    if current_book and current_chapter and v_chap == current_chapter:
                        current_verse = v_num
                        if current_verse not in bible_data[current_book][current_chapter]:
                            bible_data[current_book][current_chapter][current_verse] = ""

                        end_pos = matches[j+1].start() if j+1 < len(matches) else len(part)
                        content = part[match.end():end_pos].strip()
                        bible_data[current_book][current_chapter][current_verse] += content
                        pos = end_pos

                suffix = part[pos:].strip()
                if suffix and current_book and current_chapter and current_verse:
                    bible_data[current_book][current_chapter][current_verse] += " " + suffix

    # Final cleanup
    final_data = {}
    for book in bible_data:
        final_data[book] = {}
        # Sort chapters numerically
        sorted_chaps = sorted(bible_data[book].keys(), key=lambda x: int(x))
        for chap in sorted_chaps:
            final_data[book][chap] = {}
            # Sort verses numerically
            sorted_verses = sorted(bible_data[book][chap].keys(), key=lambda x: int(x))
            for v in sorted_verses:
                text = bible_data[book][chap][v]
                text = re.sub(r'\s+', ' ', text).strip()
                if text:
                    final_data[book][chap][v] = text

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, indent=2, ensure_ascii=False)

    print(f"Extraction complete. Saved to {output_path}")
    print(f"Books extracted ({len(final_data)}): {sorted(list(final_data.keys()))}")

if __name__ == "__main__":
    extract()
