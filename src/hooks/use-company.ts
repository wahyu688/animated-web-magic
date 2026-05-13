import { useCallback, useEffect, useRef, useState } from "react";
import { clearCompanyCache, getCurrentCompany } from "@/lib/company";
import { supabase } from "@/lib/supabase";

export function useCompany() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isCompanyLoading, setIsCompanyLoading] = useState(true);
  const [companyError, setCompanyError] = useState<Error | null>(null);

  const requestIdRef = useRef(0);
  const mountedRef = useRef(false);

  const loadCompany = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    try {
      setCompanyError(null);
      const company = await getCurrentCompany();

      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setCompanyId(company?.companyId ?? null);
      setUserId(company?.userId ?? null);
    } catch (error) {
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      console.error("Company context error:", error);

      setCompanyId(null);
      setUserId(null);

      setCompanyError(
        error instanceof Error
          ? error
          : new Error("Failed to load company context.")
      );
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setIsCompanyLoading(false);
      }
    }
  }, []);

  const refreshCompany = useCallback(async () => {
    clearCompanyCache();
    setIsCompanyLoading(true);
    await loadCompany();
  }, [loadCompany]);

  useEffect(() => {
    mountedRef.current = true;

    const initialize = async () => {
      setIsCompanyLoading(true);
      await loadCompany();
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mountedRef.current) return;
        clearCompanyCache();

        if (!session) {
          requestIdRef.current += 1;
          setCompanyId(null);
          setUserId(null);
          setCompanyError(null);
          setIsCompanyLoading(false);
          return;
        }

        setIsCompanyLoading(true);
        await loadCompany();
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
    companyError,
    refreshCompany,
    hasCompany: Boolean(companyId),
  };
}
