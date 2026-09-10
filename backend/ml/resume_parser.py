import re
import asyncio
try:
    import spacy
except ImportError:
    spacy = None
import os
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

# List of common skills to match across all 24 categories in the Kaggle dataset
TECH_SKILLS = {
    # IT / Software
    "python", "java", "javascript", "typescript", "c++", "c#", "ruby", "php", "go", "rust", "swift", "kotlin",
    "html", "css", "react", "angular", "vue", "node.js", "express", "django", "flask", "fastapi", "spring boot",
    "sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch", "cassandra",
    "docker", "kubernetes", "aws", "azure", "gcp", "terraform", "jenkins", "git", "github", "gitlab",
    "machine learning", "deep learning", "nlp", "computer vision", "tensorflow", "pytorch", "scikit-learn",
    "pandas", "numpy", "matplotlib", "data analysis", "data science",
    "agile", "scrum", "linux", "unix", "bash", "shell scripting",

    # Accounting / Finance / Banking
    "accounting", "accountant", "accountants", "bookkeeping", "bookkeeper", "ledger", "ledgers", "taxation", "tax", "taxes",
    "auditing", "audit", "auditor", "auditors", "financial analysis", "reconciliation", "reconciliations", "reconcile",
    "quickbooks", "sap", "excel", "budgeting", "budget", "budgets", "payroll", "balance sheet", "invoicing", "banking",
    "banker", "bankers", "treasury", "credit analysis", "risk assessment", "portfolio management", "wealth management",
    "financial modeling", "accounts payable", "accounts receivable", "general ledger", "financial reporting", "tax returns",
    "finance", "financial",

    # Advocate / Law
    "litigation", "legal research", "contract drafting", "compliance", "court representation", "court", "arbitration",
    "legal writing", "corporate law", "intellectual property", "family law", "mediation", "due diligence",
    "regulatory compliance", "case management", "advocate", "advocates", "lawyer", "lawyers", "attorney", "attorneys",
    "legal", "contracts", "contract",

    # Agriculture
    "agronomy", "farming", "crop management", "agribusiness", "soil science", "horticulture", "irrigation",
    "pest control", "livestock management", "sustainable agriculture", "harvesting", "agriculture", "soil", "crop", "crops",
    "pest", "livestock", "harvest",

    # Apparel / Fashion
    "fashion design", "merchandising", "textiles", "sewing", "pattern making", "apparel manufacturing",
    "trend analysis", "visual merchandising", "styling", "fabric selection", "fashion", "textile", "pattern", "apparel", "styling", "fabric",

    # Arts / Creative / Design
    "graphic design", "photoshop", "illustrator", "indesign", "fine arts", "photography", "video editing",
    "creative direction", "sculpting", "painting", "illustration", "user interface", "ux/ui design",
    "web design", "sketching", "animation", "typography", "art", "arts", "creative", "design", "designer", "designers",
    "graphic", "photographer", "video", "animator", "sculpture",

    # Automobile / Aviation / Aerospace
    "automotive engineering", "diagnostics", "vehicle maintenance", "engine repair", "aircraft maintenance",
    "flight safety", "aerospace engineering", "navigation", "avionics", "piloting", "mechanics", "automobile", "automotive",
    "mechanic", "engine", "vehicles", "vehicle", "maintenance", "aviation", "pilot", "pilots", "flight", "safety", "aircraft", "aerospace",

    # BPO / Customer Service / Sales / BD
    "customer service", "call center operations", "customer support", "client relations", "cold calling",
    "negotiation", "crm", "salesforce", "lead generation", "account management", "business development",
    "direct sales", "marketing", "telemarketing", "customer satisfaction", "customer", "bpo", "call", "center",
    "support", "sales", "selling", "client", "relations",

    # Chef / Culinary
    "culinary arts", "menu planning", "food safety", "kitchen management", "catering", "pastry baking",
    "food preparation", "fine dining", "recipe development", "inventory control", "sanitation", "chef", "chefs",
    "culinary", "cook", "cooking", "kitchen", "baking", "pastry", "food", "recipe", "recipes",

    # Construction
    "construction management", "civil engineering", "hvac", "plumbing", "electrical wiring", "carpentry",
    "blueprint reading", "estimating", "safety management", "masonry", "welding", "construction", "civil", "builder",
    "plumbing", "carpentry", "electrical", "welding", "blueprint",

    # Consultant
    "management consulting", "strategy", "process improvement", "business analysis", "change management",
    "project management", "advisory", "risk management", "performance optimization", "consultant", "consulting",
    "strategy", "process", "improvement", "advisor", "advisory", "analyst",

    # Fitness
    "personal training", "nutrition planning", "strength conditioning", "group fitness", "yoga instruction",
    "first aid", "cpr", "health coaching", "athletic training", "wellness", "fitness", "trainer", "training", "yoga",
    "nutrition", "wellness", "coach", "coaching",

    # Healthcare / Medicine
    "nursing", "patient care", "clinical research", "diagnostics", "medical terminology", "phlebotomy",
    "vital signs", "electronic health records", "pharmacology", "pediatrics", "emergency medicine", "healthcare",
    "nurse", "nurses", "clinical", "medical", "patient", "care", "medicine", "doctor", "doctors", "hospital", "hospitals",

    # HR (Human Resources)
    "recruitment", "talent acquisition", "employee relations", "onboarding", "performance management",
    "hr policies", "benefits administration", "training development", "conflict resolution", "payroll processing",
    "hr", "recruiter", "recruiters", "recruiting", "human resources", "talent", "onboarding", "relations",

    # Teacher / Education
    "curriculum development", "classroom management", "lesson planning", "tutoring", "special education",
    "pedagogy", "e-learning", "student assessment", "educational technology", "literacy", "stem education",
    "teacher", "teachers", "teaching", "education", "educator", "classroom", "tutor", "tutoring", "curriculum",
    "lesson", "school", "schools", "instruction",

    # Public Relations / Digital Media
    "seo", "sem", "social media marketing", "content creation", "copywriting", "event planning",
    "media relations", "press releases", "brand management", "public relations", "blogging", "digital marketing",
    "media", "relations", "press", "releases", "pr", "marketing", "social", "blogging", "writing", "copywriting"
}

