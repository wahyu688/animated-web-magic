import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { withSupabaseTimeout } from "@/lib/supabaseLifecycle";

export interface WorkspaceSummary {
  name: string;
  plan: string | null;
  status: string | null;
  expiresAt: string | null;
}

/** Workspace name + subscription, shown in the sidebar workspace card and trial card. */
export function useWorkspaceSummary(companyId: string | null) {
  const [summary, setSummary] = useState<WorkspaceSummary | null>(null);

  useEffect(() => {
    if (!companyId) {
      setSummary(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const [companyResult, subscriptionResult] = await Promise.all([
          withSupabaseTimeout(
            supabase.from("companies").select("name").eq("id", companyId).maybeSingle(),
            "workspace summary company"
          ),
          withSupabaseTimeout(
            supabase
              .from("subscriptions")
              .select("plan, status, expires_at")
              .eq("company_id", companyId)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
            "workspace summary subscription"
          ),
        ]);

        if (cancelled) return;
        if (companyResult.error) console.error("Workspace name fetch error:", companyResult.error);
        if (subscriptionResult.error) console.error("Subscription fetch error:", subscriptionResult.error);

        setSummary({
          name: companyResult.data?.name || "Workspace",
          plan: subscriptionResult.data?.plan ?? null,
          status: subscriptionResult.data?.status ?? null,
          expiresAt: subscriptionResult.data?.expires_at ?? null,
        });
      } catch (error) {
        console.warn("Workspace summary fetch timed out or failed:", error);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  return summary;
}
