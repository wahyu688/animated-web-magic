import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Loader2, Mail, TriangleAlert } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { clearCompanyCache } from "@/lib/company";
import { useAuth } from "@/contexts/AuthContext";
import { withSupabaseTimeout } from "@/lib/supabaseLifecycle";
import { Button } from "@/components/ui/button";

interface PendingInvite {
  id: string;
  company_id: string;
  role?: string | null;
  companyName: string | null;
}

interface InvitationPopoverBodyProps {
  /** Changes whenever the popover opens so the list is re-fetched. */
  openKey: number;
  onClose: () => void;
  /** Called after an invite is accepted or declined so the navbar count can refresh. */
  onResolved?: () => void;
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function StateMessage({ icon, iconClass, title, body, bodyClass = "text-muted-foreground" }: {
  icon: React.ReactNode;
  iconClass: string;
  title?: string;
  body: string;
  bodyClass?: string;
}) {
  return (
    <div className="flex flex-col items-center px-4 py-6 text-center">
      <span className={`mb-3 flex h-11 w-11 items-center justify-center rounded-full ${iconClass}`}>{icon}</span>
      {title && <p className="text-label text-foreground">{title}</p>}
      <p className={`mt-1.5 max-w-[260px] text-caption font-normal ${bodyClass}`}>{body}</p>
    </div>
  );
}

/** Content of the "N invites" popover in the public navbar. */
export default function InvitationPopoverBody({ openKey, onClose, onResolved }: InvitationPopoverBodyProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<"accept" | "decline" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!user?.email) {
          if (isMounted) setInvites([]);
          return;
        }

        const { data, error: fetchError } = await withSupabaseTimeout(
          supabase
            .from("invitations")
            .select("*")
            .eq("email", user.email.toLowerCase().trim())
            .eq("status", "pending")
            .order("created_at", { ascending: false }),
          "invitation lookup"
        );
        if (fetchError) throw fetchError;

        const rows = data ?? [];
        // Invitees usually can't read the company row yet (RLS), so the name is best-effort.
        const names = new Map<string, string>();
        if (rows.length > 0) {
          const { data: companies } = await supabase
            .from("companies")
            .select("id, name")
            .in("id", rows.map((row) => row.company_id));
          companies?.forEach((company) => names.set(company.id, company.name));
        }

        if (!isMounted) return;
        setInvites(rows.map((row) => ({ ...row, companyName: names.get(row.company_id) ?? null })));
      } catch (err) {
        console.error("Invitation lookup failed:", err);
        if (isMounted) {
          setInvites([]);
          setError("Unable to load your invitations. Please try again.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, [openKey, user?.email]);

  const invite = invites[0];

  const handleAccept = async () => {
    if (!user || !invite) return;
    setProcessing("accept");
    setError(null);

    try {
      const { error: memberError } = await supabase
        .from("company_members")
        .upsert(
          [{ company_id: invite.company_id, user_id: user.id, role: invite.role || "member", status: "active" }],
          { onConflict: "user_id,company_id" }
        );
      if (memberError) throw memberError;

      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({ company_id: invite.company_id, role: invite.role || "member" })
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
      setProcessing(null);
    }
  };

  const handleDecline = async () => {
    if (!invite) return;
    setProcessing("decline");
    setError(null);

    try {
      const { error: declineError } = await supabase
        .from("invitations")
        .update({ status: "declined" })
        .eq("id", invite.id);
      if (declineError) throw declineError;

      setInvites((current) => current.slice(1));
      onResolved?.();
    } catch (err) {
      console.error("Decline invite failed:", err);
      setError(err instanceof Error ? err.message : "Failed to decline the invitation.");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-small text-muted-foreground">Checking your invitation…</p>
      </div>
    );
  }

  if (!invite) {
    return error ? (
      <StateMessage
        icon={<TriangleAlert className="h-5 w-5" strokeWidth={1.75} />}
        iconClass="bg-destructive-soft text-destructive"
        title="Couldn't load invitations"
        body={error}
        bodyClass="text-destructive"
      />
    ) : (
      <StateMessage
        icon={<Mail className="h-5 w-5" strokeWidth={1.75} />}
        iconClass="bg-surface-2 text-muted-foreground"
        title="No pending invitations"
        body="When a workspace invites you, it shows up here."
      />
    );
  }

  const workspaceName = invite.companyName ?? "A NexusFlow workspace";

  return (
    <div className="p-2">
      <p className="text-caption font-semibold uppercase tracking-[0.06em] text-primary-text">Workspace invitation</p>
      <div className="mt-3.5 flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-violet text-label text-white">
          {invite.companyName ? initialsOf(invite.companyName) : <Mail className="h-5 w-5" strokeWidth={1.75} />}
        </span>
        <div className="min-w-0">
          <p className="text-card-title text-[17px] text-foreground">You've been invited</p>
          <p className="truncate text-caption font-normal text-muted-foreground">{workspaceName}</p>
        </div>
      </div>
      <p className="mt-3.5 text-small text-muted-foreground">
        Accept this invitation to join your team's shared workspace and collaboration dashboard.
      </p>

      {error && (
        <p role="alert" className="mt-3 flex gap-2 rounded-lg bg-destructive-soft px-3 py-2 text-caption font-normal text-destructive">
          <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          <span className="break-words">{error}</span>
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={handleDecline} disabled={processing !== null} loading={processing === "decline"}>
          Decline
        </Button>
        <Button onClick={handleAccept} disabled={processing !== null} loading={processing === "accept"}>
          {processing !== "accept" && <Check />}
          Accept Invite
        </Button>
      </div>

      {invites.length > 1 && (
        <p className="mt-3.5 text-center text-caption font-normal text-subtle">1 of {invites.length}</p>
      )}
    </div>
  );
}
