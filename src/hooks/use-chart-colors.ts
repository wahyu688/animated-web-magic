import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

const LIGHT_FALLBACK = {
  primary: "#0a48de",
  info: "#0a6ca3",
  violet: "#6a4ad6",
  amber: "#f2a31b",
  success: "#0f7a55",
  danger: "#c62f2f",
  grid: "#e3e6eb",
  axis: "#8b93a1",
  previous: "#a9b1be",
  surface: "#ffffff",
};

export type ChartColors = typeof LIGHT_FALLBACK;

/** Recharts needs concrete colors, so design tokens are read from CSS after each theme change. */
export function useChartColors(): ChartColors {
  const { resolvedTheme } = useTheme();
  const [colors, setColors] = useState(LIGHT_FALLBACK);

  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    const token = (name: string) => `hsl(${style.getPropertyValue(name).trim()})`;
    setColors({
      primary: token("--primary"),
      info: token("--info"),
      violet: token("--violet"),
      amber: token("--amber"),
      success: token("--success"),
      danger: token("--destructive"),
      grid: token("--border"),
      axis: token("--subtle"),
      previous: resolvedTheme === "dark" ? "#4a566b" : "#a9b1be",
      surface: token("--card"),
    });
  }, [resolvedTheme]);

  return colors;
}
