import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";
import { withSupabaseTimeout } from "./supabaseLifecycle";

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
  const { data: authSession } = await supabase.auth.getSession();
  const actualAuthUserId = authSession?.session?.user?.id;
  console.log("=== ACCEPT PENDING INVITATION START ===");
  console.log("PARAM USER ID", user.id);
  console.log("ACTUAL AUTH USER ID", actualAuthUserId);
  console.log("IDS MATCH", user.id === actualAuthUserId);

  const email = user.email?.toLowerCase();
  if (!email) return null;

  const { data: invitation, error: invitationError } = await withSupabaseTimeout(
    supabase
      .from("invitations")
      .select("id, company_id, status")
      .eq("email", email)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    "company pending invitation"
  );

  if (invitationError) throw invitationError;
  if (!invitation?.company_id) return null;

  const role = "member";
  const payload = { company_id: invitation.company_id, user_id: user.id, role, status: "active" };
  console.log("COMPANY CONTEXT FLOW START: acceptPendingInvitation");
  console.log("LOOKUP USER ID", user.id);
  console.log("LOOKUP COMPANY ID", invitation.company_id);
  console.log("ATTEMPTING COMPANY MEMBER UPSERT", payload);

  const { data: existingMember, error: existingMemberError } = await withSupabaseTimeout(
    supabase
      .from("company_members")
      .select("id")
      .eq("company_id", invitation.company_id)
      .eq("user_id", user.id)
      .maybeSingle(),
    "company existing member"
  );

  console.log("EXISTING MEMBER QUERY RESULT", existingMember);
  console.log("EXISTING MEMBER QUERY ERROR", existingMemberError);

  if (existingMemberError) {
    console.error("MEMBERSHIP LOOKUP FAILED (RLS?)", existingMemberError);
    console.warn("Skipping membership write due to RLS error. Invitation data exists but membership lookup blocked.");
    return {
      userId: user.id,
      companyId: invitation.company_id,
      role,
    };
  }

  const memberWrite = existingMember
    ? supabase
        .from("company_members")
        .update({ role, status: "active" })
        .eq("id", existingMember.id)
    : supabase
        .from("company_members")
        .upsert([payload], { onConflict: "user_id,company_id" });

  const { error: memberError } = await withSupabaseTimeout(memberWrite, "company member write");
  if (memberError) throw memberError;

  await Promise.allSettled([
    withSupabaseTimeout(
      supabase
        .from("invitations")
        .update({ status: "accepted" })
        .eq("id", invitation.id),
      "company invitation accept"
    ),
    withSupabaseTimeout(
      supabase
        .from("user_profiles")
        .update({ company_id: invitation.company_id, role, updated_at: new Date().toISOString() })
        .eq("id", user.id),
      "company profile update"
    ),
  ]).then((results) => {
    const firstError = results.find((result) =>
      result.status === "rejected" || result.value.error
    );
    if (firstError) throw firstError;
  });

  return {
    userId: user.id,
    companyId: invitation.company_id,
    role,
  };
}

async function loadCurrentCompany(user: User): Promise<CompanyContext | null> {
  const { data: authSession } = await supabase.auth.getSession();
  const actualAuthUserId = authSession?.session?.user?.id;
  console.log("=== LOAD CURRENT COMPANY START ===");
  console.log("PARAM USER ID", user.id);
  console.log("ACTUAL AUTH USER ID", actualAuthUserId);
  console.log("IDS MATCH", user.id === actualAuthUserId);

  const { data: membership, error: membershipError } = await withSupabaseTimeout(
    supabase
      .from("company_members")
      .select("company_id, role")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    "company active membership"
  );

  console.log("FIRST LOOKUP USER ID", user.id);
  console.log("FIRST LOOKUP RESULT", membership);
  console.log("FIRST LOOKUP ERROR", membershipError);

  if (membershipError) {
    console.error("FIRST LOOKUP FAILED (RLS?)", membershipError);
    throw membershipError;
  }

  if (membership?.company_id) {
    await withSupabaseTimeout(
      supabase
        .from("user_profiles")
        .update({
          company_id: membership.company_id,
          role: membership.role ?? "member",
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id),
      "company profile membership sync"
    );

    return {
      userId: user.id,
      companyId: membership.company_id,
      role: membership.role,
    };
  }

  const acceptedInvite = await acceptPendingInvitation(user);
  if (acceptedInvite) return acceptedInvite;

  const { data: profile, error: profileError } = await withSupabaseTimeout(
    supabase
      .from("user_profiles")
      .select("company_id, role")
      .eq("id", user.id)
      .maybeSingle(),
    "company profile lookup"
  );

  if (profileError) throw profileError;
  if (!profile?.company_id) return null;

  // Profil masih menunjuk sebuah company, tapi tidak ada membership aktif dan
  // tidak ada undangan pending. company_members adalah satu-satunya sumber
  // kebenaran akses — kondisi ini berarti user sudah dikeluarkan dari workspace
  // (di-kick). Jangan membuat ulang membership dari data profil yang basi;
  // bersihkan referensi company di profil agar user diarahkan memilih plan sendiri.
  console.warn("Profile references company without active membership. Clearing stale company reference.", {
    userId: user.id,
    staleCompanyId: profile.company_id,
  });

  const { error: cleanupError } = await withSupabaseTimeout(
    supabase
      .from("user_profiles")
      .update({ company_id: null, role: "member", updated_at: new Date().toISOString() })
      .eq("id", user.id),
    "company stale profile cleanup"
  );

  if (cleanupError) {
    console.error("Failed to clear stale company reference:", cleanupError);
  }

  return null;
}

export async function getCurrentCompany(user?: User | null): Promise<CompanyContext | null> {
  const authUser = user ?? (await withSupabaseTimeout(supabase.auth.getSession(), "company cached auth session")).data.session?.user ?? null;
  const sessionUserId = authUser?.id ?? null;
  if (cachedCompany && cachedUserId === sessionUserId) return cachedCompany;
  if (companyPromise) return companyPromise;

  companyPromise = authUser ? loadCurrentCompany(authUser) : Promise.resolve(null)
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
