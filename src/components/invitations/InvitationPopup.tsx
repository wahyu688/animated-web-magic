import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Mail, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { clearCompanyCache } from "@/lib/company";
import { useAuth } from "@/contexts/AuthContext";
import { withSupabaseTimeout } from "@/lib/supabaseLifecycle";

interface PendingInvite {
  id: string;
  company_id: string;
  email: string;
  status: string;
}

interface InvitationPopupProps {
  open: boolean;
  onClose: () => void;
  /** Dipanggil setelah invite di-accept/decline supaya badge count di navbar bisa refresh */
  onResolved?: () => void;
}

export default function InvitationPopup({ open, onClose, onResolved }: InvitationPopupProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [invite, setInvite] = useState<PendingInvite | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let isMounted = true;

    const checkInvitation = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!user?.email) {
          if (isMounted) setInvite(null);
          return;
        }

        const { data, error: fetchError } = await withSupabaseTimeout(
          supabase
            .from("invitations")
            .select("*")
            .eq("email", user.email.toLowerCase().trim())
            .eq("status", "pending")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          "invitation lookup"
        );

        if (!isMounted) return;
        if (fetchError) throw fetchError;
        setInvite(data ?? null);
      } catch (err) {
        console.error("Invitation lookup failed:", err);
        if (isMounted) {
          setInvite(null);
          setError("Unable to load your invitation. Please try again.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void checkInvitation();
    return () => {
      isMounted = false;
    };
  }, [open, user?.email]);

  const handleAccept = async () => {
    if (!user || !invite) return;
    setProcessing(true);
    setError(null);

    try {
      const { error: memberError } = await supabase
        .from("company_members")
        .upsert(
          [{ company_id: invite.company_id, user_id: user.id, role: "member", status: "active" }],
          { onConflict: "user_id,company_id" }
        );
      if (memberError) throw memberError;

      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({ company_id: invite.company_id, role: "member" })
        .eq("id", user.id);
      if (profileError) throw profileError;

      const { error: inviteError } = await supabase
        .from("invitations")
        .update({ status: "accepted" })
        .eq("id", invite.id);
      if (inviteError) throw inviteError;

      clearCompanyCache();
      onResolved?.();
      onClose();
      navigate("/dashboard");
    } catch (err) {
      console.error("Accept invite failed:", err);
      setError(err instanceof Error ? err.message : "Failed to accept the invitation.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!invite) return;
    setProcessing(true);
    setError(null);

    try {
      const { error: declineError } = await supabase
        .from("invitations")
        .update({ status: "declined" })
        .eq("id", invite.id);
      if (declineError) throw declineError;

      setInvite(null);
      onResolved?.();
      onClose();
    } catch (err) {
      console.error("Decline invite failed:", err);
      setError(err instanceof Error ? err.message : "Failed to decline the invitation.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: "spring", duration: 0.45 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl bg-card border border-border shadow-card-hover p-8"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {loading ? (
              <div className="py-8 flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Checking your invitation…</p>
              </div>
            ) : invite ? (
              <>
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <Mail className="h-7 w-7" />
                </div>
                <p className="text-xs font-black uppercase tracking-wide text-primary">
                  Workspace Invitation
                </p>
                <h3 className="text-xl font-bold text-foreground mt-1">You've been invited</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Accept this invitation to join your team's shared workspace and collaboration
                  dashboard.
                </p>

                {error && (
                  <p className="mt-4 rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-xs text-destructive break-words">
                    {error}
                  </p>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleAccept}
                    disabled={processing}
                    className="flex-1 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {processing && <Loader2 className="h-4 w-4 animate-spin" />}
                    Accept Invite
                  </button>
                  <button
                    onClick={handleDecline}
                    disabled={processing}
                    className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition disabled:opacity-60"
                  >
                    Decline
                  </button>
                </div>
              </>
            ) : (
              <div className="py-6 text-center">
                <h3 className="text-lg font-bold text-foreground mb-2">No pending invitations</h3>
                <p className="text-sm text-muted-foreground">
                  {error ?? "You don't have any workspace invitations right now."}
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
