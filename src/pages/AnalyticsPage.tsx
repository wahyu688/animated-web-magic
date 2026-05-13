import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, Variants } from "framer-motion";
import { TrendingUp, TrendingDown, Users, DollarSign, Clock, BarChart3, Download, Minus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useCompany } from "@/hooks/use-company";
import { safeRemoveChannel, withSupabaseTimeout } from "@/lib/supabaseLifecycle";
import { useSupabaseResumeRecovery } from "@/hooks/use-supabase-resume-recovery";


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

// --- FUNGSI MATEMATIKA: MENGUBAH DATA JADI GARIS LENGKUNG (BEZIER) ---
const generateSmoothPath = (data: ChartDatum[], key: "current_val" | "previous_val", width: number, height: number, maxVal: number) => {
  if (!data || data.length === 0) return { path: "", points: [] };
  
  const xStep = width / (data.length - 1 || 1);
  let path = "";
  const points: ChartPoint[] = [];

  data.forEach((d, i) => {
    const x = i * xStep;
    // Hitung posisi Y (dibalik karena Y di SVG dimulai dari atas ke bawah)
    // Dikalikan 0.85 agar grafik tidak menyentuh atap (ada padding 15%)
    const y = height - (d[key] / maxVal) * (height * 0.85); 
    
    points.push({ cx: x, cy: y, val: d[key], label: d.month });

    if (i === 0) {
      path += `M${x},${y}`;
    } else {
      const prevX = (i - 1) * xStep;
      const prevY = height - (data[i - 1][key] / maxVal) * (height * 0.85);
      // Titik kontrol Bezier untuk membuat lengkungan mulus
      const cpX1 = prevX + xStep / 2;
      const cpX2 = x - xStep / 2;
      path += ` C${cpX1},${prevY} ${cpX2},${y} ${x},${y}`;
    }
  });

  return { path, points };
};

