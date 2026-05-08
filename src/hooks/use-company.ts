import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentCompany } from "@/lib/company";
import { supabase } from "@/lib/supabase";

export function useCompany() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isCompanyLoading, setIsCompanyLoading] = useState(true);
  const [companyError, setCompanyError] = useState<Error | null>(null);

  const isFetchingRef = useRef(false);

  const loadCompany = useCallback(async () => {
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;

    setCompanyError(null);

    try {
      const company = await getCurrentCompany();

      setCompanyId(company?.companyId ?? null);
      setUserId(company?.userId ?? null);
    } catch (error) {
      console.error("Company context error:", error);

      setCompanyId(null);
      setUserId(null);

      setCompanyError(
        error instanceof Error
          ? error
          : new Error("Failed to load company context.")
      );
    } finally {
      setIsCompanyLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  const refreshCompany = useCallback(async () => {
    setIsCompanyLoading(true);
    await loadCompany();
  }, [loadCompany]);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      if (!mounted) return;

      setIsCompanyLoading(true);

      await loadCompany();
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      console.log("Auth state changed:", event);

      if (!mounted) return;

      loadCompany();
    });

    return () => {
      mounted = false;
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