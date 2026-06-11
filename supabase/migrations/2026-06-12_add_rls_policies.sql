-- Migration: Add/repair RLS policies for company_members, invitations, user_profiles, notifications
-- Date: 2026-06-12

-- Enable RLS if not already enabled
ALTER TABLE IF EXISTS public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;

-- ========== company_members policies ==========
-- Allow owners/admins to SELECT all members in their company. Allow users to select their own row.
DROP POLICY IF EXISTS company_members_select ON public.company_members;
CREATE POLICY company_members_select ON public.company_members
  FOR SELECT USING (
    (
      EXISTS (
        SELECT 1 FROM public.company_members cm
        WHERE cm.user_id = auth.uid()
          AND cm.company_id = company_members.company_id
          AND cm.role IN ('owner','admin')
      )
    )
    OR company_members.user_id = auth.uid()
  );

-- Allow owners/admins to INSERT members into their company.
-- Also allow a user to INSERT their own membership when there exists a pending invitation for their account.
DROP POLICY IF EXISTS company_members_insert ON public.company_members;
CREATE POLICY company_members_insert ON public.company_members
  FOR INSERT WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM public.company_members cm
        WHERE cm.user_id = auth.uid()
          AND cm.company_id = company_members.company_id
          AND cm.role IN ('owner','admin')
      )
    )
    OR (
      auth.uid() = company_members.user_id
      AND EXISTS (
        SELECT 1 FROM public.invitations i
        JOIN public.user_profiles up ON lower(up.email) = lower(i.email)
        WHERE up.id = auth.uid()
          AND i.company_id = company_members.company_id
          AND i.status = 'pending'
      )
    )
  );

-- Allow owners/admins to UPDATE member rows within the same company.
DROP POLICY IF EXISTS company_members_update ON public.company_members;
CREATE POLICY company_members_update ON public.company_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.company_id = company_members.company_id
        AND cm.role IN ('owner','admin')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.company_id = company_members.company_id
        AND cm.role IN ('owner','admin')
    )
  );

-- Allow owners/admins to DELETE member rows within the same company.
DROP POLICY IF EXISTS company_members_delete ON public.company_members;
CREATE POLICY company_members_delete ON public.company_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.company_id = company_members.company_id
        AND cm.role IN ('owner','admin')
    )
  );

-- ========== invitations policies ==========
-- Owners/admins can INSERT invitations for their company. Owners/admins can SELECT invitations for their company.
-- Invited users can SELECT their own invitation rows (by matching user_profiles.email).
DROP POLICY IF EXISTS invitations_insert ON public.invitations;
CREATE POLICY invitations_insert ON public.invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.company_id = invitations.company_id
        AND cm.role IN ('owner','admin')
    )
  );

DROP POLICY IF EXISTS invitations_select ON public.invitations;
CREATE POLICY invitations_select ON public.invitations
  FOR SELECT USING (
    (
      EXISTS (
        SELECT 1 FROM public.company_members cm
        WHERE cm.user_id = auth.uid()
          AND cm.company_id = invitations.company_id
          AND cm.role IN ('owner','admin')
      )
    )
    OR (
      EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.id = auth.uid()
          AND lower(up.email) = lower(invitations.email)
      )
    )
  );

-- Owners/admins and invited users can DELETE/UPDATE invitations: owners/admins manage invites; invited user can update (accept/decline) their own invitation.
DROP POLICY IF EXISTS invitations_update ON public.invitations;
CREATE POLICY invitations_update ON public.invitations
  FOR UPDATE USING (
    (
      EXISTS (
        SELECT 1 FROM public.company_members cm
        WHERE cm.user_id = auth.uid()
          AND cm.company_id = invitations.company_id
          AND cm.role IN ('owner','admin')
      )
    )
    OR (
      EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.id = auth.uid()
          AND lower(up.email) = lower(invitations.email)
      )
    )
  ) WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM public.company_members cm
        WHERE cm.user_id = auth.uid()
          AND cm.company_id = invitations.company_id
          AND cm.role IN ('owner','admin')
      )
    )
    OR (
      EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.id = auth.uid()
          AND lower(up.email) = lower(invitations.email)
      )
    )
  );

DROP POLICY IF EXISTS invitations_delete ON public.invitations;
CREATE POLICY invitations_delete ON public.invitations
  FOR DELETE USING (
    (
      EXISTS (
        SELECT 1 FROM public.company_members cm
        WHERE cm.user_id = auth.uid()
          AND cm.company_id = invitations.company_id
          AND cm.role IN ('owner','admin')
      )
    )
    OR (
      EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.id = auth.uid()
          AND lower(up.email) = lower(invitations.email)
      )
    )
  );

-- ========== user_profiles policies ==========
-- Users can SELECT/UPDATE their own profile. Owners/admins can SELECT profiles within their company.
DROP POLICY IF EXISTS user_profiles_select ON public.user_profiles;
CREATE POLICY user_profiles_select ON public.user_profiles
  FOR SELECT USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.company_id = user_profiles.company_id
        AND cm.role IN ('owner','admin')
    )
  );

DROP POLICY IF EXISTS user_profiles_update ON public.user_profiles;
CREATE POLICY user_profiles_update ON public.user_profiles
  FOR UPDATE USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.company_id = user_profiles.company_id
        AND cm.role IN ('owner','admin')
    )
  ) WITH CHECK (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.company_id = user_profiles.company_id
        AND cm.role IN ('owner','admin')
    )
  );

-- ========== notifications policies ==========
-- Owners/admins can INSERT notifications for their company. Company members can SELECT notifications for their company.
DROP POLICY IF EXISTS notifications_insert ON public.notifications;
CREATE POLICY notifications_insert ON public.notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.company_id = notifications.company_id
        AND cm.role IN ('owner','admin')
    )
  );

DROP POLICY IF EXISTS notifications_select ON public.notifications;
CREATE POLICY notifications_select ON public.notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.company_id = notifications.company_id
        AND cm.status = 'active'
    )
  );

-- End of migration
