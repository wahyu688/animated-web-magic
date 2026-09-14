-- ============================================================================
-- NexusFlow — Full database setup for Supabase
-- Date: 2026-09-14
--
-- Jalankan file ini SEKALI di Supabase Dashboard > SQL Editor > New query.
-- Idempotent: aman dijalankan ulang (CREATE IF NOT EXISTS / DROP POLICY IF EXISTS).
--
-- Mencakup:
--   1. Semua tabel yang dipakai aplikasi
--   2. Trigger auto-create user_profiles saat signup
--   3. Helper functions (SECURITY DEFINER) agar RLS tidak infinite-recursion
--   4. RLS policies untuk semua tabel
--   5. Storage bucket "avatars" + policies
--   6. Realtime publication untuk tabel yang di-subscribe aplikasi
-- ============================================================================

-- ============================================================
-- 1. TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.companies (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  created_by  uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text,
  first_name  text DEFAULT '',
  last_name   text DEFAULT '',
  bio         text DEFAULT '',
  timezone    text DEFAULT 'Western Indonesia Time (WIB)',
  avatar_url  text,
  company_id  uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  role        text DEFAULT 'member',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.company_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'member',   -- owner | admin | member
  status      text NOT NULL DEFAULT 'active',   -- active | inactive
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, company_id)
);

