-- ============================================================
-- financial_reports: one row per company per month with the raw
-- numbers entered on the Financial page. dashboard_kpis and
-- chart_data keep their pre-formatted values for the Dashboard;
-- Analytics reads the breakdowns (revenue by type, expenses,
-- customers, support) from here.
--
-- Safe to run more than once.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.financial_reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  year        integer NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  month       integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  -- Raw form values, e.g. {"subscriptionRevenue": 120000, "payrollExpenses": 45000, ...}
  raw         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by  uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (company_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_financial_reports_company
  ON public.financial_reports(company_id, year DESC, month DESC);

ALTER TABLE public.financial_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS financial_reports_all ON public.financial_reports;
CREATE POLICY financial_reports_all ON public.financial_reports
  FOR ALL USING (public.is_company_member(company_id))
  WITH CHECK (public.is_company_member(company_id));

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.financial_reports;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;
