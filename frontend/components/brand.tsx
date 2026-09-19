import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex h-8 w-8 items-center justify-center rounded-lg border border-foreground/15 bg-foreground shadow-sm",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-background" fill="none">
        <path
          d="M5 19V5h6.5a4.5 4.5 0 1 1 0 9H8"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function BrandLockup({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <BrandMark />
      <div className="flex flex-col leading-none">
        <span className="text-[15px] font-semibold tracking-tight text-foreground">
          Placify
        </span>
        <span className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Placement OS
        </span>
      </div>
    </div>
  );
}
