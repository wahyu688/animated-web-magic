import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/** Matches the "Empty states" row on the App — Shared states frame. */
export default function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-8 text-center", className)}>
      <span className="mb-3.5 flex h-11 w-11 items-center justify-center rounded-[10px] bg-surface-2 text-muted-foreground">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <p className="text-[15px] font-semibold leading-[22px] text-foreground">{title}</p>
      {description && <p className="mt-1.5 max-w-[300px] text-small text-muted-foreground">{description}</p>}
      {action && <div className="mt-3.5">{action}</div>}
    </div>
  );
}
