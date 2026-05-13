import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";

export interface CompanyContext {
  userId: string;
  companyId: string;
  role?: string | null;
}

let companyPromise: Promise<CompanyContext | null> | null = null;
let cachedCompany: CompanyContext | null = null;
let cachedUserId: string | null = null;

function getProfileName(user: User) {
  const meta = user.user_metadata ?? {};
  return {
    first_name: typeof meta.first_name === "string" ? meta.first_name : "",
    last_name: typeof meta.last_name === "string" ? meta.last_name : "",
  };
}

export function clearCompanyCache() {
  companyPromise = null;
  cachedCompany = null;
  cachedUserId = null;
}


async function acceptPendingInvitation(user: User): Promise<CompanyContext | null> {
  const email = user.email?.toLowerCase();
  if (!email) return null;

  const { data: invitation, error: invitationError } = await supabase
    .from("invitations")
    .select("id, company_id, status")
    .eq("email", email)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (invitationError) throw invitationError;
  if (!invitation?.company_id) return null;

  const role = "member";

  const { data: existingMember, error: existingMemberError } = await supabase
    .from("company_members")
    .select("id")
    .eq("company_id", invitation.company_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingMemberError) throw existingMemberError;

  const memberWrite = existingMember
    ? supabase
        .from("company_members")
        .update({ role, status: "active" })
        .eq("id", existingMember.id)
    : supabase
        .from("company_members")
        .insert({ company_id: invitation.company_id, user_id: user.id, role, status: "active" });

  const { error: memberError } = await memberWrite;
  if (memberError) throw memberError;

  await Promise.all([
    supabase
      .from("invitations")
      .update({ status: "accepted" })
      .eq("id", invitation.id),
    supabase
      .from("user_profiles")
      .update({ company_id: invitation.company_id, role, updated_at: new Date().toISOString() })
      .eq("id", user.id),
  ]).then((results) => {
    const firstError = results.find((result) => result.error)?.error;
    if (firstError) throw firstError;
  });

  return {
    userId: user.id,
    companyId: invitation.company_id,
    role,
  };
}

async function loadCurrentCompany(): Promise<CompanyContext | null> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throw sessionError;
  if (!session?.user) return null;

  const user = session.user;

  const { data: membership, error: membershipError } = await supabase
    .from("company_members")
    .select("company_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError) throw membershipError;

  if (membership?.company_id) {
    await supabase
      .from("user_profiles")
      .update({
        company_id: membership.company_id,
        role: membership.role ?? "member",
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    return {
      userId: user.id,
      companyId: membership.company_id,
      role: membership.role,
    };
  }

  const acceptedInvite = await acceptPendingInvitation(user);
  if (acceptedInvite) return acceptedInvite;

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile?.company_id) return null;

  const role = profile.role ?? "member";
  const { data: repairedMember, error: repairedMemberError } = await supabase
    .from("company_members")
    .select("id")
    .eq("company_id", profile.company_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (repairedMemberError) throw repairedMemberError;

  const repairWrite = repairedMember
    ? supabase
        .from("company_members")
        .update({ role, status: "active" })
        .eq("id", repairedMember.id)
    : supabase
        .from("company_members")
        .insert({ company_id: profile.company_id, user_id: user.id, role, status: "active" });

  const { error: repairError } = await repairWrite;

  if (repairError) throw repairError;

  return {
    userId: user.id,
    companyId: profile.company_id,
    role,
  };
}

export async function getCurrentCompany(): Promise<CompanyContext | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const sessionUserId = session?.user?.id ?? null;
  if (cachedCompany && cachedUserId === sessionUserId) return cachedCompany;
  if (companyPromise) return companyPromise;

  companyPromise = loadCurrentCompany()
    .then((company) => {
      cachedCompany = company;
      cachedUserId = sessionUserId;
      return company;
    })
    .finally(() => {
      companyPromise = null;
    });

  return companyPromise;
}
