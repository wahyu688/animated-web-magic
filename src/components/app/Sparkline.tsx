import { cn } from "@/lib/utils";

interface SparklineProps {
  values: number[];
  className?: string;
}

/** Tiny decorative trend line next to a KPI. Needs at least two points. */
export default function Sparkline({ values, className }: SparklineProps) {
  if (values.length < 2) return null;

  const width = 72;
  const height = 24;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((value, i) => [
    (i / (values.length - 1)) * width,
    height - 2 - ((value - min) / span) * (height - 4),
  ]);
  const path = points
    .map(([x, y], i) => {
      if (i === 0) return `M${x},${y}`;
      const [px, py] = points[i - 1];
      const mid = (px + x) / 2;
      return `C${mid},${py} ${mid},${y} ${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={cn("h-6 w-[72px] shrink-0 overflow-visible", className)} fill="none" aria-hidden="true">
      <path d={path} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
