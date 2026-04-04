import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Download, Plus, Edit, Trash2, Shield, Eye, FileEdit, X, Loader2, Mail, Save } from "lucide-react";
import DeleteConfirmModal from "@/components/modals/DeleteConfirmModal";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../lib/supabase";
import { logActivity } from "../lib/activityLogger";

// --- TYPES & UTILS ---
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string; 
  date_added: string;
  initials: string;
  color: string;
  is_invite: boolean; 
}

const roleIcons: Record<string, any> = {
  Admin: Shield,
  Editor: FileEdit,
  Viewer: Eye,
};

const avatarColors = ["bg-primary", "bg-info", "bg-success", "bg-warning", "bg-violet-500", "bg-destructive"];

const statusStyles: Record<string, string> = {
  Active: "bg-success/10 text-success",
  Pending: "bg-warning/10 text-warning",
  Inactive: "bg-muted text-muted-foreground",
};

export default function TeamPage() {
  const { toast } = useToast();
  
  // --- DATABASE STATES ---
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // --- FILTER & PAGINATION STATES ---
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [statusFilter, setStatusFilter] = useState("Status: All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // --- INTERACTION STATES ---
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null);

  // --- MODAL STATES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", role: "Viewer", status: "Active" });
  const [isSaving, setIsSaving] = useState(false);

  // --- FETCH DATA (GABUNGAN PROFIL & UNDANGAN) ---
  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('user_profiles').select('company_id').eq('id', user.id).single();
      
      if (profile) {
        setCompanyId(profile.company_id);
        
        // 1. Ambil Karyawan Aktif
        const { data: activeProfiles } = await supabase.from('user_profiles').select('*').eq('company_id', profile.company_id);
        
        // 2. Ambil Undangan Pending
        const { data: pendingInvites } = await supabase.from('invitations').select('*').eq('company_id', profile.company_id).eq('status', 'pending');

        const combinedData: TeamMember[] = [];

        // Format Karyawan Aktif
        if (activeProfiles) {
          activeProfiles.forEach((p: any) => {
            const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown User';
            combinedData.push({
              id: p.id,
              name: fullName,
              email: p.email || "No Email",
              role: p.role === 'owner' ? 'Admin' : 'Viewer', // Mapping sementara
              status: "Active",
              date_added: new Date(p.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
              initials: fullName.substring(0, 2).toUpperCase(),
              color: avatarColors[Math.floor(Math.random() * avatarColors.length)],
              is_invite: false
            });
          });
        }

        // Format Undangan Pending
        if (pendingInvites) {
          pendingInvites.forEach((inv: any) => {
            combinedData.push({
              id: inv.id,
              name: "Pending Invite",
              email: inv.email,
              role: "Viewer", 
              status: "Pending",
              date_added: new Date(inv.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
              initials: "@",
              color: "bg-warning",
              is_invite: true
            });
          });
        }

        setMembers(combinedData);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // --- FILTER & PAGINATION LOGIC ---
  const filtered = useMemo(() => {
    return members.filter((m) => {
      const matchSearch = searchQuery === "" || m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchRole = roleFilter === "All Roles" || m.role === roleFilter;
      const matchStatus = statusFilter === "Status: All" || m.status === statusFilter.replace("Status: ", "");
      return matchSearch && matchRole && matchStatus;
    });
  }, [members, searchQuery, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedMembers = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleFilterChange = (setter: any, value: string) => {
    setter(value);
    setCurrentPage(1);
    setSelectedEmails([]);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedEmails(paginatedMembers.map(m => m.email));
    else setSelectedEmails([]);
  };

  const handleSelectOne = (email: string) => {
    setSelectedEmails(prev => prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]);
  };

  // --- CRUD LOGIC ---
  const handleDelete = async () => {
    if (deleteTarget) {
      setIsLoading(true);
      if (deleteTarget.is_invite) {
        // Hapus undangan jika statusnya pending
        await supabase.from('invitations').delete().eq('id', deleteTarget.id);
      } else {
        // Cabut akses karyawan dari perusahaan (Set company_id jadi null)
        await supabase.from('user_profiles').update({ company_id: null }).eq('id', deleteTarget.id);
      }
      
      toast({ title: "Member removed", description: "Access has been successfully revoked." });
      
      await logActivity({
        user: "You",
        action: "removed a team member:",
        target: deleteTarget.email,
        type: "warning",
        iconName: "AlertTriangle",
        iconBg: "bg-destructive/10 text-destructive"
      });

      setSelectedEmails(prev => prev.filter(e => e !== deleteTarget.email));
      setDeleteTarget(null);
      fetchMembers(); // Refresh data
    }
  };

  const handleOpenAdd = () => {
    setEditTargetId(null);
    setFormData({ name: "", email: "", role: "Viewer", status: "Active" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (member: TeamMember) => {
    setEditTargetId(member.id);
    setFormData({ name: member.name, email: member.email, role: member.role, status: member.status });
    setIsModalOpen(true);
  };

  const handleSaveMember = async () => {
    if (!formData.email.trim()) {
      toast({ title: "Error", description: "Email is required.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    
    if (editTargetId) {
      toast({ title: "Updated", description: "Role changes are not fully implemented in DB yet." });
    } else {
      // Add mode
      if (members.some(m => m.email === formData.email)) {
        toast({ title: "Exists", description: "User or invite with this email already exists.", variant: "destructive" });
        setIsSaving(false);
        return;
      }

      const { error } = await supabase.from('invitations').insert({
        company_id: companyId,
        email: formData.email
      });
      
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Invite Sent", description: `An invitation has been sent to ${formData.email}.` });
        
        await logActivity({
          user: "You",
          action: "invited a new colleague:",
          target: formData.email,
          type: "invite",
          iconName: "AtSign",
          iconBg: "bg-primary/10 text-primary",
          hasAction: true 
        });
      }
    }
    
    setIsSaving(false);
    setIsModalOpen(false);
    fetchMembers(); // Refresh UI
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto relative">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Team Management</h1>
          <p className="text-muted-foreground mt-1">Manage your team access, roles, and permissions.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-muted-foreground font-medium hover:bg-muted shadow-sm transition-colors text-sm">
            <Download className="h-4 w-4" /> Export
          </button>
          <motion.button onClick={handleOpenAdd} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium shadow-primary-glow text-sm">
            <Mail className="h-4 w-4" /> Invite Colleague
          </motion.button>
        </div>
      </header>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl shadow-card border border-border overflow-hidden relative">
        
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Toolbar */}
        <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input value={searchQuery} onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)} placeholder="Search by name, email, or role..." className="block w-full pl-10 pr-3 py-3 border-none bg-muted rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground text-foreground" />
          </div>
          <div className="flex items-center gap-2">
            <select value={roleFilter} onChange={(e) => handleFilterChange(setRoleFilter, e.target.value)} className="bg-card border border-border text-foreground py-2.5 pl-4 pr-10 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-colors">
              <option>All Roles</option>
              <option>Admin</option>
              <option>Editor</option>
              <option>Viewer</option>
            </select>
            <select value={statusFilter} onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)} className="bg-card border border-border text-foreground py-2.5 pl-4 pr-10 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-colors">
              <option>Status: All</option>
              <option>Active</option>
              <option>Pending</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-10">
                  <input type="checkbox" checked={paginatedMembers.length > 0 && selectedEmails.length === paginatedMembers.length} onChange={handleSelectAll} className="rounded border-border text-primary focus:ring-primary/30 w-4 h-4 cursor-pointer" />
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date Joined</th>
                <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-muted-foreground">
                    <p className="text-lg font-medium mb-1">No members found</p>
                    <p className="text-sm">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((m, i) => {
                  const RoleIcon = roleIcons[m.role] || Eye;

                  return (
                    <motion.tr key={m.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className={`group hover:bg-muted/50 transition-colors ${selectedEmails.includes(m.email) ? "bg-primary/5" : ""}`}>
                      <td className="py-5 px-6">
                        <input type="checkbox" checked={selectedEmails.includes(m.email)} onChange={() => handleSelectOne(m.email)} className={`rounded border-border text-primary focus:ring-primary/30 w-4 h-4 cursor-pointer transition-opacity ${selectedEmails.includes(m.email) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full ${m.color} bg-opacity-20 flex items-center justify-center font-bold text-sm ${m.is_invite ? 'text-warning' : 'text-foreground'}`}>
                            {m.initials}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">{m.name}</div>
                            <div className="text-sm text-muted-foreground">{m.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <RoleIcon className="h-4 w-4 text-muted-foreground" />
                          {m.role}
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[m.status] || statusStyles.Inactive}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
                          {m.status}
                        </span>
                      </td>
                      <td className="py-5 px-6 text-sm text-muted-foreground">{m.date_added}</td>
                      <td className="py-5 px-6 text-right">
                        <div className={`flex items-center justify-end gap-2 transition-opacity ${selectedEmails.includes(m.email) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                          <button onClick={() => handleOpenEdit(m)} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => setDeleteTarget(m)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-6 border-t border-border flex items-center justify-between text-sm text-muted-foreground bg-muted/10">
          <div className="flex items-center gap-4">
            <span>Showing {paginatedMembers.length} of {filtered.length} members</span>
            {selectedEmails.length > 0 && <span className="text-primary font-medium border-l border-border pl-4">{selectedEmails.length} selected</span>}
          </div>
          <div className="flex gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Previous</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button key={page} onClick={() => { setCurrentPage(page); setSelectedEmails([]); }} className={`px-3 py-1.5 rounded-lg transition-colors ${currentPage === page ? "bg-primary text-primary-foreground shadow-sm" : "border border-border hover:bg-muted"}`}>{page}</button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Next</button>
          </div>
        </div>
      </motion.div>

      {/* Delete Modal */}
      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={deleteTarget?.is_invite ? "Cancel Invitation?" : "Remove Member?"}
        itemName={deleteTarget?.email}
        description={deleteTarget?.is_invite ? "This email will no longer be able to join your workspace." : "This user will lose access to all projects immediately."}
      />

      {/* Invite Member Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden z-10">
              <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Mail className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">{editTargetId ? "Edit Member Access" : "Invite Colleague"}</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="p-6 space-y-4">
                {!editTargetId && (
                  <p className="text-sm text-muted-foreground mb-4">
                    Send an invitation. When they sign up with this email, they will automatically join your company workspace.
                  </p>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Email Address</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} disabled={!!editTargetId} placeholder="colleague@company.com" className="w-full bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-2.5 text-sm outline-none transition-all text-foreground disabled:opacity-50 disabled:cursor-not-allowed" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Assign Role</label>
                  <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full bg-muted/50 border border-border focus:border-primary rounded-xl px-4 py-2.5 text-sm outline-none text-foreground appearance-none">
                    <option value="Admin">Admin</option>
                    <option value="Editor">Editor</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>
                
                <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
                  <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                  <button onClick={handleSaveMember} disabled={isSaving} className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editTargetId ? <Save className="w-4 h-4" /> : <Mail className="w-4 h-4" />)}
                    {editTargetId ? "Save Changes" : "Send Invite"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}