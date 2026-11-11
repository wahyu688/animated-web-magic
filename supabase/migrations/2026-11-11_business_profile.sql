-- ============================================================================
-- NexusFlow — Business type + currency per workspace
-- Date: 2026-11-11
--
-- business_type decides which numbers the Financial page asks for and which KPIs
-- the Dashboard and Analytics show. currency is used to display every amount.
-- Workspaces that already exist used the SaaS form in USD, so that's the default;
-- new workspaces pick their own during Pricing checkout.
--
-- Run after 2026-09-14_full_schema_setup.sql. Safe to run more than once.
-- ============================================================================

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS business_type text NOT NULL DEFAULT 'saas',
  ADD COLUMN IF NOT EXISTS currency      text NOT NULL DEFAULT 'USD';

DO $$
BEGIN
  ALTER TABLE public.companies
    ADD CONSTRAINT companies_business_type_check
    CHECK (business_type IN ('agency', 'saas', 'general'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER TABLE public.companies
    ADD CONSTRAINT companies_currency_check
    CHECK (currency IN ('IDR', 'USD', 'SGD', 'CNY', 'JPY', 'EUR'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;
