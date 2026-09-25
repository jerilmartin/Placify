import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex h-8 w-8 items-center justify-center rounded-md border border-[#162740] bg-[#0A192F] shadow-sharp",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none">
        {/* Architectural shield perimeter */}
        <path
          d="M12 2.5L20 7.2V16.8L12 21.5L4 16.8V7.2L12 2.5Z"
          stroke="#F7F4EF"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Ascending gold career chevron */}
        <path
          d="M8.5 13.5L12 9.5L15.5 13.5"
          stroke="#D4AF37"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Apex summit beacon */}
        <circle cx="12" cy="6.25" r="1.25" fill="#D4AF37" />
      </svg>
    </div>
  );
}

export function BrandLockup({
  className,
  isDarkSidebar = false,
}: {
  className?: string;
  isDarkSidebar?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <BrandMark className={isDarkSidebar ? "border-[#1E3A5F] bg-[#0A192F]" : ""} />
      <div className="flex flex-col leading-none">
        <span
          className={cn(
            "text-[16px] font-semibold tracking-tight font-display",
            isDarkSidebar ? "text-white" : "text-foreground",
          )}
        >
          Placify
        </span>
        <span
          className={cn(
            "mt-0.5 text-[9.5px] font-medium uppercase tracking-[0.16em]",
            isDarkSidebar ? "text-[#94A3B8]" : "text-muted-foreground",
          )}
        >
          Placement Platform
        </span>
      </div>
    </div>
  );
}
