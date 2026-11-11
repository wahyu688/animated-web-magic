-- ============================================================================
-- NexusFlow — Reset every RLS policy in the public schema
-- Date: 2026-11-11
--
-- Fixes: 42P17 "infinite recursion detected in policy for relation company_members".
-- That error means an old policy on company_members queries company_members
-- itself. Old policies can carry any name (from older migrations or ones made in
-- the Supabase dashboard), so this drops ALL of them instead of guessing names.
--
-- Run in Supabase Dashboard > SQL Editor, in this order:
--   1. this file
--   2. 2026-09-14_full_schema_setup.sql      (recreates every policy + helper functions)
--   3. 2026-11-11_financial_reports.sql      (its policy is dropped here too)
--   4. 2026-11-11_invitation_role.sql
--
-- Data is untouched. RLS stays enabled, so the app is locked out between steps
-- 1 and 2 — run them back to back.
-- ============================================================================

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    RAISE NOTICE 'Dropping policy % on %.%', pol.policyname, pol.schemaname, pol.tablename;
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END
$$;
