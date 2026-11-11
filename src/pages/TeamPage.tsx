import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Download, Ellipsis, Eye, Link2, Mail, Pencil, Search, ShieldCheck, Trash2, Users } from "lucide-react";
import DeleteConfirmModal from "@/components/modals/DeleteConfirmModal";
import MemberAccessDialog from "@/components/team/MemberAccessDialog";
import PageHeader from "@/components/app/PageHeader";
import PersonAvatar from "@/components/app/PersonAvatar";
import EmptyState from "@/components/app/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { logActivity } from "../lib/activityLogger";
import { useCompany } from "@/hooks/use-company";
import { useWorkspaceSummary } from "@/hooks/use-workspace-summary";
import { safeRemoveChannel, withSupabaseTimeout } from "@/lib/supabaseLifecycle";
import { useSupabaseResumeRecovery } from "@/hooks/use-supabase-resume-recovery";
import { toDbRole, toUiRole, type UiRole } from "@/lib/team";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 6;
const ALL_ROLES = "all";

interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: UiRole;
  isOwner: boolean;
  joinedAt: string;
}

interface PendingInvite {
  id: string;
  email: string;
  role: UiRole;
  createdAt: string;
}

interface UserProfileRow {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  role?: string | null;
  created_at?: string | null;
}

interface CompanyMemberRow {
  id: string;
  user_id: string;
  role?: string | null;
  status?: string | null;
  created_at?: string | null;
}

type RemoveTarget = { kind: "members"; members: TeamMember[] } | { kind: "invite"; invite: PendingInvite };

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const roleBadge: Record<UiRole, { variant: "default" | "info" | "neutral"; icon: typeof ShieldCheck }> = {
  Admin: { variant: "default", icon: ShieldCheck },
  Editor: { variant: "info", icon: Pencil },
  Viewer: { variant: "neutral", icon: Eye },
};

function RoleBadge({ role, owner }: { role: UiRole; owner?: boolean }) {
  const { variant, icon: Icon } = roleBadge[role];
  return (
    <Badge variant={variant}>
      <Icon strokeWidth={2} /> {owner ? "Owner" : role}
    </Badge>
  );
}

