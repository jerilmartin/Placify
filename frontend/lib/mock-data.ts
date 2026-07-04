// ═══════════════════════════════════════════════════════════════════════════════
// Placify — Comprehensive Mock Data for Demo Mode
// All data is realistic, Indian-campus-placement themed, and production-ready.
// ═══════════════════════════════════════════════════════════════════════════════

import type {
  StudentProfile, Job, JobMatch, Application, Interview, InterviewFeedback,
  PlacementDrive, Notification, StudentDashboardStats, ProfileStrength,
  PlacementRisk, Resume,
} from "./types";

// ── Helpers ──────────────────────────────────────────────────────────────────
const uid = (i: number) => `demo-uuid-${String(i).padStart(4, "0")}`;
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
const daysFromNow = (n: number) => new Date(Date.now() + n * 86400000).toISOString();

// ═════════════════════════════════════════════════════════════════════════════
// STUDENT DATA
// ═════════════════════════════════════════════════════════════════════════════

export const MOCK_STUDENT_PROFILE: StudentProfile = {
  id: uid(1),
  user_id: "demo-uid-student",
  student_id: "CS22B1045",
  full_name: "Demo Student",
  email: "student@placify.com",
  phone: "+91 98765 43210",
  location: "Chennai, Tamil Nadu",
  bio: "Final-year Computer Science student passionate about full-stack development and machine learning. Active open-source contributor with 2 internships and multiple hackathon wins.",
  university: "SRM Institute of Science and Technology",
  course: "B.Tech CSE",
  graduation_year: 2026,
  cgpa: 8.74,
  skills: ["React", "Next.js", "TypeScript", "Python", "FastAPI", "PostgreSQL", "Docker", "TensorFlow", "Git", "AWS"],
  github_url: "https://github.com/demo-student",
  linkedin_url: "https://linkedin.com/in/demo-student",
  portfolio_url: "https://demo-student.dev",
  projects: [
    { name: "AI Resume Parser", description: "Built an NLP pipeline using spaCy and transformers to extract structured data from PDF resumes with 94% accuracy.", tech_stack: ["Python", "spaCy", "FastAPI", "React"], github_url: "https://github.com/demo/resume-parser", duration: "3 months" },
    { name: "E-Commerce Platform", description: "Full-stack MERN application with Stripe payments, JWT auth, and real-time order tracking via WebSockets.", tech_stack: ["React", "Node.js", "MongoDB", "Stripe"], live_url: "https://shopify-clone.demo.dev", duration: "4 months" },
    { name: "Campus Placement Predictor", description: "ML model using Random Forest and XGBoost to predict placement probability based on student profiles. Deployed as a REST API.", tech_stack: ["Python", "scikit-learn", "Flask", "Docker"], github_url: "https://github.com/demo/placement-ml", duration: "2 months" },
  ],
  work_experience: [
    { company: "Zoho Corporation", role: "Software Engineering Intern", duration: "May 2025 – Jul 2025", description: "Built internal dashboard with React and Go. Reduced page load time by 40% through code splitting and lazy loading.", skills_used: ["React", "Go", "PostgreSQL"] },
    { company: "Google Summer of Code", role: "Open Source Contributor", duration: "Jun 2024 – Sep 2024", description: "Contributed to TensorFlow.js — implemented 3 new layer types and improved documentation for the Keras API.", skills_used: ["TypeScript", "TensorFlow", "Python"] },
  ],
  achievements: "Winner - Smart India Hackathon 2025 | Google DSC Lead | Published paper on NLP at IEEE ICACCI 2025 | Dean's Merit List (5 semesters)",
  profile_completion: 92,
  placement_probability: 87.5,
  created_at: daysAgo(180),
  updated_at: daysAgo(2),
};

