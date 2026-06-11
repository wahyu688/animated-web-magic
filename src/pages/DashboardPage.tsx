import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { TrendingUp, TrendingDown, Users, DollarSign, Clock, BarChart3, ArrowUpRight, Minus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useCompany } from "@/hooks/use-company";
import { safeRemoveChannel, withSupabaseTimeout } from "@/lib/supabaseLifecycle";
import { useSupabaseResumeRecovery } from "@/hooks/use-supabase-resume-recovery";
import { useAuth } from "@/contexts/AuthContext";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: "easeOut"
    }
  })
} as Variants;

interface ChartDatum {
  id: string;
  month: string;
  current_val: number;
  previous_val: number;
  sort_order?: number;
}

interface ChartPoint {
  cx: number;
  cy: number;
  val: number;
  label: string;
}

interface TopPage {
  id: string;
  name: string;
  views: number;
  unique_views: number;
  bounce: string;
  trend: string;
}

interface TrafficSource {
  id: string;
  name: string;
  pct: number;
  color: string;
}

// --- FUNGSI MATEMATIKA BEZIER CURVE ---
const generateSmoothPath = (data: ChartDatum[], key: "current_val" | "previous_val", width: number, height: number, maxVal: number) => {
  if (!data || data.length === 0) return { path: "", points: [] };
  
  const xStep = width / (data.length - 1 || 1);
  let path = "";
  const points: ChartPoint[] = [];

  data.forEach((d, i) => {
    const x = i * xStep;
    const value = Number(d[key]) || 0;

    const y =
      height -
      (value / maxVal) * (height * 0.75);
    
    points.push({ cx: x, cy: y, val: d[key], label: d.month });

    if (i === 0) {
      path += `M${x},${y}`;
    } else {
      const prevX = (i - 1) * xStep;
      const prevY = height - (data[i - 1][key] / maxVal) * (height * 0.85);
      const cpX1 = prevX + xStep / 2;
      const cpX2 = x - xStep / 2;
      path += ` C${cpX1},${prevY} ${cpX2},${y} ${x},${y}`;
    }
  });

  return { path, points };
};

