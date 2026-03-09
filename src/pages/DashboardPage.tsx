import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Users, DollarSign, Clock, BarChart3, ArrowUpRight, Minus } from "lucide-react";

const stats = [
  { label: "Total Revenue", value: "$124,500", change: "+12.5%", trend: "up" as const, icon: DollarSign, color: "text-primary" },
  { label: "Active Users", value: "1,240", change: "+3.2%", trend: "up" as const, icon: Users, color: "text-info" },
  { label: "Avg. Session", value: "4m 32s", change: "-1.1%", trend: "down" as const, icon: Clock, color: "text-warning" },
  { label: "Churn Rate", value: "2.4%", change: "Stable", trend: "stable" as const, icon: BarChart3, color: "text-muted-foreground" },
];

const topPages = [
  { name: "/dashboard", views: "24,120", unique: "18,200", bounce: "32%", trend: "up" },
  { name: "/pricing", views: "18,400", unique: "14,300", bounce: "28%", trend: "up" },
  { name: "/features", views: "12,800", unique: "9,600", bounce: "45%", trend: "down" },
  { name: "/docs/quickstart", views: "8,200", unique: "6,100", bounce: "22%", trend: "up" },
];

const trafficSources = [
  { name: "Direct", pct: 45, color: "bg-primary" },
  { name: "Social Media", pct: 32, color: "bg-violet-500" },
  { name: "Organic Search", pct: 18, color: "bg-info" },
  { name: "Referrals", pct: 5, color: "bg-warning" },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" },
  }),
};

export default function DashboardPage() {
  return (
    <div className="p-6 lg:p-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor your key performance metrics and business growth.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-muted rounded-xl p-1">
            {["7D", "30D", "3M", "1Y"].map((p, i) => (
              <button
                key={p}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  i === 0
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-primary-glow hover:opacity-90 transition-opacity">
            <ArrowUpRight className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="group relative overflow-hidden rounded-2xl bg-card border border-border p-6 shadow-card hover:shadow-card-hover transition-shadow"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <stat.icon className={`h-16 w-16 ${stat.color}`} />
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
            <h3 className="text-3xl font-bold text-foreground tracking-tight">{stat.value}</h3>
            <div className="flex items-center mt-4">
              <span
                className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${
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
              <span className="text-xs text-muted-foreground ml-2">vs last month</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart + Traffic */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <motion.div
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
          {/* SVG Chart */}
          <div className="relative w-full h-[280px]">
            <svg className="w-full h-full" viewBox="0 0 1200 280" preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: "hsl(222 80% 45%)", stopOpacity: 0.2 }} />
                  <stop offset="100%" style={{ stopColor: "hsl(222 80% 45%)", stopOpacity: 0 }} />
                </linearGradient>
              </defs>
              {[0, 70, 140, 210, 280].map((y) => (
                <line key={y} x1="0" y1={y} x2="1200" y2={y} stroke="hsl(214 20% 92%)" strokeWidth="1" />
              ))}
              <path d="M0,200 C150,180 300,230 450,140 C600,50 750,90 900,70 C1050,50 1200,20 1200,20 V280 H0 Z" fill="url(#areaGrad)" />
              <motion.path
                d="M0,200 C150,180 300,230 450,140 C600,50 750,90 900,70 C1050,50 1200,20 1200,20"
                fill="none"
                stroke="hsl(222 80% 45%)"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
              <circle cx="450" cy="140" r="6" fill="hsl(222 80% 45%)" stroke="white" strokeWidth="3" />
              <circle cx="900" cy="70" r="6" fill="hsl(222 80% 45%)" stroke="white" strokeWidth="3" />
            </svg>
            <div className="flex justify-between mt-2 text-xs font-medium text-muted-foreground px-2">
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Traffic Sources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl border border-border shadow-card p-6"
        >
          <h2 className="text-lg font-bold text-foreground mb-6">Traffic Sources</h2>
          <div className="space-y-5">
            {trafficSources.map((s, i) => (
              <motion.div
                key={s.name}
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
          <div className="mt-6 pt-6 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Updated 2 mins ago</span>
            <a href="#" className="text-primary hover:underline font-medium">View Details</a>
          </div>
        </motion.div>
      </div>

      {/* Top Pages Table */}
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
          <button className="px-3 py-1 text-xs font-medium bg-muted border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">
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
              {topPages.map((page) => (
                <tr key={page.name} className="group hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground font-mono text-sm">{page.name}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{page.views}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{page.unique}</td>
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