export const MOCK_STUDENT_PROFILES: StudentProfile[] = [
  MOCK_STUDENT_PROFILE,
  {
    id: uid(2), user_id: uid(102), student_id: "CS22B1012", full_name: "Ananya Sharma", email: "ananya.s@srm.edu", phone: "+91 87654 32109", location: "Bangalore, Karnataka", bio: "Aspiring ML engineer with strong foundations in statistics and deep learning.",
    university: "SRM Institute of Science and Technology", course: "B.Tech CSE (AI/ML)", graduation_year: 2026, cgpa: 9.12,
    skills: ["Python", "PyTorch", "TensorFlow", "OpenCV", "SQL", "FastAPI", "Docker", "Kubernetes"],
    github_url: "https://github.com/ananya-sharma", linkedin_url: "https://linkedin.com/in/ananya-sharma",
    projects: [{ name: "Real-time Object Detection", description: "YOLOv8-based traffic monitoring system deployed on edge devices.", tech_stack: ["Python", "PyTorch", "OpenCV"], duration: "3 months" }],
    work_experience: [{ company: "Microsoft Research", role: "Research Intern", duration: "Summer 2025", description: "Worked on multi-modal LLM fine-tuning for code generation tasks.", skills_used: ["Python", "PyTorch", "Transformers"] }],
    achievements: "ACM ICPC Regionalist | Kaggle Expert", profile_completion: 88, placement_probability: 92.3, created_at: daysAgo(150), updated_at: daysAgo(5),
  },
  {
    id: uid(3), user_id: uid(103), student_id: "EC22B2034", full_name: "Rohit Menon", email: "rohit.m@srm.edu", phone: "+91 76543 21098", location: "Kochi, Kerala", bio: "Electronics student with strong embedded systems and IoT skills.",
    university: "SRM Institute of Science and Technology", course: "B.Tech ECE", graduation_year: 2026, cgpa: 8.45,
    skills: ["C/C++", "Embedded C", "MATLAB", "Verilog", "Python", "Arduino", "PCB Design", "RTOS"],
    projects: [{ name: "Smart Agriculture IoT System", description: "Sensor network with LoRa communication for precision farming.", tech_stack: ["Arduino", "Python", "MQTT"], duration: "4 months" }],
    work_experience: [], achievements: "Texas Instruments Innovation Challenge Runner-up", profile_completion: 72, placement_probability: 68.5, created_at: daysAgo(120), updated_at: daysAgo(10),
  },
  {
    id: uid(4), user_id: uid(104), student_id: "IT22B3021", full_name: "Priya Rajan", email: "priya.r@srm.edu", phone: "+91 65432 10987", location: "Hyderabad, Telangana", bio: "Full-stack developer specializing in cloud-native applications and DevOps.",
    university: "SRM Institute of Science and Technology", course: "B.Tech IT", graduation_year: 2026, cgpa: 8.89,
    skills: ["Java", "Spring Boot", "React", "AWS", "Docker", "Kubernetes", "Jenkins", "Terraform", "MySQL"],
    github_url: "https://github.com/priya-rajan",
    projects: [{ name: "Microservices E-Learning Platform", description: "Cloud-native LMS with Spring Boot microservices, React frontend, and Kubernetes orchestration.", tech_stack: ["Java", "Spring Boot", "React", "K8s"], duration: "5 months" }],
    work_experience: [{ company: "Amazon", role: "SDE Intern", duration: "Summer 2025", description: "Built real-time inventory tracking service processing 50K events/sec.", skills_used: ["Java", "AWS", "DynamoDB"] }],
    achievements: "AWS Certified Cloud Practitioner | HackerRank 5-star Java", profile_completion: 95, placement_probability: 91.0, created_at: daysAgo(160), updated_at: daysAgo(1),
  },
  {
    id: uid(5), user_id: uid(105), student_id: "CS22B1078", full_name: "Karthik Iyer", email: "karthik.i@srm.edu", phone: "+91 54321 09876", location: "Pune, Maharashtra", bio: "Cybersecurity enthusiast with CTF experience and ethical hacking certifications.",
    university: "SRM Institute of Science and Technology", course: "B.Tech CSE (Cyber Security)", graduation_year: 2026, cgpa: 7.65,
    skills: ["Python", "Wireshark", "Burp Suite", "Nmap", "Metasploit", "Linux", "Networking", "SIEM"],
    projects: [{ name: "Network Intrusion Detection System", description: "ML-based IDS using Random Forest on NSL-KDD dataset with 97% accuracy.", tech_stack: ["Python", "scikit-learn", "Scapy"], duration: "3 months" }],
    work_experience: [], achievements: "Top 50 at CTF India 2025 | CEH Certified", profile_completion: 65, placement_probability: 58.2, created_at: daysAgo(100), updated_at: daysAgo(15),
  },
];

// ── Jobs ─────────────────────────────────────────────────────────────────────

