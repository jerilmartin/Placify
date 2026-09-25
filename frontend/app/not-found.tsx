"use client";

import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="p-8 max-w-md w-full text-center border border-border bg-card rounded-xl shadow-elevated">
        <div className="w-14 h-14 bg-muted/70 border border-border rounded-lg flex items-center justify-center mx-auto mb-5">
          <AlertCircle className="w-7 h-7 text-primary" />
        </div>

        <h1 className="font-display text-4xl font-semibold text-foreground tracking-tight mb-1">404</h1>
        <h2 className="font-display text-lg font-medium text-foreground mb-2">Page Not Found</h2>
        <p className="text-muted-foreground text-xs leading-relaxed mb-6">
          The link you followed might be broken, or the page may have been moved or removed.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <Button
            asChild
            className="flex-1 bg-primary text-primary-foreground hover:bg-[#660019]"
          >
            <Link href="/">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Return Home
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (typeof window !== "undefined") window.history.back();
            }}
            className="flex-1"
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
