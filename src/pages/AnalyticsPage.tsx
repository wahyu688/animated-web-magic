import { useState, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import { TrendingUp, TrendingDown, Users, DollarSign, Clock, BarChart3, Download, Minus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

// --- DATA GRAFIK STATIS (Template UI) ---
const chartData = {
  currentYear: "M0,260 C100,250 200,220 300,230 C400,240 500,180 600,160 C700,140 800,160 900,120 C1000,80 1100,90 1200,60",
  previousYear: "M0,280 C150,280 250,260 350,260 C450,260 550,240 650,220 C750,200 850,220 950,200 C1050,180 1150,190 1200,180",
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  points: [
    { cx: 300, cy: 230, val: "$42,100", label: "Mar" },
    { cx: 600, cy: 160, val: "$68,500", label: "Jun" },
    { cx: 900, cy: 120, val: "$84,230", label: "Sep" }
  ]
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

export default function AnalyticsPage() {
  const [activeRange, setActiveRange] = useState("30D");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  
  // State Data Dinamis KPI
  const [kpiData, setKpiData] = useState({ revenue: "$0", users: "0", session: "0", churn: "0%" });
  const [isLoadingDB, setIsLoadingDB] = useState(true);

  const { toast } = useToast();
  const navigate = useNavigate();

  // 1. Cek Sesi Supabase
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) navigate("/login");
      else setUserEmail(session.user.email || "User");
    };
    checkUser();
  }, [navigate]);

  // 2. Tarik Data KPI Dinamis dari Perusahaan Anda
  useEffect(() => {
    if (!userEmail) return;

    const fetchAnalyticsKPI = async () => {
      setIsLoadingDB(true);
      try {
        const { data, error } = await supabase.from('dashboard_kpis').select('*').limit(1).single();
        if (error) throw error;
        
        if (data) {
          setKpiData({
            revenue: data.total_revenue,
            users: data.active_users,
            session: data.avg_session,
            churn: data.churn_rate
          });
        }
      } catch (error) {
        console.error("Gagal menarik data KPI:", error);
      } finally {
        setIsLoadingDB(false);
      }
    };

    fetchAnalyticsKPI();
  }, [userEmail]);

  const handleExport = () => {
    toast({ title: "Exporting Report", description: "Your analytics report is being generated..." });
  };

  const displayStats = [
    { label: "Total Revenue", value: kpiData.revenue, change: "+12.5%", trend: "up", icon: DollarSign, color: "text-primary" },
    { label: "Active Users", value: kpiData.users, change: "+3.2%", trend: "up", icon: Users, color: "text-info" },
    { label: "Avg. Session", value: kpiData.session, change: "-1.1%", trend: "down", icon: Clock, color: "text-warning" },
    { label: "Churn Rate", value: kpiData.churn, change: "Stable", trend: "stable", icon: BarChart3, color: "text-muted-foreground" },
  ];

  if (!userEmail) return null;

  return (
    <div className="p-6 lg:p-10 space-y-8 min-h-full bg-background-light">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Analytics Overview</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your key performance metrics and business growth.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-card border border-border rounded-xl p-1 shadow-sm">
            {(["7D", "30D", "3M", "1Y"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setActiveRange(range)}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  activeRange === range ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-primary-glow hover:bg-primary/90 transition-all">
            <Download className="h-4 w-4" /> Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards Dinamis */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayStats.map((stat, i) => (
          <motion.div key={stat.label} custom={i} variants={cardVariants} initial="hidden" animate="visible" className="group relative overflow-hidden rounded-2xl bg-white border border-border p-6 shadow-sm hover:shadow-card-hover transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-300">
              <stat.icon className={`h-16 w-16 ${stat.color}`} />
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
            
            {isLoadingDB ? (
              <div className="h-9 w-24 bg-muted animate-pulse rounded mt-1 mb-4"></div>
            ) : (
              <h3 className="text-3xl font-black text-foreground tracking-tight mb-4">{stat.value}</h3>
            )}

            <div className="flex items-center mt-auto">
              <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-md transition-colors ${
                stat.trend === "up" ? "text-success bg-success/10" : stat.trend === "down" ? "text-destructive bg-destructive/10" : "text-muted-foreground bg-muted"
              }`}>
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
            <h2 className="text-xl font-bold text-foreground">Revenue Growth</h2>
            <p className="text-sm text-muted-foreground">Income trends across all sales channels.</p>
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
        
        <div className="relative w-full h-[350px]">
          <svg className="w-full h-full" viewBox="0 0 1200 350" preserveAspectRatio="none">
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
            <motion.path d={chartData.previousYear} fill="none" stroke="hsl(214 20% 85%)" strokeWidth="3" strokeDasharray="8,8" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5 }} />
            
            {/* Current Year Area & Path */}
            <path d={`${chartData.currentYear} V350 H0 Z`} fill="url(#areaGradPrimary)" />
            <motion.path d={chartData.currentYear} fill="none" stroke="hsl(222 80% 45%)" strokeWidth="4" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeInOut" }} />
            
            {/* Interactive Points */}
            {chartData.points.map((pt, index) => (
              <g key={index} onMouseEnter={() => setHoveredPoint(index)} onMouseLeave={() => setHoveredPoint(null)} className="cursor-pointer">
                {/* Garis putus-putus ke bawah saat di-hover */}
                {hoveredPoint === index && (
                  <line x1={pt.cx} y1={pt.cy} x2={pt.cx} y2="350" stroke="hsl(222 80% 45%)" strokeWidth="1.5" strokeDasharray="4,4" />
                )}
                
                {/* Titik Lingkaran */}
                <circle cx={pt.cx} cy={pt.cy} r={hoveredPoint === index ? "8" : "6"} fill="hsl(222 80% 45%)" stroke="white" strokeWidth="3" className="transition-all duration-200" />
                
                {/* Tooltip */}
                {hoveredPoint === index && (
                  <g>
                    <rect x={pt.cx - 45} y={pt.cy - 50} width="90" height="40" rx="6" fill="#0f172a" />
                    <text x={pt.cx} y={pt.cy - 34} textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">{pt.label} 24</text>
                    <text x={pt.cx} y={pt.cy - 18} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">{pt.val}</text>
                  </g>
                )}
              </g>
            ))}
          </svg>
          
          {/* Label Bulan */}
          <div className="flex justify-between mt-4 text-xs font-bold text-muted-foreground px-2">
            {chartData.labels.map((m) => <span key={m}>{m}</span>)}
          </div>
        </div>
      </motion.div>
    </div>
  );
}