export const MOCK_JOBS: Job[] = [
  { id: uid(201), title: "Software Development Engineer", company: "Amazon", location: "Bangalore, Karnataka", description: "Design and build scalable distributed systems for Amazon's retail platform. Work with a team of world-class engineers to solve complex problems at massive scale.", requirements: "Strong DSA, system design experience, proficiency in Java or C++", skills_required: ["Java", "AWS", "System Design", "Data Structures", "Microservices"], job_type: "full_time", experience_level: "entry", salary_range: "₹25L - ₹45L", package_lpa: 32, deadline: daysFromNow(15), min_cgpa: 8.0, eligible_branches: ["CSE", "IT", "ECE"], no_of_openings: 12, status: "active", created_at: daysAgo(5), updated_at: daysAgo(5) },
  { id: uid(202), title: "Associate System Engineer", company: "TCS", location: "Multiple Locations", description: "Join TCS Ninja and work on enterprise IT solutions for Fortune 500 clients across banking, healthcare, and retail domains.", requirements: "B.Tech/B.E. in any branch with 60% aggregate", skills_required: ["Java", "SQL", "Python", "Communication", "Problem Solving"], job_type: "full_time", experience_level: "entry", salary_range: "₹3.36L - ₹3.5L", package_lpa: 3.5, deadline: daysFromNow(20), min_cgpa: 6.0, eligible_branches: ["CSE", "IT", "ECE", "EEE", "ME", "CE"], no_of_openings: 200, status: "active", created_at: daysAgo(10), updated_at: daysAgo(10) },
  { id: uid(203), title: "Full Stack Developer", company: "Zoho Corporation", location: "Chennai, Tamil Nadu", description: "Build next-generation SaaS products used by millions of businesses worldwide. End-to-end ownership from design to deployment.", requirements: "Strong in at least one frontend and backend technology", skills_required: ["React", "Node.js", "Java", "MySQL", "REST APIs", "Git"], job_type: "full_time", experience_level: "entry", salary_range: "₹6L - ₹10L", package_lpa: 8, deadline: daysFromNow(12), min_cgpa: 7.0, eligible_branches: ["CSE", "IT"], no_of_openings: 30, status: "active", created_at: daysAgo(7), updated_at: daysAgo(7) },
  { id: uid(204), title: "Systems Engineer", company: "Infosys", location: "Mysore, Pune, Hyderabad", description: "Join Infosys as a Systems Engineer and work on cutting-edge digital transformation projects for global clients.", requirements: "B.Tech with 65% aggregate, no active backlogs", skills_required: ["Java", "Python", "SQL", "Agile", "Communication"], job_type: "full_time", experience_level: "entry", salary_range: "₹3.6L", package_lpa: 3.6, deadline: daysFromNow(25), min_cgpa: 6.5, eligible_branches: ["CSE", "IT", "ECE", "EEE", "ME"], no_of_openings: 150, status: "active", created_at: daysAgo(12), updated_at: daysAgo(12) },
  { id: uid(205), title: "ML Engineer Intern", company: "Google", location: "Bangalore (Hybrid)", description: "Work with Google Research on large language models and multimodal AI systems. 6-month internship with pre-placement offer possibility.", requirements: "Published research or strong ML portfolio, proficiency in Python and PyTorch/TF", skills_required: ["Python", "PyTorch", "TensorFlow", "NLP", "Computer Vision", "Research"], job_type: "internship", experience_level: "entry", salary_range: "₹1.5L/month stipend", package_lpa: 45, deadline: daysFromNow(8), min_cgpa: 8.5, eligible_branches: ["CSE"], no_of_openings: 5, status: "active", created_at: daysAgo(3), updated_at: daysAgo(3) },
  { id: uid(206), title: "Product Engineer", company: "Razorpay", location: "Bangalore, Karnataka", description: "Build payment infrastructure that powers India's digital economy. Work on high-throughput, low-latency financial systems.", requirements: "Strong backend skills, understanding of distributed systems", skills_required: ["Go", "Java", "PostgreSQL", "Redis", "Docker", "Kubernetes"], job_type: "full_time", experience_level: "entry", salary_range: "₹18L - ₹28L", package_lpa: 22, deadline: daysFromNow(18), min_cgpa: 7.5, eligible_branches: ["CSE", "IT"], no_of_openings: 8, status: "active", created_at: daysAgo(6), updated_at: daysAgo(6) },
  { id: uid(207), title: "Software Engineer", company: "Flipkart", location: "Bangalore, Karnataka", description: "Join India's leading e-commerce platform and build systems that serve 400M+ customers during high-scale events like Big Billion Days.", requirements: "Solid DSA, experience with at least one OOP language", skills_required: ["Java", "Spring Boot", "React", "Kafka", "System Design"], job_type: "full_time", experience_level: "entry", salary_range: "₹20L - ₹30L", package_lpa: 24, deadline: daysFromNow(10), min_cgpa: 7.5, eligible_branches: ["CSE", "IT", "ECE"], no_of_openings: 15, status: "active", created_at: daysAgo(4), updated_at: daysAgo(4) },
  { id: uid(208), title: "Data Analyst", company: "Wipro", location: "Hyderabad, Telangana", description: "Analyze business data and create dashboards and reports for enterprise clients using modern BI tools.", requirements: "Proficiency in SQL, Python, Excel. Experience with Tableau/Power BI preferred.", skills_required: ["SQL", "Python", "Excel", "Tableau", "Power BI", "Statistics"], job_type: "full_time", experience_level: "entry", salary_range: "₹4L - ₹6L", package_lpa: 5, deadline: daysFromNow(22), min_cgpa: 6.5, eligible_branches: ["CSE", "IT", "ECE", "EEE", "ME", "CE"], no_of_openings: 50, status: "active", created_at: daysAgo(8), updated_at: daysAgo(8) },
];

