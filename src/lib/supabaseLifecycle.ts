import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export const safeRemoveChannel = (channel: RealtimeChannel | null | undefined) => {
  if (!channel) return;

  void supabase.removeChannel(channel).catch((error) => {
    console.warn("[supabase realtime] failed to remove channel safely:", error);
  });
};

export const refreshAuthSessionSafely = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.warn("[supabase auth] refreshSession failed; falling back to getSession.", error);
      return supabase.auth.getSession();
    }

    return { data, error: null };
  } catch (error) {
    console.warn("[supabase auth] refreshSession threw; falling back to getSession.", error);
    return supabase.auth.getSession();
  }
};

export const reconnectRealtimeSafely = () => {
  try {
    supabase.realtime.disconnect();
    supabase.realtime.connect();
  } catch (error) {
    console.warn("[supabase realtime] reconnect failed:", error);
  }
};