class ResumeParserML:
    def __init__(self):
        logger.info("Initializing ResumeParserML...")
        self.nlp = None

        if spacy is None:
            logger.warning("spacy is not installed. ResumeParserML running in regex fallback mode.")
            return

        # Try loading the custom trained model first
        custom_model_path = os.path.join(os.path.dirname(__file__), "custom_ner_model")
        if os.path.exists(custom_model_path):
            try:
                self.nlp = spacy.load(custom_model_path)
                logger.info(f"Successfully loaded custom NER model from {custom_model_path}")
                return
            except Exception as e:
                logger.error(f"Failed to load custom model: {e}")

        # Fallback to base English model
        try:
            self.nlp = spacy.load("en_core_web_sm")
            logger.info("Loaded base en_core_web_sm model")
        except Exception as e:
            logger.warning(f"Spacy model 'en_core_web_sm' could not be loaded ({e}). Parser using regex heuristics.")
            self.nlp = None

    def extract_entities(self, text: str) -> Dict:
        """
        Parse raw resume text and extract structured fields.
        Layer 1: Fast regex + spaCy for contact info and skills.
        Layer 2: Gemini AI for deep extraction (education details, experience, projects, location).
        Falls back gracefully if Gemini is unavailable.
        """
        if not text:
            return self._empty_profile()
            
        text_clean = re.sub(r'\s+', ' ', text).strip()
        doc = self.nlp(text_clean) if self.nlp else None
        
        # Layer 1: Contact Information (Regex - Highest Accuracy)
        email = self._extract_email(text_clean)
        phone = self._extract_phone(text_clean)
        links = self._extract_links(text_clean)
        name = self._extract_name(text, doc)
        skills = self._extract_skills(text_clean)
        
        # Layer 2: Gemini deep extraction for the hard fields
        # We run it synchronously via asyncio if we're not already in an event loop
        gemini_data = {}
        try:
            from app.services.gemini_service import extract_resume_data as gemini_extract
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    # We're inside an async context (FastAPI) — we can't nest event loops
                    # Caller should call gemini_extract directly; use regex fallback here
                    gemini_data = {}
                else:
                    gemini_data = loop.run_until_complete(gemini_extract(text))
            except RuntimeError:
                # No event loop — create one
                gemini_data = asyncio.run(gemini_extract(text))
        except Exception as e:
            logger.warning(f"Gemini enrichment skipped in ML parser: {e}")
            gemini_data = {}

        # Merge: prefer Gemini for deep fields, regex for contact (more reliable)
        result = {
            "name": name or gemini_data.get("name", ""),
            "email": email or gemini_data.get("email", ""),
            "phone": phone or gemini_data.get("phone", ""),
            "location": gemini_data.get("location", ""),
            "bio": gemini_data.get("bio", ""),
            "skills": skills if skills else gemini_data.get("skills", []),
            "education": gemini_data.get("education", []),
            "experience": gemini_data.get("experience", []),
            "projects": gemini_data.get("projects", []),
            "achievements": gemini_data.get("achievements", []),
            "linkedin": links.get("linkedin", "") or gemini_data.get("linkedin", ""),
            "github": links.get("github", "") or gemini_data.get("github", ""),
        }
        return result

    def _empty_profile(self) -> Dict:
        return {
            "name": "", "email": "", "phone": "", "location": "", "bio": "",
            "skills": [], "education": [], "experience": [], "projects": [],
            "achievements": [], "linkedin": "", "github": ""
        }

    def _extract_email(self, text: str) -> str:
        # Standard email regex
        match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b', text)
        return match.group(0) if match else ""

    def _extract_phone(self, text: str) -> str:
        # Matches formats like +91 9999999999, (123) 456-7890, 123-456-7890
        match = re.search(r'(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}', text)
        return match.group(0) if match else ""

    def _extract_links(self, text: str) -> Dict[str, str]:
        links = {"linkedin": "", "github": ""}
        # Find all URLs
        urls = re.findall(r'(https?://[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/[^\s]+)', text)
        for url in urls:
            url_lower = url.lower()
            if "linkedin.com" in url_lower:
                links["linkedin"] = url
            elif "github.com" in url_lower:
                links["github"] = url
        return links

    def _extract_name(self, original_text: str, doc) -> str:
        # Strategy 1: First line of the resume is often the name
        lines = [line.strip() for line in original_text.split('\n') if line.strip()]
        if lines:
            first_line = lines[0]
            # If first line is reasonably short, assume it's the name
            if len(first_line.split()) <= 4 and len(first_line) < 30:
                # Remove common non-name characters
                clean_name = re.sub(r'[^a-zA-Z\s]', '', first_line).strip()
                if clean_name:
                    return clean_name.title()

        # Strategy 2: Use spaCy NER to find the first PERSON entity
        if doc:
            for ent in doc.ents:
                if ent.label_ == "PERSON":
                    return ent.text.title()
                    
        return ""

    def _extract_skills(self, text: str) -> List[str]:
        found_skills = set()
        # Tokenize text into words (removing punctuation) for exact word matching
        text_lower = text.lower()
        # Handle multi-word skills first
        for skill in TECH_SKILLS:
            if " " in skill and skill in text_lower:
                found_skills.add(skill.title())
        
        # Handle single-word skills safely using word boundaries
        for skill in TECH_SKILLS:
            if " " not in skill:
                # Use word boundary regex to avoid partial matches (e.g., 'go' in 'algorithm')
                if re.search(rf'\b{re.escape(skill)}\b', text_lower):
                    # Proper casing for specific skills
                    if skill == "node.js": found_skills.add("Node.js")
                    elif skill == "react": found_skills.add("React")
                    else: found_skills.add(skill.title())
                    
        return sorted(list(found_skills))
