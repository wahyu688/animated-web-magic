import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { refreshAuthSessionSafely, withSupabaseTimeout } from "@/lib/supabaseLifecycle";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isAuthLoading: boolean;
  isAuthRefreshing: boolean;
  authError: Error | null;
  refreshAuth: () => Promise<Session | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthRefreshing, setIsAuthRefreshing] = useState(false);
  const [authError, setAuthError] = useState<Error | null>(null);
  const mountedRef = useRef(false);
  const refreshPromiseRef = useRef<Promise<Session | null> | null>(null);
  const lastRefreshRef = useRef(0);

  const refreshAuth = useCallback(async () => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    const now = Date.now();
    if (now - lastRefreshRef.current < 5000) return session;

    lastRefreshRef.current = now;
    setIsAuthRefreshing(true);

    refreshPromiseRef.current = refreshAuthSessionSafely()
      .then(({ data, error }) => {
        if (error) throw error;
        const nextSession = data.session ?? null;
        if (mountedRef.current) {
          setSession(nextSession);
          setAuthError(null);
        }
        return nextSession;
      })
      .catch((error) => {
        const nextError = error instanceof Error ? error : new Error("Failed to refresh auth session.");
        if (mountedRef.current) setAuthError(nextError);
        console.warn("[auth] refresh failed:", error);
        return session;
      })
      .finally(() => {
        refreshPromiseRef.current = null;
        if (mountedRef.current) setIsAuthRefreshing(false);
      });

    return refreshPromiseRef.current;
  }, [session]);

  useEffect(() => {
    mountedRef.current = true;

    const bootstrap = async () => {
      try {
        const { data, error } = await withSupabaseTimeout(
          supabase.auth.getSession(),
          "auth provider bootstrap",
          8000
        );
        if (error) throw error;
        if (!mountedRef.current) return;
        setSession(data.session ?? null);
        setAuthError(null);
      } catch (error) {
        const nextError = error instanceof Error ? error : new Error("Failed to load auth session.");
        if (mountedRef.current) setAuthError(nextError);
        console.warn("[auth] bootstrap failed:", error);
      } finally {
        if (mountedRef.current) setIsAuthLoading(false);
      }
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      queueMicrotask(() => {
        if (!mountedRef.current) return;
        setSession(nextSession);
        setAuthError(null);
        setIsAuthLoading(false);
      });
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const recover = () => {
      if (document.visibilityState === "hidden") return;
      void refreshAuth();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") recover();
    };

    window.addEventListener("focus", recover);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", recover);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshAuth]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isAuthLoading,
        isAuthRefreshing,
        authError,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
