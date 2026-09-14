-- ============================================================================
-- Seed data finansial contoh untuk Financial Page / Dashboard
-- Company: bc8ab696-1a47-48ec-ac7a-4df440a07e33
--
-- Jalankan di Supabase Dashboard > SQL Editor > New query > Run.
-- Idempotent: menghapus data lama company ini dulu, jadi aman diulang.
--
-- Skenario: B2B SaaS bertumbuh. Jan (dasar) -> Feb -> Mar naik,
-- lalu Apr turun (churn naik) supaya tren tidak selalu hijau.
-- Angka current_val/previous_val & KPI dihitung sama persis dengan
-- logika di FinancialPage.tsx.
-- ============================================================================

DO $$
DECLARE
  cid uuid := 'bc8ab696-1a47-48ec-ac7a-4df440a07e33';
BEGIN
  -- Bersihkan data lama company ini
  DELETE FROM public.chart_data     WHERE company_id = cid;
  DELETE FROM public.dashboard_kpis WHERE company_id = cid;

  -- ---------- CHART DATA (ledger revenue per bulan) ----------
  -- current_val  = total revenue bulan itu
  -- previous_val = revenue aktual bulan sebelumnya (bulan pertama = dirinya sendiri)
  INSERT INTO public.chart_data (company_id, month, current_val, previous_val, sort_order) VALUES
    (cid, 'Jan', 122500, 122500, 1),  -- Jan: 82000+35000+8000-2500
    (cid, 'Feb', 140000, 122500, 2),  -- Feb: 95000+42000+6000-3000  (+14.3% vs Jan)
    (cid, 'Mar', 170000, 140000, 3),  -- Mar: 110000+55000+9000-4000 (+21.4% vs Feb)
    (cid, 'Apr', 154000, 170000, 4);  -- Apr: 108000+50000+5000-9000 (-9.4% vs Mar)

  -- ---------- DASHBOARD KPI (mencerminkan bulan terakhir diproses: April) ----------
  INSERT INTO public.dashboard_kpis (
    company_id,
    total_revenue, revenue_change, revenue_trend,
    active_users,  users_change,   users_trend,
    churn_rate,    churn_change,   churn_trend,
    avg_session,   session_change, session_trend
  ) VALUES (
    cid,
    '$154,000', '-9.4%', 'down',              -- revenue turun vs Maret
    '30,200',   '+25 net', 'up',              -- MAU April; net customers = 120-95
    '6.4%',     '95 lost / 120 new', 'down',  -- churn April naik di atas 5%
    '6m 54s',   '88 tickets', 'stable'        -- avg session 6.9 menit
  );
END $$;

-- Cek hasil:
-- select month, current_val, previous_val from public.chart_data
--   where company_id = 'bc8ab696-1a47-48ec-ac7a-4df440a07e33' order by sort_order;
-- select * from public.dashboard_kpis
--   where company_id = 'bc8ab696-1a47-48ec-ac7a-4df440a07e33';
