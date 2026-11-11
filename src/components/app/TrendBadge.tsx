import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type Trend = "up" | "down" | "stable";

interface TrendBadgeProps {
  trend: Trend;
  value: string;
  /** For metrics where lower is better (churn), a drop is shown as good news. */
  lowerIsBetter?: boolean;
}

export default function TrendBadge({ trend, value, lowerIsBetter = false }: TrendBadgeProps) {
  if (trend === "stable") {
    return (
      <Badge variant="neutral">
        <Minus strokeWidth={2.25} /> {value}
      </Badge>
    );
  }

  const isGood = (trend === "up") !== lowerIsBetter;
  const Icon = trend === "up" ? TrendingUp : TrendingDown;

  return (
    <Badge variant={isGood ? "success" : "destructive"}>
      <Icon strokeWidth={2.25} /> {value}
    </Badge>
  );
}
