import type { LucideIcon } from "lucide-react";
import TrendBadge, { type Trend } from "@/components/app/TrendBadge";
import Sparkline from "@/components/app/Sparkline";
import { Skeleton } from "@/components/ui/skeleton";
import { toneClasses, type Tone } from "@/lib/tones";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  trend: Trend;
  icon: LucideIcon;
  tone: Tone;
  lowerIsBetter?: boolean;
  loading?: boolean;
  /** Recent values, oldest first. Shown as a small trend line when there are 2+. */
  sparkline?: number[];
}

export default function StatCard({ label, value, change, trend, icon: Icon, tone, lowerIsBetter, loading, sparkline }: StatCardProps) {
  return (
    <div className="flex h-full flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-xs sm:gap-3.5 sm:p-5">
      <div className="flex items-center justify-between gap-2.5">
        <p className="truncate text-label text-muted-foreground">{label}</p>
        <span className={cn("hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:flex", toneClasses[tone].soft, toneClasses[tone].text)}>
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
      </div>
      {loading ? (
        <Skeleton className="h-7 w-28 sm:h-[34px] sm:w-32" />
      ) : (
        <p className="truncate text-[22px] font-bold leading-7 tracking-[-0.02em] text-foreground tabular sm:text-kpi">{value}</p>
      )}
      <div className="flex items-center gap-2">
        <TrendBadge trend={trend} value={change} lowerIsBetter={lowerIsBetter} />
        <span className="hidden truncate text-caption font-normal text-muted-foreground sm:inline">
          {sparkline && sparkline.length > 1 ? "vs prev." : "vs prev. period"}
        </span>
        {sparkline && sparkline.length > 1 && (
          <Sparkline
            values={sparkline}
            className={cn("ml-auto hidden sm:block", (trend === "up") === !!lowerIsBetter && trend !== "stable" ? "text-destructive" : "text-success")}
          />
        )}
      </div>
    </div>
  );
}
