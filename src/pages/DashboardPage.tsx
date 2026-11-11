import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, ArrowUpRight, BarChart3, CalendarDays, FileText, Loader2, SquareKanban,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../lib/supabase";
import { useCompany } from "@/hooks/use-company";
import { useWorkspaceSummary } from "@/hooks/use-workspace-summary";
import { useFinancialReports } from "@/hooks/use-financial-reports";
import { useBusinessProfile } from "@/hooks/use-business-profile";
import { safeRemoveChannel, withSupabaseTimeout } from "@/lib/supabaseLifecycle";
import { useSupabaseResumeRecovery } from "@/hooks/use-supabase-resume-recovery";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import PageHeader from "@/components/app/PageHeader";
import StatCard from "@/components/app/StatCard";
import EmptyState from "@/components/app/EmptyState";
import RevenueChart from "@/components/app/RevenueChart";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toneClasses, toneFromClass, type Tone } from "@/lib/tones";
import { cn } from "@/lib/utils";

interface ChartDatum {
  id: string;
  month: string;
  current_val: number;
  previous_val: number;
  sort_order?: number;
}

interface TopPage {
  id: string;
  page: string;
  views: number;
}

interface TrafficSource {
  id: string;
  name: string;
  pct: number;
  color: string;
}

interface UpcomingEvent {
  id: string;
  title: string;
  time: string;
  duration: number | null;
  color: string | null;
}

// Column order and colors match the Project Board page.
const boardColumns: { id: string; title: string; tone: Tone }[] = [
  { id: "backlog", title: "Backlog", tone: "neutral" },
  { id: "todo", title: "To Do", tone: "warning" },
  { id: "progress", title: "In Progress", tone: "primary" },
  { id: "review", title: "Review", tone: "violet" },
  { id: "done", title: "Done", tone: "success" },
];

// Fallback order for traffic sources that have no stored color.
const trafficTones: Tone[] = ["primary", "info", "violet", "warning", "success"];

const cardMotion = (index: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, delay: index * 0.04, ease: "easeOut" },
}) as const;

function todayDateStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDuration(hours: number | null) {
  if (!hours) return null;
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} hr`;
}

function csvEscape(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export default function DashboardPage() {
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [trafficSources, setTrafficSources] = useState<TrafficSource[]>([]);
  const [chartRawData, setChartRawData] = useState<ChartDatum[]>([]);
  const [columnCounts, setColumnCounts] = useState<Record<string, number>>({});
  const [upcoming, setUpcoming] = useState<UpcomingEvent[]>([]);
  const [isLoadingDB, setIsLoadingDB] = useState(true);
  const isMountedRef = useRef(false);
  const fetchRequestIdRef = useRef(0);

  const { toast } = useToast();
  const navigate = useNavigate();
  const { companyId, isCompanyLoading } = useCompany();
  const { user, isAuthLoading } = useAuth();
  const workspace = useWorkspaceSummary(companyId);
  const { reports, isLoading: isLoadingReports } = useFinancialReports(companyId);
  const { config, currency, isLoading: isProfileLoading } = useBusinessProfile(companyId);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isCompanyLoading && !companyId) {
      setIsLoadingDB(false);
      setTopPages([]);
      setTrafficSources([]);
      setChartRawData([]);
    }
  }, [companyId, isCompanyLoading]);

  const fetchDashboardInfo = useCallback(async (showLoading = false) => {
    if (!companyId) {
      if (showLoading) setIsLoadingDB(false);
      navigate("/subscription", { replace: true });
      return;
    }
    const requestId = showLoading
      ? ++fetchRequestIdRef.current
      : fetchRequestIdRef.current;

    try {
      if (showLoading) setIsLoadingDB(true);
      const [pagesRes, trafficRes, chartRes] = await Promise.allSettled([
        withSupabaseTimeout(supabase.from('top_pages').select('*').eq('company_id', companyId).order('views', { ascending: false }), "dashboard top_pages"),
        withSupabaseTimeout(supabase.from('traffic_sources').select('*').eq('company_id', companyId).order('pct', { ascending: false }), "dashboard traffic_sources"),
        withSupabaseTimeout(supabase.from('chart_data').select('*').eq('company_id', companyId).order('sort_order', { ascending: true }), "dashboard chart_data")
      ]);

      const firstError =
        (pagesRes.status === "fulfilled" && pagesRes.value.error) ||
        (trafficRes.status === "fulfilled" && trafficRes.value.error) ||
        (chartRes.status === "fulfilled" && chartRes.value.error) ||
        (pagesRes.status === "rejected" && pagesRes.reason) ||
        (trafficRes.status === "rejected" && trafficRes.reason) ||
        (chartRes.status === "rejected" && chartRes.reason);
      if (firstError) throw firstError;
      if (!isMountedRef.current) return;

      setTopPages(pagesRes.status === "fulfilled" ? pagesRes.value.data ?? [] : []);
      setTrafficSources(trafficRes.status === "fulfilled" ? trafficRes.value.data ?? [] : []);
      setChartRawData(chartRes.status === "fulfilled" ? chartRes.value.data ?? [] : []);
    } catch (error) {
      console.error("Gagal menarik data:", error);
      toast({ title: "Couldn't load the dashboard", description: "Some figures may be out of date. Try refreshing.", variant: "destructive" });
    } finally {
      if (isMountedRef.current && (showLoading || requestId === fetchRequestIdRef.current)) setIsLoadingDB(false);
    }
  }, [companyId, navigate, toast]);

  // Board snapshot and today's events. Failures here only hide those two cards' data.
  const fetchWorkSnapshot = useCallback(async () => {
    if (!companyId) return;

    const [tasksRes, eventsRes] = await Promise.allSettled([
      withSupabaseTimeout(supabase.from("kanban_tasks").select("column_id").eq("company_id", companyId), "dashboard kanban counts"),
      withSupabaseTimeout(
        supabase
          .from("calendar_events")
          .select("id, title, time, duration, color")
          .eq("company_id", companyId)
          .eq("date_str", todayDateStr())
          .order("time", { ascending: true })
          .limit(4),
        "dashboard upcoming events"
      ),
    ]);
    if (!isMountedRef.current) return;

    if (tasksRes.status === "fulfilled" && !tasksRes.value.error) {
      const counts: Record<string, number> = {};
      for (const task of tasksRes.value.data ?? []) {
        counts[task.column_id] = (counts[task.column_id] ?? 0) + 1;
      }
      setColumnCounts(counts);
    }
    if (eventsRes.status === "fulfilled" && !eventsRes.value.error) {
      setUpcoming(eventsRes.value.data ?? []);
    }
  }, [companyId]);

  useSupabaseResumeRecovery({
    enabled: Boolean(companyId),
    onRecover: () => {
      void fetchDashboardInfo(false);
      void fetchWorkSnapshot();
    },
  });

  useEffect(() => {
    const handler = () => fetchDashboardInfo();
    window.addEventListener('nexusflow:chart-updated', handler);
    return () => window.removeEventListener('nexusflow:chart-updated', handler);
  }, [fetchDashboardInfo]);

  // Keyed on the user id: a token refresh (e.g. after alt-tab) creates a new user object
  // and must not reload the page with skeletons.
  const userId = user?.id;
  useEffect(() => {
    if (!userId || !companyId) return;
    isMountedRef.current = true;
    fetchDashboardInfo(true);
    fetchWorkSnapshot();

    const channel = supabase.channel(`dashboard-metrics-realtime:${companyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'traffic_sources', filter: `company_id=eq.${companyId}` }, () => fetchDashboardInfo())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'top_pages', filter: `company_id=eq.${companyId}` }, () => fetchDashboardInfo())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chart_data', filter: `company_id=eq.${companyId}` }, () => fetchDashboardInfo())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kanban_tasks', filter: `company_id=eq.${companyId}` }, () => fetchWorkSnapshot())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events', filter: `company_id=eq.${companyId}` }, () => fetchWorkSnapshot())
      .subscribe((status, error) => {
        if (status === 'SUBSCRIBED') fetchDashboardInfo();
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn("[dashboard realtime] disconnected; fetch fallback remains active.", { status, error });
        }
      });

    return () => {
      isMountedRef.current = false;
      safeRemoveChannel(channel);
    };
  }, [companyId, userId, fetchDashboardInfo, fetchWorkSnapshot]);

  const chartData = chartRawData.map((d) => ({
    month: d.month,
    current: Number(d.current_val) || 0,
    previous: Number(d.previous_val) || 0,
  }));

  const displayStats = config.kpis(reports, currency);

  const totalTasks = boardColumns.reduce((sum, column) => sum + (columnCounts[column.id] ?? 0), 0);

  const handleExport = () => {
    const rows: (string | number)[][] = [
      ["Section", "Label", "Value", "Change / Previous"],
      ...displayStats.map((stat) => ["KPI", stat.label, stat.value, stat.change]),
      ...chartData.map((point) => ["Revenue", point.month, point.current, point.previous]),
      ...trafficSources.map((source) => ["Traffic source", source.name, `${source.pct}%`, ""]),
      ...topPages.map((page) => ["Top page", page.page, page.views, ""]),
    ];
    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `nexusflow-dashboard-${todayDateStr()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ variant: "info", title: "Exporting report", description: "Your CSV is downloading." });
  };

  if (isAuthLoading || !user || (isCompanyLoading && !companyId)) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const workspaceName = workspace?.name;
  const todayLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="space-y-4 px-4 pb-12 pt-6 sm:space-y-6 sm:px-6 lg:px-8 lg:pt-7">
      <PageHeader
        title="Dashboard"
        description={
          <>
            Welcome back, <b className="font-semibold text-foreground">{user.email}</b>.
            {workspaceName && <span className="hidden sm:inline"> Here's how {workspaceName} is doing this month.</span>}
          </>
        }
        actions={
          <Button variant="secondary" onClick={handleExport} disabled={isLoadingDB}>
            Export <ArrowUpRight />
          </Button>
        }
      />

      {/* KPIs */}
      <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {displayStats.map((stat, index) => (
          <motion.div key={stat.label} {...cardMotion(index)}>
            <StatCard {...stat} loading={isLoadingReports || isProfileLoading} />
          </motion.div>
        ))}
      </section>

      {/* Revenue + traffic */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_378px]">
        <motion.div {...cardMotion(4)}>
          <Card className="h-full">
            <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 pb-[18px]">
              <div className="space-y-0.5">
                <CardTitle>Revenue Growth</CardTitle>
                <CardDescription>Income trends across all channels.</CardDescription>
              </div>
              <ul className="flex shrink-0 items-center gap-4 pt-1 text-caption font-normal text-muted-foreground" aria-label="Legend">
                <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-primary" />Current</li>
                <li className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-[#a9b1be] dark:border-[#4a566b]" />Previous</li>
              </ul>
            </CardHeader>
            <div className="px-3 pb-4 sm:px-5 sm:pb-5">
              {isLoadingDB ? (
                <Skeleton className="h-[268px] w-full rounded-lg" />
              ) : chartData.length === 0 ? (
                <EmptyState
                  icon={BarChart3}
                  title="No chart data yet"
                  description="Add your first monthly report in Financial and the chart fills in."
                  action={<Button asChild variant="secondary" size="sm"><Link to="/financial">Open Financial</Link></Button>}
                  className="h-[268px]"
                />
              ) : (
                // Phones show the last 6 months so the month labels stay readable.
                <RevenueChart data={isMobile ? chartData.slice(-6) : chartData} currency={currency} />
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div {...cardMotion(5)}>
          <Card className="h-full">
            <CardHeader className="pb-[18px]">
              <CardTitle>Traffic Sources</CardTitle>
              <CardDescription>Where this month's visitors came from.</CardDescription>
            </CardHeader>
            <div className="px-5 pb-5">
              {isLoadingDB ? (
                <div className="space-y-[18px]">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
              ) : trafficSources.length === 0 ? (
                <p className="py-10 text-center text-small text-muted-foreground">No traffic data yet.</p>
              ) : (
                <ul className="space-y-[18px]">
                  {trafficSources.map((source, index) => {
                    const tone = toneFromClass(source.color, trafficTones[index % trafficTones.length]);
                    const pct = Math.max(0, Math.min(100, Number(source.pct) || 0));
                    return (
                      <li key={source.id} className="space-y-2">
                        <div className="flex items-center gap-2 text-small">
                          <span className={cn("h-2 w-2 shrink-0 rounded-[2px]", toneClasses[tone].solid)} aria-hidden="true" />
                          <span className="flex-1 truncate text-foreground">{source.name}</span>
                          <span className="font-semibold text-foreground tabular">{pct}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-track">
                          <motion.div
                            className={cn("h-full rounded-full", toneClasses[tone].solid)}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Pages, board, up next */}
      <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
        <motion.div {...cardMotion(6)}>
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle>Top Performing Pages</CardTitle>
              <CardDescription>Views in the last 30 days.</CardDescription>
            </CardHeader>
            {isLoadingDB ? (
              <div className="space-y-3 px-5 pb-5">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
              </div>
            ) : topPages.length === 0 ? (
              <EmptyState icon={FileText} title="No page data yet" description="Page views show up here once they're recorded." />
            ) : (
              <ol className="divide-y divide-border border-t border-border">
                {topPages.slice(0, 5).map((page, index) => (
                  <li key={page.id} className="flex items-center gap-3 px-5 py-3 text-small">
                    <span className="w-3 text-subtle tabular">{index + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-foreground">{page.page}</span>
                    <span className="font-semibold text-foreground tabular">{Number(page.views).toLocaleString("en-US")}</span>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </motion.div>

        <motion.div {...cardMotion(7)}>
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 pb-[18px]">
              <div className="space-y-0.5">
                <CardTitle>Project Board</CardTitle>
                <CardDescription>
                  {totalTasks} {totalTasks === 1 ? "task" : "tasks"} across {boardColumns.length} columns.
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="-mr-2">
                <Link to="/kanban">Open <ArrowRight /></Link>
              </Button>
            </CardHeader>
            <div className="space-y-4 px-5 pb-5">
              <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-track" aria-hidden="true">
                {totalTasks > 0 &&
                  boardColumns.map((column) => {
                    const count = columnCounts[column.id] ?? 0;
                    if (!count) return null;
                    return (
                      <span
                        key={column.id}
                        className={cn("h-full first:rounded-l-full last:rounded-r-full", toneClasses[column.tone].solid)}
                        style={{ width: `${(count / totalTasks) * 100}%` }}
                      />
                    );
                  })}
              </div>
              <ul className="space-y-2.5">
                {boardColumns.map((column) => (
                  <li key={column.id} className="flex items-center gap-2.5 text-small">
                    <span className={cn("h-2 w-2 rounded-[2px]", toneClasses[column.tone].solid)} aria-hidden="true" />
                    <span className="flex-1 text-foreground">{column.title}</span>
                    <span className="font-semibold text-foreground tabular">{columnCounts[column.id] ?? 0}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </motion.div>

        <motion.div {...cardMotion(8)} className="md:col-span-2 xl:col-span-1">
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 pb-3.5">
              <div className="space-y-0.5">
                <CardTitle>Up Next</CardTitle>
                <CardDescription>{todayLabel}</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="-mr-2">
                <Link to="/calendar">Calendar <ArrowRight /></Link>
              </Button>
            </CardHeader>
            <div className="px-5 pb-5">
              {upcoming.length === 0 ? (
                <EmptyState icon={CalendarDays} title="Nothing scheduled today" description="Events you add to the calendar for today show up here." className="py-6" />
              ) : (
                <ul className="space-y-3.5">
                  {upcoming.map((event) => {
                    const tone = toneFromClass(event.color);
                    const duration = formatDuration(event.duration);
                    return (
                      <li key={event.id} className="rounded-lg bg-surface-2 py-2.5 pl-3 pr-3">
                        <div className={cn("border-l-[3px] pl-2.5", toneClasses[tone].border)}>
                          <p className="truncate text-label text-foreground">{event.title}</p>
                          <p className="text-caption font-normal text-muted-foreground tabular">
                            {event.time}{duration ? ` · ${duration}` : ""}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
