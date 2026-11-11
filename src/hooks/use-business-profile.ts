import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { withSupabaseTimeout } from "@/lib/supabaseLifecycle";
import { LEGACY_BUSINESS_TYPE, getBusinessConfig, isBusinessType, type BusinessType } from "@/lib/business";
import { DEFAULT_CURRENCY, getCurrency, type CurrencyCode } from "@/lib/currency";

export const BUSINESS_PROFILE_UPDATED_EVENT = "nexusflow:business-profile-updated";

export interface BusinessProfile {
  businessType: BusinessType;
  currency: CurrencyCode;
}

const FALLBACK: BusinessProfile = { businessType: LEGACY_BUSINESS_TYPE, currency: DEFAULT_CURRENCY };

// One fetch per workspace, shared by every page that asks.
const cache = new Map<string, Promise<BusinessProfile>>();

function loadProfile(companyId: string) {
  let pending = cache.get(companyId);
  if (!pending) {
    pending = (async () => {
      const { data, error } = await withSupabaseTimeout(
        supabase.from("companies").select("business_type, currency").eq("id", companyId).maybeSingle(),
        "business profile"
      );
      if (error) {
        // e.g. the business_profile migration hasn't been run yet.
        console.warn("Business profile unavailable; using SaaS + USD.", error);
        return FALLBACK;
      }
      return {
        businessType: isBusinessType(data?.business_type) ? data.business_type : LEGACY_BUSINESS_TYPE,
        currency: getCurrency(data?.currency).code,
      };
    })().catch((error) => {
      cache.delete(companyId);
      console.warn("Business profile fetch failed:", error);
      return FALLBACK;
    });
    cache.set(companyId, pending);
  }
  return pending;
}

/** Call after changing a workspace's business type or currency. */
export function announceBusinessProfileChanged(companyId: string) {
  cache.delete(companyId);
  window.dispatchEvent(new CustomEvent(BUSINESS_PROFILE_UPDATED_EVENT, { detail: { companyId } }));
}

/** The workspace's business type (drives Financial fields + KPIs) and currency. */
export function useBusinessProfile(companyId: string | null) {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);

  useEffect(() => {
    if (!companyId) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    const load = () => loadProfile(companyId).then((next) => !cancelled && setProfile(next));
    void load();

    const onChange = (event: Event) => {
      if ((event as CustomEvent<{ companyId: string }>).detail?.companyId === companyId) void load();
    };
    window.addEventListener(BUSINESS_PROFILE_UPDATED_EVENT, onChange);
    return () => {
      cancelled = true;
      window.removeEventListener(BUSINESS_PROFILE_UPDATED_EVENT, onChange);
    };
  }, [companyId]);

  return {
    isLoading: Boolean(companyId) && profile === null,
    businessType: profile?.businessType ?? FALLBACK.businessType,
    currency: profile?.currency ?? FALLBACK.currency,
    config: getBusinessConfig(profile?.businessType ?? FALLBACK.businessType),
  };
}
