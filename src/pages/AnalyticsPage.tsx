import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Download, Loader2, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../lib/supabase";
import { useCompany } from "@/hooks/use-company";
import { safeRemoveChannel, withSupabaseTimeout } from "@/lib/supabaseLifecycle";
import { useSupabaseResumeRecovery } from "@/hooks/use-supabase-resume-recovery";
import { useAuth } from "@/contexts/AuthContext";
import { useFinancialReports, type FinancialReport } from "@/hooks/use-financial-reports";
import { useBusinessProfile } from "@/hooks/use-business-profile";
import { reportTotals } from "@/lib/business";
import { formatMoney, formatMoneyCompact } from "@/lib/currency";
import PageHeader from "@/components/app/PageHeader";
import StatCard from "@/components/app/StatCard";
import EmptyState from "@/components/app/EmptyState";
import RevenueChart from "@/components/app/RevenueChart";
import AnalyticsBars from "@/components/app/AnalyticsBars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toneClasses } from "@/lib/tones";
import { cn } from "@/lib/utils";

interface ChartDatum {
  id: string;
  month: string;
  current_val: number;
  previous_val: number;
  sort_order?: number;
}

// Chart data is monthly, so ranges are whole months.
const RANGES = [
  { id: "3M", months: 3 },
  { id: "6M", months: 6 },
  { id: "1Y", months: 12 },
] as const;
type RangeId = (typeof RANGES)[number]["id"];

const swatch = { primary: "bg-primary", info: "bg-info", violet: "bg-violet" } as const;

const cardMotion = (index: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, delay: index * 0.04, ease: "easeOut" },
}) as const;