// ── Job Matches ──────────────────────────────────────────────────────────────

export const MOCK_JOB_MATCHES: JobMatch[] = [
  { id: uid(301), job: MOCK_JOBS[0], match_score: 88, match_reason: "Strong overlap in backend skills and system design experience", skill_matches: ["Java", "AWS", "System Design", "Data Structures"], missing_skills: ["Microservices"], recommendation: "Excellent fit — your Amazon internship experience gives you an edge.", viewed: false, created_at: daysAgo(2) },
  { id: uid(302), job: MOCK_JOBS[2], match_score: 94, match_reason: "Perfect alignment with full-stack development profile", skill_matches: ["React", "Node.js", "REST APIs", "Git", "MySQL"], missing_skills: [], recommendation: "Top match! Your Zoho internship makes you a strong internal candidate.", viewed: true, created_at: daysAgo(3) },
  { id: uid(303), job: MOCK_JOBS[5], match_score: 76, match_reason: "Good backend foundation, needs fintech domain exposure", skill_matches: ["PostgreSQL", "Docker"], missing_skills: ["Go", "Redis", "Kubernetes"], recommendation: "Consider learning Go and Redis to improve your match score.", viewed: false, created_at: daysAgo(4) },
  { id: uid(304), job: MOCK_JOBS[6], match_score: 82, match_reason: "Strong Java and React skills match well with Flipkart's stack", skill_matches: ["React", "Java"], missing_skills: ["Kafka", "Spring Boot"], recommendation: "Great match! Brush up on Spring Boot and event-driven architectures.", viewed: true, created_at: daysAgo(1) },
  { id: uid(305), job: MOCK_JOBS[4], match_score: 71, match_reason: "ML experience present but needs more research depth", skill_matches: ["Python", "TensorFlow"], missing_skills: ["PyTorch", "NLP", "Research"], recommendation: "Publish a paper or contribute to ML open-source to strengthen this match.", viewed: false, created_at: daysAgo(5) },
  { id: uid(306), job: MOCK_JOBS[1], match_score: 95, match_reason: "Exceeds all eligibility criteria for TCS Ninja", skill_matches: ["Java", "SQL", "Python", "Problem Solving"], missing_skills: [], recommendation: "Safety pick — apply as backup. You exceed all requirements.", viewed: true, created_at: daysAgo(6) },
];

// ── Applications ─────────────────────────────────────────────────────────────

export const MOCK_APPLICATIONS: Application[] = [
  { id: uid(401), student_id: uid(1), job_id: uid(202), cover_letter: "I am excited to apply for the TCS Ninja program...", status: "shortlisted", next_step: "Online Assessment", next_step_date: daysFromNow(5), applied_at: daysAgo(8), created_at: daysAgo(8), updated_at: daysAgo(2), jobs: { title: "Associate System Engineer", company: "TCS" } },
  { id: uid(402), student_id: uid(1), job_id: uid(203), status: "interviewed", next_step: "HR Round", next_step_date: daysFromNow(3), applied_at: daysAgo(6), created_at: daysAgo(6), updated_at: daysAgo(1), jobs: { title: "Full Stack Developer", company: "Zoho Corporation" } },
  { id: uid(403), student_id: uid(1), job_id: uid(207), status: "submitted", applied_at: daysAgo(2), created_at: daysAgo(2), updated_at: daysAgo(2), jobs: { title: "Software Engineer", company: "Flipkart" } },
  { id: uid(404), student_id: uid(1), job_id: uid(204), status: "offered", next_step: "Accept by deadline", next_step_date: daysFromNow(7), applied_at: daysAgo(15), created_at: daysAgo(15), updated_at: daysAgo(1), jobs: { title: "Systems Engineer", company: "Infosys" } },
];

// ── Resumes ──────────────────────────────────────────────────────────────────

