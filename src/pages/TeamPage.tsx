import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Download, Plus, Edit, Trash2, Shield, Eye, FileEdit, X } from "lucide-react";
import DeleteConfirmModal from "@/components/modals/DeleteConfirmModal";
import { useToast } from "@/hooks/use-toast";

// Mapping ikon dan warna untuk otomatisasi form
const roleIcons: Record<string, any> = {
  Admin: Shield,
  Editor: FileEdit,
  Viewer: Eye,
};

const avatarColors = ["bg-primary", "bg-info", "bg-success", "bg-warning", "bg-violet-500", "bg-destructive"];

const initialMembers = [
  { name: "Sarah Wilson", email: "sarah.w@company.com", role: "Admin", roleIcon: Shield, status: "Active", date: "Oct 24, 2023", initials: "SW", color: "bg-primary" },
  { name: "Michael Johnson", email: "michael.j@company.com", role: "Editor", roleIcon: FileEdit, status: "Pending", date: "Nov 02, 2023", initials: "MJ", color: "bg-info" },
  { name: "David Chen", email: "david.c@company.com", role: "Viewer", roleIcon: Eye, status: "Active", date: "Dec 15, 2023", initials: "DC", color: "bg-success" },
  { name: "Emma Rodriguez", email: "emma.r@company.com", role: "Editor", roleIcon: FileEdit, status: "Active", date: "Jan 10, 2024", initials: "ER", color: "bg-warning" },
  { name: "Alex Lewis", email: "alex.l@company.com", role: "Viewer", roleIcon: Eye, status: "Inactive", date: "Feb 28, 2024", initials: "AL", color: "bg-destructive" },
];

const statusStyles: Record<string, string> = {
  Active: "bg-success/10 text-success",
  Pending: "bg-warning/10 text-warning",
  Inactive: "bg-muted text-muted-foreground",
};

