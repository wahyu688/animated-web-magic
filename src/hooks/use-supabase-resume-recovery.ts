import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { reconnectRealtimeSafely } from "@/lib/supabaseLifecycle";

/** Shorter trips away (a quick alt-tab) don't refetch anything. */
const REFETCH_AFTER_AWAY_MS = 60_000;
/** After this long the socket may be stale even if it reports connected. */
const RECONNECT_AFTER_AWAY_MS = 5 * 60_000;

// When the user last left the tab/window, and the latest return, shared by every hook instance.
let leftAt: number | null = null;
let lastReturn: { at: number; awayMs: number } | null = null;
let globalRecoveryPromise: Promise<void> | null = null;

if (typeof window !== "undefined") {
  const markLeft = () => {
    leftAt ??= Date.now();
  };
  window.addEventListener("blur", markLeft);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") markLeft();
  });
}

function realtimeIsConnected() {
  try {
    return supabase.realtime.isConnected();
  } catch {
    return false;
  }
}

interface UseSupabaseResumeRecoveryOptions {
  enabled?: boolean;
  onRecover?: () => void | Promise<void>;
}

/**
 * Quietly refreshes data when the user comes back after being away for a while.
 * Returns true only while a dropped realtime connection is being re-established.
 */
export function useSupabaseResumeRecovery({ enabled = true, onRecover }: UseSupabaseResumeRecoveryOptions = {}) {
  const [isReconnecting, setIsReconnecting] = useState(false);
  const onRecoverRef = useRef(onRecover);
  const handledReturnRef = useRef<number | null>(null);

  useEffect(() => {
    onRecoverRef.current = onRecover;
  }, [onRecover]);

  useEffect(() => {
    if (!enabled) return;

    const recover = async () => {
      if (document.visibilityState === "hidden") return;
      // focus and visibilitychange both fire on return; record the trip once for all instances.
      if (leftAt !== null) {
        lastReturn = { at: Date.now(), awayMs: Date.now() - leftAt };
        leftAt = null;
      }
      const isNewReturn = lastReturn !== null && handledReturnRef.current !== lastReturn.at;
      if (isNewReturn) handledReturnRef.current = lastReturn!.at;
      const awayMs = isNewReturn ? lastReturn!.awayMs : 0;

      const needsReconnect = !realtimeIsConnected() || awayMs >= RECONNECT_AFTER_AWAY_MS;
      if (!needsReconnect && awayMs < REFETCH_AFTER_AWAY_MS) return;

      try {
        if (needsReconnect) {
          setIsReconnecting(true);
          globalRecoveryPromise ??= Promise.resolve(reconnectRealtimeSafely()).finally(() => {
            globalRecoveryPromise = null;
          });
          await globalRecoveryPromise;
        }
        await onRecoverRef.current?.();
      } catch (error) {
        console.warn("[supabase lifecycle] tab resume recovery failed:", error);
      } finally {
        setIsReconnecting(false);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void recover();
    };

    window.addEventListener("focus", recover);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", recover);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled]);

  return isReconnecting;
}
