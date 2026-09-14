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

  // Identitas user yang stabil. Saat pindah/alt-tab, Supabase me-refresh sesi dan
  // menghasilkan OBJEK user baru walau id-nya sama; kalau kita bereaksi ke objeknya,
  // company akan dimuat ulang dan memunculkan skeleton (terasa seperti refresh).
  // Cukup bereaksi ke id-nya saja.
  const authUserId = user?.id ?? null;

  const requestIdRef = useRef(0);
  const mountedRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const companyIdRef = useRef<string | null>(null);
  const userRef = useRef(user);

  // Simpan objek user terbaru untuk dipakai loadCompany tanpa menjadikannya dependency.
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const loadCompany = useCallback(async (showInitialLoading = false) => {
    const requestId = ++requestIdRef.current;

    try {
      if (showInitialLoading) {
        setIsCompanyLoading(true);
      } else if (hasLoadedRef.current) {
        setIsCompanyRefreshing(true);
      }

      setCompanyError(null);
      const company = await getCurrentCompany(userRef.current);

      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      const nextCompanyId = company?.companyId ?? null;
      companyIdRef.current = nextCompanyId;
      setCompanyId(nextCompanyId);
      setUserId(company?.userId ?? null);
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
  }, []);

  const refreshCompany = useCallback(async () => {
    clearCompanyCache();
    await loadCompany(!hasLoadedRef.current && !companyIdRef.current);
  }, [loadCompany]);

  useEffect(() => {
    mountedRef.current = true;

    const initialize = async () => {
      if (isAuthLoading) return;

      if (!authUserId) {
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

    void initialize();

    return () => {
      mountedRef.current = false;
    };
    // Sengaja hanya bergantung pada authUserId (bukan objek user) supaya
    // company tidak dimuat ulang setiap kali sesi di-refresh saat pindah tab.
  }, [isAuthLoading, authUserId, loadCompany]);

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
