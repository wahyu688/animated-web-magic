import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { TrendingUp, TrendingDown, Users, DollarSign, Clock, BarChart3, ArrowUpRight, Minus, LogOut, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

// --- GRAFIK STATIS (Hanya grafiknya saja yang menggunakan template SVG) ---
const chartData = {
  path: "M0,220 C120,220 120,180 240,180 C360,180 360,240 480,240 C600,240 600,120 720,120 C840,120 840,150 960,150 C1080,150 1080,60 1200,60",
  labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"],
  dots: [{ cx: 480, cy: 240 }, { cx: 960, cy: 150 }]
};

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

export default function DashboardPage() {
  const [activeRange, setActiveRange] = useState("30D");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  // State Data Dinamis dari Supabase
  const [kpiData, setKpiData] = useState({ revenue: "$0", users: "0", session: "0", churn: "0%" });
  const [topPages, setTopPages] = useState<any[]>([]);
  const [trafficSources, setTrafficSources] = useState<any[]>([]);
  const [isLoadingDB, setIsLoadingDB] = useState(true);

  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) navigate("/login");
      else setUserEmail(session.user.email || "User");
    };
    checkUser();
  }, [navigate]);

  useEffect(() => {
    if (!userEmail) return;

    const fetchDashboardInfo = async () => {
      setIsLoadingDB(true);
      try {
        const [pagesRes, trafficRes, kpiRes] = await Promise.all([
          supabase.from('top_pages').select('*').order('views', { ascending: false }),
          supabase.from('traffic_sources').select('*').order('pct', { ascending: false }),
          supabase.from('dashboard_kpis').select('*').limit(1).single() // Ambil KPI
        ]);

        if (pagesRes.data) setTopPages(pagesRes.data);
        if (trafficRes.data) setTrafficSources(trafficRes.data);
        if (kpiRes.data) {
          setKpiData({
            revenue: kpiRes.data.total_revenue,
            users: kpiRes.data.active_users,
            session: kpiRes.data.avg_session,
            churn: kpiRes.data.churn_rate
          });
        }
      } catch (error) {
        console.error("Gagal menarik data:", error);
      } finally {
        setIsLoadingDB(false);
      }
    };

    fetchDashboardInfo();
  }, [userEmail]);

  // Siapkan array metrik untuk di-mapping ke kartu UI
  const displayStats = [
    { label: "Total Revenue", value: kpiData.revenue, change: "+12.5%", trend: "up", icon: DollarSign, color: "text-primary" },
    { label: "Active Users", value: kpiData.users, change: "+3.2%", trend: "up", icon: Users, color: "text-info" },
    { label: "Avg. Session", value: kpiData.session, change: "-1.1%", trend: "down", icon: Clock, color: "text-warning" },
    { label: "Churn Rate", value: kpiData.churn, change: "Stable", trend: "stable", icon: BarChart3, color: "text-muted-foreground" },
  ];

  if (!userEmail) return null;

  return (
    <div className="p-6 lg:p-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, <span className="text-primary font-medium">{userEmail}</span>. Monitor your key metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-primary-glow hover:opacity-90 transition-opacity">
            <ArrowUpRight className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* KPI Cards (Sekarang Dinamis dari DB!) */}
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
          </div>
          <div className="relative w-full h-[280px]">
            <svg className="w-full h-full" viewBox="0 0 1200 280" preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: "hsl(222 80% 45%)", stopOpacity: 0.2 }} />
                  <stop offset="100%" style={{ stopColor: "hsl(222 80% 45%)", stopOpacity: 0 }} />
                </linearGradient>
              </defs>
              {[0, 70, 140, 210, 280].map((y) => (
                <line key={`line-${y}`} x1="0" y1={y} x2="1200" y2={y} stroke="hsl(214 20% 92%)" strokeWidth="1" />
              ))}
              <path d={`${chartData.path} V280 H0 Z`} fill="url(#areaGrad)" />
              <motion.path d={chartData.path} fill="none" stroke="hsl(222 80% 45%)" strokeWidth="3" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2 }} />
            </svg>
          </div>
        </motion.div>

        {/* Traffic Sources */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card rounded-2xl border border-border shadow-card p-6">
          <h2 className="text-lg font-bold text-foreground mb-6">Traffic Sources</h2>
          {isLoadingDB ? (
            <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-5">
              {trafficSources.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1 }}>
                  <div className="flex justify-between text-xs font-medium mb-1.5">
                    <span className="text-muted-foreground">{s.name}</span>
                    <span className="text-foreground">{s.pct}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <motion.div className={`${s.color} h-2.5 rounded-full`} initial={{ width: 0 }} animate={{ width: `${s.pct}%` }} transition={{ duration: 1 }} />
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