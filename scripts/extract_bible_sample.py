import pypdf
import os
import re

pdf_path = r"C:\Users\fajos\Downloads\Documents\Fathers-Life-New-Testament-4th-edition.pdf"

if not os.path.exists(pdf_path):
    print(f"File not found: {pdf_path}")
else:
    reader = pypdf.PdfReader(pdf_path)
    # Page 37 was Matthew 1:1. Let's look at page 38-40
    for i in range(36, 42):
        print(f"\n--- PAGE {i+1} ---")
        print(reader.pages[i].extract_text())
