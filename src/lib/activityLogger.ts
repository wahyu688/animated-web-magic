import { supabase } from "./supabase";
import { getCurrentCompany } from "./company";

interface LogProps {
  user?: string;
  action: string;
  target?: string;
  message?: string;
  type?: "success" | "warning" | "mention" | "upload" | "commit" | "invite";
  iconName?: string;
  iconBg?: string;
  hasAction?: boolean; 
  companyId?: string;
}

/** "You" is resolved to the signed-in person's name so teammates see who did it. */
async function resolveActorName(user: string) {
  if (user !== "You") return user;
  const { data } = await supabase.auth.getSession();
  const authUser = data.session?.user;
  const meta = authUser?.user_metadata ?? {};
  const fullName = [meta.first_name, meta.last_name].filter(Boolean).join(" ").trim();
  return fullName || authUser?.email?.split("@")[0] || "A teammate";
}

export const logActivity = async ({
  user = "System",
  action,
  target = "",
  message = "",
  type = "success",
  iconName = "CheckCircle",
  iconBg = "bg-success/10 text-success",
  hasAction = false,
  companyId
}: LogProps) => {
  try {
    const scopedCompanyId = companyId ?? (await getCurrentCompany())?.companyId;
    if (!scopedCompanyId) throw new Error("Missing company_id for activity log.");
    const actorName = await resolveActorName(user);

    // Tembak data ke tabel notifications
    const { error } = await supabase.from('notifications').insert([{
      company_id: scopedCompanyId,
      type,
      user_name: actorName,
      action,
      target,
      message,
      time: "Just now",
      unread: true,
      icon_name: iconName,
      icon_bg: iconBg,
      has_action: hasAction 
    }]);

    if (error) throw error;
  } catch (error) {
    console.error("Gagal mencatat aktivitas:", error);
  }
};
