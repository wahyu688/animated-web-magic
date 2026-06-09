import { useCallback, useEffect, useRef, useState } from "react";
import { clearCompanyCache, getCurrentCompany } from "@/lib/company";
import { useAuth } from "@/contexts/AuthContext";

export function useCompany() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isCompanyLoading, setIsCompanyLoading] = useState(true);
  const [isCompanyRefreshing, setIsCompanyRefreshing] = useState(false);
  const [companyError, setCompanyError] = useState<Error | null>(null);
  const { user, isAuthLoading } = useAuth();

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
      console.log("=== USE COMPANY LOAD START ===");
      console.log("AUTH USER FROM CONTEXT", user?.id);
      console.log("AUTH LOADING", isAuthLoading);
      const company = await getCurrentCompany(user);

      console.log("COMPANY RESULT FROM GET CURRENT COMPANY", company);
      console.log("COMPANY ID RETURNED", company?.companyId);
      console.log("USER ID RETURNED", company?.userId);

      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      const nextCompanyId = company?.companyId ?? null;
      companyIdRef.current = nextCompanyId;
      setCompanyId(nextCompanyId);
      setUserId(company?.userId ?? null);
      console.log("COMPANY STATE SET TO", nextCompanyId);
    } catch (error) {
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      console.error("Company context error:", error);

      if (!hasLoadedRef.current || !companyIdRef.current) {
        setCompanyId(null);
        companyIdRef.current = null;
        setUserId(null);
      }

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
  }, [user]);

  const refreshCompany = useCallback(async () => {
    clearCompanyCache();
    await loadCompany(!hasLoadedRef.current && !companyIdRef.current);
  }, [loadCompany]);

  useEffect(() => {
    mountedRef.current = true;

    const initialize = async () => {
      if (isAuthLoading) return;

      if (!user) {
        requestIdRef.current += 1;
        clearCompanyCache();
        companyIdRef.current = null;
        setCompanyId(null);
        setUserId(null);
        setCompanyError(null);
        setIsCompanyLoading(false);
        setIsCompanyRefreshing(false);
        hasLoadedRef.current = true;
        return;
      }

      await loadCompany(true);
    };

    initialize();

    return () => {
      mountedRef.current = false;
    };

  }, [isAuthLoading, loadCompany, user]);

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
