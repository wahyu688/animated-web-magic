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

    // Tembak data ke tabel notifications
    const { error } = await supabase.from('notifications').insert([{
      company_id: scopedCompanyId,
      type,
      user_name: user,
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
