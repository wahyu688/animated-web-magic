import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Custom font sizes from tailwind.config.ts. Without this, twMerge reads e.g.
// `text-label` as a text color and drops `text-primary-foreground` next to it.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: ["display", "h1", "h2", "page-title", "h3", "card-title", "body-lg", "body", "label", "small", "caption", "micro", "kpi"],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
