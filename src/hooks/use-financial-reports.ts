import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { safeRemoveChannel, withSupabaseTimeout } from "@/lib/supabaseLifecycle";
import type { ReportValues } from "@/lib/business";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface FinancialReport {
  id: string;
  year: number;
  month: number;
  /** "Nov" */
  label: string;
  /** "November 2026" */
  longLabel: string;
  /** Raw Financial form values; which keys exist depends on the business type. */
  raw: ReportValues;
}

/** Last 12 monthly reports for the company, oldest first. Empty if the table doesn't exist yet. */
export function useFinancialReports(companyId: string | null) {
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!companyId) {
      setReports([]);
      setIsLoading(false);
      return;
    }
    try {
      const { data, error } = await withSupabaseTimeout(
        supabase
          .from("financial_reports")
          .select("id, year, month, raw")
          .eq("company_id", companyId)
          .order("year", { ascending: false })
          .order("month", { ascending: false })
          .limit(12),
        "financial reports"
      );
      if (error) throw error;
      setReports(
        (data ?? [])
          .map((row) => ({
            ...row,
            label: MONTHS[row.month - 1],
            longLabel: new Date(row.year, row.month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" }),
            raw: (row.raw ?? {}) as ReportValues,
          }))
          .reverse()
      );
    } catch (error) {
      console.warn("financial_reports unavailable:", error);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void load();
    if (!companyId) return;
    const channel = supabase
      .channel(`financial-reports:${companyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "financial_reports", filter: `company_id=eq.${companyId}` }, () => void load())
      .subscribe();
    return () => safeRemoveChannel(channel);
  }, [companyId, load]);

  return { reports, isLoading, reload: load };
}