function signed(value: number, digits = 0, unit = "") {
  const formatted = Math.abs(value).toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits });
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatted}${unit}`;
}

function csvEscape(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function NoReports({ className }: { className?: string }) {
  return (
    <EmptyState
      icon={Receipt}
      title="No financial data recorded yet"
      description="Submit a monthly report to start tracking."
      action={<Button asChild variant="secondary" size="sm"><Link to="/financial">Add report</Link></Button>}
      className={className}
    />
  );
}

function SummaryTile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-[18px] py-4 shadow-xs">
      <p className="text-label text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-[22px] font-bold leading-7 tracking-[-0.02em] text-foreground tabular">{value}</p>
      <p className="mt-1 text-caption font-normal text-muted-foreground">{note}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const [activeRange, setActiveRange] = useState<RangeId>("1Y");
  const [isLive, setIsLive] = useState(false);

  const [chartRawData, setChartRawData] = useState<ChartDatum[]>([]);
  const [isLoadingDB, setIsLoadingDB] = useState(true);
  const isMountedRef = useRef(false);
  const fetchRequestIdRef = useRef(0);

  const { toast } = useToast();
  const { companyId, isCompanyLoading } = useCompany();
  const { user, isAuthLoading } = useAuth();
  const { reports, isLoading: isLoadingReports } = useFinancialReports(companyId);
  const { config, currency, isLoading: isProfileLoading } = useBusinessProfile(companyId);

  useEffect(() => {
    if (!isCompanyLoading && !companyId) {
      setIsLoadingDB(false);
      setChartRawData([]);
    }
  }, [companyId, isCompanyLoading]);

  const fetchAnalyticsData = useCallback(async (showLoading = false) => {
    if (!companyId) {
      if (showLoading) setIsLoadingDB(false);
      return;
    }
    const requestId = showLoading
      ? ++fetchRequestIdRef.current
      : fetchRequestIdRef.current;

    try {
      if (showLoading) setIsLoadingDB(true);
      const { data, error } = await withSupabaseTimeout(
        supabase.from('chart_data').select('*').eq('company_id', companyId).order('sort_order', { ascending: true }),
        "analytics chart_data"
      );
      if (error) throw error;
      if (!isMountedRef.current) return;
      setChartRawData(data ?? []);
    } catch (error) {
      console.error("Gagal menarik data:", error);
      toast({ title: "Couldn't load analytics", description: "Some figures may be out of date. Try refreshing.", variant: "destructive" });
    } finally {
      if (isMountedRef.current && (showLoading || requestId === fetchRequestIdRef.current)) setIsLoadingDB(false);
    }
  }, [companyId, toast]);

  useSupabaseResumeRecovery({
    enabled: Boolean(companyId),
    onRecover: () => fetchAnalyticsData(false),
  });

  useEffect(() => {
    const handler = () => fetchAnalyticsData();
    window.addEventListener('nexusflow:chart-updated', handler);
    return () => window.removeEventListener('nexusflow:chart-updated', handler);
  }, [fetchAnalyticsData]);

  // Keyed on the user id: a token refresh (e.g. after alt-tab) must not reload with skeletons.
  const userId = user?.id;
  useEffect(() => {
    if (!userId || !companyId) return;
    isMountedRef.current = true;
    fetchAnalyticsData(true);

    const channel = supabase.channel(`analytics-metrics-realtime:${companyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chart_data', filter: `company_id=eq.${companyId}` }, () => fetchAnalyticsData())
      .subscribe((status, error) => {
        setIsLive(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') fetchAnalyticsData();
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn("[analytics realtime] disconnected; fetch fallback remains active.", { status, error });
        }
      });

    return () => {
      isMountedRef.current = false;
      setIsLive(false);
      safeRemoveChannel(channel);
    };
  }, [companyId, userId, fetchAnalyticsData]);

  const chartData = useMemo(() => {
    const months = RANGES.find((range) => range.id === activeRange)?.months ?? 12;
    return chartRawData.slice(-months).map((d) => ({
      month: d.month,
      current: Number(d.current_val) || 0,
      previous: Number(d.previous_val) || 0,
    }));
  }, [chartRawData, activeRange]);

  // --- Breakdowns from financial_reports ---
  const latest: FinancialReport | undefined = reports[reports.length - 1];
  const previous: FinancialReport | undefined = reports[reports.length - 2];
  const lastSix = reports.slice(-6);

  const value = (report: FinancialReport | undefined, key: string) => Number(report?.raw?.[key]) || 0;
  const money = (amount: number) => formatMoney(amount, currency);
  const compactMoney = (amount: number) => formatMoneyCompact(amount, currency);

  const revenueByType = lastSix.map((report) => ({
    label: report.label,
    ...Object.fromEntries(config.revenueStreams.map((stream) => [stream.key, value(report, stream.key)])),
  }));

  const { customers } = config;
  const customerFlow = lastSix.map((report) => ({
    label: report.label,
    new: value(report, customers.newKey),
    ...(customers.lostKey ? { lost: value(report, customers.lostKey) } : {}),
  }));

  const latestTotals = reportTotals(config, latest?.raw);
  const largestExpense = Math.max(...config.expenses.map((row) => value(latest, row.key)), 1);
  const netCustomers = value(latest, customers.newKey) - (customers.lostKey ? value(latest, customers.lostKey) : 0);

  const displayStats = config.kpis(reports, currency);
  const summaryTiles = config.summary(reports, currency);
  const formFields = config.sections.flatMap((section) => section.fields);

  const handleExport = () => {
    const header = ["Month", `Revenue (${currency})`, `Expenses (${currency})`, `Net profit (${currency})`, ...formFields.map((field) => field.label)];
    const rows = reports.length
      ? reports.map((report) => {
          const totals = reportTotals(config, report.raw);
          return [report.longLabel, totals.revenue, totals.expenses, totals.netProfit, ...formFields.map((field) => value(report, field.key))];
        })
      : chartRawData.map((d) => [d.month, Number(d.current_val) || 0, "", "", ...formFields.map(() => "")]);
    const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "nexusflow-analytics.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast({ variant: "info", title: "Exporting report", description: "Your CSV is downloading." });
  };

  if (isAuthLoading || !user || (isCompanyLoading && !companyId)) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const breakdownLoading = isLoadingReports;
  const hasReports = reports.length > 0;

  return (
    <div className="space-y-4 px-4 pb-12 pt-6 sm:space-y-6 sm:px-6 lg:px-8 lg:pt-7">
      <PageHeader
        title="Analytics Overview"
        description="Monitor your key performance metrics and business growth."
        actions={
          <>
            <div role="radiogroup" aria-label="Chart range" className="flex h-10 items-center gap-0.5 rounded-[9px] border border-border bg-surface-2 p-[3px]">
              {RANGES.map((range) => (
                <button
                  key={range.id}
                  type="button"
                  role="radio"
                  aria-checked={activeRange === range.id}
                  onClick={() => setActiveRange(range.id)}
                  className={cn(
                    "h-[32px] rounded-[7px] px-3.5 text-label transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    activeRange === range.id ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {range.id}
                </button>
              ))}
            </div>
            <Button variant="secondary" onClick={handleExport} disabled={isLoadingDB}>
              <Download /> Export Report
            </Button>
          </>
        }
      />

      <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {displayStats.map((stat, index) => (
          <motion.div key={stat.label} {...cardMotion(index)}>
            <StatCard {...stat} loading={isLoadingReports || isProfileLoading} />
          </motion.div>
        ))}
      </section>

      <motion.div {...cardMotion(4)}>
        <Card>
          <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-[18px]">
            <div className="space-y-0.5">
              <CardTitle>Revenue Growth</CardTitle>
              <CardDescription>Income trends generated from your monthly Financial reports.</CardDescription>
            </div>
            <div className="flex items-center gap-4 pt-1 text-caption font-normal text-muted-foreground">
              {isLive && (
                <Badge variant="success" size="sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" /> Live
                </Badge>
              )}
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-primary" />Current year</span>
              <span className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-[#a9b1be] dark:border-[#4a566b]" />Previous year</span>
            </div>
          </CardHeader>
          <div className="px-3 pb-4 sm:px-5 sm:pb-5">
            {isLoadingDB ? (
              <Skeleton className="h-[300px] w-full rounded-lg" />
            ) : chartData.length === 0 ? (
              <NoReports className="h-[300px]" />
            ) : (
              <RevenueChart data={chartData} height={300} currency={currency} />
            )}
          </div>
        </Card>
      </motion.div>

      <div className="grid items-stretch gap-4 lg:grid-cols-3">
        <motion.div {...cardMotion(5)}>
          <Card className="flex h-full flex-col">
            <CardHeader className="pb-4">
              <CardTitle>Revenue by Type</CardTitle>
              <CardDescription>Last {Math.max(lastSix.length, 1)} {lastSix.length === 1 ? "month" : "months"}, in {currency}.</CardDescription>
            </CardHeader>
            <div className="flex flex-1 flex-col justify-end px-5 pb-5">
              {breakdownLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : !hasReports ? (
                <NoReports />
              ) : (
                <>
                  <AnalyticsBars
                    data={revenueByType}
                    stacked
                    formatValue={compactMoney}
                    series={config.revenueStreams.map((stream) => ({ key: stream.key, label: stream.label, color: stream.color }))}
                  />
                  <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-caption font-normal text-muted-foreground">
                    {config.revenueStreams.map((stream) => (
                      <li key={stream.key} className="flex items-center gap-1.5">
                        <span className={cn("h-2.5 w-2.5 rounded-[3px]", swatch[stream.color])} />{stream.label}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div {...cardMotion(6)}>
          <Card className="h-full">
            <CardHeader className="pb-4">
              <CardTitle>Expenses</CardTitle>
              <CardDescription>
                {latest ? `${latest.longLabel.split(" ")[0]} · ${money(latestTotals.expenses)} total` : "Latest month"}
              </CardDescription>
            </CardHeader>
            <div className="px-5 pb-5">
              {breakdownLoading ? (
                <div className="space-y-4">{config.expenses.map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
              ) : !hasReports ? (
                <NoReports />
              ) : (
                <ul className="space-y-[14px]">
                  {config.expenses.map((row) => {
                    const amount = value(latest, row.key);
                    return (
                      <li key={row.key} className="space-y-2">
                        <div className="flex justify-between text-small">
                          <span className="text-foreground">{row.label}</span>
                          <span className="font-semibold text-foreground tabular">{money(amount)}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-track">
                          <div className={cn("h-full rounded-full", toneClasses[row.tone].solid)} style={{ width: `${(amount / largestExpense) * 100}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div {...cardMotion(7)}>
          <Card className="flex h-full flex-col">
            <CardHeader className="pb-4">
              <CardTitle>{customers.title}</CardTitle>
              <CardDescription>{customers.lostKey ? "New vs. lost per month." : `New ${customers.noun} per month.`}</CardDescription>
            </CardHeader>
            <div className="flex flex-1 flex-col justify-end px-5 pb-5">
              {breakdownLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : !hasReports ? (
                <NoReports />
              ) : (
                <>
                  <AnalyticsBars
                    data={customerFlow}
                    formatValue={(value) => value.toLocaleString("en-US")}
                    series={[
                      { key: "new", label: "New", color: "success" as const },
                      ...(customers.lostKey ? [{ key: "lost", label: "Lost", color: "danger" as const }] : []),
                    ]}
                  />
                  <div className="mt-4 flex items-center justify-between gap-3 text-caption font-normal text-muted-foreground">
                    <ul className="flex gap-4">
                      <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-success" />New</li>
                      {customers.lostKey && <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-destructive" />Lost</li>}
                    </ul>
                    {latest && (
                      <span className={cn("text-label tabular", netCustomers >= 0 ? "text-success" : "text-destructive")}>
                        {customers.lostKey ? "Net" : "New"} {signed(netCustomers)} in {latest.label}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {hasReports && latest && (
        <section aria-label={`${latest.longLabel} summary`} className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {summaryTiles.map((tile) => (
            <SummaryTile key={tile.label} {...tile} />
          ))}
        </section>
      )}
    </div>
  );
}
