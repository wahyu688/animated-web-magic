import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Users, DollarSign, Clock, BarChart3, ArrowUpRight, Minus, Globe, ExternalLink, X, Filter, Plus } from "lucide-react";
import { useState } from "react";

// --- DATA DINAMIS BERDASARKAN WAKTU ---
type TimeRange = "7D" | "30D" | "3M" | "1Y";

const statsData: Record<TimeRange, any[]> = {
  "7D": [
    { label: "Total Revenue", value: "$18,200", change: "+4.5%", trend: "up", icon: DollarSign },
    { label: "Active Users", value: "840", change: "+1.2%", trend: "up", icon: Users },
    { label: "Avg. Session", value: "3m 45s", change: "-0.5%", trend: "down", icon: Clock },
    { label: "Churn Rate", value: "1.2%", change: "Stable", trend: "stable", icon: BarChart3 },
  ],
  "30D": [
    { label: "Total Revenue", value: "$124,500", change: "+12.5%", trend: "up", icon: DollarSign },
    { label: "Active Users", value: "1,240", change: "+3.2%", trend: "up", icon: Users },
    { label: "Avg. Session", value: "4m 32s", change: "-1.1%", trend: "down", icon: Clock },
    { label: "Churn Rate", value: "2.4%", change: "Stable", trend: "stable", icon: BarChart3 },
  ],
  "3M": [
    { label: "Total Revenue", value: "$345,100", change: "+24.8%", trend: "up", icon: DollarSign },
    { label: "Active Users", value: "3,800", change: "+15.4%", trend: "up", icon: Users },
    { label: "Avg. Session", value: "5m 12s", change: "+2.1%", trend: "up", icon: Clock },
    { label: "Churn Rate", value: "3.1%", change: "+0.5%", trend: "down", icon: BarChart3 },
  ],
  "1Y": [
    { label: "Total Revenue", value: "$1.4M", change: "+45.2%", trend: "up", icon: DollarSign },
    { label: "Active Users", value: "12,450", change: "+38.1%", trend: "up", icon: Users },
    { label: "Avg. Session", value: "4m 58s", change: "Stable", trend: "stable", icon: Clock },
    { label: "Churn Rate", value: "4.5%", change: "-1.2%", trend: "up", icon: BarChart3 },
  ]
};

const trafficSources = [
  { name: "Direct", pct: 45, color: "bg-primary" },
  { name: "Social Media", pct: 32, color: "bg-violet-500" },
  { name: "Organic Search", pct: 18, color: "bg-info" },
  { name: "Referrals", pct: 5, color: "bg-warning" },
];

const topPages = [
  { name: "/dashboard", views: "24,120", unique: "18,200", bounce: "32%", trend: "up" },
  { name: "/pricing", views: "18,400", unique: "14,300", bounce: "28%", trend: "up" },
  { name: "/features", views: "12,800", unique: "9,600", bounce: "45%", trend: "down" },
  { name: "/docs/quickstart", views: "8,200", unique: "6,100", bounce: "22%", trend: "up" },
  { name: "/blog", views: "6,100", unique: "4,800", bounce: "38%", trend: "up" },
];

const geoData = [
  { region: "USA", pct: 42 },
  { region: "Europe", pct: 35 },
  { region: "Asia", pct: 15 },
  { region: "Other", pct: 8 },
];

const initialProjects = [
  { name: "Website Redesign", progress: 75, status: "In Progress", statusColor: "bg-info/10 text-info", iconColor: "bg-primary/10 text-primary" },
  { name: "API Integration", progress: 30, status: "Review", statusColor: "bg-warning/10 text-warning", iconColor: "bg-warning/10 text-warning" },
  { name: "Mobile App V2", progress: 90, status: "Testing", statusColor: "bg-success/10 text-success", iconColor: "bg-success/10 text-success" },
  { name: "Design System", progress: 15, status: "Planned", statusColor: "bg-muted text-muted-foreground", iconColor: "bg-violet-100 text-violet-600" },
];

