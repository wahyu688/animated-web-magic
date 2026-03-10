import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Users, DollarSign, Clock, BarChart3, ArrowUpRight, Minus, LogOut, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

// --- DATA DINAMIS BERDASARKAN FILTER WAKTU (Chart & KPI Tetap Statis Dulu) ---
type TimeRange = "7D" | "30D" | "3M" | "1Y";

const dynamicData: Record<TimeRange, any> = {
  "7D": {
    stats: [
      { label: "Total Revenue", value: "$18,200", change: "+4.5%", trend: "up", icon: DollarSign, color: "text-primary" },
      { label: "Active Users", value: "840", change: "+1.2%", trend: "up", icon: Users, color: "text-info" },
      { label: "Avg. Session", value: "3m 45s", change: "-0.5%", trend: "down", icon: Clock, color: "text-warning" },
      { label: "Churn Rate", value: "1.2%", change: "Stable", trend: "stable", icon: BarChart3, color: "text-muted-foreground" },
    ],
    chart: {
      path: "M0,240 C100,240 100,200 200,200 C300,200 300,220 400,220 C500,220 500,150 600,150 C700,150 700,180 800,180 C900,180 900,90 1000,90 C1100,90 1100,50 1200,50",
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      dots: [{ cx: 600, cy: 150 }, { cx: 1000, cy: 90 }]
    }
  },
  "30D": {
    stats: [
      { label: "Total Revenue", value: "$124,500", change: "+12.5%", trend: "up", icon: DollarSign, color: "text-primary" },
      { label: "Active Users", value: "1,240", change: "+3.2%", trend: "up", icon: Users, color: "text-info" },
      { label: "Avg. Session", value: "4m 32s", change: "-1.1%", trend: "down", icon: Clock, color: "text-warning" },
      { label: "Churn Rate", value: "2.4%", change: "Stable", trend: "stable", icon: BarChart3, color: "text-muted-foreground" },
    ],
    chart: {
      path: "M0,220 C120,220 120,180 240,180 C360,180 360,240 480,240 C600,240 600,120 720,120 C840,120 840,150 960,150 C1080,150 1080,60 1200,60",
      labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"],
      dots: [{ cx: 480, cy: 240 }, { cx: 960, cy: 150 }]
    }
  },
  "3M": {
    stats: [
      { label: "Total Revenue", value: "$345,100", change: "+24.8%", trend: "up", icon: DollarSign, color: "text-primary" },
      { label: "Active Users", value: "3,800", change: "+15.4%", trend: "up", icon: Users, color: "text-info" },
      { label: "Avg. Session", value: "5m 12s", change: "+2.1%", trend: "up", icon: Clock, color: "text-warning" },
      { label: "Churn Rate", value: "3.1%", change: "+0.5%", trend: "down", icon: BarChart3, color: "text-muted-foreground" },
    ],
    chart: {
      path: "M0,260 C150,260 150,180 300,180 C450,180 450,220 600,220 C750,220 750,100 900,100 C1050,100 1050,40 1200,40",
      labels: ["Aug", "Sep", "Oct", "Nov", "Dec"],
      dots: [{ cx: 600, cy: 220 }, { cx: 900, cy: 100 }]
    }
  },
  "1Y": {
    stats: [
      { label: "Total Revenue", value: "$1.4M", change: "+45.2%", trend: "up", icon: DollarSign, color: "text-primary" },
      { label: "Active Users", value: "12,450", change: "+38.1%", trend: "up", icon: Users, color: "text-info" },
      { label: "Avg. Session", value: "4m 58s", change: "Stable", trend: "stable", icon: Clock, color: "text-warning" },
      { label: "Churn Rate", value: "4.5%", change: "-1.2%", trend: "up", icon: BarChart3, color: "text-muted-foreground" },
    ],
    chart: {
      path: "M0,220 C100,200 200,250 300,200 C400,150 500,180 600,120 C700,60 800,100 900,60 C1000,20 1100,40 1200,20",
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      dots: [{ cx: 600, cy: 120 }, { cx: 900, cy: 60 }]
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
};

export default function DashboardPage() {
  const [activeRange, setActiveRange] = useState<TimeRange>("30D");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  // State untuk menyimpan data dari Database
  const [topPages, setTopPages] = useState<any[]>([]);
  const [trafficSources, setTrafficSources] = useState<any[]>([]);
  const [isLoadingDB, setIsLoadingDB] = useState(true);

  const currentData = dynamicData[activeRange];
  const { toast } = useToast();
  const navigate = useNavigate();

  // 1. CEK AUTENTIKASI SUPABASE
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
      } else {
        setUserEmail(session.user.email || "User");
      }
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate("/login");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  // 2. FETCH DATA DARI DATABASE BILA USER SUDAH LOGIN
  useEffect(() => {
    if (!userEmail) return;

    const fetchDashboardInfo = async () => {
      setIsLoadingDB(true);
      try {
        const [pagesRes, trafficRes] = await Promise.all([
          supabase.from('top_pages').select('*').order('created_at', { ascending: true }),
          supabase.from('traffic_sources').select('*').order('pct', { ascending: false })
        ]);

        if (pagesRes.error) throw pagesRes.error;
        if (trafficRes.error) throw trafficRes.error;

        setTopPages(pagesRes.data || []);
        setTrafficSources(trafficRes.data || []);
      } catch (error: any) {
        console.error("Gagal menarik data:", error);
        toast({
          title: "Database Error",
          description: "Gagal memuat data live dari server.",
          variant: "destructive"
        });
      } finally {
        setIsLoadingDB(false);
      }
    };

    fetchDashboardInfo();
  }, [userEmail, toast]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleAction = (action: string) => {
    toast({
      title: "Action Triggered",
      description: `"${action}" function is currently running.`,
    });
  };

  // Jangan render konten utama sampai pengecekan sesi selesai
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
          {/* Interactive Time Filter */}
          <div className="flex bg-muted rounded-xl p-1 relative">
            {(["7D", "30D", "3M", "1Y"] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setActiveRange(range)}
                className={`relative z-10 px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  activeRange === range ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {activeRange === range && (
                  <motion.div layoutId="dashboard-range-tab" className="absolute inset-0 bg-card shadow-sm rounded-lg -z-10" transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                )}
                {range}
              </button>
            ))}
          </div>
          <button onClick={() => handleAction("Export Data")} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-primary-glow hover:opacity-90 transition-opacity">
            <ArrowUpRight className="h-4 w-4" /> Export
          </button>
          
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {currentData.stats.map((stat: any, i: number) => (
          <motion.div
            key={stat.label}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="group relative overflow-hidden rounded-2xl bg-card border border-border p-6 shadow-card hover:shadow-card-hover transition-all cursor-default"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-300">
              <stat.icon className={`h-16 w-16 ${stat.color}`} />
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
            
            <AnimatePresence mode="wait">
              <motion.h3 
                key={stat.value}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="text-3xl font-bold text-foreground tracking-tight"
              >
                {stat.value}
              </motion.h3>
            </AnimatePresence>

            <div className="flex items-center mt-4">
              <span
                className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full transition-colors ${
                  stat.trend === "up"
                    ? "text-success bg-success/10"
                    : stat.trend === "down"
                    ? "text-destructive bg-destructive/10"
                    : "text-muted-foreground bg-muted"
                }`}
              >
                {stat.trend === "up" ? (
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                ) : stat.trend === "down" ? (
                  <TrendingDown className="h-3 w-3 mr-0.5" />
                ) : (
                  <Minus className="h-3 w-3 mr-0.5" />
                )}
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
        <motion.div
          key={`chart-container-${activeRange}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-card p-6 lg:p-8"
        >
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
              
              <path d={`${currentData.chart.path} V280 H0 Z`} fill="url(#areaGrad)" />
              
              <motion.path
                key={`line-${activeRange}`}
                d={currentData.chart.path}
                fill="none"
                stroke="hsl(222 80% 45%)"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
              />
              
              {currentData.chart.dots.map((dot: any, index: number) => (
                <motion.circle 
                  key={`dot-${activeRange}-${index}`} 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ delay: 1 + (index * 0.2) }} 
                  cx={dot.cx} cy={dot.cy} r="6" 
                  fill="hsl(222 80% 45%)" stroke="white" strokeWidth="3" 
                />
              ))}
            </svg>
            <div className="flex justify-between mt-2 text-xs font-medium text-muted-foreground px-2">
              {currentData.chart.labels.map((m: string) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Traffic Sources - DATA DINAMIS DARI SUPABASE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl border border-border shadow-card p-6"
        >
          <h2 className="text-lg font-bold text-foreground mb-6">Traffic Sources</h2>
          
          {isLoadingDB ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : trafficSources.length === 0 ? (
             <div className="text-center text-sm text-muted-foreground pt-10">Data kosong</div>
          ) : (
            <div className="space-y-5">
              {trafficSources.map((s, i) => (
                <motion.div
                  key={s.id || s.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  <div className="flex justify-between text-xs font-medium mb-1.5">
                    <span className="text-muted-foreground">{s.name}</span>
                    <span className="text-foreground">{s.pct}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <motion.div
                      className={`${s.color} h-2.5 rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${s.pct}%` }}
                      transition={{ duration: 1, delay: 0.6 + i * 0.1, ease: "easeOut" }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          <div className="mt-6 pt-6 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Live Data</span>
            <button onClick={() => handleAction("View Traffic Details")} className="text-primary hover:underline font-medium">View Details</button>
          </div>
        </motion.div>
      </div>

      {/* Top Pages Table - DATA DINAMIS DARI SUPABASE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-card rounded-2xl border border-border shadow-card overflow-hidden"
      >
        <div className="p-6 border-b border-border flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-foreground">Top Performing Pages</h2>
            <p className="text-xs text-muted-foreground mt-1">Pages with the highest engagement rate.</p>
          </div>
          <button onClick={() => handleAction("Open Filter Options")} className="px-3 py-1 text-xs font-medium bg-muted border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">
            Filter
          </button>
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
                 <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                     <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                     Memuat data dari Supabase...
                   </td>
                 </tr>
              ) : topPages.length === 0 ? (
                 <tr>
                   <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">
                     Tidak ada data tersedia.
                   </td>
                 </tr>
              ) : topPages.map((page) => (
                <tr key={page.id || page.name} className="group hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => handleAction(`View details for ${page.name}`)}>
                  <td className="px-6 py-4 font-medium text-foreground font-mono text-sm">{page.name}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{page.views}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{page.unique_views}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{page.bounce}</td>
                  <td className="px-6 py-4 text-right">
                    {page.trend === "up" ? (
                      <TrendingUp className="h-4 w-4 text-success inline" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-destructive inline" />
                    )}
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