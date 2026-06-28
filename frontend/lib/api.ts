import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Attach auth token from localStorage
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-handle 401 — redirect to login
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: Record<string, unknown>) => apiClient.post("/api/auth/register", data),
  login: (email: string, password: string) => apiClient.post("/api/auth/login", { email, password }),
  logout: () => apiClient.post("/api/auth/logout"),
  me: () => apiClient.get("/api/auth/me"),
  refresh: (refreshToken: string) => apiClient.post("/api/auth/refresh", { refresh_token: refreshToken }),
};

// ── Students ──────────────────────────────────────────────────────────────────
export const studentsApi = {
  getProfile: () => apiClient.get("/api/students/profile"),
  createProfile: (data: Record<string, unknown>) => apiClient.post("/api/students/profile", data),
  updateProfile: (data: Record<string, unknown>) => apiClient.put("/api/students/profile", data),
  list: (params?: Record<string, unknown>) => apiClient.get("/api/students", { params }),
  getById: (id: string) => apiClient.get(`/api/students/${id}`),
};

// ── Resumes ───────────────────────────────────────────────────────────────────
export const resumesApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return apiClient.post("/api/resumes/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  list: () => apiClient.get("/api/resumes"),
  getAtsScore: (resumeId: string, jobId?: string) =>
    apiClient.get(`/api/resumes/${resumeId}/ats-score`, { params: { job_id: jobId } }),
  improve: (resumeId: string) => apiClient.post(`/api/resumes/${resumeId}/improve`),
  generateCoverLetter: (resumeId: string, jobId: string) =>
    apiClient.post("/api/resumes/cover-letter", null, { params: { resume_id: resumeId, job_id: jobId } }),
};

// ── Jobs ──────────────────────────────────────────────────────────────────────
export const jobsApi = {
  list: (params?: Record<string, unknown>) => apiClient.get("/api/jobs", { params }),
  getMatches: () => apiClient.get("/api/jobs/matches"),
  getById: (id: string) => apiClient.get(`/api/jobs/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post("/api/jobs", data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put(`/api/jobs/${id}`, data),
  delete: (id: string) => apiClient.delete(`/api/jobs/${id}`),
};

// ── Applications ──────────────────────────────────────────────────────────────
export const applicationsApi = {
  myApplications: () => apiClient.get("/api/applications"),
  apply: (jobId: string, coverLetter?: string) =>
    apiClient.post("/api/applications", { job_id: jobId, cover_letter: coverLetter }),
  forJob: (jobId: string) => apiClient.get(`/api/applications/job/${jobId}`),
  updateStatus: (id: string, data: Record<string, unknown>) => apiClient.put(`/api/applications/${id}`, data),
  withdraw: (id: string) => apiClient.delete(`/api/applications/${id}`),
};

// ── Interviews ────────────────────────────────────────────────────────────────
export const interviewsApi = {
  start: (data: Record<string, unknown>) => apiClient.post("/api/interviews/start", data),
  submitAnswer: (data: Record<string, unknown>) => apiClient.post("/api/interviews/answer", data),
  complete: (id: string) => apiClient.post(`/api/interviews/${id}/complete`),
  list: () => apiClient.get("/api/interviews"),
};

// ── Recruiters ────────────────────────────────────────────────────────────────
export const recruitersApi = {
  getProfile: () => apiClient.get("/api/recruiters/profile"),
  createProfile: (data: Record<string, unknown>) => apiClient.post("/api/recruiters/profile", data),
  updateProfile: (data: Record<string, unknown>) => apiClient.put("/api/recruiters/profile", data),
  getCandidates: (jobId: string) => apiClient.get("/api/recruiters/candidates", { params: { job_id: jobId } }),
  aiSearch: (query: string) => apiClient.post("/api/recruiters/ai-search", null, { params: { query } }),
};

// ── Universities ──────────────────────────────────────────────────────────────
export const universitiesApi = {
  getProfile: () => apiClient.get("/api/universities/profile"),
  createProfile: (data: Record<string, unknown>) => apiClient.post("/api/universities/profile", data),
  listDrives: () => apiClient.get("/api/universities/drives"),
  createDrive: (data: Record<string, unknown>) => apiClient.post("/api/universities/drives", data),
  getEligibleStudents: (driveId: string) => apiClient.get(`/api/universities/drives/${driveId}/eligible-students`),
  getAnalytics: () => apiClient.get("/api/universities/analytics"),
};

// ── Mentors ───────────────────────────────────────────────────────────────────
export const mentorsApi = {
  list: () => apiClient.get("/api/mentors"),
  getProfile: () => apiClient.get("/api/mentors/profile"),
  createProfile: (data: Record<string, unknown>) => apiClient.post("/api/mentors/profile", data),
  bookSession: (data: Record<string, unknown>) => apiClient.post("/api/mentors/sessions", data),
  listSessions: () => apiClient.get("/api/mentors/sessions"),
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsApi = {
  studentOverview: () => apiClient.get("/api/analytics/student/overview"),
  platformOverview: () => apiClient.get("/api/analytics/platform/overview"),
};

// ── AI Features ───────────────────────────────────────────────────────────────
export const aiApi = {
  careerGuidance: (message: string, history: unknown[]) =>
    apiClient.post("/api/ai/career-guidance", { message, conversation_history: history }),
  resumeVsJob: (resumeId: string, jobId: string) =>
    apiClient.post("/api/ai/resume-vs-job", { resume_id: resumeId, job_id: jobId }),
  placementRisk: () => apiClient.get("/api/ai/placement-risk"),
  profileStrength: () => apiClient.get("/api/ai/profile-strength"),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  list: (params?: { unread_only?: boolean }) => apiClient.get("/api/notifications", { params }),
  markRead: (id: string) => apiClient.put(`/api/notifications/${id}/read`),
  markAllRead: () => apiClient.put("/api/notifications/read-all"),
  unreadCount: () => apiClient.get("/api/notifications/unread-count"),
};

export default apiClient;