export default function AnalyticsPage() {
  const [activeRange, setActiveRange] = useState<TimeRange>("30D");
  const currentStats = statsData[activeRange];

  // --- STATE UNTUK MODALS & FITUR BARU ---
  const [isTrafficModalOpen, setIsTrafficModalOpen] = useState(false);
  
  // Filter Projects State
  const [projectFilter, setProjectFilter] = useState<"All" | "In Progress" | "Review" | "Testing" | "Planned">("All");
  const [isProjectFilterOpen, setIsProjectFilterOpen] = useState(false);
  const filteredProjects = projectFilter === "All" ? initialProjects : initialProjects.filter(p => p.status === projectFilter);

  // Focus Mode State
  const [focusTasks, setFocusTasks] = useState([
    { tag: "Design", tagColor: "text-primary bg-primary/10", title: "Update Brand Assets", desc: "Replace old logos with new vectors across landing pages.", time: "2h remaining" },
    { tag: "Dev", tagColor: "text-warning bg-warning/10", title: "Fix Auth Bug #204", desc: "Token refresh logic failing on Safari mobile browser.", time: "Today" },
  ]);
  const [isAddFocusModalOpen, setIsAddFocusModalOpen] = useState(false);
  const [newFocusTitle, setNewFocusTitle] = useState("");
  const [newFocusDesc, setNewFocusDesc] = useState("");

  const handleAddNewFocus = () => {
    if (newFocusTitle.trim()) {
      setFocusTasks([
        ...focusTasks,
        {
          tag: "Custom",
          tagColor: "text-violet-600 bg-violet-100",
          title: newFocusTitle,
          desc: newFocusDesc || "No description provided.",
          time: "Just added"
        }
      ]);
      setNewFocusTitle("");
      setNewFocusDesc("");
      setIsAddFocusModalOpen(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Analytics Overview</h1>
          <p className="text-muted-foreground mt-1">Monitor your key performance metrics and business growth.</p>
        </div>
        <div className="flex items-center gap-3">
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
                  <motion.div
                    layoutId="active-range-tab"
                    className="absolute inset-0 bg-card shadow-sm rounded-lg -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                {range}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-primary-glow hover:opacity-90 transition-opacity">
            <ArrowUpRight className="h-4 w-4" /> Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {currentStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4, ease: "easeOut" }}
            className="group relative overflow-hidden rounded-2xl bg-card border border-border p-6 shadow-card hover:shadow-card-hover transition-shadow"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <stat.icon className="h-16 w-16 text-primary" />
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
              <span className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${stat.trend === "up" ? "text-success bg-success/10" : stat.trend === "down" ? "text-destructive bg-destructive/10" : "text-muted-foreground bg-muted"}`}>
                {stat.trend === "up" ? <TrendingUp className="h-3 w-3 mr-0.5" /> : stat.trend === "down" ? <TrendingDown className="h-3 w-3 mr-0.5" /> : <Minus className="h-3 w-3 mr-0.5" />}
                {stat.change}
              </span>
              <span className="text-xs text-muted-foreground ml-2">vs prev. period</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      <motion.div key={`chart-${activeRange}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card rounded-2xl border border-border shadow-card p-6 lg:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-lg font-bold text-foreground">Revenue Growth</h2>
            <p className="text-sm text-muted-foreground">Income trends across all sales channels.</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center"><span className="h-3 w-3 rounded-full bg-primary mr-2" /><span className="text-xs font-medium text-muted-foreground">Current Year</span></div>
            <div className="flex items-center"><span className="h-3 w-3 rounded-full bg-border mr-2" /><span className="text-xs font-medium text-muted-foreground">Previous Year</span></div>
          </div>
        </div>
        <div className="relative w-full h-[300px]">
          <svg className="w-full h-full" viewBox="0 0 1200 300" preserveAspectRatio="none">
            <defs>
              <linearGradient id="analyticsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: "hsl(222 80% 45%)", stopOpacity: 0.2 }} />
                <stop offset="100%" style={{ stopColor: "hsl(222 80% 45%)", stopOpacity: 0 }} />
              </linearGradient>
            </defs>
            {[0, 75, 150, 225, 300].map((y) => (<line key={y} x1="0" y1={y} x2="1200" y2={y} stroke="hsl(214 20% 92%)" strokeWidth="1" />))}
            <path d="M0,220 C100,200 200,240 350,180 C500,120 600,140 750,100 C900,60 1000,80 1100,30 L1200,20 V300 H0 Z" fill="url(#analyticsGrad)" />
            <path d="M0,260 C100,250 200,255 350,240 C500,225 600,230 750,220 C900,210 1000,215 1100,200 L1200,195" fill="none" stroke="hsl(214 20% 85%)" strokeWidth="2" strokeDasharray="6 4" />
            <motion.path d="M0,220 C100,200 200,240 350,180 C500,120 600,140 750,100 C900,60 1000,80 1100,30 L1200,20" fill="none" stroke="hsl(222 80% 45%)" strokeWidth="3" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeInOut" }} />
            <circle cx="350" cy="180" r="6" fill="hsl(222 80% 45%)" stroke="white" strokeWidth="3" />
            <circle cx="750" cy="100" r="6" fill="hsl(222 80% 45%)" stroke="white" strokeWidth="3" />
            <circle cx="1100" cy="30" r="6" fill="hsl(222 80% 45%)" stroke="white" strokeWidth="3" />
            <g transform="translate(710, 45)">
              <rect fill="hsl(222 47% 11%)" height="50" rx="8" width="100" />
              <text fill="hsl(215 20% 65%)" fontFamily="Inter" fontSize="10" textAnchor="middle" x="50" y="20">Sep 24</text>
              <text fill="white" fontFamily="Inter" fontSize="14" fontWeight="bold" textAnchor="middle" x="50" y="38">$84,230</text>
              <path d="M45,50 L50,55 L55,50 Z" fill="hsl(222 47% 11%)" />
            </g>
          </svg>
          <div className="flex justify-between mt-2 text-xs font-medium text-muted-foreground px-2">
            {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m) => <span key={m}>{m}</span>)}
          </div>
        </div>
      </motion.div>

      {/* Traffic + Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Traffic Sources */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card rounded-2xl border border-border shadow-card p-6">
          <h2 className="text-lg font-bold text-foreground mb-6">Traffic Sources</h2>
          <div className="space-y-5">
            {trafficSources.map((s, i) => (
              <motion.div key={s.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1 }}>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="text-foreground">{s.pct}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <motion.div className={`${s.color} h-2.5 rounded-full`} initial={{ width: 0 }} animate={{ width: `${s.pct}%` }} transition={{ duration: 1, delay: 0.6 + i * 0.1, ease: "easeOut" }} />
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Updated 2 mins ago</span>
            <button onClick={() => setIsTrafficModalOpen(true)} className="text-primary hover:underline font-medium">View Details</button>
          </div>
        </motion.div>

        {/* Project Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-card overflow-hidden">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-foreground">Active Projects</h2>
              <p className="text-xs text-muted-foreground mt-1">Track project progress and milestones.</p>
            </div>
            {/* Filter Projects Dropdown / Popover (Disimulasikan dengan state sederhana) */}
            <div className="relative">
              <button 
                onClick={() => setIsProjectFilterOpen(!isProjectFilterOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-muted border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              >
                <Filter className="w-3 h-3" /> {projectFilter}
              </button>
              
              <AnimatePresence>
                {isProjectFilterOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-32 bg-card border border-border rounded-xl shadow-lg z-20 py-1"
                  >
                    {["All", "In Progress", "Review", "Testing", "Planned"].map((status) => (
                      <button
                        key={status}
                        onClick={() => { setProjectFilter(status as any); setIsProjectFilterOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-xs hover:bg-muted/50 transition-colors ${projectFilter === status ? "text-primary font-bold" : "text-foreground"}`}
                      >
                        {status}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-4">Project</th>
                  <th className="px-6 py-4">Progress</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <AnimatePresence>
                  {filteredProjects.map((p) => (
                    <motion.tr 
                      key={p.name}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} layout
                      className="group hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg ${p.iconColor} flex items-center justify-center`}>
                            <BarChart3 className="h-4 w-4" />
                          </div>
                          <span className="font-medium text-foreground text-sm">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 w-40">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <motion.div className="bg-primary h-1.5 rounded-full" initial={{ width: 0 }} animate={{ width: `${p.progress}%` }} transition={{ duration: 0.5 }} />
                          </div>
                          <span className="text-xs text-muted-foreground font-medium">{p.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.statusColor}`}>{p.status}</span>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Focus + Global + Top Pages */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Focus Mode */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-card rounded-2xl shadow-card border border-border p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Focus Mode</h2>
          <div className="space-y-4">
            <AnimatePresence>
              {focusTasks.map((t, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-xl bg-muted/50 border border-border hover:border-primary/30 transition-colors group cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${t.tagColor}`}>{t.tag}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">{t.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">{t.desc}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {t.time}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <button 
              onClick={() => setIsAddFocusModalOpen(true)}
              className="w-full py-2.5 rounded-xl border border-dashed border-border text-muted-foreground text-sm font-medium hover:text-primary hover:border-primary/50 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" /> Add New Focus
            </button>
          </div>
        </motion.div>

        {/* Global Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="lg:col-span-2 bg-card rounded-2xl shadow-card border border-border p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-foreground">Global Activity</h2>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-muted-foreground">Live Traffic</span>
            </div>
          </div>
          <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gradient-to-br from-primary/5 to-info/5 border border-border group">
            <div className="absolute inset-0 flex items-center justify-center">
              <Globe className="h-24 w-24 text-primary/10 group-hover:scale-110 transition-transform duration-700" />
            </div>
            {[
              { top: "25%", left: "22%", size: "12px" }, { top: "35%", left: "48%", size: "8px" },
              { top: "40%", left: "75%", size: "10px" }, { top: "60%", left: "35%", size: "6px" }, { top: "30%", left: "62%", size: "8px" },
            ].map((dot, i) => (
              <motion.div
                key={i} className="absolute rounded-full bg-primary" style={{ top: dot.top, left: dot.left, width: dot.size, height: dot.size }}
                animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.5, 1] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
              />
            ))}
            <div className="absolute bottom-4 left-4 flex gap-3">
              {geoData.slice(0, 3).map((g) => (
                <div key={g.region} className="bg-card/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">{g.region}</span>
                  <span className="text-sm font-bold text-foreground">{g.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Top Pages Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-foreground">Top Performing Pages</h2>
            <p className="text-xs text-muted-foreground mt-1">Pages with the highest engagement rate.</p>
          </div>
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
              {topPages.map((page) => (
                <tr key={page.name} className="group hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground font-mono text-sm">{page.name}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{page.views}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{page.unique}</td>
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

      {/* --- MODALS (DIALOG POP-UP) --- */}
      
      {/* 1. Modal Traffic Details */}
      <AnimatePresence>
        {isTrafficModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsTrafficModalOpen(false)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden z-10">
              <div className="p-6 border-b border-border flex justify-between items-center">
                <h2 className="text-xl font-bold text-foreground">Traffic Details</h2>
                <button onClick={() => setIsTrafficModalOpen(false)} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-muted-foreground">Comprehensive breakdown of all incoming traffic sources over the selected period.</p>
                {/* Dummy Detail Data */}
                <div className="space-y-3 pt-2">
                  {trafficSources.map(s => (
                    <div key={s.name} className="flex justify-between items-center p-3 bg-muted/50 rounded-xl border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${s.color}`} />
                        <span className="font-medium text-sm text-foreground">{s.name}</span>
                      </div>
                      <span className="font-bold text-sm text-foreground">{s.pct}% <span className="text-xs text-muted-foreground font-normal ml-2">({(s.pct * 124.5).toFixed(0)} visitors)</span></span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Modal Add New Focus */}
      <AnimatePresence>
        {isAddFocusModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddFocusModalOpen(false)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden z-10">
              <div className="p-6 border-b border-border flex justify-between items-center">
                <h2 className="text-xl font-bold text-foreground">Add New Focus Task</h2>
                <button onClick={() => setIsAddFocusModalOpen(false)} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Task Title</label>
                  <input type="text" value={newFocusTitle} onChange={(e) => setNewFocusTitle(e.target.value)} autoFocus placeholder="e.g., Q3 Marketing Review" className="w-full bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-2 text-sm outline-none transition-all text-foreground" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Short Description</label>
                  <textarea value={newFocusDesc} onChange={(e) => setNewFocusDesc(e.target.value)} placeholder="Brief details about the task..." rows={3} className="w-full bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-2 text-sm outline-none transition-all text-foreground resize-none" />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button onClick={() => setIsAddFocusModalOpen(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                  <button onClick={handleAddNewFocus} disabled={!newFocusTitle.trim()} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity">Add Focus</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}