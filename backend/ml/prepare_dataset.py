import os
import re
import spacy
from spacy.tokens import DocBin
import logging
import argparse

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

try:
    import pdfplumber
except ImportError:
    logger.error("pdfplumber not installed. Run: pip install pdfplumber")
    exit(1)

# Import our tech skills list
from resume_parser import TECH_SKILLS

def extract_text_from_pdf(pdf_path: str) -> str:
    text = ""
    # Try PyPDF2 first (extremely fast)
    try:
        import PyPDF2
        with open(pdf_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            pages = [page.extract_text() for page in reader.pages if page.extract_text()]
            text = "\n".join(pages)
            if text.strip():
                return text.strip()
    except Exception as e:
        logger.debug(f"PyPDF2 error for {pdf_path}: {e}")

    # Fallback to pdfplumber
    try:
        with pdfplumber.open(pdf_path) as pdf:
            pages = []
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    pages.append(page_text)
            text = "\n".join(pages)
    except Exception as e:
        logger.debug(f"pdfplumber error for {pdf_path}: {e}")
    return text.strip()

def auto_annotate(text: str, nlp) -> list:
    """Uses weak supervision (Regex/Dictionary) to find entity offsets."""
    entities = []
    text_lower = text.lower()
    
    # We must ensure entities do not overlap.
    # Spacy requires strict, non-overlapping character offsets.
    spans_found = []
    
    def is_overlapping(start, end):
        for s, e in spans_found:
            if max(start, s) < min(end, e):
                return True
        return False
        
    def add_entity(start, end, label):
        if not is_overlapping(start, end):
            entities.append((start, end, label))
            spans_found.append((start, end))

    # 1. Match Email
    for match in re.finditer(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b', text):
        add_entity(match.start(), match.end(), "EMAIL")

    # 2. Match Phone
    for match in re.finditer(r'(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}', text):
        add_entity(match.start(), match.end(), "PHONE")

    # 3. Match Skills
    for skill in TECH_SKILLS:
        # Regex to find whole words, ignoring case
        pattern = rf'\b{re.escape(skill)}\b'
        for match in re.finditer(pattern, text_lower):
            add_entity(match.start(), match.end(), "SKILL")

    # 4. Match Name (First line heuristic)
    lines = [line for line in text.split('\n') if line.strip()]
    if lines:
        first_line = lines[0]
        if len(first_line.split()) <= 4 and len(first_line) < 30:
            start_idx = text.find(first_line)
            end_idx = start_idx + len(first_line)
            clean_name = re.sub(r'[^a-zA-Z\s]', '', first_line).strip()
            if clean_name and start_idx != -1:
                add_entity(start_idx, end_idx, "PERSON")

    return entities

def prepare_dataset(data_dir: str, output_file: str, limit: int = 0):
    nlp = spacy.blank("en")
    db = DocBin()
    
    processed = 0
    skipped = 0
    
    for root, _, files in os.walk(data_dir):
        for file in files:
            if file.lower().endswith(".pdf"):
                if limit > 0 and processed >= limit:
                    break
                    
                pdf_path = os.path.join(root, file)
                text = extract_text_from_pdf(pdf_path)
                
                if not text:
                    skipped += 1
                    continue
                
                # Clean text lightly to prevent offset issues
                text = re.sub(r'\s+', ' ', text).strip()
                
                entities = auto_annotate(text, nlp)
                
                if not entities:
                    skipped += 1
                    continue
                    
                doc = nlp.make_doc(text)
                spans = []
                for start, end, label in entities:
                    span = doc.char_span(start, end, label=label, alignment_mode="contract")
                    if span is not None:
                        spans.append(span)
                
                # Filter out overlapping spans again just in case char_span caused issues
                doc.ents = spacy.util.filter_spans(spans)
                db.add(doc)
                
                processed += 1
                if processed % 10 == 0:
                    logger.info(f"Processed {processed} resumes...")
                    
        if limit > 0 and processed >= limit:
            break

    db.to_disk(output_file)
    logger.info(f"Completed! Saved {processed} annotated resumes to {output_file}. Skipped: {skipped}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", type=str, default="../../Resume Datas/data", help="Path to PDF folders")
    parser.add_argument("--output", type=str, default="train.spacy", help="Output file path")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of PDFs processed (0 for all)")
    args = parser.parse_args()
    
    prepare_dataset(args.data_dir, args.output, args.limit)