export default function AnalyticsPage() {
  const [activeRange, setActiveRange] = useState("1Y");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  
  const [kpiData, setKpiData] = useState({ 
      revenue: "$0", revenue_change: "0%", revenue_trend: "stable",
      users: "0", users_change: "0%", users_trend: "stable",
      session: "0", session_change: "0%", session_trend: "stable",
      churn: "0%", churn_change: "0%", churn_trend: "stable" 
    });
  const [chartRawData, setChartRawData] = useState<ChartDatum[]>([]);
  const [isLoadingDB, setIsLoadingDB] = useState(true);
  const isMountedRef = useRef(false);
  const fetchRequestIdRef = useRef(0);

  const { toast } = useToast();
  const navigate = useNavigate();
  const { companyId, isCompanyLoading, companyError } = useCompany();

  useEffect(() => {
    if (!isCompanyLoading && !companyId) {
      setIsLoadingDB(false);
      setChartRawData([]);
    }
  }, [companyId, isCompanyLoading]);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await withSupabaseTimeout(
          supabase.auth.getSession(),
          "analytics auth session"
        );
        if (!session) navigate("/login");
        else setUserEmail(session.user.email || "User");
      } catch (error) {
        console.warn("Analytics auth session check failed:", error);
        setUserEmail("User");
      }
    };
    checkUser();
  }, [navigate]);

  const fetchAnalyticsData = useCallback(async (showLoading = false) => {
    if (!companyId) {
      if (showLoading) setIsLoadingDB(false);
      return;
    }
    const requestId = ++fetchRequestIdRef.current;

    try {
      if (showLoading) setIsLoadingDB(true);
      const [kpiRes, chartRes] = await Promise.allSettled([
        withSupabaseTimeout(supabase.from('dashboard_kpis').select('*').eq('company_id', companyId).limit(1).maybeSingle(), "analytics dashboard_kpis"),
        withSupabaseTimeout(supabase.from('chart_data').select('*').eq('company_id', companyId).order('sort_order', { ascending: true }), "analytics chart_data")
      ]);

      const firstError =
        (kpiRes.status === "fulfilled" && kpiRes.value.error) ||
        (chartRes.status === "fulfilled" && chartRes.value.error) ||
        (kpiRes.status === "rejected" && kpiRes.reason) ||
        (chartRes.status === "rejected" && chartRes.reason);
      if (firstError) throw firstError;
      if (!isMountedRef.current || requestId !== fetchRequestIdRef.current) return;

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
      toast({ title: "Fetch Error", description: "Gagal memuat data analytics.", variant: "destructive" });
    } finally {
      if (isMountedRef.current && (showLoading || requestId === fetchRequestIdRef.current)) setIsLoadingDB(false);
    }
  }, [companyId, toast]);

  useSupabaseResumeRecovery({
    enabled: Boolean(companyId),
    onRecover: () => fetchAnalyticsData(false),
  });

  useEffect(() => {
    if (!userEmail || !companyId) return;
    isMountedRef.current = true;
    fetchAnalyticsData(true);

    const channel = supabase.channel(`analytics-metrics-realtime:${companyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dashboard_kpis', filter: `company_id=eq.${companyId}` }, () => fetchAnalyticsData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chart_data', filter: `company_id=eq.${companyId}` }, () => fetchAnalyticsData())
      .subscribe((status, error) => {
        console.info("[analytics realtime] status:", status, error ?? "");
        if (status === 'SUBSCRIBED') fetchAnalyticsData();
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn("[analytics realtime] disconnected; fetch fallback remains active.", { status, error });
        }
      });

    return () => {
      isMountedRef.current = false;
      safeRemoveChannel(channel);
    };
  }, [companyId, userEmail, fetchAnalyticsData]);

  // --- MENGHITUNG KORDINAT SVG DINAMIS ---
  const filteredChartData = useMemo(() => {
    if (!chartRawData.length) return [];

    switch (activeRange) {
      case "7D":
        return chartRawData.slice(-7);

      case "30D":
        return chartRawData.slice(-30);

      case "3M":
        return chartRawData.slice(-3);

      case "1Y":
      default:
        return chartRawData;
    }
  }, [chartRawData, activeRange]);

  const maxChartValue = Math.max(
    ...filteredChartData.map(d => d.current_val), 
    ...filteredChartData.map(d => d.previous_val), 
    1 
  );

  const width = 1200;
  const height = 350;

  // Generate garis (path) dan titik (points) 
  const currentYearGraph = generateSmoothPath(filteredChartData, 'current_val', width, height, maxChartValue);
  const previousYearGraph = generateSmoothPath(filteredChartData, 'previous_val', width, height, maxChartValue);

  const handleExport = () => toast({ title: "Exporting Report", description: "Your analytics report is being generated..." });

  const displayStats = [
    { label: "Total Revenue", value: kpiData.revenue, change: kpiData.revenue_change, trend: kpiData.revenue_trend, icon: DollarSign, color: "text-primary" },
    { label: "Active Users", value: kpiData.users, change: kpiData.users_change, trend: kpiData.users_trend, icon: Users, color: "text-info" },
    { label: "Avg. Session", value: kpiData.session, change: kpiData.session_change, trend: kpiData.session_trend, icon: Clock, color: "text-warning" },
    { label: "Churn Rate", value: kpiData.churn, change: kpiData.churn_change, trend: kpiData.churn_trend, icon: BarChart3, color: "text-muted-foreground" },
  ];

  if (!userEmail || isCompanyLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-6 lg:p-10 space-y-8 min-h-full bg-background-light">
      {companyError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Gagal memuat company context. Silakan refresh atau login ulang.
        </div>
      )}

      {!companyId && !companyError && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          Company context belum tersedia. Hubungi admin workspace Anda.
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Analytics Overview</h1>
          <p className="text-muted-foreground mt-1">Monitor your key performance metrics and business growth.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-card border border-border rounded-xl p-1 shadow-sm">
            {(["7D", "30D", "3M", "1Y"] as const).map((range) => (
              <button key={range} onClick={() => setActiveRange(range)} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${activeRange === range ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                {range}
              </button>
            ))}
          </div>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-primary-glow hover:bg-primary/90 transition-all">
            <Download className="h-4 w-4" /> Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayStats.map((stat, i) => (
          <motion.div key={stat.label} custom={i} variants={cardVariants} initial="hidden" animate="visible" className="group relative overflow-hidden rounded-2xl bg-white border border-border p-6 shadow-sm hover:shadow-card-hover transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-300">
              <stat.icon className={`h-16 w-16 ${stat.color}`} />
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
            {isLoadingDB ? <div className="h-9 w-24 bg-muted animate-pulse rounded mt-1 mb-4"></div> : <h3 className="text-3xl font-black text-foreground tracking-tight mb-4">{stat.value}</h3>}
            <div className="flex items-center mt-auto">
              <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-md transition-colors ${stat.trend === "up" ? "text-success bg-success/10" : stat.trend === "down" ? "text-destructive bg-destructive/10" : "text-muted-foreground bg-muted"}`}>
                {stat.trend === "up" ? <TrendingUp className="h-3 w-3 mr-1" /> : stat.trend === "down" ? <TrendingDown className="h-3 w-3 mr-1" /> : <Minus className="h-3 w-3 mr-1" />}
                {stat.change}
              </span>
              <span className="text-xs font-medium text-muted-foreground ml-2">vs prev. period</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Raksasa Chart Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-2xl border border-border shadow-sm p-6 lg:p-8">
        <div className="flex justify-between items-start mb-10">
          <div>
            <h2 className="text-xl font-bold text-foreground">Revenue Growth (Live)</h2>
            <p className="text-sm text-muted-foreground">Income trends dynamically generated from Database.</p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <span className="h-3 w-3 rounded-full bg-primary mr-2" />
              <span className="text-sm font-semibold text-foreground">Current Year</span>
            </div>
            <div className="flex items-center">
              <span className="h-3 w-3 rounded-full bg-border mr-2" />
              <span className="text-sm font-semibold text-muted-foreground">Previous Year</span>
            </div>
          </div>
        </div>
        
        {isLoadingDB ? (
          <div className="flex justify-center items-center h-[350px]">
             <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="relative w-full h-[350px]">
            <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGradPrimary" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: "hsl(222 80% 45%)", stopOpacity: 0.15 }} />
                  <stop offset="100%" style={{ stopColor: "hsl(222 80% 45%)", stopOpacity: 0 }} />
                </linearGradient>
              </defs>
              
              {/* Grid Lines */}
              {[0, 87.5, 175, 262.5, 350].map((y) => (
                <line key={`line-${y}`} x1="0" y1={y} x2="1200" y2={y} stroke="hsl(214 20% 92%)" strokeWidth="1" strokeDasharray={y === 350 ? "0" : "5,5"} />
              ))}
              
              {/* Previous Year Path */}
              {previousYearGraph.path && (
                <motion.path d={previousYearGraph.path} fill="none" stroke="hsl(214 20% 85%)" strokeWidth="3" strokeDasharray="8,8" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5 }} />
              )}
              
              {/* Current Year Area & Path */}
              {currentYearGraph.path && (
                <>
                  <path d={`${currentYearGraph.path} V${height} H0 Z`} fill="url(#areaGradPrimary)" />
                  <motion.path d={currentYearGraph.path} fill="none" stroke="hsl(222 80% 45%)" strokeWidth="4" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeInOut" }} />
                </>
              )}
              
              {/* Interactive Points (Current Year) */}
              {currentYearGraph.points.map((pt, index) => (
                <g key={index} onMouseEnter={() => setHoveredPoint(index)} onMouseLeave={() => setHoveredPoint(null)} className="cursor-pointer">
                  {hoveredPoint === index && (
                    <line x1={pt.cx} y1={pt.cy} x2={pt.cx} y2={height} stroke="hsl(222 80% 45%)" strokeWidth="1.5" strokeDasharray="4,4" />
                  )}
                  {/* Titik disembunyikan jika tidak di-hover agar lebih rapi, hanya muncul saat hover */}
                  <circle cx={pt.cx} cy={pt.cy} r={hoveredPoint === index ? "8" : "0"} fill="hsl(222 80% 45%)" stroke="white" strokeWidth="3" className="transition-all duration-200" />
                  
                  {hoveredPoint === index && (
                    <g>
                      <rect x={pt.cx - 45} y={pt.cy - 50} width="90" height="40" rx="6" fill="#0f172a" />
                      <text x={pt.cx} y={pt.cy - 34} textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">{pt.label}</text>
                      <text x={pt.cx} y={pt.cy - 18} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                        ${pt.val.toLocaleString()}
                      </text>
                    </g>
                  )}
                </g>
              ))}
            </svg>
            
            {/* Label Bulan */}
            <div className="flex justify-between mt-4 text-xs font-bold text-muted-foreground px-2">
              {filteredChartData.map((d) => <span key={d.id}>{d.month}</span>)}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
