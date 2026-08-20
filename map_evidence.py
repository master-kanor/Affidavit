import os
from pypdf import PdfReader

official_path = "/home/ubuntu/upload/BACKUP_OFFICIAL_AFFIDAVIT_STATEMENT_OF_CHARLES_TANAUAN_CASE_PRESENTATION_2025_(1)(1).pdf"
unofficial_path = "/home/ubuntu/upload/officialaffidavitwithevidence(1).pdf"

off_reader = PdfReader(official_path)
unoff_reader = PdfReader(unofficial_path)

print("Extracting official affidavit text...")
official_text = ""
for i, page in enumerate(off_reader.pages):
    official_text += f"\n\n--- OFFICIAL PAGE {i+1} ---\n" + page.extract_text()

print("Extracting unofficial affidavit text...")
unofficial_text = ""
for i, page in enumerate(unoff_reader.pages):
    unofficial_text += f"\n\n--- UNOFFICIAL PAGE {i+1} ---\n" + page.extract_text()

with open("/home/ubuntu/evidence-website/official_extracted.txt", "w", encoding="utf-8") as f:
    f.write(official_text)

with open("/home/ubuntu/evidence-website/unofficial_extracted.txt", "w", encoding="utf-8") as f:
    f.write(unofficial_text)

print("Extraction complete. Files saved.")
