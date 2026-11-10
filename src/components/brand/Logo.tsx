import { cn } from "@/lib/utils";

// "N" mark exported from the Logo/Mark component in NexusFlow-Redesign-v2.fig.
const MARK_PATH =
  "M47.07 23.69L47.7 23.5L48.59 23.11L49.15 22.77L49.92 22.17L50.59 21.46L51.15 20.67L51.59 19.79L51.81 19.18L52.02 18.23L52.1 17.25L52.1 6.64L52.06 5.99L51.97 5.34L51.81 4.71L51.59 4.1L51.31 3.51L50.98 2.95L50.59 2.43L50.15 1.94L49.67 1.51L49.15 1.12L48.59 0.78L48 0.51L47.39 0.29L46.75 0.13L46.11 0.03L45.46 0L44.81 0.03L44.16 0.13L43.41 0.33L38.85 6.02L38.82 6.64L38.82 16.55L46.54 23.8L47.07 23.69ZM33.35 35.07L34.26 35.86L35.05 36.51L36.41 37.52L37.19 38.03L37.99 38.5L38.84 38.94L39.75 39.32L40.34 39.53L41.12 39.75L42.18 39.94L43.15 40L43.87 39.99L44.87 39.86L45.47 39.73L46.37 39.43L46.97 39.17L47.82 38.7L48.35 38.33L49.07 37.72L49.48 37.29L50.1 36.53L50.48 35.96L50.94 35.13L51.34 34.16L51.58 33.39L51.73 32.82L51.91 31.87L52.02 30.93L52.09 29.35L52.1 25.54L51.44 26.03L51 26.31L50.38 26.66L49.91 26.89L48.94 27.28L48.13 27.53L47.63 27.65L46.82 27.77L46.41 27.78L46 27.74L45.6 27.67L45.2 27.55L44.82 27.39L44.46 27.2L44.13 26.97L43.81 26.7L22.8 6.94L21.78 6.01L20.51 4.93L19.64 4.25L18.57 3.47L17.13 2.55L15.93 1.91L14.95 1.47L13.99 1.13L13.64 1.01L12.65 0.78L12.07 0.67L10.83 0.56L10.48 0.56L9.59 0.61L9 0.68L8.41 0.8L7.6 1.01L7.01 1.22L6.25 1.57L5.7 1.86L5.17 2.21L4.29 2.88L3.87 3.28L3.26 3.93L2.84 4.47L2.33 5.2L2.05 5.7L1.59 6.6L1.08 7.88L0.65 9.39L0.4 10.64L0.26 11.58L0.11 12.95L0.03 14.36L0 16.37L0.51 15.96L1.35 15.4L1.79 15.15L2.7 14.72L3.17 14.54L4.14 14.24L5.13 14.05L5.63 13.99L6.13 13.95L7.14 13.95L8.15 14.05L8.64 14.13L9.62 14.38L10.1 14.54L11.03 14.92L11.49 15.15L12.35 15.67L12.76 15.96L13.27 16.37L13.27 16.22L33.35 35.07ZM0.07 34.16L0.2 34.79L0.39 35.42L0.78 36.31L1.12 36.87L1.51 37.39L1.94 37.87L2.43 38.31L2.95 38.7L3.51 39.03L4.4 39.43L5.02 39.62L5.66 39.75L6.31 39.81L6.96 39.81L7.93 39.69L8.56 39.53L9.05 39.36L13.26 33.56L13.27 24.22L13.24 23.57L13.15 22.93L12.99 22.3L12.77 21.68L12.49 21.09L12.15 20.54L11.77 20.01L11.33 19.53L10.85 19.09L10.32 18.7L9.76 18.37L9.18 18.09L8.56 17.87L7.93 17.71L7.29 17.62L6.64 17.59L5.99 17.62L5.34 17.71L4.71 17.87L4.1 18.09L3.51 18.37L2.95 18.7L2.43 19.09L1.94 19.53L1.51 20.01L1.12 20.54L0.78 21.09L0.39 21.99L0.13 22.93L0.03 23.57L0 24.22L0 33.18L0.07 34.16Z";

interface LogoMarkProps {
  className?: string;
}

export function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 52.1 40"
      fill="currentColor"
      aria-hidden="true"
      className={cn("h-[22px] w-auto shrink-0 text-primary", className)}
    >
      <path d={MARK_PATH} />
    </svg>
  );
}

interface LogoProps {
  className?: string;
  markClassName?: string;
  /** Hide the wordmark, e.g. in the collapsed sidebar. */
  markOnly?: boolean;
  /** sm: mobile topbar (20px mark). md: app sidebar (22px). lg: public navbar (26px). */
  size?: "sm" | "md" | "lg";
  /** "inverse" is the all-white lockup for dark backgrounds. */
  tone?: "default" | "inverse";
}

export default function Logo({ className, markClassName, markOnly = false, size = "md", tone = "default" }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center", size === "lg" ? "gap-[9px]" : "gap-[7px]", className)}>
      <LogoMark className={cn(size === "sm" && "h-5", size === "lg" && "h-[26px]", tone === "inverse" && "text-white", markClassName)} />
      {!markOnly && (
        <span className={cn("font-semibold tracking-[-0.01em]", tone === "inverse" ? "text-white" : "text-foreground", size === "sm" ? "text-[15px] leading-[17px]" : size === "lg" ? "text-[19px] leading-[22px]" : "text-[17px] leading-5")}>
          Nexus<span className={tone === "inverse" ? undefined : "text-primary"}>Flow</span>
        </span>
      )}
      {markOnly && <span className="sr-only">NexusFlow</span>}
    </span>
  );
}