CREATE TABLE IF NOT EXISTS public.invitations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email       text NOT NULL,
  status      text NOT NULL DEFAULT 'pending',  -- pending | accepted | declined
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type        text DEFAULT 'success',           -- success | warning | mention | upload | commit | invite
  user_name   text DEFAULT 'System',
  action      text NOT NULL,
  target      text DEFAULT '',
  message     text DEFAULT '',
  time        text DEFAULT 'Just now',
  unread      boolean DEFAULT true,
  icon_name   text DEFAULT 'CheckCircle',
  icon_bg     text DEFAULT 'bg-success/10 text-success',
  has_action  boolean DEFAULT false,
  replies     jsonb DEFAULT '[]'::jsonb,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_settings (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications      boolean DEFAULT true,
  push_notifications       boolean DEFAULT true,
  marketing_notifications  boolean DEFAULT false,
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan           text NOT NULL,
  status         text NOT NULL DEFAULT 'active',
  billing_cycle  text,                          -- monthly | yearly
  expires_at     timestamptz,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kanban_tasks (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  column_id      text NOT NULL,
  title          text NOT NULL DEFAULT '',
  tag            text DEFAULT 'Draft',
  tag_color      text DEFAULT 'bg-secondary text-secondary-foreground',
  priority       text,                          -- high | medium | low | null
  comments       integer DEFAULT 0,
  attachments    integer DEFAULT 0,
  due_date       text,
  position       double precision NOT NULL DEFAULT 1000,
  description    text DEFAULT '',
  subtasks       jsonb DEFAULT '[]'::jsonb,
  activities     jsonb DEFAULT '[]'::jsonb,
  assignee_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assignee_name  text,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title        text NOT NULL,
  date_str     text NOT NULL,                   -- format YYYY-MM-DD
  time         text NOT NULL,
  duration     numeric DEFAULT 1,
  color        text DEFAULT 'bg-primary',
  description  text DEFAULT '',
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dashboard_kpis (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  total_revenue   text DEFAULT '$0',
  revenue_change  text DEFAULT '0%',
  revenue_trend   text DEFAULT 'stable',
  active_users    text DEFAULT '0',
  users_change    text DEFAULT '0%',
  users_trend     text DEFAULT 'stable',
  avg_session     text DEFAULT '0',
  session_change  text DEFAULT '0%',
  session_trend   text DEFAULT 'stable',
  churn_rate      text DEFAULT '0%',
  churn_change    text DEFAULT '0%',
  churn_trend     text DEFAULT 'stable',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chart_data (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  month         text NOT NULL,
  current_val   numeric DEFAULT 0,
  previous_val  numeric DEFAULT 0,
  sort_order    integer DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.top_pages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  page        text NOT NULL,
  views       numeric DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.traffic_sources (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name        text NOT NULL,
  pct         numeric DEFAULT 0,
  color       text DEFAULT 'bg-primary',
  created_at  timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_company_members_user     ON public.company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_company  ON public.company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_company    ON public.user_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_invitations_company      ON public.invitations(company_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email        ON public.invitations(lower(email));
CREATE INDEX IF NOT EXISTS idx_notifications_company    ON public.notifications(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id    ON public.user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_company    ON public.subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_company     ON public.kanban_tasks(company_id, position);
CREATE INDEX IF NOT EXISTS idx_calendar_events_company  ON public.calendar_events(company_id, date_str);
CREATE INDEX IF NOT EXISTS idx_dashboard_kpis_company   ON public.dashboard_kpis(company_id);
CREATE INDEX IF NOT EXISTS idx_chart_data_company       ON public.chart_data(company_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_top_pages_company        ON public.top_pages(company_id);
CREATE INDEX IF NOT EXISTS idx_traffic_sources_company  ON public.traffic_sources(company_id);

-- ============================================================
-- 2. TRIGGER: auto-create user_profiles saat user signup
--    (aplikasi tidak pernah INSERT user_profiles dari client,
--     jadi baris profil HARUS dibuat oleh trigger ini)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 3. HELPER FUNCTIONS untuk RLS
--    SECURITY DEFINER = bypass RLS di dalam function, sehingga
--    policy company_members tidak mengecek dirinya sendiri
--    (mencegah error "infinite recursion detected in policy")
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_company_member(cid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members cm
    WHERE cm.company_id = cid
      AND cm.user_id = auth.uid()
      AND cm.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_company_admin(cid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members cm
    WHERE cm.company_id = cid
      AND cm.user_id = auth.uid()
      AND cm.role IN ('owner', 'admin')
      AND cm.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_company_owner(cid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members cm
    WHERE cm.company_id = cid
      AND cm.user_id = auth.uid()
      AND cm.role = 'owner'
      AND cm.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_company_creator(cid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = cid AND c.created_by = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.has_pending_invitation(cid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.invitations i
    WHERE i.company_id = cid
      AND i.status = 'pending'
      AND lower(i.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
  );
$$;

GRANT EXECUTE ON FUNCTION
  public.is_company_member(uuid),
  public.is_company_admin(uuid),
  public.is_company_owner(uuid),
  public.is_company_creator(uuid),
  public.has_pending_invitation(uuid)
TO authenticated;

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.companies        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_tasks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_kpis   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_data       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.top_pages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_sources  ENABLE ROW LEVEL SECURITY;

-- ---------- companies ----------
DROP POLICY IF EXISTS companies_select ON public.companies;
CREATE POLICY companies_select ON public.companies
  FOR SELECT USING (
    public.is_company_member(id) OR created_by = auth.uid()
  );

DROP POLICY IF EXISTS companies_insert ON public.companies;
CREATE POLICY companies_insert ON public.companies
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS companies_update ON public.companies;
CREATE POLICY companies_update ON public.companies
  FOR UPDATE USING (public.is_company_owner(id))
  WITH CHECK (public.is_company_owner(id));

DROP POLICY IF EXISTS companies_delete ON public.companies;
CREATE POLICY companies_delete ON public.companies
  FOR DELETE USING (public.is_company_owner(id));

-- ---------- user_profiles ----------
DROP POLICY IF EXISTS user_profiles_select ON public.user_profiles;
CREATE POLICY user_profiles_select ON public.user_profiles
  FOR SELECT USING (
    id = auth.uid()
    OR (company_id IS NOT NULL AND public.is_company_member(company_id))
  );

DROP POLICY IF EXISTS user_profiles_insert ON public.user_profiles;
CREATE POLICY user_profiles_insert ON public.user_profiles
  FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS user_profiles_update ON public.user_profiles;
CREATE POLICY user_profiles_update ON public.user_profiles
  FOR UPDATE USING (
    id = auth.uid()
    OR (company_id IS NOT NULL AND public.is_company_admin(company_id))
  ) WITH CHECK (
    id = auth.uid()
    OR company_id IS NULL  -- admin melepas member dari workspace (set company_id = null)
    OR public.is_company_admin(company_id)
  );

-- ---------- company_members ----------
DROP POLICY IF EXISTS company_members_select ON public.company_members;
CREATE POLICY company_members_select ON public.company_members
  FOR SELECT USING (
    user_id = auth.uid() OR public.is_company_member(company_id)
  );

DROP POLICY IF EXISTS company_members_insert ON public.company_members;
CREATE POLICY company_members_insert ON public.company_members
  FOR INSERT WITH CHECK (
    public.is_company_admin(company_id)
    OR (
      user_id = auth.uid()
      AND (
        public.is_company_creator(company_id)     -- pembuat workspace jadi owner pertama
        OR public.has_pending_invitation(company_id)  -- terima undangan
      )
    )
  );

DROP POLICY IF EXISTS company_members_update ON public.company_members;
CREATE POLICY company_members_update ON public.company_members
  FOR UPDATE USING (
    public.is_company_admin(company_id) OR user_id = auth.uid()
  ) WITH CHECK (
    public.is_company_admin(company_id) OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS company_members_delete ON public.company_members;
CREATE POLICY company_members_delete ON public.company_members
  FOR DELETE USING (
    public.is_company_admin(company_id) OR user_id = auth.uid()
  );

-- ---------- invitations ----------
DROP POLICY IF EXISTS invitations_select ON public.invitations;
CREATE POLICY invitations_select ON public.invitations
  FOR SELECT USING (
    public.is_company_admin(company_id)
    OR lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
  );

DROP POLICY IF EXISTS invitations_insert ON public.invitations;
CREATE POLICY invitations_insert ON public.invitations
  FOR INSERT WITH CHECK (public.is_company_admin(company_id));

DROP POLICY IF EXISTS invitations_update ON public.invitations;
CREATE POLICY invitations_update ON public.invitations
  FOR UPDATE USING (
    public.is_company_admin(company_id)
    OR lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
  ) WITH CHECK (
    public.is_company_admin(company_id)
    OR lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
  );

DROP POLICY IF EXISTS invitations_delete ON public.invitations;
CREATE POLICY invitations_delete ON public.invitations
  FOR DELETE USING (
    public.is_company_admin(company_id)
    OR lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
  );

-- ---------- notifications ----------
-- Semua member aktif boleh baca/tulis notifikasi company-nya
-- (logActivity dipanggil oleh member biasa, bukan hanya admin)
DROP POLICY IF EXISTS notifications_select ON public.notifications;
DROP POLICY IF EXISTS notifications_access ON public.notifications;
DROP POLICY IF EXISTS notifications_all ON public.notifications;
CREATE POLICY notifications_all ON public.notifications
  FOR ALL USING (public.is_company_member(company_id))
  WITH CHECK (public.is_company_member(company_id));

-- ---------- user_settings ----------
DROP POLICY IF EXISTS user_settings_all ON public.user_settings;
CREATE POLICY user_settings_all ON public.user_settings
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------- subscriptions ----------
DROP POLICY IF EXISTS subscriptions_select ON public.subscriptions;
CREATE POLICY subscriptions_select ON public.subscriptions
  FOR SELECT USING (public.is_company_member(company_id));

DROP POLICY IF EXISTS subscriptions_insert ON public.subscriptions;
CREATE POLICY subscriptions_insert ON public.subscriptions
  FOR INSERT WITH CHECK (
    public.is_company_admin(company_id) OR public.is_company_creator(company_id)
  );

DROP POLICY IF EXISTS subscriptions_update ON public.subscriptions;
CREATE POLICY subscriptions_update ON public.subscriptions
  FOR UPDATE USING (public.is_company_admin(company_id))
  WITH CHECK (public.is_company_admin(company_id));

DROP POLICY IF EXISTS subscriptions_delete ON public.subscriptions;
CREATE POLICY subscriptions_delete ON public.subscriptions
  FOR DELETE USING (public.is_company_admin(company_id));

-- ---------- tabel data per-company (full akses untuk member aktif) ----------
DROP POLICY IF EXISTS kanban_tasks_all ON public.kanban_tasks;
CREATE POLICY kanban_tasks_all ON public.kanban_tasks
  FOR ALL USING (public.is_company_member(company_id))
  WITH CHECK (public.is_company_member(company_id));

DROP POLICY IF EXISTS calendar_events_all ON public.calendar_events;
CREATE POLICY calendar_events_all ON public.calendar_events
  FOR ALL USING (public.is_company_member(company_id))
  WITH CHECK (public.is_company_member(company_id));

DROP POLICY IF EXISTS dashboard_kpis_all ON public.dashboard_kpis;
CREATE POLICY dashboard_kpis_all ON public.dashboard_kpis
  FOR ALL USING (public.is_company_member(company_id))
  WITH CHECK (public.is_company_member(company_id));

DROP POLICY IF EXISTS chart_data_all ON public.chart_data;
CREATE POLICY chart_data_all ON public.chart_data
  FOR ALL USING (public.is_company_member(company_id))
  WITH CHECK (public.is_company_member(company_id));

DROP POLICY IF EXISTS top_pages_all ON public.top_pages;
CREATE POLICY top_pages_all ON public.top_pages
  FOR ALL USING (public.is_company_member(company_id))
  WITH CHECK (public.is_company_member(company_id));

DROP POLICY IF EXISTS traffic_sources_all ON public.traffic_sources;
CREATE POLICY traffic_sources_all ON public.traffic_sources
  FOR ALL USING (public.is_company_member(company_id))
  WITH CHECK (public.is_company_member(company_id));

-- ============================================================
-- 5. STORAGE: bucket "avatars" (public read, user upload sendiri)
--    Path upload dari aplikasi: avatars/<user_id>/<filename>
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_user_insert" ON storage.objects;
CREATE POLICY "avatars_user_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND split_part(name, '/', 2) = auth.uid()::text
  );

DROP POLICY IF EXISTS "avatars_user_update" ON storage.objects;
CREATE POLICY "avatars_user_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND split_part(name, '/', 2) = auth.uid()::text
  );

DROP POLICY IF EXISTS "avatars_user_delete" ON storage.objects;
CREATE POLICY "avatars_user_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND split_part(name, '/', 2) = auth.uid()::text
  );

-- ============================================================
-- 6. REALTIME: daftarkan tabel yang di-subscribe aplikasi
-- ============================================================

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'notifications', 'kanban_tasks', 'calendar_events',
    'dashboard_kpis', 'chart_data', 'top_pages', 'traffic_sources',
    'company_members', 'user_profiles', 'invitations'
  ]
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION
      WHEN duplicate_object THEN NULL;  -- sudah terdaftar, lewati
    END;
  END LOOP;
END;
$$;

-- Agar payload realtime UPDATE/DELETE membawa data baris lengkap
ALTER TABLE public.notifications   REPLICA IDENTITY FULL;
ALTER TABLE public.kanban_tasks    REPLICA IDENTITY FULL;
ALTER TABLE public.calendar_events REPLICA IDENTITY FULL;

-- ============================================================
-- SELESAI
-- ============================================================
