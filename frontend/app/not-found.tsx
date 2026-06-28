"use client";

import Link from "next/link";
import { AlertCircle, ArrowLeft, HelpCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="glass p-8 max-w-md w-full text-center border border-white/5 rounded-2xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -left-12 w-24 h-24 bg-purple-500/10 rounded-full blur-xl" />
        <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-blue-500/10 rounded-full blur-xl" />
        
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-purple-400" />
        </div>

        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">404</h1>
        <h2 className="text-lg font-bold text-white mb-3">Page Not Found</h2>
        <p className="text-slate-500 text-xs leading-relaxed mb-6">
          The link you followed might be broken, or the page may have been removed. Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium text-xs hover:from-purple-500 hover:to-blue-500 transition-all shadow-md shadow-purple-500/20"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return Home
          </Link>
          <button
            onClick={() => {
              if (typeof window !== "undefined") window.history.back();
            }}
            className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white font-medium hover:bg-white/10 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
