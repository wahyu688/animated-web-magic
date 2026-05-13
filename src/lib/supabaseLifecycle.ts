import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabase";

const DEFAULT_SUPABASE_TIMEOUT_MS = 12000;

export const withSupabaseTimeout = async <T>(
  promise: PromiseLike<T>,
  label: string,
  timeoutMs = DEFAULT_SUPABASE_TIMEOUT_MS
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([Promise.resolve(promise), timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

export const safeRemoveChannel = (channel: RealtimeChannel | null | undefined) => {
  if (!channel) return;

  void supabase.removeChannel(channel).catch((error) => {
    console.warn("[supabase realtime] failed to remove channel safely:", error);
  });
};

export const refreshAuthSessionSafely = async () => {
  try {
    const { data, error } = await withSupabaseTimeout(
      supabase.auth.refreshSession(),
      "auth.refreshSession",
      8000
    );

    if (error) {
      console.warn("[supabase auth] refreshSession failed; falling back to getSession.", error);
      return withSupabaseTimeout(supabase.auth.getSession(), "auth.getSession fallback", 8000);
    }

    return { data, error: null };
  } catch (error) {
    console.warn("[supabase auth] refreshSession threw; falling back to getSession.", error);
    return withSupabaseTimeout(supabase.auth.getSession(), "auth.getSession fallback", 8000);
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
