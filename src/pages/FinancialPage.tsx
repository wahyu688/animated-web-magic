import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Loader2, DollarSign, TrendingUp, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../lib/supabase";

export default function FinancialPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingKpi, setIsSavingKpi] = useState(false);
  const [isSavingChart, setIsSavingChart] = useState(false);

  // State untuk Data KPI
  const [kpi, setKpi] = useState({
    id: "",
    company_id: "",
    total_revenue: "", revenue_change: "", revenue_trend: "stable",
    active_users: "", users_change: "", users_trend: "stable",
    avg_session: "", session_change: "", session_trend: "stable",
    churn_rate: "", churn_change: "", churn_trend: "stable"
  });

  // State untuk Data Grafik
  const [chartData, setChartData] = useState<any[]>([]);

  // 1. Ambil Data dari Database saat halaman dimuat
  useEffect(() => {
    const fetchFinanceData = async () => {
      setIsLoading(true);
      try {
        const [kpiRes, chartRes] = await Promise.all([
          supabase.from('dashboard_kpis').select('*').limit(1).single(),
          supabase.from('chart_data').select('*').order('sort_order', { ascending: true })
        ]);

        if (kpiRes.data) setKpi(kpiRes.data);
        if (chartRes.data) setChartData(chartRes.data);
      } catch (error) {
        console.error("Gagal memuat data finansial:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFinanceData();
  }, []);

  // 2. Handler Simpan KPI
  const handleSaveKpi = async () => {
    setIsSavingKpi(true);
    const { id, company_id, ...updateData } = kpi; // Pisahkan ID agar tidak ikut di-update
    
    const { error } = await supabase.from('dashboard_kpis').update(updateData).eq('id', kpi.id);
    
    if (error) {
      toast({ title: "Error", description: "Gagal menyimpan metrik KPI.", variant: "destructive" });
    } else {
      toast({ title: "Tersimpan", description: "Metrik KPI berhasil diperbarui!" });
    }
    setIsSavingKpi(false);
  };

  // 3. Handler Simpan Grafik Bulanan
  const handleSaveChart = async () => {
    setIsSavingChart(true);
    try {
      // Update setiap baris data grafik
      const updates = chartData.map(row => 
        supabase.from('chart_data').update({ current_val: row.current_val, previous_val: row.previous_val }).eq('id', row.id)
      );
      await Promise.all(updates);
      toast({ title: "Tersimpan", description: "Data grafik berhasil diperbarui!" });
    } catch (error) {
      toast({ title: "Error", description: "Gagal menyimpan data grafik.", variant: "destructive" });
    }
    setIsSavingChart(false);
  };

  const handleChartChange = (index: number, field: string, value: string) => {
    const newData = [...chartData];
    newData[index][field] = Number(value);
    setChartData(newData);
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Financial & Metrics</h1>
        <p className="text-muted-foreground mt-1">Manage the data displayed on your Dashboard and Analytics pages.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* KOLOM KIRI: EDIT KPI */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border bg-muted/30 flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Main KPI Metrics</h2>
          </div>
          
          <div className="p-6 space-y-6 flex-1">
            {/* Template Render untuk setiap Metrik */}
            {[
              { label: "Total Revenue", key: "total_revenue", changeKey: "revenue_change", trendKey: "revenue_trend" },
              { label: "Active Users", key: "active_users", changeKey: "users_change", trendKey: "users_trend" },
              { label: "Avg Session", key: "avg_session", changeKey: "session_change", trendKey: "session_trend" },
              { label: "Churn Rate", key: "churn_rate", changeKey: "churn_change", trendKey: "churn_trend" },
            ].map((metric) => (
              <div key={metric.key} className="p-4 rounded-xl border border-border bg-background space-y-3">
                <label className="text-sm font-bold text-foreground">{metric.label}</label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-3 sm:col-span-1">
                    <span className="text-xs text-muted-foreground mb-1 block">Main Value</span>
                    <input 
                      type="text" value={(kpi as any)[metric.key]} 
                      onChange={(e) => setKpi({...kpi, [metric.key]: e.target.value})}
                      className="w-full px-3 py-2 bg-muted rounded-lg border-none text-sm focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-xs text-muted-foreground mb-1 block">Change %</span>
                    <input 
                      type="text" value={(kpi as any)[metric.changeKey]} 
                      onChange={(e) => setKpi({...kpi, [metric.changeKey]: e.target.value})}
                      className="w-full px-3 py-2 bg-muted rounded-lg border-none text-sm focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="col-span-1">
                    <span className="text-xs text-muted-foreground mb-1 block">Trend</span>
                    <select 
                      value={(kpi as any)[metric.trendKey]} 
                      onChange={(e) => setKpi({...kpi, [metric.trendKey]: e.target.value})}
                      className="w-full px-3 py-2 bg-muted rounded-lg border-none text-sm focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    >
                      <option value="up">Up</option>
                      <option value="down">Down</option>
                      <option value="stable">Stable</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 border-t border-border bg-muted/30">
            <button onClick={handleSaveKpi} disabled={isSavingKpi} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
              {isSavingKpi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save KPI Data
            </button>
          </div>
        </motion.div>

        {/* KOLOM KANAN: EDIT GRAFIK BULANAN */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border bg-muted/30 flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Revenue Chart Data</h2>
          </div>
          
          <div className="p-0 flex-1 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 font-semibold text-muted-foreground">Month</th>
                  <th className="px-6 py-3 font-semibold text-muted-foreground">Current Val ($)</th>
                  <th className="px-6 py-3 font-semibold text-muted-foreground">Prev Val ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {chartData.map((row, index) => (
                  <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-3 font-bold text-foreground">{row.month}</td>
                    <td className="px-6 py-2">
                      <input 
                        type="number" value={row.current_val} 
                        onChange={(e) => handleChartChange(index, 'current_val', e.target.value)}
                        className="w-full px-3 py-1.5 bg-muted rounded-lg border-none text-sm focus:ring-2 focus:ring-primary/20"
                      />
                    </td>
                    <td className="px-6 py-2">
                      <input 
                        type="number" value={row.previous_val} 
                        onChange={(e) => handleChartChange(index, 'previous_val', e.target.value)}
                        className="w-full px-3 py-1.5 bg-muted rounded-lg border-none text-sm focus:ring-2 focus:ring-primary/20"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6 border-t border-border bg-muted/30">
            <button onClick={handleSaveChart} disabled={isSavingChart} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
              {isSavingChart ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Chart Data
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}