function csvEscape(value: string) {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Inserts an invitation, retrying without `role` if the invitation_role migration hasn't run yet. */
async function insertInvitation(companyId: string, email: string, role: UiRole) {
  const base = { company_id: companyId, email, status: "pending" };
  const withRole = await supabase.from("invitations").insert([{ ...base, role: toDbRole(role) }]);
  if (!withRole.error) return { roleSaved: true };
  if (/role/.test(withRole.error.message)) {
    const fallback = await supabase.from("invitations").insert([base]);
    if (fallback.error) throw fallback.error;
    return { roleSaved: false };
  }
  throw withRole.error;
}

export default function TeamPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { companyId, isCompanyLoading } = useCompany();
  const workspace = useWorkspaceSummary(companyId);

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState(ALL_ROLES);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [dialog, setDialog] = useState<{ mode: "invite" } | { mode: "edit"; member: TeamMember } | null>(null);
  const [removeTarget, setRemoveTarget] = useState<RemoveTarget | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isCompanyLoading && !companyId) {
      setIsLoading(false);
      setMembers([]);
      setInvites([]);
    }
  }, [companyId, isCompanyLoading]);

  const fetchMembers = useCallback(async (showLoading = false) => {
    if (!companyId) {
      if (showLoading) setIsLoading(false);
      return;
    }

    try {
      if (showLoading) setIsLoading(true);

      const { data: companyMembers, error: membersError } = await withSupabaseTimeout(
        supabase
          .from("company_members")
          .select("id, user_id, role, status, created_at")
          .eq("company_id", companyId)
          .eq("status", "active"),
        "team active members"
      );
      if (membersError) throw membersError;
      const rows = (companyMembers ?? []) as CompanyMemberRow[];

      const userIds = [...new Set(rows.map((m) => m.user_id).filter(Boolean))];
      let profileMap = new Map<string, UserProfileRow>();
      if (userIds.length > 0) {
        const { data: profiles, error: profileError } = await withSupabaseTimeout(
          supabase.from("user_profiles").select("id, first_name, last_name, email, role, created_at").in("id", userIds),
          "team user profiles"
        );
        if (profileError) throw profileError;
        profileMap = new Map((profiles ?? []).map((p: UserProfileRow) => [p.id, p]));
      }

      const { data: pendingRows, error: invitesError } = await withSupabaseTimeout(
        supabase.from("invitations").select("*").eq("company_id", companyId).eq("status", "pending").order("created_at", { ascending: false }),
        "team pending invitations"
      );
      if (invitesError) throw invitesError;

      const activeMembers: TeamMember[] = rows.map((member) => {
        const profile = profileMap.get(member.user_id);
        const name = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || profile?.email || "Unknown member";
        return {
          id: member.id,
          userId: member.user_id,
          name,
          email: profile?.email ?? "",
          role: toUiRole(member.role ?? profile?.role),
          isOwner: member.role === "owner",
          joinedAt: member.created_at || profile?.created_at || new Date().toISOString(),
        };
      }).sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));

      const memberEmails = new Set(activeMembers.map((m) => m.email.toLowerCase()).filter(Boolean));
      const pending: PendingInvite[] = (pendingRows ?? [])
        .filter((inv) => inv.email && !memberEmails.has(inv.email.toLowerCase()))
        .map((inv) => ({ id: inv.id, email: inv.email, role: toUiRole(inv.role), createdAt: inv.created_at }));

      if (isMountedRef.current) {
        setMembers(activeMembers);
        setInvites(pending);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
      toast({ title: "Couldn't load your team", description: "Check your connection and refresh.", variant: "destructive" });
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, [companyId, toast]);

  useSupabaseResumeRecovery({
    enabled: Boolean(companyId),
    onRecover: () => fetchMembers(false),
  });

  useEffect(() => {
    isMountedRef.current = true;
    if (!companyId) return;
    fetchMembers(true);

    const channel = supabase.channel(`team-members-realtime:${companyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'company_members', filter: `company_id=eq.${companyId}` }, () => fetchMembers())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles', filter: `company_id=eq.${companyId}` }, () => fetchMembers())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invitations', filter: `company_id=eq.${companyId}` }, () => fetchMembers())
      .subscribe((status, error) => {
        if (status === 'SUBSCRIBED') fetchMembers();
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn("[team realtime] disconnected; mutation fetch fallback remains active.", { status, error });
        }
      });

    return () => {
      isMountedRef.current = false;
      safeRemoveChannel(channel);
    };
  }, [companyId, fetchMembers]);

  // --- Permissions: only owners/admins manage the team (RLS enforces this server-side too) ---
  const me = members.find((m) => m.userId === user?.id);
  const canManage = Boolean(me && (me.isOwner || me.role === "Admin"));
  const canChange = (member: TeamMember) => canManage && !member.isOwner && member.userId !== user?.id;

  // --- Filtering & pagination ---
  const filtered = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    return members.filter((m) =>
      (!term || m.name.toLowerCase().includes(term) || m.email.toLowerCase().includes(term) || m.role.toLowerCase().includes(term)) &&
      (roleFilter === ALL_ROLES || m.role === roleFilter)
    );
  }, [members, searchQuery, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageMembers = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selectable = pageMembers.filter(canChange);
  const selectedMembers = members.filter((m) => selectedIds.includes(m.id));
  const allSelected = selectable.length > 0 && selectable.every((m) => selectedIds.includes(m.id));
  const someSelected = selectable.some((m) => selectedIds.includes(m.id));

  const resetSelection = () => setSelectedIds([]);

  // --- Mutations ---
  const handleInvite = async (email: string, role: UiRole) => {
    if (!companyId) return;
    if (members.some((m) => m.email.toLowerCase() === email)) {
      toast({ title: "Already a member", description: `${email} is already in this workspace.`, variant: "destructive" });
      return;
    }
    if (invites.some((inv) => inv.email.toLowerCase() === email)) {
      toast({ title: "Already invited", description: `There's already a pending invitation for ${email}.`, variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const { roleSaved } = await insertInvitation(companyId, email, role);
      setDialog(null);
      toast({
        title: "Invitation created",
        description: roleSaved
          ? `${email} will be asked to join as ${role} when they log in.`
          : `${email} will be asked to join when they log in. They'll start as Viewer until the invitation_role migration is applied.`,
      });
      await logActivity({ user: "You", action: "invited a new member:", target: email, message: `Role: ${role}`, type: "invite", iconName: "UserPlus", iconBg: "bg-success/10 text-success", companyId });
      await fetchMembers();
    } catch (error) {
      console.error("Invite member error:", error);
      toast({ title: "Couldn't send the invitation", description: error instanceof Error ? error.message : "Try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditRole = async (member: TeamMember, role: UiRole) => {
    if (!companyId) return;
    if (role === member.role) {
      setDialog(null);
      return;
    }
    setIsSaving(true);
    try {
      const dbRole = toDbRole(role);
      const { error } = await supabase.from("company_members").update({ role: dbRole }).eq("company_id", companyId).eq("id", member.id);
      if (error) throw error;
      const { error: profileError } = await supabase.from("user_profiles").update({ role: dbRole }).eq("id", member.userId);
      if (profileError) throw profileError;

      setDialog(null);
      toast({ title: "Access updated", description: `${member.name} is now ${role}.` });
      await logActivity({ user: "You", action: "changed the role of", target: member.name, message: `Now ${role}`, type: "success", iconName: "Users", iconBg: "bg-primary/10 text-primary", companyId });
      await fetchMembers();
    } catch (error) {
      console.error("Edit role error:", error);
      toast({ title: "Couldn't update access", description: "Try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (target: RemoveTarget) => {
    if (!companyId) return;
    try {
      if (target.kind === "invite") {
        const { error } = await supabase.from("invitations").delete().eq("company_id", companyId).eq("id", target.invite.id);
        if (error) throw error;
        toast({ title: "Invitation cancelled", description: `${target.invite.email} can no longer join with that invite.` });
      } else {
        for (const member of target.members) {
          const { error } = await supabase.from("company_members").delete().eq("company_id", companyId).eq("id", member.id);
          if (error) throw error;
          const { error: profileError } = await supabase.from("user_profiles").update({ company_id: null }).eq("company_id", companyId).eq("id", member.userId);
          if (profileError) throw profileError;
          await logActivity({ user: "You", action: "removed a team member:", target: member.email || member.name, type: "warning", iconName: "AlertTriangle", iconBg: "bg-destructive/10 text-destructive", companyId });
        }
        toast({
          title: target.members.length === 1 ? "Member removed" : `${target.members.length} members removed`,
          description: "Their access was revoked immediately.",
        });
        resetSelection();
      }
    } catch (error) {
      console.error("Remove error:", error);
      toast({ title: "Couldn't complete the removal", description: "Some changes may not have been saved. Refresh to check.", variant: "destructive" });
    } finally {
      await fetchMembers();
    }
  };

  const copySignupLink = async (invite: PendingInvite) => {
    const link = `${window.location.origin}/login?mode=signup`;
    try {
      await navigator.clipboard.writeText(link);
      toast({ title: "Sign-up link copied", description: `Send it to ${invite.email}. Signing up with that email adds them to the workspace.` });
    } catch {
      toast({ title: "Copy this link", description: link });
    }
  };

  const handleExport = () => {
    const rows = [
      ["Name", "Email", "Role", "Status", "Date joined"],
      ...members.map((m) => [m.name, m.email, m.isOwner ? "Owner" : m.role, "Active", formatDate(m.joinedAt)]),
      ...invites.map((inv) => ["", inv.email, inv.role, "Pending", formatDate(inv.createdAt)]),
    ];
    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "nexusflow-team.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const showSkeleton = (isCompanyLoading && !companyId) || (Boolean(companyId) && isLoading);
  const removeTitle = removeTarget?.kind === "invite"
    ? "Cancel invitation?"
    : removeTarget && removeTarget.members.length > 1 ? `Remove ${removeTarget.members.length} members?` : "Remove member?";

  return (
    <div className="space-y-6 px-4 pb-12 pt-6 sm:px-6 lg:px-8 lg:pt-7">
      <PageHeader
        title="Team Management"
        description={<span className="hidden sm:inline">Manage your team access, roles, and permissions.</span>}
        actions={
          <>
            <Button variant="secondary" className="hidden sm:inline-flex" onClick={handleExport} disabled={showSkeleton}>
              <Download strokeWidth={1.75} /> Export
            </Button>
            {canManage && (
              <Button className="w-full sm:w-auto" size="default" onClick={() => setDialog({ mode: "invite" })}>
                <Mail strokeWidth={1.75} /> Invite Colleague
              </Button>
            )}
          </>
        }
      />

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        aria-label="Members"
        className="overflow-hidden rounded-xl border-border sm:border sm:bg-card sm:shadow-xs"
      >
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 pb-3 sm:p-4">
          <div className="relative w-full sm:w-[340px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" strokeWidth={1.75} />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
                resetSelection();
              }}
              placeholder="Search by name, email, or role…"
              aria-label="Search members"
              className="h-9 pl-9 md:text-small"
            />
          </div>
          <Select value={roleFilter} onValueChange={(value) => { setRoleFilter(value); setPage(1); resetSelection(); }}>
            <SelectTrigger className="hidden w-auto min-w-[110px] sm:flex" aria-label="Role filter"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ROLES}>All Roles</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Editor">Editor</SelectItem>
              <SelectItem value="Viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
          {selectedIds.length > 0 && (
            <div className="ml-auto flex items-center gap-2">
              <Badge>{selectedIds.length} selected</Badge>
              <Button
                size="sm"
                className="bg-destructive-soft text-destructive shadow-none hover:bg-destructive/15"
                onClick={() => setRemoveTarget({ kind: "members", members: selectedMembers })}
              >
                <Trash2 strokeWidth={1.75} /> Remove
              </Button>
            </div>
          )}
        </div>

        {showSkeleton ? (
          <div className="space-y-3 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={members.length === 0 ? "No team members yet" : "No members match"}
            description={members.length === 0 ? "Invite a colleague to start working together." : "Try a different name, email or role."}
            action={members.length > 0 && (
              <Button variant="secondary" size="sm" onClick={() => { setSearchQuery(""); setRoleFilter(ALL_ROLES); }}>Clear filters</Button>
            )}
            className="border-t border-border py-12"
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-small">
                <thead className="border-y border-border bg-surface-2 text-caption font-semibold uppercase tracking-[0.04em] text-muted-foreground">
                  <tr>
                    <th scope="col" className="w-12 py-3 pl-4">
                      {canManage && (
                        <Checkbox
                          aria-label="Select all on this page"
                          checked={allSelected ? true : someSelected ? "indeterminate" : false}
                          disabled={selectable.length === 0}
                          onCheckedChange={(checked) =>
                            setSelectedIds(checked ? [...new Set([...selectedIds, ...selectable.map((m) => m.id)])] : selectedIds.filter((id) => !selectable.some((m) => m.id === id)))
                          }
                        />
                      )}
                    </th>
                    <th scope="col" className="py-3 pr-4">User</th>
                    <th scope="col" className="py-3 pr-4">Role</th>
                    <th scope="col" className="py-3 pr-4">Status</th>
                    <th scope="col" className="py-3 pr-4">Date joined</th>
                    {canManage && <th scope="col" className="py-3 pr-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {pageMembers.map((member) => {
                    const selected = selectedIds.includes(member.id);
                    return (
                      <tr key={member.id} className={cn("border-b border-border last:border-b-0 transition-colors", selected ? "bg-primary-soft/60" : "hover:bg-surface-2/50")}>
                        <td className="py-3 pl-4">
                          {canManage && (
                            <Checkbox
                              aria-label={`Select ${member.name}`}
                              checked={selected}
                              disabled={!canChange(member)}
                              onCheckedChange={(checked) => setSelectedIds(checked ? [...selectedIds, member.id] : selectedIds.filter((id) => id !== member.id))}
                            />
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <PersonAvatar name={member.name} id={member.userId} size={34} />
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-foreground">
                                {member.name}
                                {member.userId === user?.id && <span className="ml-1.5 font-normal text-subtle">(you)</span>}
                              </p>
                              <p className="truncate text-caption font-normal text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4"><RoleBadge role={member.role} owner={member.isOwner} /></td>
                        <td className="py-3 pr-4">
                          <span className="flex items-center gap-2 text-foreground"><span className="h-1.5 w-1.5 rounded-full bg-success" />Active</span>
                        </td>
                        <td className="py-3 pr-4 text-foreground tabular">{formatDate(member.joinedAt)}</td>
                        {canManage && (
                          <td className="py-3 pr-4">
                            {canChange(member) && (
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon-sm" aria-label={`Edit ${member.name}'s access`} onClick={() => setDialog({ mode: "edit", member })}>
                                  <Pencil strokeWidth={1.75} />
                                </Button>
                                <Button variant="ghost" size="icon-sm" aria-label={`Remove ${member.name}`} onClick={() => setRemoveTarget({ kind: "members", members: [member] })}>
                                  <Trash2 strokeWidth={1.75} />
                                </Button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="space-y-3 md:hidden">
              {pageMembers.map((member) => (
                <li key={member.id} className="rounded-xl border border-border bg-card p-4 shadow-xs">
                  <div className="flex items-center gap-3">
                    <PersonAvatar name={member.name} id={member.userId} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-label text-foreground">{member.name}</p>
                      <p className="truncate text-small text-muted-foreground">{member.email}</p>
                    </div>
                    {canChange(member) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${member.name}`}><Ellipsis strokeWidth={1.75} /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onSelect={() => setDialog({ mode: "edit", member })}><Pencil strokeWidth={1.75} /> Edit access</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setRemoveTarget({ kind: "members", members: [member] })} className="text-destructive focus:text-destructive [&_svg]:text-destructive">
                            <Trash2 strokeWidth={1.75} /> Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <RoleBadge role={member.role} owner={member.isOwner} />
                    <Badge variant="success"><span className="h-1.5 w-1.5 rounded-full bg-success" /> Active</Badge>
                    <span className="ml-auto text-caption font-normal text-muted-foreground tabular">{formatDate(member.joinedAt)}</span>
                  </div>
                </li>
              ))}
            </ul>

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 sm:border-t sm:border-border sm:p-4">
              <p className="text-small text-muted-foreground">
                Showing {pageMembers.length} of {filtered.length} {filtered.length === 1 ? "member" : "members"}
              </p>
              {totalPages > 1 && (
                <nav aria-label="Pagination" className="flex items-center gap-1">
                  <Button variant="secondary" size="sm" disabled={currentPage === 1} onClick={() => { setPage(currentPage - 1); resetSelection(); }}>
                    <ChevronLeft /> Previous
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <Button
                      key={n}
                      variant={n === currentPage ? "default" : "ghost"}
                      size="icon-sm"
                      aria-current={n === currentPage ? "page" : undefined}
                      onClick={() => { setPage(n); resetSelection(); }}
                    >
                      {n}
                    </Button>
                  ))}
                  <Button variant="secondary" size="sm" disabled={currentPage === totalPages} onClick={() => { setPage(currentPage + 1); resetSelection(); }}>
                    Next <ChevronRight />
                  </Button>
                </nav>
              )}
            </div>
          </>
        )}
      </motion.section>

      {/* Pending invitations */}
      {!showSkeleton && (canManage || invites.length > 0) && (
        <section aria-label="Pending invitations" className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <header className="p-5 pb-4">
            <h2 className="text-card-title text-foreground">Pending Invitations</h2>
            <p className="text-small text-muted-foreground">People who were invited but haven't joined yet.</p>
          </header>
          {invites.length === 0 ? (
            <EmptyState
              icon={Mail}
              title="No pending invitations"
              description="Invites you send will show here until they're accepted."
              action={canManage && <Button variant="secondary" size="sm" onClick={() => setDialog({ mode: "invite" })}>Invite Colleague</Button>}
              className="border-t border-border py-8"
            />
          ) : (
            <ul className="divide-y divide-border border-t border-border">
              {invites.map((invite) => (
                <li key={invite.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning">
                    <Mail className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-label text-foreground">{invite.email}</p>
                    <p className="text-caption font-normal text-muted-foreground">Pending · {invite.role} · {formatDate(invite.createdAt)}</p>
                  </div>
                  {canManage && (
                    <div className="flex gap-1">
                      <Button variant="secondary" size="sm" onClick={() => void copySignupLink(invite)}>
                        <Link2 strokeWidth={1.75} /> Copy sign-up link
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setRemoveTarget({ kind: "invite", invite })}>Cancel</Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <MemberAccessDialog
        open={dialog !== null}
        mode={dialog?.mode ?? "invite"}
        workspaceName={workspace?.name}
        initialEmail={dialog?.mode === "edit" ? dialog.member.email : ""}
        initialRole={dialog?.mode === "edit" ? dialog.member.role : "Editor"}
        saving={isSaving}
        onClose={() => setDialog(null)}
        onSubmit={(email, role) => {
          if (dialog?.mode === "edit") void handleEditRole(dialog.member, role);
          else void handleInvite(email, role);
        }}
      />

      <DeleteConfirmModal
        open={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => removeTarget && void handleRemove(removeTarget)}
        title={removeTitle}
        confirmLabel={removeTarget?.kind === "invite" ? "Cancel invite" : "Remove"}
        itemName={
          removeTarget?.kind === "invite"
            ? removeTarget.invite.email
            : removeTarget?.members.length === 1 ? removeTarget.members[0].name : removeTarget?.members.map((m) => m.name).join(", ")
        }
        description={removeTarget?.kind === "invite" ? "This email will no longer be able to join with that invitation." : "They'll lose access to all projects immediately."}
      />
    </div>
  );
}
