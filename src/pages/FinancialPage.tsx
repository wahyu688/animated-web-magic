import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Save, Loader2, Calculator, Receipt, TrendingUp, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../lib/supabase";
import { useCompany } from "@/hooks/use-company";
import { safeRemoveChannel, withSupabaseTimeout } from "@/lib/supabaseLifecycle";
import { useSupabaseResumeRecovery } from "@/hooks/use-supabase-resume-recovery";

const ALL_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const parseNum = (v: string) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatUSD = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

interface ChartDatum {
  id: string;
  company_id?: string;
  month: string;
  current_val: number;
  previous_val: number;
  sort_order: number;
}

export default function FinancialPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Data ID & Company ID untuk keperluan Insert/Update
  const [kpiId, setKpiId] = useState("");
  const [chartData, setChartData] = useState<ChartDatum[]>([]);
  const isMountedRef = useRef(false);
  const { companyId, isCompanyLoading, companyError } = useCompany();

  useEffect(() => {
    if (!isCompanyLoading && !companyId) {
      setIsLoading(false);
      setKpiId("");
      setChartData([]);
    }
  }, [companyId, isCompanyLoading]);

  // State Form Input Mentah (Raw Data)
  const [formData, setFormData] = useState({
    month: "Jan",

    // Revenue
    subscriptionRevenue: "",
    enterpriseRevenue: "",
    oneTimeRevenue: "",
    refunds: "",

    // Customers
    newCustomers: "",
    lostCustomers: "",
    activeCustomers: "",
    trialUsers: "",

    // Expenses
    payrollExpenses: "",
    marketingSpend: "",
    infrastructureCost: "",
    softwareLicenses: "",
    operationalExpenses: "",

    // Operations
    monthlyActiveUsers: "",
    avgSessionMinutes: "",
    supportTickets: ""
  });

  // Kalkulasi live — dipakai untuk panel ringkasan DAN saat menyimpan,
  // supaya angka yang dilihat user persis sama dengan yang tersimpan.
  const metrics = useMemo(() => {
    const subscriptionRevenue = parseNum(formData.subscriptionRevenue);
    const enterpriseRevenue = parseNum(formData.enterpriseRevenue);
    const oneTimeRevenue = parseNum(formData.oneTimeRevenue);
    const refunds = parseNum(formData.refunds);

    const newCustomers = parseNum(formData.newCustomers);
    const lostCustomers = parseNum(formData.lostCustomers);
    const activeCustomers = parseNum(formData.activeCustomers);
    const monthlyActiveUsers = parseNum(formData.monthlyActiveUsers);
    const supportTickets = parseNum(formData.supportTickets);
    const sessionMins = parseNum(formData.avgSessionMinutes);

    const totalRevenue =
      subscriptionRevenue + enterpriseRevenue + oneTimeRevenue - refunds;

    const totalExpenses =
      parseNum(formData.payrollExpenses) +
      parseNum(formData.marketingSpend) +
      parseNum(formData.infrastructureCost) +
      parseNum(formData.softwareLicenses) +
      parseNum(formData.operationalExpenses);

    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const churnRate = activeCustomers > 0 ? (lostCustomers / activeCustomers) * 100 : 0;
    const netCustomers = newCustomers - lostCustomers;

    // Cari revenue aktual bulan sebelumnya dari ledger (bukan angka buatan)
    const monthIdx = ALL_MONTHS.indexOf(formData.month);
    let prevRevenue: number | null = null;
    for (let i = monthIdx - 1; i >= 0; i--) {
      const row = chartData.find((c) => c.month === ALL_MONTHS[i]);
      if (row) {
        prevRevenue = row.current_val;
        break;
      }
    }

    const revenueGrowth =
      prevRevenue !== null && prevRevenue > 0
        ? ((totalRevenue - prevRevenue) / prevRevenue) * 100
        : null;

    return {
      totalRevenue, totalExpenses, netProfit, profitMargin, churnRate,
      netCustomers, newCustomers, lostCustomers, activeCustomers,
      monthlyActiveUsers, supportTickets, sessionMins, prevRevenue, revenueGrowth,
    };
  }, [formData, chartData]);

  const fetchFinanceData = useCallback(async (showLoading = false) => {
    if (!companyId) {
      if (showLoading) setIsLoading(false);
      return;
    }

    try {
      if (showLoading) setIsLoading(true);

      // Ambil data KPI dan Grafik
      const [kpiRes, chartRes] = await Promise.allSettled([
        withSupabaseTimeout(supabase.from('dashboard_kpis').select('id').eq('company_id', companyId).limit(1).maybeSingle(), "financial dashboard_kpis"),
        withSupabaseTimeout(supabase.from('chart_data').select('*').eq('company_id', companyId).order('sort_order', { ascending: true }), "financial chart_data")
      ]);

      const firstError =
        (kpiRes.status === "fulfilled" && kpiRes.value.error) ||
        (chartRes.status === "fulfilled" && chartRes.value.error) ||
        (kpiRes.status === "rejected" && kpiRes.reason) ||
        (chartRes.status === "rejected" && chartRes.reason);
      if (firstError) throw firstError;
      if (!isMountedRef.current) return;

      setKpiId(kpiRes.status === "fulfilled" ? kpiRes.value.data?.id ?? "" : "");
      setChartData(chartRes.status === "fulfilled" ? chartRes.value.data ?? [] : []);
    } catch (error) {
      console.error("Gagal memuat data:", error);
      toast({ title: "Fetch Error", description: "Failed to load financial data.", variant: "destructive" });
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, [companyId, toast]);

  useSupabaseResumeRecovery({
    enabled: Boolean(companyId),
    onRecover: () => fetchFinanceData(false),
  });

  // 1. Ambil Data Awal & ID Perusahaan
  useEffect(() => {
    isMountedRef.current = true;
    if (!companyId) return;
    fetchFinanceData(true);

    const channel = supabase.channel(`financial-metrics-realtime:${companyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dashboard_kpis', filter: `company_id=eq.${companyId}` }, () => fetchFinanceData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chart_data', filter: `company_id=eq.${companyId}` }, () => fetchFinanceData())
      .subscribe((status, error) => {
        console.info("[financial realtime] status:", status, error ?? "");
        if (status === 'SUBSCRIBED') fetchFinanceData();
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn("[financial realtime] disconnected; save fallback remains active.", { status, error });
        }
      });

    return () => {
      isMountedRef.current = false;
      safeRemoveChannel(channel);
    };
  }, [companyId, fetchFinanceData]);

  // 2. Fungsi Otomatisasi Perhitungan & Simpan => include dengan insert dan update
  const handleProcessAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) {
      toast({ title: "Company Error", description: "Company context belum tersedia.", variant: "destructive" });
      window.dispatchEvent(new CustomEvent('nexusflow:chart-updated'));
      return;
    }

    // --- VALIDASI INPUT ---
    const numericValues = Object.entries(formData)
      .filter(([key]) => key !== "month")
      .map(([, value]) => value);

    if (numericValues.every((v) => v.trim() === "")) {
      toast({ title: "Empty Report", description: "Isi minimal satu data keuangan sebelum menyimpan.", variant: "destructive" });
      return;
    }

    if (numericValues.some((v) => v.trim() !== "" && Number(v) < 0)) {
      toast({ title: "Invalid Input", description: "Nilai tidak boleh negatif. Gunakan kolom Refunds untuk pengurang revenue.", variant: "destructive" });
      return;
    }

    if (metrics.activeCustomers > 0 && metrics.lostCustomers > metrics.activeCustomers) {
      toast({ title: "Invalid Input", description: "Lost customers tidak boleh melebihi active customers.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);

    try {
      const {
        totalRevenue, churnRate, netCustomers, newCustomers, lostCustomers,
        activeCustomers, monthlyActiveUsers, supportTickets, sessionMins,
        prevRevenue, revenueGrowth,
      } = metrics;

      const kpiPayload = {
        total_revenue: formatUSD(totalRevenue),

        // Pertumbuhan revenue dibanding bulan sebelumnya yang tercatat di ledger.
        // Bulan pertama (belum ada pembanding) ditandai "New".
        revenue_change: revenueGrowth === null ? "New" : `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}%`,
        revenue_trend: revenueGrowth === null ? "stable" : revenueGrowth >= 0 ? "up" : "down",

        // KPI "Active Users" memakai MAU produk bila diisi; fallback ke paying customers.
        active_users: new Intl.NumberFormat('en-US').format(monthlyActiveUsers > 0 ? monthlyActiveUsers : activeCustomers),

        users_change: `${netCustomers >= 0 ? '+' : ''}${netCustomers} net`,
        users_trend: netCustomers > 0 ? "up" : netCustomers < 0 ? "down" : "stable",

        churn_rate: `${churnRate.toFixed(1)}%`,
        churn_change: `${lostCustomers} lost / ${newCustomers} new`,
        churn_trend: churnRate <= 5 ? "stable" : "down",

        avg_session: `${Math.floor(sessionMins)}m ${Math.round((sessionMins % 1) * 60)}s`,
        session_change: supportTickets > 0 ? `${supportTickets} tickets` : "Operational",
        session_trend: "stable"
      };

      // --- SIMPAN KPI ---
      if (kpiId) {
        // Jika sudah ada, Update
        const { error } = await supabase.from('dashboard_kpis').update(kpiPayload).eq('company_id', companyId).eq('id', kpiId);
        if (error) throw error;
      } else {
        // Jika akun baru kosong, Insert
        const kpiRes = await supabase.from('dashboard_kpis').insert({ company_id: companyId, ...kpiPayload }).select().maybeSingle();
        if (kpiRes.error) throw kpiRes.error;
        if (kpiRes.data) setKpiId(kpiRes.data.id);
      }

      // --- SIMPAN GRAFIK (CHART) ---
      // previous_val = revenue aktual bulan sebelumnya dari ledger,
      // bukan angka buatan — garis pembanding di chart jadi data nyata.
      const comparisonVal = prevRevenue ?? totalRevenue;
      const existingMonth = chartData.find(c => c.month === formData.month);
      if (existingMonth) {
        // Jika bulan ini sudah ada datanya, Update
        const { error } = await supabase.from('chart_data').update({ current_val: totalRevenue, previous_val: comparisonVal }).eq('company_id', companyId).eq('id', existingMonth.id);
        if (error) throw error;

        const updatedChart = chartData.map(c => c.id === existingMonth.id ? { ...c, current_val: totalRevenue, previous_val: comparisonVal } : c);
        setChartData(updatedChart);
      } else {
        // Jika bulan ini belum ada (akun baru), Insert
        const sortOrder = ALL_MONTHS.indexOf(formData.month) + 1;
        const chartRes = await supabase.from('chart_data').insert({
          company_id: companyId,
          month: formData.month,
          current_val: totalRevenue,
          previous_val: comparisonVal,
          sort_order: sortOrder
        }).select().maybeSingle();

        if (chartRes.error) throw chartRes.error;
        if (chartRes.data) {
          const newChartData = [...chartData, chartRes.data].sort((a, b) => a.sort_order - b.sort_order);
          setChartData(newChartData);
        }
      }

      // Reset form agar gampang input bulan berikutnya (Opsional)
      setFormData({
        month: formData.month,

        subscriptionRevenue: "",
        enterpriseRevenue: "",
        oneTimeRevenue: "",
        refunds: "",

        newCustomers: "",
        lostCustomers: "",
        activeCustomers: "",
        trialUsers: "",

        payrollExpenses: "",
        marketingSpend: "",
        infrastructureCost: "",
        softwareLicenses: "",
        operationalExpenses: "",

        monthlyActiveUsers: "",
        avgSessionMinutes: "",
        supportTickets: ""
      });

      toast({ 
        title: "Report Processed", 
        description: `Financial data for ${formData.month} successfully saved!`,
      });
      await fetchFinanceData();

    } catch (error) {
      console.error("Financial save error:", error);
      toast({ title: "Error", description: "Failed to process data.", variant: "destructive" });
      await fetchFinanceData();
    } finally {
      setIsProcessing(false);
    }
  };

  if ((isCompanyLoading && !companyId) || (Boolean(companyId) && isLoading)) return <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-6xl mx-auto">
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
                {/* Menggunakan daftar bulan permanen */}
                {ALL_MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="rounded-2xl border border-border/50 p-5 bg-muted/20 space-y-5">

              <h3 className="text-sm font-black uppercase tracking-wide text-primary">
                Revenue
              </h3>

              <div className="grid grid-cols-2 gap-4">

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">
                    Subscription Revenue
                  </label>

                  <input
                    type="number"
                    value={formData.subscriptionRevenue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        subscriptionRevenue: e.target.value
                      })
                    }
                    placeholder="e.g. 120000"
                    className="w-full px-4 py-2.5 bg-muted rounded-xl border-none text-sm focus:ring-2 focus:ring-primary/20 text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">
                    Enterprise Revenue
                  </label>

                  <input
                    type="number"
                    value={formData.enterpriseRevenue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        enterpriseRevenue: e.target.value
                      })
                    }
                    placeholder="e.g. 45000"
                    className="w-full px-4 py-2.5 bg-muted rounded-xl border-none text-sm focus:ring-2 focus:ring-primary/20 text-foreground"
                  />
                </div>

              </div>

              <div className="grid grid-cols-2 gap-4">

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">
                    One-Time Revenue
                  </label>

                  <input
                    type="number"
                    value={formData.oneTimeRevenue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        oneTimeRevenue: e.target.value
                      })
                    }
                    placeholder="e.g. 12000"
                    className="w-full px-4 py-2.5 bg-muted rounded-xl border-none text-sm focus:ring-2 focus:ring-primary/20 text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">
                    Refunds / Discounts
                  </label>

                  <input
                    type="number"
                    value={formData.refunds}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        refunds: e.target.value
                      })
                    }
                    placeholder="e.g. 3000"
                    className="w-full px-4 py-2.5 bg-muted rounded-xl border-none text-sm focus:ring-2 focus:ring-primary/20 text-foreground"
                  />
                </div>

              </div>

            </div>

            <div className="rounded-2xl border border-border/50 p-5 bg-muted/20 space-y-5">

              <h3 className="text-sm font-black uppercase tracking-wide text-primary">
                Customers
              </h3>

              <div className="grid grid-cols-2 gap-4">

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">
                    New Customers
                  </label>

                  <input
                    type="number"
                    value={formData.newCustomers}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        newCustomers: e.target.value
                      })
                    }
                    placeholder="e.g. 120"
                    className="w-full px-4 py-2.5 bg-muted rounded-xl border-none text-sm focus:ring-2 focus:ring-primary/20 text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">
                    Lost Customers
                  </label>

                  <input
                    type="number"
                    value={formData.lostCustomers}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lostCustomers: e.target.value
                      })
                    }
                    placeholder="e.g. 12"
                    className="w-full px-4 py-2.5 bg-muted rounded-xl border-none text-sm focus:ring-2 focus:ring-primary/20 text-foreground"
                  />
                </div>

              </div>

              <div className="grid grid-cols-2 gap-4">

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">
                    Active Customers
                  </label>

                  <input
                    type="number"
                    value={formData.activeCustomers}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        activeCustomers: e.target.value
                      })
                    }
                    placeholder="e.g. 1450"
                    className="w-full px-4 py-2.5 bg-muted rounded-xl border-none text-sm focus:ring-2 focus:ring-primary/20 text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">
                    Trial Users
                  </label>

                  <input
                    type="number"
                    value={formData.trialUsers}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        trialUsers: e.target.value
                      })
                    }
                    placeholder="e.g. 250"
                    className="w-full px-4 py-2.5 bg-muted rounded-xl border-none text-sm focus:ring-2 focus:ring-primary/20 text-foreground"
                  />
                </div>

              </div>

            </div>

            <div className="rounded-2xl border border-border/50 p-5 bg-muted/20 space-y-5">

              <h3 className="text-sm font-black uppercase tracking-wide text-destructive">
                Expenses
              </h3>

              <div className="grid grid-cols-2 gap-4">

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">
                    Payroll Expenses
                  </label>

                  <input
                    type="number"
                    value={formData.payrollExpenses}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payrollExpenses: e.target.value
                      })
                    }
                    placeholder="e.g. 45000"
                    className="w-full px-4 py-2.5 bg-muted rounded-xl border-none text-sm focus:ring-2 focus:ring-destructive/20 text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">
                    Marketing Spend
                  </label>

                  <input
                    type="number"
                    value={formData.marketingSpend}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        marketingSpend: e.target.value
                      })
                    }
                    placeholder="e.g. 12000"
                    className="w-full px-4 py-2.5 bg-muted rounded-xl border-none text-sm focus:ring-2 focus:ring-destructive/20 text-foreground"
                  />
                </div>

              </div>

              <div className="grid grid-cols-2 gap-4">

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">
                    Infrastructure Cost
                  </label>

                  <input
                    type="number"
                    value={formData.infrastructureCost}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        infrastructureCost: e.target.value
                      })
                    }
                    placeholder="e.g. 8000"
                    className="w-full px-4 py-2.5 bg-muted rounded-xl border-none text-sm focus:ring-2 focus:ring-destructive/20 text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">
                    Software Licenses
                  </label>

                  <input
                    type="number"
                    value={formData.softwareLicenses}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        softwareLicenses: e.target.value
                      })
                    }
                    placeholder="e.g. 3000"
                    className="w-full px-4 py-2.5 bg-muted rounded-xl border-none text-sm focus:ring-2 focus:ring-destructive/20 text-foreground"
                  />
                </div>

              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground">
                  Operational Expenses
                </label>

                <input
                  type="number"
                  value={formData.operationalExpenses}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      operationalExpenses: e.target.value
                    })
                  }
                  placeholder="e.g. 5000"
                  className="w-full px-4 py-2.5 bg-muted rounded-xl border-none text-sm focus:ring-2 focus:ring-destructive/20 text-foreground"
                />
              </div>

            </div>

            <div className="rounded-2xl border border-border/50 p-5 bg-muted/20 space-y-5">

              <h3 className="text-sm font-black uppercase tracking-wide text-info">
                Operations
              </h3>

              <div className="grid grid-cols-2 gap-4">

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">
                    Monthly Active Users
                  </label>

                  <input
                    type="number"
                    value={formData.monthlyActiveUsers}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        monthlyActiveUsers: e.target.value
                      })
                    }
                    placeholder="e.g. 25000"
                    className="w-full px-4 py-2.5 bg-muted rounded-xl border-none text-sm focus:ring-2 focus:ring-info/20 text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">
                    Support Tickets
                  </label>

                  <input
                    type="number"
                    value={formData.supportTickets}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        supportTickets: e.target.value
                      })
                    }
                    placeholder="e.g. 32"
                    className="w-full px-4 py-2.5 bg-muted rounded-xl border-none text-sm focus:ring-2 focus:ring-info/20 text-foreground"
                  />
                </div>

              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground">
                  Avg. Session Duration (Minutes)
                </label>

                <input
                  type="number"
                  step="0.1"
                  value={formData.avgSessionMinutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      avgSessionMinutes: e.target.value
                    })
                  }
                  placeholder="e.g. 6.5"
                  className="w-full px-4 py-2.5 bg-muted rounded-xl border-none text-sm focus:ring-2 focus:ring-info/20 text-foreground"
                />

                <p className="text-[10px] text-muted-foreground mt-1">
                  Example: 6.5 = 6m 30s
                </p>
              </div>

            </div>

            {/* RINGKASAN KALKULASI LIVE — review sebelum disimpan */}
            <div className="rounded-2xl border border-primary/20 p-5 bg-primary/5 space-y-3">
              <h3 className="text-sm font-black uppercase tracking-wide text-primary flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Calculated Summary — {formData.month}
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Revenue</span>
                  <span className="font-bold text-foreground font-mono">{formatUSD(metrics.totalRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Expenses</span>
                  <span className="font-bold text-foreground font-mono">{formatUSD(metrics.totalExpenses)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net Profit</span>
                  <span className={`font-bold font-mono ${metrics.netProfit >= 0 ? "text-success" : "text-destructive"}`}>
                    {formatUSD(metrics.netProfit)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Profit Margin</span>
                  <span className={`font-bold font-mono ${metrics.profitMargin >= 0 ? "text-success" : "text-destructive"}`}>
                    {metrics.profitMargin.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Churn Rate</span>
                  <span className="font-bold text-foreground font-mono">{metrics.churnRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net Customers</span>
                  <span className={`font-bold font-mono ${metrics.netCustomers >= 0 ? "text-success" : "text-destructive"}`}>
                    {metrics.netCustomers >= 0 ? "+" : ""}{metrics.netCustomers}
                  </span>
                </div>
                <div className="flex justify-between col-span-2">
                  <span className="text-muted-foreground">Growth vs previous month</span>
                  <span className="font-bold text-foreground font-mono">
                    {metrics.revenueGrowth === null
                      ? "— (no earlier month recorded)"
                      : `${metrics.revenueGrowth >= 0 ? "+" : ""}${metrics.revenueGrowth.toFixed(1)}% (prev ${formatUSD(metrics.prevRevenue ?? 0)})`}
                  </span>
                </div>
              </div>
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
            {chartData.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-success bg-success/10 px-3 py-1.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" /> Synced with Chart
              </span>
            )}
          </div>
          
          <div className="p-0 flex-1 overflow-x-auto">
            {chartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Receipt className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm">No financial data recorded yet.</p>
                <p className="text-xs mt-1 opacity-70">Submit a monthly report to start tracking.</p>
              </div>
            ) : (
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
                      <tr key={row.id} className="hover:bg-muted/30 transition-colors">
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
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
