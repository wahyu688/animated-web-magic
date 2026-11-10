import type { ReactNode } from "react";
import { Info, RefreshCw, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type BannerTone = "danger" | "warning" | "info";

const tones: Record<BannerTone, { box: string; icon: string; Icon: LucideIcon }> = {
  danger: { box: "border-destructive/20 bg-destructive-soft", icon: "text-destructive", Icon: TriangleAlert },
  warning: { box: "border-warning/20 bg-warning-soft", icon: "text-warning", Icon: Info },
  info: { box: "border-info/20 bg-info-soft", icon: "text-info", Icon: RefreshCw },
};

interface BannerProps {
  tone: BannerTone;
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
  className?: string;
}

export default function Banner({ tone, title, description, action, icon, className }: BannerProps) {
  const { box, icon: iconColor, Icon: DefaultIcon } = tones[tone];
  const Icon = icon ?? DefaultIcon;

  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("flex items-center gap-3 rounded-[10px] border px-4 py-3.5", box, className)}
    >
      <Icon className={cn("h-[18px] w-[18px] shrink-0", iconColor)} strokeWidth={1.75} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-label text-foreground">{title}</p>
        {description && <p className="text-small text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
