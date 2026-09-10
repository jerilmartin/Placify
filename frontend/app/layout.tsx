import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: {
    template: "%s | Placify",
    default: "Placify — AI-Powered Campus Placement Platform",
  },
  description:
    "Placify unifies Students, Universities, Recruiters, and Mentors into a single intelligent ecosystem powered by Gemini AI and ML.",
  keywords: ["campus placement", "AI", "job matching", "resume parser", "interview coach"],
  openGraph: {
    title: "Placify — AI-Powered Campus Placement Platform",
    description: "Smart campus recruitment powered by Gemini AI and machine learning",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-[#0a0a0f] text-white">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            theme="dark"
            richColors
            closeButton
          />
        </AuthProvider>
      </body>
    </html>
  );
}
