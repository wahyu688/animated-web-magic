import { supabase } from "./supabase";

export interface CompanyContext {
  userId: string;
  companyId: string;
}

export async function getCurrentCompany(): Promise<CompanyContext | null> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;

  let companyId = data?.company_id ?? null;

  if (!companyId) {
    const { data: membership, error: membershipError } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (membershipError) throw membershipError;
    companyId = membership?.company_id ?? null;
  }

  if (!companyId) return null;

  return {
    userId: user.id,
    companyId,
  };
}
