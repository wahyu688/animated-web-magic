import { useEffect, useRef } from "react";
import { reconnectRealtimeSafely, refreshAuthSessionSafely } from "@/lib/supabaseLifecycle";

let globalRecoveryPromise: Promise<void> | null = null;
let lastGlobalRecoveryAt = 0;

interface UseSupabaseResumeRecoveryOptions {
  enabled?: boolean;
  minIntervalMs?: number;
  onRecover?: () => void | Promise<void>;
}

export function useSupabaseResumeRecovery({
  enabled = true,
  minIntervalMs = 2500,
  onRecover,
}: UseSupabaseResumeRecoveryOptions = {}) {
  const lastCallbackRef = useRef(0);
  const onRecoverRef = useRef(onRecover);

  useEffect(() => {
    onRecoverRef.current = onRecover;
  }, [onRecover]);

  useEffect(() => {
    if (!enabled) return;

    const recoverSupabaseCore = () => {
      const now = Date.now();
      if (globalRecoveryPromise) return globalRecoveryPromise;
      if (now - lastGlobalRecoveryAt < minIntervalMs) return Promise.resolve();

      lastGlobalRecoveryAt = now;
      globalRecoveryPromise = (async () => {
        await refreshAuthSessionSafely();
        reconnectRealtimeSafely();
      })().finally(() => {
        globalRecoveryPromise = null;
      });

      return globalRecoveryPromise;
    };

    const recover = async () => {
      if (document.visibilityState === "hidden") return;

      const now = Date.now();
      if (now - lastCallbackRef.current < minIntervalMs) return;
      lastCallbackRef.current = now;

      try {
        await recoverSupabaseCore();
        await onRecoverRef.current?.();
      } catch (error) {
        console.warn("[supabase lifecycle] tab resume recovery failed:", error);
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
  }, [enabled, minIntervalMs]);
}
