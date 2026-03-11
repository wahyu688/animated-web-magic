import { useState, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import { TrendingUp, TrendingDown, Users, DollarSign, Clock, BarChart3, Download, Minus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

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

// --- FUNGSI MATEMATIKA: MENGUBAH DATA JADI GARIS LENGKUNG (BEZIER) ---
const generateSmoothPath = (data: any[], key: string, width: number, height: number, maxVal: number) => {
  if (!data || data.length === 0) return { path: "", points: [] };
  
  const xStep = width / (data.length - 1 || 1);
  let path = "";
  let points: any[] = [];

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
  const [chartRawData, setChartRawData] = useState<any[]>([]);
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

    const fetchAnalyticsData = async () => {
      setIsLoadingDB(true);
      try {
        const [kpiRes, chartRes] = await Promise.all([
          supabase.from('dashboard_kpis').select('*').limit(1).single(),
          supabase.from('chart_data').select('*').order('sort_order', { ascending: true }) // Tarik data grafik
        ]);

        if (kpiRes.data) {
          setKpiData({
            revenue: kpiRes.data.total_revenue,
            revenue_change: kpiRes.data.revenue_change || "0%",
            revenue_trend: kpiRes.data.revenue_trend || "stable",
            
            users: kpiRes.data.active_users,
            users_change: kpiRes.data.users_change || "0%",
            users_trend: kpiRes.data.users_trend || "stable",
            
            session: kpiRes.data.avg_session,
            session_change: kpiRes.data.session_change || "0%",
            session_trend: kpiRes.data.session_trend || "stable",
            
            churn: kpiRes.data.churn_rate,
            churn_change: kpiRes.data.churn_change || "0%",
            churn_trend: kpiRes.data.churn_trend || "stable"
          });
        }
        if (chartRes.data) {
          setChartRawData(chartRes.data);
        }
      } catch (error) {
        console.error("Gagal menarik data:", error);
      } finally {
        setIsLoadingDB(false);
      }
    };

    fetchAnalyticsData();
  }, [userEmail]);

  // --- MENGHITUNG KORDINAT SVG DINAMIS ---
  // Cari nilai paling tinggi antara tahun ini dan tahun lalu agar grafiknya proporsional
  const maxChartValue = Math.max(
    ...chartRawData.map(d => d.current_val), 
    ...chartRawData.map(d => d.previous_val), 
    1 // Hindari pembagian dengan 0
  );

  const width = 1200;
  const height = 350;

  // Generate garis (path) dan titik (points) secara dinamis
  const currentYearGraph = generateSmoothPath(chartRawData, 'current_val', width, height, maxChartValue);
  const previousYearGraph = generateSmoothPath(chartRawData, 'previous_val', width, height, maxChartValue);

  const handleExport = () => toast({ title: "Exporting Report", description: "Your analytics report is being generated..." });

  const displayStats = [
    { label: "Total Revenue", value: kpiData.revenue, change: kpiData.revenue_change, trend: kpiData.revenue_trend, icon: DollarSign, color: "text-primary" },
    { label: "Active Users", value: kpiData.users, change: kpiData.users_change, trend: kpiData.users_trend, icon: Users, color: "text-info" },
    { label: "Avg. Session", value: kpiData.session, change: kpiData.session_change, trend: kpiData.session_trend, icon: Clock, color: "text-warning" },
    { label: "Churn Rate", value: kpiData.churn, change: kpiData.churn_change, trend: kpiData.churn_trend, icon: BarChart3, color: "text-muted-foreground" },
  ];

  if (!userEmail) return null;

  return (
    <div className="p-6 lg:p-10 space-y-8 min-h-full bg-background-light">
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
                  {/* Titik disembunyikan jika tidak di-hover agar lebih rapi, hanya muncul saat hover (atau bisa biarkan muncul terus) */}
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
              {chartRawData.map((d) => <span key={d.id}>{d.month}</span>)}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}