export const MOCK_RESUMES: Resume[] = [
  {
    id: uid(501), student_id: uid(1), original_filename: "Resume_DemoStudent_2026.pdf",
    parsed_text: "Demo Student — B.Tech CSE | SRM IST | CGPA: 8.74\nSkills: React, Python, FastAPI...",
    extracted_data: {
      name: "Demo Student", email: "student@placify.com",
      skills: ["React", "Python", "FastAPI", "PostgreSQL", "Docker"],
      education: [{ institution: "SRM IST", degree: "B.Tech CSE", cgpa: 8.74, year: 2026 }],
      experience: [{ company: "Zoho", role: "SDE Intern", duration: "3 months" }],
      projects: [{ name: "AI Resume Parser", tech: "Python, spaCy" }],
    },
    status: "parsed", completion_percentage: 85, created_at: daysAgo(30),
  },
];

export const MOCK_ATS_RESULT = {
  ats_score: 78,
  overall_grade: "B+",
  issues: [
    "Missing quantified achievements in work experience section",
    "Skills section should be organized by category (Languages, Frameworks, Tools)",
    "Add a professional summary at the top of resume",
    "Consider adding relevant coursework section",
  ],
  keyword_suggestions: ["Microservices", "CI/CD", "Agile", "REST API", "Unit Testing", "System Design"],
};

export const MOCK_IMPROVE_RESULT = {
  ats_score: 91,
  overall_grade: "A",
  issues: [
    "Add metrics: 'Reduced load time by 40%' instead of 'Improved performance'",
    "Lead with action verbs: Built, Designed, Implemented, Optimized",
    "Include GPA equivalent or percentage if CGPA format varies",
    "Add links to live demos for each project",
  ],
  keyword_suggestions: ["Cloud Computing", "Distributed Systems", "GraphQL", "Redis", "Kafka"],
};

// ── Dashboard Stats ──────────────────────────────────────────────────────────

export const MOCK_DASHBOARD_STATS: StudentDashboardStats = {
  profile_completion: 92,
  placement_probability: 87.5,
  applications: {
    total: 4,
    by_status: { submitted: 1, reviewed: 0, shortlisted: 1, interviewed: 1, offered: 1, accepted: 0, rejected: 0, withdrawn: 0 },
  },
  job_matches: { total: 6, avg_score: 84 },
  interviews: { total: 3, completed: 2, avg_score: 8.2 },
};

export const MOCK_PROFILE_STRENGTH: ProfileStrength = {
  overall_score: 82,
  level: "Advanced",
  sections: [
    { section: "personal", label: "Personal Info", score: 18, max_score: 20, percentage: 90, tips: [] },
    { section: "academic", label: "Academic Profile", score: 16, max_score: 20, percentage: 80, tips: ["Add 10th and 12th marksheet"] },
    { section: "skills", label: "Skills & Projects", score: 22, max_score: 25, percentage: 88, tips: ["Add 1 more project with live demo"] },
    { section: "experience", label: "Work Experience", score: 14, max_score: 20, percentage: 70, tips: ["Add more quantified achievements", "Include your GSoC contribution details"] },
    { section: "links", label: "Career Links", score: 12, max_score: 15, percentage: 80, tips: ["Add a personal blog or Medium profile"] },
  ],
  next_milestone: { target: 90, label: "Expert Level", tip: "Add 1 more project and complete your experience section to reach Expert", points_needed: 8 },
};

export const MOCK_PLACEMENT_RISK: PlacementRisk = {
  risk_level: "Low",
  probability: 87.5,
  factors: { skills: 9.2, cgpa: 8.7, projects: 8.5, experience: 7.8, profile_completion: 9.2 },
  top_improvements: [
    "Add 1 more internship or freelance experience",
    "Practice system design problems for product companies",
    "Get AWS or GCP certification to stand out",
  ],
  message: "You're in a strong position! Your profile is competitive for most campus placement drives.",
};

