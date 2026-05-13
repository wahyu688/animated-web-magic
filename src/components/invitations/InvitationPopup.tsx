import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function InvitationPopup() {
  const navigate = useNavigate();

  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    checkInvitation();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(() => {
      checkInvitation();
    });

    return () => {
      subscription.unsubscribe();
    };

    
  }, []);

  const checkInvitation = async () => {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user?.email) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("invitations")
        .select("*")
        .eq("email", user.email.toLowerCase().trim())
        .eq("status", "pending")
        .maybeSingle();

        console.log("INVITE DATA:", data);
        console.log("INVITE ERROR:", error);
        console.log("USER EMAIL:", user?.email);
        
      if (!error && data) {
        setInvite(data);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user || !invite) return;

      await supabase
        .from("company_members")
        .insert({
          company_id: invite.company_id,
          user_id: user.id,
          role: "member"
        });

      await supabase
        .from("user_profiles")
        .update({
          company_id: invite.company_id
        })
        .eq("id", user.id);

      await supabase
        .from("invitations")
        .update({
          status: "accepted"
        })
        .eq("id", invite.id);

      navigate("/dashboard");

      window.location.reload();

    } catch (err) {
      console.error(err);
    }
  };

  const handleDecline = async () => {
    if (!invite) return;

    await supabase
      .from("invitations")
      .update({
        status: "declined"
      })
      .eq("id", invite.id);

    setInvite(null);
  };

  if (loading || !invite) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] w-[360px] rounded-2xl border border-border/50 bg-background/90 backdrop-blur-xl shadow-2xl p-5">

      <div className="space-y-3">

        <div>
          <p className="text-xs font-black uppercase tracking-wide text-primary">
            Workspace Invitation
          </p>

          <h3 className="text-lg font-bold text-foreground mt-1">
            You've been invited
          </h3>

          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Accept this invitation to join your team's shared workspace and collaboration dashboard.
          </p>
        </div>

        <div className="flex gap-3 pt-2">

          <button
            onClick={handleAccept}
            className="flex-1 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition"
          >
            Accept Invite
          </button>

          <button
            onClick={handleDecline}
            className="flex-1 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted transition"
          >
            Decline
          </button>

        </div>

      </div>

    </div>
  );
}