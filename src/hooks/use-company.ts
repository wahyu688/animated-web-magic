import { useCallback, useEffect, useState } from "react";
import { getCurrentCompany } from "@/lib/company";
import { supabase } from "@/lib/supabase";

export function useCompany() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isCompanyLoading, setIsCompanyLoading] = useState(true);
  const [companyError, setCompanyError] = useState<Error | null>(null);

  const refreshCompany = useCallback(async () => {
    setIsCompanyLoading(true);
    setCompanyError(null);

    try {
      const company = await getCurrentCompany();
      setCompanyId(company?.companyId ?? null);
      setUserId(company?.userId ?? null);
    } catch (error) {
      setCompanyId(null);
      setUserId(null);
      setCompanyError(error instanceof Error ? error : new Error("Failed to load company context."));
    } finally {
      setIsCompanyLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadCompany = async () => {
      setIsCompanyLoading(true);
      setCompanyError(null);

      try {
        const company = await getCurrentCompany();
        if (!isMounted) return;
        setCompanyId(company?.companyId ?? null);
        setUserId(company?.userId ?? null);
      } catch (error) {
        if (!isMounted) return;
        setCompanyId(null);
        setUserId(null);
        setCompanyError(error instanceof Error ? error : new Error("Failed to load company context."));
      } finally {
        if (isMounted) setIsCompanyLoading(false);
      }
    };

    loadCompany();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadCompany();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    companyId,
    userId,
    isCompanyLoading,
    companyError,
    refreshCompany,
    hasCompany: Boolean(companyId),
  };
}