// ── Notifications ────────────────────────────────────────────────────────────

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: uid(601), user_id: "demo-uid-student", type: "offer_received", title: "🎉 Offer from Infosys!", message: "Congratulations! You have received a placement offer from Infosys for the Systems Engineer role at ₹3.6 LPA. Accept before the deadline.", read: false, created_at: daysAgo(1), data: {} },
  { id: uid(602), user_id: "demo-uid-student", type: "application_update", title: "Zoho — Interview Round Scheduled", message: "Your application for Full Stack Developer at Zoho has moved to the HR interview round. Prepare well!", read: false, created_at: daysAgo(2), data: {} },
  { id: uid(603), user_id: "demo-uid-student", type: "new_job", title: "New Match: Amazon SDE", message: "A new job posting from Amazon matches your profile with 88% compatibility. Check it out!", read: false, created_at: daysAgo(2), data: {} },
  { id: uid(604), user_id: "demo-uid-student", type: "interview_scheduled", title: "Mock Interview Feedback Ready", message: "Your AI mock interview results are ready. Overall score: 8.2/10. View detailed feedback.", read: true, created_at: daysAgo(4), data: {} },
  { id: uid(605), user_id: "demo-uid-student", type: "resume_feedback", title: "Resume ATS Score Updated", message: "Your resume scored 78/100 on ATS analysis. We found 4 areas for improvement.", read: true, created_at: daysAgo(5), data: {} },
  { id: uid(606), user_id: "demo-uid-student", type: "drive_registration", title: "TCS Ninja Drive — Registration Open", message: "Registration for TCS Ninja campus placement drive is now open. Deadline: 15 days. Eligibility: CGPA ≥ 6.0", read: true, created_at: daysAgo(7), data: {} },
  { id: uid(607), user_id: "demo-uid-student", type: "session_reminder", title: "Mentor Session Tomorrow", message: "Reminder: You have a career guidance session with Dr. Ramesh Kumar tomorrow at 3:00 PM.", read: true, created_at: daysAgo(8), data: {} },
  { id: uid(608), user_id: "demo-uid-student", type: "system", title: "Welcome to Placify! 🚀", message: "Your account has been created. Complete your profile to start receiving AI-powered job recommendations.", read: true, created_at: daysAgo(30), data: {} },
];

// ── Placement Drives ─────────────────────────────────────────────────────────

export const MOCK_PLACEMENT_DRIVES: PlacementDrive[] = [
  { id: uid(701), title: "TCS Ninja Hiring Drive 2026", company_name: "Tata Consultancy Services", university_id: uid(900), description: "Mass recruitment drive for B.Tech graduates across all branches. 4-stage selection process: Online test → Technical Interview → Managerial Interview → HR Round.", eligibility: { min_cgpa: 6.0, eligible_branches: ["CSE", "IT", "ECE", "EEE", "ME", "CE"], max_backlogs: 0, graduation_year: 2026 }, drive_date: daysFromNow(20), registration_deadline: daysFromNow(10), package_lpa: 3.5, role: "Associate System Engineer", location: "Multiple Locations", status: "active", total_registered: 487, total_selected: 0, created_at: daysAgo(15), updated_at: daysAgo(2) },
  { id: uid(702), title: "Amazon Campus Hiring", company_name: "Amazon", university_id: uid(900), description: "Hiring for SDE-1 roles. Requires strong DSA and system design skills. High-performance, high-ownership culture.", eligibility: { min_cgpa: 8.0, eligible_branches: ["CSE", "IT", "ECE"], max_backlogs: 0, graduation_year: 2026 }, drive_date: daysFromNow(15), registration_deadline: daysFromNow(5), package_lpa: 32, role: "SDE-1", location: "Bangalore", status: "active", total_registered: 156, total_selected: 0, created_at: daysAgo(10), updated_at: daysAgo(3) },
  { id: uid(703), title: "Zoho Off-Campus Drive", company_name: "Zoho Corporation", university_id: uid(900), description: "Full-stack developer positions. Own problems, design and own system test writing. Direct interview rounds — no online test.", eligibility: { min_cgpa: 7.0, eligible_branches: ["CSE", "IT"], graduation_year: 2026 }, drive_date: daysFromNow(12), registration_deadline: daysFromNow(6), package_lpa: 8, role: "Full Stack Developer", location: "Chennai", status: "upcoming", total_registered: 92, total_selected: 0, created_at: daysAgo(8), updated_at: daysAgo(4) },
  { id: uid(704), title: "Infosys InfyTQ Drive", company_name: "Infosys", university_id: uid(900), description: "Systems Engineer and Power Programmer roles. InfyTQ certified candidates get priority shortlisting.", eligibility: { min_cgpa: 6.5, eligible_branches: ["CSE", "IT", "ECE", "EEE", "ME"], max_backlogs: 0, graduation_year: 2026 }, drive_date: daysAgo(5), registration_deadline: daysAgo(12), package_lpa: 3.6, role: "Systems Engineer", location: "Mysore, Pune, Hyderabad", status: "completed", total_registered: 623, total_selected: 148, created_at: daysAgo(30), updated_at: daysAgo(5) },
  { id: uid(705), title: "Google India Internship Program", company_name: "Google", university_id: uid(900), description: "6-month ML/AI internship with PPO possibility. Open only to CSE students with strong research background.", eligibility: { min_cgpa: 8.5, eligible_branches: ["CSE"], graduation_year: 2026 }, drive_date: daysFromNow(8), registration_deadline: daysFromNow(2), package_lpa: 45, role: "ML Engineer Intern", location: "Bangalore (Hybrid)", status: "active", total_registered: 34, total_selected: 0, created_at: daysAgo(5), updated_at: daysAgo(1) },
];