export default function TeamPage() {
  const [members, setMembers] = useState(initialMembers);
  
  // States Filter & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [statusFilter, setStatusFilter] = useState("Status: All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // States Interaksi
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const { toast } = useToast();

  // States Modal Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTargetEmail, setEditTargetEmail] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", role: "Viewer", status: "Active" });

  // --- LOGIKA FILTER & PAGINASI ---
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

  // Helper untuk reset halaman jika filter berubah
  const handleFilterChange = (setter: any, value: string) => {
    setter(value);
    setCurrentPage(1);
    setSelectedEmails([]);
  };

  // --- LOGIKA CHECKBOX ---
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedEmails(paginatedMembers.map(m => m.email));
    } else {
      setSelectedEmails([]);
    }
  };

  const handleSelectOne = (email: string) => {
    setSelectedEmails(prev => 
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  // --- LOGIKA CRUD ---
  const handleDelete = () => {
    if (deleteTarget) {
      setMembers((prev) => prev.filter((m) => m.email !== deleteTarget));
      setSelectedEmails(prev => prev.filter(e => e !== deleteTarget)); // Hapus dari seleksi jika ada
      toast({ title: "Member removed", description: "Team member has been successfully removed." });
      setDeleteTarget(null);
      
      // Mundur 1 halaman jika menghapus item terakhir di halaman tersebut
      if (paginatedMembers.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    }
  };

  const handleOpenAdd = () => {
    setEditTargetEmail(null);
    setFormData({ name: "", email: "", role: "Viewer", status: "Active" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (member: typeof initialMembers[0]) => {
    setEditTargetEmail(member.email);
    setFormData({ name: member.name, email: member.email, role: member.role, status: member.status });
    setIsModalOpen(true);
  };

  const handleSaveMember = () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({ title: "Error", description: "Name and email are required.", variant: "destructive" });
      return;
    }

    const initials = formData.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
    
    if (editTargetEmail) {
      // Edit mode
      setMembers(prev => prev.map(m => 
        m.email === editTargetEmail ? { 
          ...m, 
          name: formData.name, 
          email: formData.email, 
          role: formData.role, 
          status: formData.status, 
          roleIcon: roleIcons[formData.role],
          initials: initials
        } : m
      ));
      toast({ title: "Member updated", description: "Team member details updated successfully." });
    } else {
      // Add mode
      // Cek apakah email sudah ada
      if (members.some(m => m.email === formData.email)) {
        toast({ title: "Email exists", description: "A member with this email already exists.", variant: "destructive" });
        return;
      }

      const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];
      const newDate = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      
      const newMember = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: formData.status,
        roleIcon: roleIcons[formData.role],
        date: newDate,
        initials: initials,
        color: randomColor
      };
      
      setMembers([newMember, ...members]);
      toast({ title: "Member added", description: "New team member has been successfully added." });
    }
    
    setIsModalOpen(false);
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
          <motion.button
            onClick={handleOpenAdd}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium shadow-primary-glow text-sm"
          >
            <Plus className="h-4 w-4" /> Add Member
          </motion.button>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl shadow-card border border-border overflow-hidden"
      >
        {/* Toolbar */}
        <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              value={searchQuery}
              onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
              placeholder="Search by name, email, or role..."
              className="block w-full pl-10 pr-3 py-3 border-none bg-muted rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground text-foreground"
            />
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
              <option>Inactive</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-10">
                  <input 
                    type="checkbox" 
                    checked={paginatedMembers.length > 0 && selectedEmails.length === paginatedMembers.length}
                    onChange={handleSelectAll}
                    className="rounded border-border text-primary focus:ring-primary/30 w-4 h-4 cursor-pointer" 
                  />
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date Added</th>
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
                paginatedMembers.map((m, i) => (
                  <motion.tr
                    key={m.email}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`group hover:bg-muted/50 transition-colors ${selectedEmails.includes(m.email) ? "bg-primary/5" : ""}`}
                  >
                    <td className="py-5 px-6">
                      <input 
                        type="checkbox" 
                        checked={selectedEmails.includes(m.email)}
                        onChange={() => handleSelectOne(m.email)}
                        className={`rounded border-border text-primary focus:ring-primary/30 w-4 h-4 cursor-pointer transition-opacity ${selectedEmails.includes(m.email) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} 
                      />
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full ${m.color || 'bg-primary'} bg-opacity-20 flex items-center justify-center font-bold text-sm text-foreground`}>
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
                        <m.roleIcon className="h-4 w-4 text-muted-foreground" />
                        {m.role}
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[m.status]}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
                        {m.status}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-sm text-muted-foreground">{m.date}</td>
                    <td className="py-5 px-6 text-right">
                      <div className={`flex items-center justify-end gap-2 transition-opacity ${selectedEmails.includes(m.email) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <button 
                          onClick={() => handleOpenEdit(m)}
                          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(m.email)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-6 border-t border-border flex items-center justify-between text-sm text-muted-foreground bg-muted/10">
          <div className="flex items-center gap-4">
            <span>Showing {paginatedMembers.length} of {filtered.length} members</span>
            {selectedEmails.length > 0 && (
              <span className="text-primary font-medium border-l border-border pl-4">
                {selectedEmails.length} selected
              </span>
            )}
          </div>
          <div className="flex gap-1">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button 
                key={page}
                onClick={() => { setCurrentPage(page); setSelectedEmails([]); }}
                className={`px-3 py-1.5 rounded-lg transition-colors ${currentPage === page ? "bg-primary text-primary-foreground shadow-sm" : "border border-border hover:bg-muted"}`}
              >
                {page}
              </button>
            ))}

            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </motion.div>

      {/* Delete Modal (Bawaan Anda) */}
      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove Member?"
        itemName={members.find((m) => m.email === deleteTarget)?.name}
        description="This user will lose access to all projects and documents immediately."
      />

      {/* Add / Edit Member Modal Dinamis */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden z-10">
              <div className="p-6 border-b border-border flex justify-between items-center">
                <h2 className="text-xl font-bold text-foreground">
                  {editTargetEmail ? "Edit Team Member" : "Add New Member"}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" className="w-full bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-2.5 text-sm outline-none transition-all text-foreground" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Email Address</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} disabled={!!editTargetEmail} placeholder="john@company.com" className="w-full bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-2.5 text-sm outline-none transition-all text-foreground disabled:opacity-50 disabled:cursor-not-allowed" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Role</label>
                    <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full bg-muted/50 border border-border focus:border-primary rounded-xl px-4 py-2.5 text-sm outline-none text-foreground appearance-none">
                      <option value="Admin">Admin</option>
                      <option value="Editor">Editor</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full bg-muted/50 border border-border focus:border-primary rounded-xl px-4 py-2.5 text-sm outline-none text-foreground appearance-none">
                      <option value="Active">Active</option>
                      <option value="Pending">Pending</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                  <button onClick={handleSaveMember} className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:opacity-90 transition-opacity">
                    {editTargetEmail ? "Save Changes" : "Add Member"}
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