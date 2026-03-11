import { supabase } from "./supabase";

interface LogProps {
  user?: string;
  action: string;
  target?: string;
  message?: string;
  type?: "success" | "warning" | "mention" | "upload" | "commit" | "invite";
  iconName?: string;
  iconBg?: string;
  hasAction?: boolean; // <-- INI YANG KURANG TADI
}

export const logActivity = async ({
  user = "System",
  action,
  target = "",
  message = "",
  type = "success",
  iconName = "CheckCircle",
  iconBg = "bg-success/10 text-success",
  hasAction = false // <-- Tambahkan default valuenya di sini
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
      has_action: hasAction // <-- Kirim ke Supabase
    }]);
  } catch (error) {
    console.error("Gagal mencatat aktivitas:", error);
  }
};