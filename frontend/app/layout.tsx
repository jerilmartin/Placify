import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: {
    template: "%s | Placify",
    default: "Placify — Campus Placement Platform",
  },
  description:
    "Placify unifies Students, Universities, Recruiters, and Mentors into a single intelligent ecosystem for campus recruitment.",
  keywords: ["campus placement", "job matching", "resume parser", "interview coach"],
  openGraph: {
    title: "Placify — Campus Placement Platform",
    description: "Smart campus recruitment and placement management",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400..700;1,6..72,400..700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-background text-foreground min-h-screen">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            theme="light"
            richColors
            closeButton
          />
        </AuthProvider>
      </body>
    </html>
  );
}
