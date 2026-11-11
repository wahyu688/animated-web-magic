-- ============================================================
-- invitations.role: the role picked in "Invite Colleague".
-- Before this column the choice was dropped and every invitee
-- joined as 'member'. Values match company_members.role
-- ('admin' | 'editor' | 'member').
--
-- Safe to run more than once.
-- ============================================================

ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member';
