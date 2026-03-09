import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Download, Plus, Edit, Trash2, Shield, Eye, FileEdit } from "lucide-react";
import DeleteConfirmModal from "@/components/modals/DeleteConfirmModal";
import { useToast } from "@/hooks/use-toast";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [statusFilter, setStatusFilter] = useState("Status: All");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const { toast } = useToast();

  const filtered = members.filter((m) => {
    const matchSearch = searchQuery === "" || m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === "All Roles" || m.role === roleFilter;
    const matchStatus = statusFilter === "Status: All" || m.status === statusFilter.replace("Status: ", "");
    return matchSearch && matchRole && matchStatus;
  });

  const handleDelete = () => {
    if (deleteTarget) {
      setMembers((prev) => prev.filter((m) => m.email !== deleteTarget));
      toast({ title: "Member removed", description: "Team member has been successfully removed." });
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
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
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or role..."
              className="block w-full pl-10 pr-3 py-3 border-none bg-muted rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground text-foreground"
            />
          </div>
          <div className="flex items-center gap-2">
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="bg-card border border-border text-foreground py-2.5 pl-4 pr-10 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-colors">
              <option>All Roles</option>
              <option>Admin</option>
              <option>Editor</option>
              <option>Viewer</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-card border border-border text-foreground py-2.5 pl-4 pr-10 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-colors">
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
              <tr className="border-b border-border">
                <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-10">
                  <input type="checkbox" className="rounded border-border text-primary focus:ring-primary/30 w-4 h-4" />
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date Added</th>
                <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-muted-foreground">
                    <p className="text-lg font-medium mb-1">No members found</p>
                    <p className="text-sm">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((m, i) => (
                  <motion.tr
                    key={m.email}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-5 px-6">
                      <input type="checkbox" className="rounded border-border text-primary focus:ring-primary/30 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-sm text-foreground">
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
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
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
        <div className="p-6 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing {filtered.length} of {members.length} members</span>
          <div className="flex gap-1">
            <button className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors">Previous</button>
            <button className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground">1</button>
            <button className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors">Next</button>
          </div>
        </div>
      </motion.div>

      {/* Delete Modal */}
      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove Member?"
        itemName={members.find((m) => m.email === deleteTarget)?.name}
        description={undefined}
      />
    </div>
  );
}
