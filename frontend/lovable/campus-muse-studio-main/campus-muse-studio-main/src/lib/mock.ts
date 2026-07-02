export const student = {
  name: "Aarav Sharma",
  handle: "aarav.sharma",
  email: "aarav.s@iitb.ac.in",
  university: "IIT Bombay",
  program: "B.Tech, Computer Science",
  batch: "2026",
  cgpa: 8.7,
  avatarInitials: "AS",
};

export const kpis = [
  { label: "AI Match Score", value: "92", suffix: "/100", delta: "+4", trend: "up" as const, hint: "vs. last week" },
  { label: "Resume ATS", value: "88", suffix: "/100", delta: "+11", trend: "up" as const, hint: "after AI rewrite" },
  { label: "Applications", value: "24", delta: "6 active", trend: "flat" as const, hint: "in pipeline" },
  { label: "Profile Complete", value: "96", suffix: "%", delta: "Add certifications", trend: "up" as const, hint: "1 step left" },
];

export const matchedJobs = [
  { id: "j1", company: "Stripe", role: "Software Engineer, Payments", location: "Bengaluru · Hybrid", package: "₹52 LPA", match: 96, logo: "S", tint: "oklch(0.68 0.19 285)" },
  { id: "j2", company: "Rippling", role: "Full-Stack Engineer", location: "Remote, India", package: "₹46 LPA", match: 93, logo: "R", tint: "oklch(0.72 0.14 235)" },
  { id: "j3", company: "Zerodha", role: "Backend Engineer, Trading", location: "Bengaluru · Onsite", package: "₹38 LPA", match: 91, logo: "Z", tint: "oklch(0.72 0.17 155)" },
  { id: "j4", company: "Razorpay", role: "Product Engineer", location: "Bengaluru", package: "₹34 LPA", match: 89, logo: "R", tint: "oklch(0.80 0.16 75)" },
  { id: "j5", company: "Linear", role: "Software Engineer (Grad)", location: "Remote, Global", package: "$140k", match: 87, logo: "L", tint: "oklch(0.68 0.20 340)" },
];

export const applications = [
  { id: "a1", company: "Stripe", role: "Software Engineer, Payments", stage: "Interview", stageIndex: 3, date: "Nov 04", note: "Round 2 scheduled Tue 3pm" },
  { id: "a2", company: "Rippling", role: "Full-Stack Engineer", stage: "Assessment", stageIndex: 2, date: "Nov 02", note: "HackerRank due in 2 days" },
  { id: "a3", company: "Zerodha", role: "Backend Engineer", stage: "Shortlisted", stageIndex: 1, date: "Oct 30", note: "Recruiter viewed profile" },
  { id: "a4", company: "Google", role: "SWE, Cloud", stage: "Offer", stageIndex: 5, date: "Oct 26", note: "Verbal offer received" },
  { id: "a5", company: "Notion", role: "Product Engineer", stage: "Applied", stageIndex: 0, date: "Oct 24", note: "Awaiting recruiter" },
];

export const stages = ["Applied", "Shortlisted", "Assessment", "Interview", "HR", "Offer"];

export const upcomingInterviews = [
  { id: "i1", company: "Stripe", role: "Payments SWE — Round 2", when: "Tue, Nov 5 · 3:00 PM", mode: "Google Meet" },
  { id: "i2", company: "Rippling", role: "System Design", when: "Thu, Nov 7 · 11:00 AM", mode: "Onsite" },
  { id: "i3", company: "Zerodha", role: "Founder Round", when: "Fri, Nov 8 · 4:30 PM", mode: "Zoom" },
];

export const activity = [
  { id: "n1", title: "Stripe shortlisted your application", when: "12m", kind: "success" as const },
  { id: "n2", title: "New match: Linear · Software Engineer", when: "1h", kind: "info" as const },
  { id: "n3", title: "Resume ATS score improved to 88", when: "3h", kind: "success" as const },
  { id: "n4", title: "Placement drive: Razorpay opens tomorrow", when: "5h", kind: "warning" as const },
  { id: "n5", title: "Mentor Priya left a note on your resume", when: "1d", kind: "info" as const },
];

export const skillGaps = [
  { skill: "System Design", level: 62, target: 85 },
  { skill: "Distributed Systems", level: 48, target: 75 },
  { skill: "SQL Optimization", level: 71, target: 90 },
  { skill: "DSA (Hard)", level: 74, target: 90 },
];

export const applicationTrend = [
  { d: "W1", applied: 4, interviews: 1 },
  { d: "W2", applied: 6, interviews: 2 },
  { d: "W3", applied: 3, interviews: 2 },
  { d: "W4", applied: 8, interviews: 3 },
  { d: "W5", applied: 5, interviews: 4 },
  { d: "W6", applied: 9, interviews: 5 },
  { d: "W7", applied: 7, interviews: 6 },
  { d: "W8", applied: 11, interviews: 7 },
];

export const performanceRadar = [
  { axis: "Technical", A: 86 },
  { axis: "Communication", A: 78 },
  { axis: "Problem Solving", A: 91 },
  { axis: "System Design", A: 62 },
  { axis: "Behavioral", A: 82 },
  { axis: "Coding Speed", A: 74 },
];
