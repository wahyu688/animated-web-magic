import { useCallback, useEffect, useRef, useState } from "react";
import { clearCompanyCache, getCurrentCompany } from "@/lib/company";
import { supabase } from "@/lib/supabase";

export function useCompany() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isCompanyLoading, setIsCompanyLoading] = useState(true);
  const [isCompanyRefreshing, setIsCompanyRefreshing] = useState(false);
  const [companyError, setCompanyError] = useState<Error | null>(null);

  const requestIdRef = useRef(0);
  const mountedRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const companyIdRef = useRef<string | null>(null);

  const loadCompany = useCallback(async (showInitialLoading = false) => {
    const requestId = ++requestIdRef.current;

    try {
      if (showInitialLoading) {
        setIsCompanyLoading(true);
      } else if (hasLoadedRef.current) {
        setIsCompanyRefreshing(true);
      }

      setCompanyError(null);
      const company = await getCurrentCompany();

      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      const nextCompanyId = company?.companyId ?? null;
      companyIdRef.current = nextCompanyId;
      setCompanyId(nextCompanyId);
      setUserId(company?.userId ?? null);
    } catch (error) {
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      console.error("Company context error:", error);

      setCompanyId(null);
      companyIdRef.current = null;
      setUserId(null);

      setCompanyError(
        error instanceof Error
          ? error
          : new Error("Failed to load company context.")
      );
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        hasLoadedRef.current = true;
        setIsCompanyLoading(false);
        setIsCompanyRefreshing(false);
      }
    }
  }, []);

  const refreshCompany = useCallback(async () => {
    clearCompanyCache();
    await loadCompany(!hasLoadedRef.current && !companyIdRef.current);
  }, [loadCompany]);

  useEffect(() => {
    mountedRef.current = true;

    const initialize = async () => {
      await loadCompany(true);
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;
        clearCompanyCache();

        if (!session) {
          requestIdRef.current += 1;
          setCompanyId(null);
          companyIdRef.current = null;
          setUserId(null);
          setCompanyError(null);
          setIsCompanyLoading(false);
          setIsCompanyRefreshing(false);
          return;
        }

        const shouldUseInitialLoading =
          !hasLoadedRef.current && !companyIdRef.current && event !== "TOKEN_REFRESHED";

        await loadCompany(shouldUseInitialLoading);
      }
    );

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };

  }, [loadCompany]);

  return {
    companyId,
    userId,
    isCompanyLoading,
    isCompanyRefreshing,
    companyError,
    refreshCompany,
    hasCompany: Boolean(companyId),
  };
}
