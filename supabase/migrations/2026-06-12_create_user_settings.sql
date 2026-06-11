-- Migration: create user_settings table for notification preferences

CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  marketing_notifications boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Optional: RLS policies may be applied in your Supabase console where appropriate.

-- Index for lookup
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
