import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Loader2, Calculator, Receipt, TrendingUp, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../lib/supabase";

export default function FinancialPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Data ID untuk update ke database
  const [kpiId, setKpiId] = useState("");
  const [chartData, setChartData] = useState<any[]>([]);

  // State Form Input Mentah (Raw Data)
  const [formData, setFormData] = useState({
    month: "Sep",
    actualRevenue: "",
    targetRevenue: "", // Digunakan sebagai pembanding (Previous Val)
    activeUsers: "",
    churnedUsers: "",
    avgSessionMinutes: ""
  });

  // 1. Ambil Data Awal
  useEffect(() => {
    const fetchFinanceData = async () => {
      setIsLoading(true);
      try {
        const [kpiRes, chartRes] = await Promise.all([
          supabase.from('dashboard_kpis').select('id').limit(1).maybeSingle(),
          supabase.from('chart_data').select('*').order('sort_order', { ascending: true })
        ]);

        if (kpiRes.data) setKpiId(kpiRes.data.id);
        if (chartRes.data) setChartData(chartRes.data);
      } catch (error) {
        console.error("Gagal memuat data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFinanceData();
  }, []);

  // 2. Fungsi Otomatisasi Perhitungan & Simpan
  const handleProcessAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // --- A. KONVERSI INPUT MENJADI ANGKA ---
      const rev = Number(formData.actualRevenue);
      const target = Number(formData.targetRevenue);
      const users = Number(formData.activeUsers);
      const churned = Number(formData.churnedUsers);
      const sessionMins = Number(formData.avgSessionMinutes);

      // --- B. RUMUS KALKULASI OTOMATIS (Sistem yang Bekerja) ---
      const revGrowth = target > 0 ? ((rev - target) / target) * 100 : 0;
      const revTrend = revGrowth >= 0 ? "up" : "down";

      const churnRate = users > 0 ? (churned / users) * 100 : 0;
      const churnTrend = churnRate <= 3 ? "stable" : "down"; // Jika di atas 3% anggap tren buruk (down)

      const formattedMins = Math.floor(sessionMins);
      const formattedSecs = Math.round((sessionMins % 1) * 60);

      // Siapkan payload untuk KPI Dashboard
      const kpiPayload = {
        total_revenue: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(rev),
        revenue_change: `${revGrowth >= 0 ? '+' : ''}${revGrowth.toFixed(1)}%`,
        revenue_trend: revTrend,
        
        active_users: new Intl.NumberFormat('en-US').format(users),
        users_change: "Live", 
        users_trend: "up",
        
        churn_rate: `${churnRate.toFixed(1)}%`,
        churn_change: "Calculated",
        churn_trend: churnTrend,
        
        avg_session: `${formattedMins}m ${formattedSecs}s`,
        session_change: "Live",
        session_trend: "stable"
      };

      // --- C. SIMPAN KE DATABASE ---
      // 1. Update KPI
      if (kpiId) {
        await supabase.from('dashboard_kpis').update(kpiPayload).eq('id', kpiId);
      }

      // 2. Update Grafik (Chart) untuk bulan yang dipilih
      const targetMonthId = chartData.find(c => c.month === formData.month)?.id;
      if (targetMonthId) {
        await supabase.from('chart_data')
          .update({ current_val: rev, previous_val: target })
          .eq('id', targetMonthId);
          
        // Refresh tabel lokal
        const updatedChart = chartData.map(c => 
          c.id === targetMonthId ? { ...c, current_val: rev, previous_val: target } : c
        );
        setChartData(updatedChart);
      }

      toast({ 
        title: "Report Processed", 
        description: `Financial data for ${formData.month} successfully calculated and saved!`,
      });

    } catch (error) {
      toast({ title: "Error", description: "Failed to process data.", variant: "destructive" });
    }
    setIsProcessing(false);
  };

  if (isLoading) return <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Financial Input</h1>
        <p className="text-muted-foreground mt-1">Enter your raw monthly operational data. The system will auto-calculate KPIs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* KOLOM KIRI: FORM INPUT RAW DATA */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-5 bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border bg-muted/30 flex items-center gap-3">
            <Calculator className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Monthly Report Entry</h2>
          </div>
          
          <form onSubmit={handleProcessAndSave} className="p-6 space-y-5 flex-1 bg-background">
            
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-foreground">Reporting Month</label>
              <select 
                value={formData.month} onChange={(e) => setFormData({...formData, month: e.target.value})} required
                className="w-full px-4 py-2.5 bg-muted rounded-xl border-none text-sm focus:ring-2 focus:ring-primary/20 cursor-pointer text-foreground"
              >
                {chartData.map(c => <option key={c.id} value={c.month}>{c.month}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground">Actual Revenue ($)</label>
                <input 
                  type="number" value={formData.actualRevenue} onChange={(e) => setFormData({...formData, actualRevenue: e.target.value})} required placeholder="e.g. 84230"
                  className="w-full px-4 py-2.5 bg-muted rounded-xl border-none text-sm focus:ring-2 focus:ring-primary/20 text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground">Target / Prev Rev ($)</label>
                <input 
                  type="number" value={formData.targetRevenue} onChange={(e) => setFormData({...formData, targetRevenue: e.target.value})} required placeholder="e.g. 75000"
                  className="w-full px-4 py-2.5 bg-muted rounded-xl border-none text-sm focus:ring-2 focus:ring-primary/20 text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground">Total Active Users</label>
                <input 
                  type="number" value={formData.activeUsers} onChange={(e) => setFormData({...formData, activeUsers: e.target.value})} required placeholder="e.g. 1240"
                  className="w-full px-4 py-2.5 bg-muted rounded-xl border-none text-sm focus:ring-2 focus:ring-primary/20 text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground">Churned Users</label>
                <input 
                  type="number" value={formData.churnedUsers} onChange={(e) => setFormData({...formData, churnedUsers: e.target.value})} required placeholder="e.g. 30"
                  className="w-full px-4 py-2.5 bg-muted rounded-xl border-none text-sm focus:ring-2 focus:ring-primary/20 text-foreground"
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-sm font-bold text-foreground">Avg. Session (Minutes)</label>
              <input 
                type="number" step="0.1" value={formData.avgSessionMinutes} onChange={(e) => setFormData({...formData, avgSessionMinutes: e.target.value})} required placeholder="e.g. 4.5"
                className="w-full px-4 py-2.5 bg-muted rounded-xl border-none text-sm focus:ring-2 focus:ring-primary/20 text-foreground"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Use decimals (e.g., 4.5 = 4m 30s)</p>
            </div>

            <button type="submit" disabled={isProcessing} className="w-full mt-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 shadow-primary-glow hover:opacity-90 transition-opacity disabled:opacity-50">
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Process & Sync to Dashboard
            </button>
          </form>
        </motion.div>

        {/* KOLOM KANAN: REVIEW GRAFIK */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-7 bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Receipt className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Annual Ledger</h2>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-success bg-success/10 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" /> Synced with Chart
            </span>
          </div>
          
          <div className="p-0 flex-1 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Month</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Actual Revenue</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Target / Prev</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {chartData.map((row) => {
                  const isUp = row.current_val >= row.previous_val;
                  return (
                    <tr key={row.id} className={`hover:bg-muted/30 transition-colors ${formData.month === row.month ? "bg-primary/5" : ""}`}>
                      <td className="px-6 py-4 font-bold text-foreground">{row.month}</td>
                      <td className="px-6 py-4 text-foreground font-mono">${row.current_val?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-muted-foreground font-mono">${row.previous_val?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        {isUp ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-success"><TrendingUp className="w-3.5 h-3.5" /> Hit</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-destructive">Miss</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}