export default function DashboardPage() {
  const [activeRange, setActiveRange] = useState("1Y");
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  
  // State Data Dinamis dari Supabase
  const [kpiData, setKpiData] = useState({ 
    revenue: "$0", revenue_change: "0%", revenue_trend: "stable",
    users: "0", users_change: "0%", users_trend: "stable",
    session: "0", session_change: "0%", session_trend: "stable",
    churn: "0%", churn_change: "0%", churn_trend: "stable" 
  });
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [trafficSources, setTrafficSources] = useState<TrafficSource[]>([]);
  const [chartRawData, setChartRawData] = useState<ChartDatum[]>([]);
  const [isLoadingDB, setIsLoadingDB] = useState(true);
  const isMountedRef = useRef(false);
  const fetchRequestIdRef = useRef(0);

  const { toast } = useToast();
  const navigate = useNavigate();
  const { companyId, isCompanyLoading, companyError } = useCompany();
  const { user, isAuthLoading } = useAuth();

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
      const [pagesRes, trafficRes, kpiRes, chartRes] = await Promise.allSettled([
        withSupabaseTimeout(supabase.from('top_pages').select('*').eq('company_id', companyId).order('views', { ascending: false }), "dashboard top_pages"),
        withSupabaseTimeout(supabase.from('traffic_sources').select('*').eq('company_id', companyId).order('pct', { ascending: false }), "dashboard traffic_sources"),
        withSupabaseTimeout(supabase.from('dashboard_kpis').select('*').eq('company_id', companyId).limit(1).maybeSingle(), "dashboard dashboard_kpis"),
        withSupabaseTimeout(supabase.from('chart_data').select('*').eq('company_id', companyId).order('sort_order', { ascending: true }), "dashboard chart_data")
      ]);

      const firstError =
        (pagesRes.status === "fulfilled" && pagesRes.value.error) ||
        (trafficRes.status === "fulfilled" && trafficRes.value.error) ||
        (kpiRes.status === "fulfilled" && kpiRes.value.error) ||
        (chartRes.status === "fulfilled" && chartRes.value.error) ||
        (pagesRes.status === "rejected" && pagesRes.reason) ||
        (trafficRes.status === "rejected" && trafficRes.reason) ||
        (kpiRes.status === "rejected" && kpiRes.reason) ||
        (chartRes.status === "rejected" && chartRes.reason);
      if (firstError) throw firstError;
      if (!isMountedRef.current) return;

      setTopPages(pagesRes.status === "fulfilled" ? pagesRes.value.data ?? [] : []);
      setTrafficSources(trafficRes.status === "fulfilled" ? trafficRes.value.data ?? [] : []);
      const kpi = kpiRes.status === "fulfilled" ? kpiRes.value.data : null;
      if (kpi) {
        setKpiData({
          revenue: kpi.total_revenue || "$0", 
          revenue_change: kpi.revenue_change || "0%", 
          revenue_trend: kpi.revenue_trend || "stable",
          users: kpi.active_users || "0", 
          users_change: kpi.users_change || "0%", 
          users_trend: kpi.users_trend || "stable",
          session: kpi.avg_session || "0", 
          session_change: kpi.session_change || "0%", 
          session_trend: kpi.session_trend || "stable",
          churn: kpi.churn_rate || "0%", 
          churn_change: kpi.churn_change || "0%", 
          churn_trend: kpi.churn_trend || "stable"
        });
      }
      setChartRawData(chartRes.status === "fulfilled" ? chartRes.value.data ?? [] : []);
    } catch (error) {
      console.error("Gagal menarik data:", error);
      toast({ title: "Fetch Error", description: "Gagal memuat data dashboard.", variant: "destructive" });
    } finally {
      if (isMountedRef.current && (showLoading || requestId === fetchRequestIdRef.current)) setIsLoadingDB(false);
    }
  }, [companyId, navigate, toast]);

  useSupabaseResumeRecovery({
    enabled: Boolean(companyId),
    onRecover: () => fetchDashboardInfo(false),
  });

  // 2. Fetch Data & Real-Time Listener
  useEffect(() => {
    const handler = () => fetchDashboardInfo();
    window.addEventListener('nexusflow:chart-updated', handler);
    return () => window.removeEventListener('nexusflow:chart-updated', handler);
  }, [fetchDashboardInfo]);

  useEffect(() => {
    if (!user || !companyId) return;
    isMountedRef.current = true;
    fetchDashboardInfo(true);

    const channel = supabase.channel(`dashboard-metrics-realtime:${companyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'traffic_sources', filter: `company_id=eq.${companyId}` }, () => fetchDashboardInfo())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'top_pages', filter: `company_id=eq.${companyId}` }, () => fetchDashboardInfo())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dashboard_kpis', filter: `company_id=eq.${companyId}` }, () => fetchDashboardInfo())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chart_data', filter: `company_id=eq.${companyId}` }, () => fetchDashboardInfo())
      .subscribe((status, error) => {
        console.info("[dashboard realtime] status:", status, error ?? "");
        if (status === 'SUBSCRIBED') fetchDashboardInfo();
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn("[dashboard realtime] disconnected; fetch fallback remains active.", { status, error });
        }
      });

    return () => {
      isMountedRef.current = false;
      safeRemoveChannel(channel);
    };
  }, [companyId, user, fetchDashboardInfo]);

  // --- MENGHITUNG KORDINAT SVG ---
  const maxChartValue = Math.max(
    ...chartRawData.map(d =>
      Math.max(
        Number(d.current_val) || 0,
        Number(d.previous_val) || 0
      )
    ),
    100
  );

  const width = 1200;
  const height = 280;

  const currentYearGraph = generateSmoothPath(chartRawData, 'current_val', width, height, maxChartValue);
  const previousYearGraph = generateSmoothPath(chartRawData, 'previous_val', width, height, maxChartValue);

  const displayStats = [
    { label: "Total Revenue", value: kpiData.revenue, change: kpiData.revenue_change, trend: kpiData.revenue_trend, icon: DollarSign, color: "text-primary" },
    { label: "Active Users", value: kpiData.users, change: kpiData.users_change, trend: kpiData.users_trend, icon: Users, color: "text-info" },
    { label: "Avg. Session", value: kpiData.session, change: kpiData.session_change, trend: kpiData.session_trend, icon: Clock, color: "text-warning" },
    { label: "Churn Rate", value: kpiData.churn, change: kpiData.churn_change, trend: kpiData.churn_trend, icon: BarChart3, color: "text-muted-foreground" },
  ];

  if (isAuthLoading || !user || (isCompanyLoading && !companyId)) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-6 lg:p-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, <span className="text-primary font-medium">{user.email || "User"}</span>. Monitor your key metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-primary-glow hover:opacity-90 transition-opacity">
            <ArrowUpRight className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayStats.map((stat, i) => (
          <motion.div key={stat.label} custom={i} variants={cardVariants} initial="hidden" animate="visible" className="group relative overflow-hidden rounded-2xl bg-card border border-border p-6 shadow-card hover:shadow-card-hover transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-300">
              <stat.icon className={`h-16 w-16 ${stat.color}`} />
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
            
            {isLoadingDB ? (
              <div className="h-9 w-24 bg-muted animate-pulse rounded mt-1"></div>
            ) : (
              <h3 className="text-3xl font-bold text-foreground tracking-tight">{stat.value}</h3>
            )}

            <div className="flex items-center mt-4">
              <span className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full transition-colors ${
                stat.trend === "up" ? "text-success bg-success/10" : stat.trend === "down" ? "text-destructive bg-destructive/10" : "text-muted-foreground bg-muted"
              }`}>
                {stat.trend === "up" ? <TrendingUp className="h-3 w-3 mr-0.5" /> : stat.trend === "down" ? <TrendingDown className="h-3 w-3 mr-0.5" /> : <Minus className="h-3 w-3 mr-0.5" />}
                {stat.change}
              </span>
              <span className="text-xs text-muted-foreground ml-2">vs prev. period</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart + Traffic */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Revenue Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-card p-6 lg:p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-lg font-bold text-foreground">Revenue Growth</h2>
              <p className="text-sm text-muted-foreground">Income trends across all channels.</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <span className="h-3 w-3 rounded-full bg-primary mr-2" />
                <span className="text-xs font-medium text-muted-foreground">Current</span>
              </div>
              <div className="flex items-center">
                <span className="h-3 w-3 rounded-full bg-border mr-2" />
                <span className="text-xs font-medium text-muted-foreground">Previous</span>
              </div>
            </div>
          </div>
          
          {isLoadingDB ? (
            <div className="flex justify-center items-center h-[280px]">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : chartRawData.length === 0 ? (
            <div className="flex justify-center items-center h-[280px] text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">
              Tidak ada data grafik. Silakan isi di menu Financial.
            </div>
          ) : (
            <div className="relative w-full h-[280px]">
              <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="areaGradDashboard" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: "hsl(222 80% 45%)", stopOpacity: 0.2 }} />
                    <stop offset="100%" style={{ stopColor: "hsl(222 80% 45%)", stopOpacity: 0 }} />
                  </linearGradient>
                </defs>
                
                {[0, 70, 140, 210, 280].map((y) => (
                  <line key={`line-${y}`} x1="0" y1={y} x2="1200" y2={y} stroke="hsl(214 20% 92%)" strokeWidth="1" />
                ))}
                
                {previousYearGraph.path && (
                  <motion.path d={previousYearGraph.path} fill="none" stroke="hsl(214 20% 85%)" strokeWidth="2" strokeDasharray="6,6" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5 }} />
                )}
                
                {currentYearGraph.path && (
                  <>
                    <path d={`${currentYearGraph.path} V${height} H0 Z`} fill="url(#areaGradDashboard)" />
                    <motion.path d={currentYearGraph.path} fill="none" stroke="hsl(222 80% 45%)" strokeWidth="3" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: "easeInOut" }} />
                  </>
                )}

                {currentYearGraph.points.map((pt, index) => (
                  <g key={index} onMouseEnter={() => setHoveredPoint(index)} onMouseLeave={() => setHoveredPoint(null)} className="cursor-pointer">
                    <circle cx={pt.cx} cy={pt.cy} r={hoveredPoint === index ? "8" : "0"} fill="hsl(222 80% 45%)" stroke="white" strokeWidth="3" className="transition-all duration-200" />
                    
                    {hoveredPoint === index && (
                      <g>
                        <rect x={pt.cx - 45} y={pt.cy - 45} width="90" height="35" rx="6" fill="#0f172a" />
                        <text x={pt.cx} y={pt.cy - 22} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                          ${pt.val.toLocaleString()}
                        </text>
                      </g>
                    )}
                  </g>
                ))}
              </svg>
              
              <div className="flex justify-between mt-2 text-xs font-medium text-muted-foreground px-2">
                {chartRawData.map((d) => <span key={d.id}>{d.month}</span>)}
              </div>
            </div>
          )}
        </motion.div>

        {/* Traffic Sources */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card rounded-2xl border border-border shadow-card p-6">
          <h2 className="text-lg font-bold text-foreground mb-6">Traffic Sources</h2>
          {isLoadingDB ? (
            <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : trafficSources.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center mt-10">Data kosong</p>
          ) : (
            <div className="space-y-5">
              {trafficSources.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1 }}>
                  <div className="flex justify-between text-xs font-medium mb-1.5">
                    <span className="text-muted-foreground">{s.name}</span>
                    <span className="text-foreground">{s.pct}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Number(s.pct) || 0}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-2.5 rounded-full ${s.color || "bg-primary"}`}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Top Pages Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Top Performing Pages</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="px-6 py-4">Page</th>
                <th className="px-6 py-4">Views</th>
                <th className="px-6 py-4">Unique</th>
                <th className="px-6 py-4">Bounce Rate</th>
                <th className="px-6 py-4 text-right">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoadingDB ? (
                 <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /></td></tr>
              ) : topPages.length === 0 ? (
                 <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground text-sm">Belum ada data Top Pages.</td></tr>
              ) : topPages.map((page) => (
                <tr key={page.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground font-mono text-sm">{page.name}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{page.views}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{page.unique_views}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{page.bounce}</td>
                  <td className="px-6 py-4 text-right">
                    {page.trend === "up" ? <TrendingUp className="h-4 w-4 text-success inline" /> : <TrendingDown className="h-4 w-4 text-destructive inline" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
