import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-ring",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow-xs hover:bg-[#660019]",
        secondary:
          "border-border bg-secondary text-secondary-foreground hover:bg-muted",
        destructive:
          "border-destructive/30 bg-destructive/10 text-destructive shadow-xs hover:bg-destructive/20",
        outline: "border-border text-foreground bg-card",
        gold: "border-[#E8D9A8] bg-[#FCF9EE] text-[#785A00] font-semibold",
        navy: "border-[#162740] bg-[#0A192F] text-[#F7F4EF] font-medium",
        burgundy: "border-[#800020]/20 bg-[#800020]/10 text-[#800020] font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
