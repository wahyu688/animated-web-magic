import { supabase } from "./supabase";

interface LogProps {
  user?: string;
  action: string;
  target?: string;
  message?: string;
  type?: "success" | "warning" | "mention" | "upload" | "commit" | "invite";
  iconName?: string;
  iconBg?: string;
  hasAction?: boolean; 
}

export const logActivity = async ({
  user = "System",
  action,
  target = "",
  message = "",
  type = "success",
  iconName = "CheckCircle",
  iconBg = "bg-success/10 text-success",
  hasAction = false 
}: LogProps) => {
  try {
    // Tembak data ke tabel notifications
    await supabase.from('notifications').insert([{
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
  } catch (error) {
    console.error("Gagal mencatat aktivitas:", error);
  }
};