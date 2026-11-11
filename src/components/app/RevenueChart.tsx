import { useChartColors } from "@/hooks/use-chart-colors";
import { niceTicks } from "@/lib/chart";
import { formatMoney, formatMoneyCompact } from "@/lib/currency";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface RevenuePoint {
  month: string;
  current: number;
  previous: number;
}

interface TooltipPayload {
  payload?: { payload: RevenuePoint }[];
  active?: boolean;
}

function ChartTooltip({ active, payload, currency }: TooltipPayload & { currency: string }) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  return (
    <div className="rounded-lg bg-tooltip px-3 py-2 shadow-md">
      <p className="text-micro text-[#a9b1be] dark:text-muted-foreground">{point.month}</p>
      <p className="text-sm font-semibold text-tooltip-foreground tabular">{formatMoney(point.current, currency)}</p>
      <p className="text-micro text-[#a9b1be] dark:text-muted-foreground tabular">Previous {formatMoney(point.previous, currency)}</p>
    </div>
  );
}

interface RevenueChartProps {
  data: RevenuePoint[];
  height?: number;
  /** Workspace currency code, e.g. "USD". */
  currency: string;
}

export default function RevenueChart({ data, height = 268, currency }: RevenueChartProps) {
  const colors = useChartColors();
  const ticks = niceTicks(Math.max(...data.flatMap((point) => [point.current, point.previous])));
  const formatTick = (value: number) => formatMoneyCompact(value, currency);
  // Longer symbols ("Rp", "CN¥") need a wider axis than "$".
  const axisWidth = Math.max(44, Math.max(...ticks.map((tick) => formatTick(tick).length)) * 7 + 12);

  return (
    <div style={{ height }}>
      <table className="sr-only">
        <caption>Revenue by month, current period compared with the previous period</caption>
        <thead>
          <tr><th scope="col">Month</th><th scope="col">Current</th><th scope="col">Previous</th></tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.month}><th scope="row">{point.month}</th><td>{formatMoney(point.current, currency)}</td><td>{formatMoney(point.previous, currency)}</td></tr>
          ))}
        </tbody>
      </table>
      <ResponsiveContainer width="100%" height="100%" aria-hidden="true">
        <ComposedChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="revenue-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.primary} stopOpacity={0.16} />
              <stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={colors.grid} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fill: colors.axis, fontSize: 11 }}
            tickMargin={10}
            interval="preserveStartEnd"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: colors.axis, fontSize: 11 }}
            tickFormatter={formatTick}
            width={axisWidth}
            ticks={ticks}
            domain={[0, ticks[ticks.length - 1]]}
          />
          <Tooltip
            content={<ChartTooltip currency={currency} />}
            cursor={{ stroke: colors.grid, strokeWidth: 1 }}
          />
          <Line
            type="monotone"
            dataKey="previous"
            stroke={colors.previous}
            strokeWidth={1.75}
            strokeDasharray="5 5"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="current"
            stroke={colors.primary}
            strokeWidth={2.5}
            fill="url(#revenue-area)"
            dot={false}
            activeDot={{ r: 6, fill: colors.surface, stroke: colors.primary, strokeWidth: 3 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
