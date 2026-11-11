// Stored color classes (e.g. calendar_events.color = "bg-info") mapped onto design tokens.
export type Tone = "primary" | "info" | "success" | "warning" | "danger" | "violet" | "neutral";

export const toneClasses: Record<Tone, { solid: string; soft: string; text: string; border: string; ring: string }> = {
  primary: { solid: "bg-primary", soft: "bg-primary-soft", text: "text-primary-text", border: "border-primary", ring: "ring-primary" },
  info: { solid: "bg-info", soft: "bg-info-soft", text: "text-info", border: "border-info", ring: "ring-info" },
  success: { solid: "bg-success", soft: "bg-success-soft", text: "text-success", border: "border-success", ring: "ring-success" },
  // Amber reads as "warning" in charts and event bars; the darker token is kept for text.
  warning: { solid: "bg-amber", soft: "bg-warning-soft", text: "text-warning", border: "border-amber", ring: "ring-amber" },
  danger: { solid: "bg-destructive", soft: "bg-destructive-soft", text: "text-destructive", border: "border-destructive", ring: "ring-destructive" },
  violet: { solid: "bg-violet", soft: "bg-violet-soft", text: "text-violet", border: "border-violet", ring: "ring-violet" },
  neutral: { solid: "bg-subtle", soft: "bg-surface-2", text: "text-muted-foreground", border: "border-subtle", ring: "ring-subtle" },
};

/** Accepts legacy class strings ("bg-warning", "bg-primary/10 text-primary") or tone names. */
export function toneFromClass(value: string | null | undefined, fallback: Tone = "primary"): Tone {
  if (!value) return fallback;
  if (/destructive|danger|red/.test(value)) return "danger";
  if (/success|green|emerald/.test(value)) return "success";
  if (/warning|amber|yellow|orange/.test(value)) return "warning";
  if (/violet|purple/.test(value)) return "violet";
  if (/info|cyan|sky/.test(value)) return "info";
  if (/muted|slate|gray|neutral/.test(value)) return "neutral";
  if (/primary|blue/.test(value)) return "primary";
  return fallback;
}
