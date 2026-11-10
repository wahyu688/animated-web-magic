import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Tones follow the Badges group on the Components page (roles, statuses, tags, trends).
const badgeVariants = cva(
  "inline-flex h-[22px] shrink-0 items-center gap-[5px] whitespace-nowrap rounded-full px-2 text-caption font-semibold [&_svg]:h-3 [&_svg]:w-3 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary-soft text-primary-text",
        solid: "bg-primary text-primary-foreground",
        info: "bg-info-soft text-info",
        success: "bg-success-soft text-success",
        warning: "bg-warning-soft text-warning",
        destructive: "bg-destructive-soft text-destructive",
        violet: "bg-violet-soft text-violet",
        neutral: "bg-track text-muted-foreground",
        outline: "border border-border bg-card text-foreground",
      },
      size: {
        default: "",
        sm: "h-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { Badge, badgeVariants };