// ── University Analytics ─────────────────────────────────────────────────────

export const MOCK_UNIVERSITY_ANALYTICS = {
  total_drives: 12,
  total_placed: 342,
  total_students: 1850,
  placement_rate: 84.5,
  average_package_lpa: 8.2,
  highest_package_lpa: 45.0,
  packages_by_branch: [
    { name: "CSE", avg: 12.5, max: 45.0 },
    { name: "IT", avg: 10.2, max: 28.5 },
    { name: "ECE", avg: 8.4, max: 18.0 },
    { name: "EEE", avg: 7.2, max: 12.0 },
    { name: "ME", avg: 5.8, max: 9.5 },
    { name: "CE", avg: 5.2, max: 8.0 },
  ],
  placements_timeline: [
    { month: "Jan", count: 42 },
    { month: "Feb", count: 89 },
    { month: "Mar", count: 145 },
    { month: "Apr", count: 210 },
    { month: "May", count: 298 },
    { month: "Jun", count: 342 },
  ],
  sector_breakdown: [
    { name: "Product Dev", value: 38 },
    { name: "IT Services", value: 32 },
    { name: "FinTech", value: 16 },
    { name: "Core Eng", value: 14 },
  ],
};

// ── Mentor Sessions ──────────────────────────────────────────────────────────

export const MOCK_MENTOR_SESSIONS = [
  { id: uid(801), topic: "System Design Interview Preparation", scheduled_at: daysFromNow(2), duration_minutes: 45, status: "scheduled", notes: "", student_rating: undefined },
  { id: uid(802), topic: "Resume Review & Career Roadmap", scheduled_at: daysAgo(3), duration_minutes: 30, status: "completed", notes: "Reviewed resume structure. Suggested adding quantified achievements. Discussed transitioning from web dev to ML engineering.", student_rating: 5 },
  { id: uid(803), topic: "DSA Practice Strategy for FAANG", scheduled_at: daysAgo(10), duration_minutes: 60, status: "completed", notes: "Covered graph algorithms and dynamic programming patterns. Assigned 15 LeetCode problems for next session.", student_rating: 4 },
  { id: uid(804), topic: "Mock HR Interview", scheduled_at: daysAgo(20), duration_minutes: 30, status: "cancelled", notes: "Student requested reschedule due to exam conflict.", student_rating: undefined },
];

// ── Interview Mock Data ──────────────────────────────────────────────────────

export const MOCK_INTERVIEW_QUESTIONS: Record<string, string[]> = {
  technical: [
    "Explain the difference between a stack and a queue. When would you use each?",
    "What is the time complexity of binary search and how does it work?",
    "Describe the CAP theorem in distributed systems. Give a real-world example.",
    "How would you design a URL shortening service like bit.ly?",
    "Explain the concept of virtual memory and its benefits.",
  ],
  behavioral: [
    "Tell me about a time you had a conflict with a teammate. How did you resolve it?",
    "Describe a project where you had to learn a completely new technology in a short time.",
    "What's the biggest professional failure you've experienced, and what did you learn from it?",
    "How do you prioritize tasks when you have multiple deadlines?",
    "Tell me about a time when you went above and beyond what was expected.",
  ],
  mixed: [
    "Walk me through a project you're most proud of. What technical challenges did you face?",
    "How would you explain REST vs GraphQL to a non-technical stakeholder?",
    "Describe a time you had to debug a complex production issue. What was your approach?",
    "What's your approach to writing maintainable and testable code?",
    "If you had to redesign Instagram's backend, where would you start?",
  ],
  hr: [
    "Why are you interested in this company and role?",
    "Where do you see yourself in 5 years?",
    "What are your salary expectations?",
    "Why should we hire you over other candidates?",
    "Do you have any questions for us about the company culture?",
  ],
};

export const MOCK_INTERVIEW_FEEDBACK: InterviewFeedback = {
  overall_score: 8.2,
  confidence_score: 7.8,
  communication_score: 8.5,
  technical_accuracy_score: 8.4,
  strengths: [
    "Excellent problem decomposition skills",
    "Clear and structured communication",
    "Good use of real-world examples to illustrate concepts",
    "Strong understanding of data structures",
  ],
  improvements: [
    "Practice time management — some answers were too lengthy",
    "Be more specific with complexity analysis",
    "Prepare STAR format responses for behavioral questions",
    "Research company-specific values before the interview",
  ],
  overall_recommendation: "Strong candidate with solid technical foundations. With some refinement in communication brevity and behavioral response structuring, this candidate would perform well in actual placement interviews. Recommended to practice 2-3 more mock sessions focused on system design.",
};

