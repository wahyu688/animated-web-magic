import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useChartColors, type ChartColors } from "@/hooks/use-chart-colors";

export interface BarSeries {
  key: string;
  label: string;
  color: keyof ChartColors;
}

interface AnalyticsBarsProps {
  data: Record<string, number | string>[];
  series: BarSeries[];
  /** Stacked segments (revenue by type) or side-by-side bars (new vs lost). */
  stacked?: boolean;
  formatValue?: (value: number) => string;
  height?: number;
}

interface TooltipProps {
  active?: boolean;
  label?: string;
  payload?: { dataKey: string; value: number; color: string; name: string }[];
  formatValue: (value: number) => string;
}

function BarsTooltip({ active, label, payload, formatValue }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-tooltip px-3 py-2 shadow-md">
      <p className="text-micro text-[#a9b1be] dark:text-muted-foreground">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} className="flex items-center gap-1.5 text-caption font-semibold text-tooltip-foreground tabular">
          <span className="h-2 w-2 rounded-[2px]" style={{ background: item.color }} />
          {item.name} {formatValue(item.value)}
        </p>
      ))}
    </div>
  );
}

export default function AnalyticsBars({ data, series, stacked = false, formatValue = String, height = 168 }: AnalyticsBarsProps) {
  const colors = useChartColors();

  return (
    <div style={{ height }}>
      <table className="sr-only">
        <thead>
          <tr><th scope="col">Month</th>{series.map((s) => <th key={s.key} scope="col">{s.label}</th>)}</tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={String(row.label)}>
              <th scope="row">{row.label}</th>
              {series.map((s) => <td key={s.key}>{formatValue(Number(row[s.key]) || 0)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      <ResponsiveContainer width="100%" height="100%" aria-hidden="true">
        <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }} barCategoryGap={stacked ? "45%" : "30%"} barGap={2}>
          <CartesianGrid vertical={false} horizontal={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: colors.axis, fontSize: 11 }} tickMargin={10} />
          <Tooltip content={<BarsTooltip formatValue={formatValue} />} cursor={{ fill: colors.grid, opacity: 0.4 }} />
          {series.map((s, index) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              stackId={stacked ? "total" : undefined}
              fill={colors[s.color]}
              // A 2px surface-colored stroke separates stacked segments.
              stroke={stacked ? colors.surface : undefined}
              strokeWidth={stacked ? 2 : 0}
              radius={stacked ? (index === series.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]) : [4, 4, 0, 0]}
              barSize={stacked ? 26 : 12}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
