import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CalendarDays, Calculator, Check, Receipt, RefreshCw, Save, TrendingDown, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../lib/supabase";
import { useCompany } from "@/hooks/use-company";
import { useBusinessProfile } from "@/hooks/use-business-profile";
import { formFieldKeys, reportTotals, type ReportValues } from "@/lib/business";
import { formatMoney, getCurrency } from "@/lib/currency";
import { safeRemoveChannel, withSupabaseTimeout } from "@/lib/supabaseLifecycle";
import { useSupabaseResumeRecovery } from "@/hooks/use-supabase-resume-recovery";
import PageHeader from "@/components/app/PageHeader";
import EmptyState from "@/components/app/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toneClasses } from "@/lib/tones";
import { cn } from "@/lib/utils";

const ALL_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Accepts "120,000" as well as "120000". */
const parseNum = (v: string) => {
  const n = Number(String(v).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
};

/** Adds thousands separators to a typed value, leaving partial input (e.g. "6.") alone. */
const formatTyped = (v: string) => {
  const clean = v.replace(/,/g, "").trim();
  if (clean === "" || !/^\d+(\.\d+)?$/.test(clean)) return v;
  const [whole, fraction] = clean.split(".");
  return `${Number(whole).toLocaleString("en-US")}${fraction !== undefined ? `.${fraction}` : ""}`;
};

interface ChartDatum {
  id: string;
  company_id?: string;
  month: string;
  current_val: number;
  previous_val: number;
  sort_order: number;
}

type FormState = Record<string, string> & { month: string };

const emptyForm = (month: string): FormState => ({ month }) as FormState;

/** Left padding for money inputs, so longer symbols ("Rp", "CN¥") don't overlap the number. */
const symbolPadding = (symbol: string) => (symbol.length >= 3 ? "pl-12" : symbol.length === 2 ? "pl-9" : "pl-7");

interface SavedReport {
  month: number;
  raw: ReportValues;
  updated_at: string | null;
}

export default function FinancialPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [chartData, setChartData] = useState<ChartDatum[]>([]);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const isMountedRef = useRef(false);
  const { companyId, isCompanyLoading } = useCompany();
  const { config, currency: currencyCode, isLoading: isProfileLoading } = useBusinessProfile(companyId);
  const currency = getCurrency(currencyCode);
  const fieldKeys = useMemo(() => formFieldKeys(config), [config]);
  const money = useCallback((value: number) => formatMoney(value, currency.code), [currency.code]);

  const [formData, setFormData] = useState<FormState>(() => emptyForm(ALL_MONTHS[new Date().getMonth()]));

  useEffect(() => {
    if (!isCompanyLoading && !companyId) {
      setIsLoading(false);
      setChartData([]);
    }
  }, [companyId, isCompanyLoading]);

  // Live calculations: used by the summary panel AND when saving, so what you see is what's stored.
  const values = useMemo<ReportValues>(
    () => Object.fromEntries(fieldKeys.map((key) => [key, parseNum(formData[key] ?? "")])),
    [fieldKeys, formData]
  );

  const metrics = useMemo(() => {
    const { revenue: totalRevenue, expenses: totalExpenses, netProfit, margin } = reportTotals(config, values);

    // Previous month's actual revenue from the ledger (not a made-up number).
    const monthIdx = ALL_MONTHS.indexOf(formData.month);
    let prevRevenue: number | null = null;
    for (let i = monthIdx - 1; i >= 0; i--) {
      const row = chartData.find((c) => c.month === ALL_MONTHS[i]);
      if (row) {
        prevRevenue = row.current_val;
        break;
      }
    }
    const revenueGrowth = prevRevenue !== null && prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : null;

    return { totalRevenue, totalExpenses, netProfit, profitMargin: margin ?? 0, prevRevenue, revenueGrowth };
  }, [config, values, formData.month, chartData]);

  const fetchFinanceData = useCallback(async (showLoading = false) => {
    if (!companyId) {
      if (showLoading) setIsLoading(false);
      return;
    }

    try {
      if (showLoading) setIsLoading(true);

      const [chartRes, reportsRes] = await Promise.allSettled([
        withSupabaseTimeout(supabase.from('chart_data').select('*').eq('company_id', companyId).order('sort_order', { ascending: true }), "financial chart_data"),
        withSupabaseTimeout(
          supabase.from('financial_reports').select('month, raw, updated_at').eq('company_id', companyId).eq('year', new Date().getFullYear()),
          "financial reports"
        ),
      ]);

      const firstError =
        (chartRes.status === "fulfilled" && chartRes.value.error) ||
        (chartRes.status === "rejected" && chartRes.reason);
      if (firstError) throw firstError;
      if (!isMountedRef.current) return;

      setChartData(chartRes.status === "fulfilled" ? chartRes.value.data ?? [] : []);
      // financial_reports is optional until its migration has run.
      setSavedReports(reportsRes.status === "fulfilled" && !reportsRes.value.error ? (reportsRes.value.data ?? []) as SavedReport[] : []);
    } catch (error) {
      console.error("Gagal memuat data:", error);
      toast({ title: "Couldn't load financial data", description: "Check your connection and refresh.", variant: "destructive" });
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, [companyId, toast]);

  useSupabaseResumeRecovery({
    enabled: Boolean(companyId),
    onRecover: () => fetchFinanceData(false),
  });

  useEffect(() => {
    isMountedRef.current = true;
    if (!companyId) return;
    fetchFinanceData(true);

    const channel = supabase.channel(`financial-metrics-realtime:${companyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chart_data', filter: `company_id=eq.${companyId}` }, () => fetchFinanceData())
      .subscribe((status, error) => {
        if (status === 'SUBSCRIBED') fetchFinanceData();
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn("[financial realtime] disconnected; save fallback remains active.", { status, error });
        }
      });

    return () => {
      isMountedRef.current = false;
      safeRemoveChannel(channel);
    };
  }, [companyId, fetchFinanceData]);

  const savedForMonth = savedReports.find((r) => r.month === ALL_MONTHS.indexOf(formData.month) + 1);
  const lastSynced = savedReports
    .map((r) => r.updated_at)
    .filter((d): d is string => Boolean(d))
    .sort()
    .at(-1);

  // Picking a month that already has a report loads it, so you can review what you'd replace.
  const selectMonth = (month: string) => {
    const saved = savedReports.find((r) => r.month === ALL_MONTHS.indexOf(month) + 1);
    if (!saved) {
      setFormData(emptyForm(month));
      return;
    }
    setFormData({
      month,
      ...Object.fromEntries(fieldKeys.map((key) => {
        const value = saved.raw?.[key];
        return [key, value ? formatTyped(String(value)) : ""];
      })),
    } as FormState);
  };

  // On first load, open the current month's saved report (if any) unless the user already started typing.
  const prefilledRef = useRef(false);
  useEffect(() => {
    // Wait for the business type, so the right fields get filled in.
    if (prefilledRef.current || savedReports.length === 0 || isProfileLoading) return;
    prefilledRef.current = true;
    if (fieldKeys.every((key) => !formData[key])) selectMonth(formData.month);
    // selectMonth/formData are read once on purpose; later report refreshes must not overwrite edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedReports, isProfileLoading]);

  const handleProcessAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) {
      toast({ title: "Workspace unavailable", description: "Refresh the page and try again.", variant: "destructive" });
      return;
    }

    const typed = fieldKeys.map((key) => (formData[key] ?? "").replace(/,/g, "").trim());

    if (typed.every((v) => v === "")) {
      toast({ title: "Nothing to save", description: "Fill in at least one number before submitting.", variant: "destructive" });
      return;
    }
    if (typed.some((v) => v !== "" && !Number.isFinite(Number(v)))) {
      toast({ title: "Check your numbers", description: "Only digits, commas and a decimal point are allowed.", variant: "destructive" });
      return;
    }
    if (typed.some((v) => v !== "" && Number(v) < 0)) {
      toast({ title: "Negative values aren't allowed", description: "Enter every amount as a positive number; discounts have their own field.", variant: "destructive" });
      return;
    }
    const problem = config.validate?.(values);
    if (problem) {
      toast({ title: "Check your numbers", description: problem, variant: "destructive" });
      return;
    }

    setIsProcessing(true);

    try {
      const { totalRevenue, prevRevenue } = metrics;

      // --- Chart ---
      // previous_val is last month's actual revenue from the ledger, so the comparison line is real data.
      const comparisonVal = prevRevenue ?? totalRevenue;
      const existingMonth = chartData.find(c => c.month === formData.month);
      if (existingMonth) {
        const { error } = await supabase.from('chart_data').update({ current_val: totalRevenue, previous_val: comparisonVal }).eq('company_id', companyId).eq('id', existingMonth.id);
        if (error) throw error;
      } else {
        const chartRes = await supabase.from('chart_data').insert({
          company_id: companyId,
          month: formData.month,
          current_val: totalRevenue,
          previous_val: comparisonVal,
          sort_order: ALL_MONTHS.indexOf(formData.month) + 1
        }).select().maybeSingle();
        if (chartRes.error) throw chartRes.error;
      }

      // --- Raw numbers (financial_reports) ---
      // Analytics reads the breakdowns from here. The form has no year picker yet, so it's the current year.
      const { error: reportError } = await supabase.from('financial_reports').upsert(
        {
          company_id: companyId,
          year: new Date().getFullYear(),
          month: ALL_MONTHS.indexOf(formData.month) + 1,
          raw: values,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "company_id,year,month" }
      );
      // Dashboard and Analytics KPIs are calculated from these raw numbers.
      if (reportError) throw reportError;

      toast({ title: "Report synced", description: `${MONTH_NAMES[ALL_MONTHS.indexOf(formData.month)]} figures are now on the Dashboard.` });
      window.dispatchEvent(new CustomEvent('nexusflow:chart-updated'));
      await fetchFinanceData();
    } catch (error) {
      console.error("Financial save error:", error);
      toast({ title: "Couldn't sync the report", description: "Nothing was changed on the Dashboard. Try again.", variant: "destructive" });
      await fetchFinanceData();
    } finally {
      setIsProcessing(false);
    }
  };

  const monthName = MONTH_NAMES[ALL_MONTHS.indexOf(formData.month)];
  const profitPositive = metrics.netProfit >= 0;
  const showSkeleton = (isCompanyLoading && !companyId) || (Boolean(companyId) && (isLoading || isProfileLoading));
  const liveTiles = config.liveTiles(values, currency.code);

  return (
    <div className="space-y-6 px-4 pb-12 pt-6 sm:px-6 lg:px-8 lg:pt-7">
      <PageHeader
        title="Financial Input"
        description="Enter your raw monthly operational data. The system will auto-calculate KPIs."
        actions={lastSynced && (
          <Badge variant="neutral" className="font-normal">
            <RefreshCw strokeWidth={2} />
            Last synced {new Date(lastSynced).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })}
          </Badge>
        )}
      />

      {showSkeleton ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <Skeleton className="h-[720px] rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      ) : (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          {/* Entry form */}
          <motion.form
            onSubmit={handleProcessAndSave}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden rounded-xl border border-border bg-card shadow-xs"
          >
            <header className="flex flex-wrap items-center gap-3 border-b border-border px-6 py-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-primary-soft text-primary">
                <Calculator className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </span>
              <div className="mr-auto">
                <h2 className="text-card-title text-foreground">Monthly Report Entry</h2>
                <p className="text-caption font-normal text-muted-foreground">
                  {config.label} · amounts in {currency.code}.{" "}
                  <Link to="/settings?tab=workspace" className="rounded-sm text-primary-text underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    Change
                  </Link>
                </p>
              </div>
              <Select value={formData.month} onValueChange={selectMonth}>
                <SelectTrigger className="h-9 w-[160px] justify-start" aria-label="Reporting month">
                  <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_MONTHS.map((m, i) => (
                    <SelectItem key={m} value={m}>{MONTH_NAMES[i]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </header>

            {config.sections.map((section) => (
              <section key={section.title} aria-label={section.title} className="space-y-4 border-b border-border px-6 py-5">
                <h3 className="flex items-center gap-2.5 text-card-title text-foreground">
                  <span className={cn("flex h-6 w-6 items-center justify-center rounded-md", toneClasses[section.tone].soft, toneClasses[section.tone].text)}>
                    <section.icon className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                  {section.title}
                </h3>
                <div className="grid gap-x-3.5 gap-y-4 sm:grid-cols-2">
                  {section.fields.map((field) => (
                    <div key={field.key} className={cn("space-y-1.5", field.wide && "sm:col-span-2")}>
                      <Label htmlFor={field.key}>{field.label}</Label>
                      <div className="relative">
                        {field.money && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-subtle">{currency.symbol}</span>}
                        <Input
                          id={field.key}
                          inputMode="decimal"
                          autoComplete="off"
                          value={formData[field.key] ?? ""}
                          onChange={(e) => setFormData((current) => ({ ...current, [field.key]: e.target.value }))}
                          onBlur={(e) => setFormData((current) => ({ ...current, [field.key]: formatTyped(e.target.value) }))}
                          placeholder="0"
                          aria-describedby={field.hint ? `${field.key}-hint` : undefined}
                          className={cn("tabular", field.money && symbolPadding(currency.symbol))}
                        />
                      </div>
                      {field.hint && <p id={`${field.key}-hint`} className="text-caption font-normal text-muted-foreground">{field.hint}</p>}
                    </div>
                  ))}
                </div>
              </section>
            ))}

            <footer className="flex flex-wrap items-center gap-3 bg-surface-2 px-6 py-4">
              <p className="mr-auto max-w-[300px] text-caption font-normal text-muted-foreground">
                {savedForMonth
                  ? `Submitting replaces the report already saved for ${monthName}.`
                  : `No report saved for ${monthName} yet.`}
              </p>
              <Button type="button" variant="ghost" onClick={() => setFormData(emptyForm(formData.month))} disabled={isProcessing}>
                Reset
              </Button>
              <Button type="submit" loading={isProcessing}>
                {!isProcessing && <Save strokeWidth={1.75} />} Process & Sync to Dashboard
              </Button>
            </footer>
          </motion.form>

          <div className="space-y-5">
            {/* Live summary */}
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: 0.04 }}
              aria-label="Calculated summary"
              className="space-y-3.5 rounded-xl border border-border bg-card p-5 shadow-xs"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-card-title text-foreground">Calculated Summary — {monthName}</h2>
                <Badge variant="success" size="sm"><span className="h-1.5 w-1.5 rounded-full bg-success" /> Live</Badge>
              </div>

              <div className={cn("rounded-[10px] px-4 py-4", profitPositive ? "bg-success-soft" : "bg-destructive-soft")}>
                <p className={cn("text-label", profitPositive ? "text-success" : "text-destructive")}>Net Profit</p>
                <p className="mt-1 text-[36px] font-bold leading-[42px] tracking-[-0.03em] text-foreground tabular sm:text-[40px] sm:leading-[46px]">
                  {money(metrics.netProfit)}
                </p>
                <p className={cn("mt-1 text-small", profitPositive ? "text-success" : "text-destructive")}>
                  {metrics.profitMargin.toFixed(1)}% profit margin
                </p>
              </div>

              <dl className="grid grid-cols-2 gap-2.5">
                {[
                  { label: "Total Revenue", value: money(metrics.totalRevenue) },
                  { label: "Total Expenses", value: money(metrics.totalExpenses) },
                  ...liveTiles.map((tile) => ({
                    label: tile.label,
                    value: tile.value,
                    tone: tile.tone === "positive" ? "text-success" : tile.tone === "negative" ? "text-destructive" : undefined,
                  })),
                ].map((tile: { label: string; value: string; tone?: string }) => (
                  <div key={tile.label} className="rounded-[10px] border border-border px-3 py-2.5">
                    <dt className="text-caption font-normal text-muted-foreground">{tile.label}</dt>
                    <dd className={cn("text-[17px] font-semibold leading-6 text-foreground tabular", tile.tone)}>{tile.value}</dd>
                  </div>
                ))}
              </dl>

              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-[10px] bg-surface-2 px-3 py-2.5 text-small text-muted-foreground">
                {metrics.revenueGrowth !== null && metrics.revenueGrowth < 0
                  ? <TrendingDown className="h-4 w-4 text-destructive" strokeWidth={1.75} />
                  : <TrendingUp className="h-4 w-4 text-success" strokeWidth={1.75} />}
                Growth vs previous month
                <span
                  className={cn(
                    "ml-auto font-semibold tabular",
                    metrics.revenueGrowth === null ? "text-muted-foreground" : metrics.revenueGrowth >= 0 ? "text-success" : "text-destructive"
                  )}
                >
                  {metrics.revenueGrowth === null
                    ? "No earlier month"
                    : `${metrics.revenueGrowth >= 0 ? "+" : ""}${metrics.revenueGrowth.toFixed(1)}% (prev ${money(metrics.prevRevenue ?? 0)})`}
                </span>
              </p>
            </motion.section>

            {/* Ledger */}
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: 0.08 }}
              aria-label="Annual ledger"
              className="overflow-hidden rounded-xl border border-border bg-card shadow-xs"
            >
              <header className="flex items-center gap-3 px-5 py-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-muted-foreground">
                  <Receipt className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <h2 className="mr-auto text-card-title text-foreground">Annual Ledger</h2>
                {chartData.length > 0 && (
                  <Badge size="sm"><Check strokeWidth={2.5} /> Synced with Chart</Badge>
                )}
              </header>

              {chartData.length === 0 ? (
                <EmptyState icon={Receipt} title="No financial data recorded yet" description="Submit a monthly report to start tracking." className="border-t border-border py-10" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-small">
                    <thead className="border-y border-border bg-surface-2 text-caption font-semibold uppercase tracking-[0.04em] text-muted-foreground">
                      <tr>
                        <th scope="col" className="py-2.5 pl-5 pr-3">Month</th>
                        <th scope="col" className="px-3 py-2.5">Actual</th>
                        <th scope="col" className="px-3 py-2.5">Target / Prev</th>
                        <th scope="col" className="py-2.5 pl-3 pr-5">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.map((row) => {
                        const isUp = Number(row.current_val) >= Number(row.previous_val);
                        return (
                          <tr key={row.id} className={cn("border-b border-border last:border-b-0", row.month === formData.month && "bg-primary-soft/50")}>
                            <td className="py-3 pl-5 pr-3 text-foreground">{row.month}</td>
                            <td className="px-3 py-3 text-foreground tabular">{money(Number(row.current_val) || 0)}</td>
                            <td className="px-3 py-3 text-foreground tabular">{money(Number(row.previous_val) || 0)}</td>
                            <td className="py-3 pl-3 pr-5">
                              {isUp ? (
                                <Badge variant="success" size="sm"><TrendingUp strokeWidth={2.25} /> Hit</Badge>
                              ) : (
                                <Badge variant="destructive" size="sm"><TrendingDown strokeWidth={2.25} /> Miss</Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.section>
          </div>
        </div>
      )}
    </div>
  );
}
