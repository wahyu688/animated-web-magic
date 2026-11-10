import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  className?: string;
  leadClassName?: string;
  /** Use h1 for a page header, h2 for sections. */
  as?: "h1" | "h2";
}

export default function SectionHeading({ eyebrow, title, lead, className, leadClassName, as: Heading = "h2" }: SectionHeadingProps) {
  return (
    <div className={cn("mx-auto max-w-[760px] text-center", className)}>
      {eyebrow && <p className="mb-3.5 text-label text-primary-text">{eyebrow}</p>}
      <Heading
        className={cn(
          "text-balance text-foreground",
          Heading === "h1" ? "text-[36px] font-bold leading-[42px] tracking-[-0.03em] sm:text-h1" : "text-[28px] font-bold leading-[34px] tracking-[-0.025em] sm:text-h2"
        )}
      >
        {title}
      </Heading>
      {lead && <p className={cn("mx-auto mt-3.5 text-pretty text-body text-muted-foreground sm:text-body-lg", leadClassName)}>{lead}</p>}
    </div>
  );
}
