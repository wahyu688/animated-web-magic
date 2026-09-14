-- Migration: Harden RLS policies for Settings-related tables
-- Date: 2026-06-13

-- companies: allow read for active company members, update only for owner
ALTER TABLE IF EXISTS public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS companies_select ON public.companies;
CREATE POLICY companies_select ON public.companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.company_id = companies.id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
  );

DROP POLICY IF EXISTS companies_update ON public.companies;
CREATE POLICY companies_update ON public.companies
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.company_id = companies.id
        AND cm.user_id = auth.uid()
        AND cm.role = 'owner'
        AND cm.status = 'active'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.company_id = companies.id
        AND cm.user_id = auth.uid()
        AND cm.role = 'owner'
        AND cm.status = 'active'
    )
  );

-- user_settings: allow each user to read/write only their own settings row
ALTER TABLE IF EXISTS public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_settings_select ON public.user_settings;
CREATE POLICY user_settings_select ON public.user_settings
  FOR SELECT USING (
    auth.uid() = user_settings.user_id
  );

DROP POLICY IF EXISTS user_settings_insert ON public.user_settings;
CREATE POLICY user_settings_insert ON public.user_settings
  FOR INSERT WITH CHECK (
    auth.uid() = user_settings.user_id
  );

DROP POLICY IF EXISTS user_settings_update ON public.user_settings;
CREATE POLICY user_settings_update ON public.user_settings
  FOR UPDATE USING (
    auth.uid() = user_settings.user_id
  ) WITH CHECK (
    auth.uid() = user_settings.user_id
  );

DROP POLICY IF EXISTS user_settings_delete ON public.user_settings;
CREATE POLICY user_settings_delete ON public.user_settings
  FOR DELETE USING (
    auth.uid() = user_settings.user_id
  );

-- invitations: restrict to same-company owners/admins and exact invited user access
ALTER TABLE IF EXISTS public.invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS invitations_insert ON public.invitations;
CREATE POLICY invitations_insert ON public.invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.company_id = invitations.company_id
        AND cm.role IN ('owner','admin')
        AND cm.status = 'active'
    )
  );

DROP POLICY IF EXISTS invitations_select ON public.invitations;
CREATE POLICY invitations_select ON public.invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.company_id = invitations.company_id
        AND cm.role IN ('owner','admin')
        AND cm.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND lower(up.email) = lower(invitations.email)
    )
  );

DROP POLICY IF EXISTS invitations_update ON public.invitations;
CREATE POLICY invitations_update ON public.invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.company_id = invitations.company_id
        AND cm.role IN ('owner','admin')
        AND cm.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND lower(up.email) = lower(invitations.email)
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.company_id = invitations.company_id
        AND cm.role IN ('owner','admin')
        AND cm.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND lower(up.email) = lower(invitations.email)
    )
  );

DROP POLICY IF EXISTS invitations_delete ON public.invitations;
CREATE POLICY invitations_delete ON public.invitations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.company_id = invitations.company_id
        AND cm.role IN ('owner','admin')
        AND cm.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND lower(up.email) = lower(invitations.email)
    )
  );

-- notifications: active members only, company-isolated
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_select ON public.notifications;
CREATE POLICY notifications_access ON public.notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.company_id = notifications.company_id
        AND cm.status = 'active'
    )
  );