// ── Career Chatbot Responses ─────────────────────────────────────────────────

export const MOCK_CAREER_RESPONSES: Record<string, string> = {
  default: "That's a great question! Based on your profile as a CSE student with strong full-stack and ML skills, I'd recommend focusing on building depth in one area while maintaining breadth. Your CGPA of 8.74 and internship experience position you well for both product companies and service companies. Would you like specific advice on any particular career path?",
  skills: "Based on current market trends for 2026 graduates, here are the most in-demand skills:\n\n**For Product Companies**: System Design, DSA, React/Next.js, Go/Rust, AWS/GCP, Kubernetes\n\n**For AI/ML Roles**: PyTorch, LLM Fine-tuning, RAG Systems, MLOps, Computer Vision\n\n**For Data Roles**: SQL, Python, Apache Spark, dbt, Tableau/Power BI\n\nSince you already have React and Python, I'd suggest adding **System Design** and **Go** to target high-paying product companies like Razorpay, Flipkart, or Google.",
  salary: "Here's the typical salary landscape for 2026 B.Tech graduates:\n\n| Company Tier | Package Range |\n|---|---|\n| FAANG/Top Product | ₹25L - ₹60L |\n| Mid-tier Product (Razorpay, Swiggy) | ₹15L - ₹30L |\n| Good Product (Zoho, Freshworks) | ₹8L - ₹15L |\n| IT Services (TCS, Infosys) | ₹3.5L - ₹7L |\n| Startups | ₹6L - ₹20L (+ equity) |\n\n**Tip**: Don't just chase the number — consider learning opportunities, work-life balance, and career growth trajectory.",
  interview: "Here's my proven strategy for cracking campus placement interviews:\n\n**1. DSA (2 months)**: Solve 150+ problems on LeetCode. Focus on Arrays, Trees, Graphs, and DP.\n\n**2. System Design (1 month)**: Study \"Designing Data-Intensive Applications\" by Martin Kleppmann. Practice 10 common designs.\n\n**3. Projects (ongoing)**: Have 2-3 solid projects with live demos. Be ready to explain architecture decisions.\n\n**4. Behavioral (2 weeks)**: Prepare 8-10 STAR stories covering leadership, conflict, failure, and teamwork.\n\n**5. Company Research**: Study each company's products, tech blog, and recent news before their interview.",
  resume: "Your resume is your first impression — here's how to make it stand out:\n\n✅ **Do**: Use action verbs (Built, Designed, Optimized, Led)\n✅ **Do**: Quantify everything ('Reduced load time by 40%', 'Processed 50K events/sec')\n✅ **Do**: Keep it to 1 page for freshers\n✅ **Do**: Add GitHub links for every project\n\n❌ **Don't**: Use generic objectives ('Seeking a challenging role...')\n❌ **Don't**: List technologies without context\n❌ **Don't**: Include photos, declarations, or references\n\nYour current ATS score is 78/100. Upload your resume on the Resume page and I'll give you specific improvement suggestions!",
  placement: "Based on your profile analysis:\n\n🟢 **Placement Probability: 87.5%** — You're in a strong position!\n\n**Your Strengths**:\n- Strong CGPA (8.74) — clears cutoffs for all companies\n- 2 internships (Zoho + GSoC) — rare for campus hires\n- Diverse project portfolio with live demos\n\n**Areas to Improve**:\n- Add a System Design project to target ₹20L+ packages\n- Get one cloud certification (AWS CCP or GCP Associate)\n- Practice competitive programming for online assessments\n\nAt your current trajectory, I'd estimate you'll receive 3-5 offers during placement season. Target companies: Zoho (safety), Flipkart/Razorpay (target), Amazon/Google (dream).",
  faang: "FAANG (now MAANG) interview preparation requires a structured approach:\n\n**Google**: Heavy on DSA + System Design. Expect 4-5 rounds. Practice on LeetCode medium-hard.\n\n**Amazon**: Leadership Principles are CRITICAL. Prepare behavioral stories for each LP. Coding is medium difficulty.\n\n**Meta**: Move fast. Strong focus on coding speed. Practice timed contests.\n\n**Microsoft**: Balanced — DSA + System Design + Behavioral. Most approachable FAANG.\n\n**Apple**: Similar to Microsoft but values attention to detail and user experience.\n\n**Timeline**: Start 3-4 months before placement season. Solve 200+ problems. Do 5+ mock interviews. You're already on the right track with your experience!",
};

// ── Helper to check demo mode ────────────────────────────────────────────────

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("access_token");
  return !!token && token.startsWith("demo-token-");
}
