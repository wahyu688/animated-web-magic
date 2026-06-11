import { useState, useRef, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Lock, Bell, CreditCard, Puzzle, Camera, Shield, Smartphone, Key, Mail, Monitor, Globe, Slack, Github, Webhook, ChevronRight, Loader2, Users, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../lib/supabase";
import { logActivity } from "../lib/activityLogger";
import type { Session } from "@supabase/supabase-js";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/use-company";

const tabs = [
  { icon: User, label: "General" },
  { icon: Lock, label: "Security" },
  { icon: Bell, label: "Notifications" },
  { icon: CreditCard, label: "Billing" },
  { icon: Puzzle, label: "Integrations" },
  { icon: Monitor, label: "Workspace" },
  { icon: Users, label: "Team" },
];

/* ── Shared Footer ── */
function SettingsFooter({ onSave, isLoading }: { onSave: () => void, isLoading?: boolean }) {
  return (
    <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
      <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-xl transition-colors">Cancel</button>
      <motion.button 
        onClick={onSave}
        disabled={isLoading}
        whileHover={{ scale: 1.02 }} 
        whileTap={{ scale: 0.98 }} 
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-xl shadow-primary-glow hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        Save Changes
      </motion.button>
    </div>
  );
}

/* ── General Tab (TERSAMBUNG SUPABASE) ── */
function GeneralTab({ session }: { session: Session | null }) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    bio: "",
    timezone: "Western Indonesia Time (WIB)",
    avatar_url: "",
  });

  // Fetch data profil saat tab dibuka
  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user?.id) return;
      try {
        const { data, error } = await supabase.from("user_profiles").select('*').eq('id', session.user.id).single();
        if (error) throw error;
        if (data) {
          setProfile({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            bio: data.bio || "",
            timezone: data.timezone || "Western Indonesia Time (WIB)",
            avatar_url: data.avatar_url || "",
          });
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    };
    fetchProfile();
  }, [session]);

  const handleSave = async () => {
    if (!session?.user?.id) return;
    setIsLoading(true);

    try {
      const updates = {
        first_name: profile.first_name,
        last_name: profile.last_name,
        bio: profile.bio,
        timezone: profile.timezone,
        updated_at: new Date(),
      };

      const { error } = await supabase.from("user_profiles").update(updates).eq('id', session.user.id);

      if (error) throw error;

      toast({ title: "Profile updated", description: "Your general profile settings have been saved successfully." });
      await logActivity({
        user: "You",
        action: "updated your",
        target: "Profile Details",
        type: "success",
        iconName: "CheckCircle",
        iconBg: "bg-success/10 text-success"
      });
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      toast({ title: "Error", description: error?.message ?? 'Failed to save profile.', variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!session?.user?.id) return;
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setIsLoading(true);
    try {
      const filePath = `avatars/${session.user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;
      const { error: updateError } = await supabase.from('user_profiles').update({ avatar_url: publicUrl }).eq('id', session.user.id);
      if (updateError) throw updateError;
      setProfile((p) => ({ ...p, avatar_url: publicUrl }));
      toast({ title: 'Photo uploaded', description: 'Profile photo updated.' });
    } catch (err) {
      console.error('Avatar upload failed:', err);
      toast({ title: 'Upload failed', description: 'Unable to upload avatar.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="px-6 py-6 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground">Profile Details</h2>
        <p className="text-sm text-muted-foreground mt-1">Update your photo and personal details here.</p>
      </div>
      <div className="p-6 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className={`w-20 h-20 rounded-full overflow-hidden ${profile.avatar_url ? "border border-border" : "gradient-primary"}`}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary-foreground font-bold text-2xl ring-4 ring-muted transition-transform group-hover:scale-105">
                  {profile.first_name ? profile.first_name[0] : session?.user?.email?.[0].toUpperCase() || "U"}
                </div>
              )}
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-foreground/40 rounded-full opacity-0 group-hover:opacity-100 transition-all">
              <Camera className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">Profile Photo</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-3">Accepts JPG, GIF or PNG. 1MB Max.</p>
            <div className="flex gap-3">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 text-xs font-medium bg-card border border-border rounded-lg shadow-sm hover:bg-muted text-foreground transition-colors">Upload New</button>
            </div>
          </div>
        </div>
        <hr className="border-border" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">First Name</label>
            <input type="text" value={profile.first_name} onChange={(e) => setProfile({...profile, first_name: e.target.value})} className="block w-full rounded-xl border border-border bg-card text-foreground shadow-sm focus:border-primary focus:ring-primary/20 text-sm py-2.5 px-3 transition-colors" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Last Name</label>
            <input type="text" value={profile.last_name} onChange={(e) => setProfile({...profile, last_name: e.target.value})} className="block w-full rounded-xl border border-border bg-card text-foreground shadow-sm focus:border-primary focus:ring-primary/20 text-sm py-2.5 px-3 transition-colors" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Email Address</label>
            <input type="email" disabled value={session?.user?.email || ""} className="block w-full rounded-xl border border-border bg-muted/50 text-muted-foreground shadow-sm text-sm py-2.5 px-3 cursor-not-allowed" />
            <p className="text-[10px] text-muted-foreground">Email is managed by authentication provider.</p>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Bio</label>
            <textarea rows={4} value={profile.bio} onChange={(e) => setProfile({...profile, bio: e.target.value})} placeholder="Tell us a little about yourself..." className="block w-full rounded-xl border border-border bg-card text-foreground shadow-sm focus:border-primary focus:ring-primary/20 text-sm py-2.5 px-3 transition-colors resize-none" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Timezone</label>
            <select value={profile.timezone} onChange={(e) => setProfile({...profile, timezone: e.target.value})} className="block w-full rounded-xl border border-border bg-card text-foreground shadow-sm focus:border-primary focus:ring-primary/20 text-sm py-2.5 px-3 transition-colors">
              <option>Pacific Standard Time (PST)</option>
              <option>Eastern Standard Time (EST)</option>
              <option>Greenwich Mean Time (GMT)</option>
              <option>Western Indonesia Time (WIB)</option>
            </select>
          </div>
        </div>
        <SettingsFooter onSave={handleSave} isLoading={isLoading} />
      </div>
    </>
  );
}

/* ── Security Tab (TERSAMBUNG SUPABASE AUTH) ── */
function SecurityTab() {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [passwords, setPasswords] = useState({ new: "", confirm: "" });

  const handleUpdatePassword = async () => {
    if (!passwords.new || !passwords.confirm) {
      toast({ title: "Error", description: "Please fill in all password fields.", variant: "destructive" });
      return;
    }
    if (passwords.new.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }

    if (passwords.new !== passwords.confirm) {
      toast({ title: "Error", description: "New passwords do not match.", variant: "destructive" });
      return;
    }

    setIsUpdating(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.new });
    
    if (error) {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated", description: "Your password has been changed successfully." });
      setPasswords({ new: "", confirm: "" });

      // NOTIFIKASI GANTI PASSWORD
      await logActivity({
        user: "You",
        action: "changed your",
        target: "Account Password",
        type: "warning",
        iconName: "AlertTriangle",
        iconBg: "bg-warning/10 text-warning"
      });
    }
    setIsUpdating(false);
  };

  return (
    <>
      <div className="px-6 py-6 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground">Security</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage your password and account security settings.</p>
      </div>
      <div className="p-6 space-y-8">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Key className="h-4 w-4 text-primary" /> Change Password</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">New Password</label>
              <input type="password" value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} placeholder="••••••••" className="block w-full rounded-xl border border-border bg-card text-foreground shadow-sm focus:border-primary text-sm py-2.5 px-3" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Confirm Password</label>
              <input type="password" value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} placeholder="••••••••" className="block w-full rounded-xl border border-border bg-card text-foreground shadow-sm focus:border-primary text-sm py-2.5 px-3" />
            </div>
          </div>
          <div className="mt-4">
            <motion.button onClick={handleUpdatePassword} disabled={isUpdating} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-xl shadow-primary-glow hover:opacity-90 disabled:opacity-50">
              {isUpdating ? "Updating..." : "Update Password"}
            </motion.button>
          </div>
        </div>
        <hr className="border-border" />
        <div className="p-4 rounded-xl bg-muted/50 border border-border flex items-center gap-4">
           <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Shield className="h-5 w-5" /></div>
           <div>
             <p className="text-sm font-medium text-foreground">Account Protection</p>
             <p className="text-xs text-muted-foreground">Your account is secured by Supabase Authentication layer.</p>
           </div>
        </div>
      </div>
    </>
  );
}

/* ── Notifications Tab (TERSAMBUNG SUPABASE) ── */
function NotificationsTab({ session }: { session: Session | null }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [prefs, setPrefs] = useState({
    email_mentions: true, email_updates: false, email_digest: true,
    push_mentions: true, push_tasks: true, push_comments: false,
  });

  useEffect(() => {
    const fetchPrefs = async () => {
      if (!session?.user?.id) return;
      try {
        const { data, error } = await supabase.from('user_settings').select('*').eq('user_id', session.user.id).maybeSingle();
        if (error) throw error;
        if (data) {
          setPrefs({
            email_mentions: data.email_notifications ?? true,
            email_updates: data.marketing_notifications ?? false,
            email_digest: data.email_notifications ?? true,
            push_mentions: data.push_notifications ?? true,
            push_tasks: data.push_notifications ?? true,
            push_comments: data.push_notifications ?? false,
          });
          return;
        }

        const defaultSettings = {
          user_id: session.user.id,
          email_notifications: true,
          push_notifications: true,
          marketing_notifications: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: createError } = await supabase.from('user_settings').insert(defaultSettings);
        if (createError) throw createError;

        setPrefs({
          email_mentions: true,
          email_updates: false,
          email_digest: true,
          push_mentions: true,
          push_tasks: true,
          push_comments: false,
        });
      } catch (err) {
        console.warn('user_settings load failed, falling back to user_profiles', err);
        const { data } = await supabase.from("user_profiles").select('*').eq('id', session.user.id).maybeSingle();
        if (data) {
          setPrefs({
            email_mentions: data.email_mentions ?? true,
            email_updates: data.email_updates ?? false,
            email_digest: data.email_digest ?? true,
            push_mentions: data.push_mentions ?? true,
            push_tasks: data.push_tasks ?? true,
            push_comments: data.push_comments ?? false,
          });
        }
      }
    };
    fetchPrefs();
  }, [session]);

  const toggle = (key: keyof typeof prefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const handleSave = async () => {
    if (!session?.user?.id) return;
    setIsLoading(true);
    try {
      const settings = {
        user_id: session.user.id,
        email_notifications: prefs.email_mentions || false,
        push_notifications: prefs.push_mentions || false,
        marketing_notifications: prefs.email_updates || false,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('user_settings').upsert(settings, { onConflict: 'user_id' });
      if (error) throw error;

      toast({ title: "Preferences saved", description: "Your notification settings have been updated." });
      await logActivity({
        user: "You",
        action: "updated",
        target: "Notification Preferences",
        type: "success",
        iconName: "CheckCircle",
        iconBg: "bg-success/10 text-success"
      });
    } catch (err) {
      console.error('Failed to save user_settings', err);
      toast({ title: "Error", description: "Failed to save preferences.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const ToggleBtn = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${on ? "bg-primary" : "bg-border"}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-primary-foreground transition-transform ${on ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );

  return (
    <>
      <div className="px-6 py-6 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground">Notifications</h2>
        <p className="text-sm text-muted-foreground mt-1">Choose how you want to be notified.</p>
      </div>
      <div className="p-6 space-y-8">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> Email Notifications</h3>
          <div className="space-y-4">
            {[
              { key: "email_mentions" as const, label: "Mentions & Replies", desc: "When someone mentions you" },
              { key: "email_updates" as const, label: "Project Updates", desc: "Status changes and milestone completions" },
              { key: "email_digest" as const, label: "Weekly Digest", desc: "A summary of your activity every Monday" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors">
                <div><p className="text-sm font-medium text-foreground">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                <ToggleBtn on={prefs[item.key]} onToggle={() => toggle(item.key)} />
              </div>
            ))}
          </div>
        </div>
        <SettingsFooter onSave={handleSave} isLoading={isLoading} />
      </div>
    </>
  );
}

/* ── Billing & Integrations ── */
function WorkspaceTab({ companyId, companyRole }: { companyId: string | null; companyRole: string | null }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyLoaded, setCompanyLoaded] = useState(false);

  useEffect(() => {
    const loadCompany = async () => {
      if (!companyId) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from('companies').select('*').eq('id', companyId).single();
        if (error) throw error;
        setCompanyName(data.name || "");
        setWorkspaceName(data.name || "");
      } catch (err) {
        console.error('Load workspace failed:', err);
        toast({ title: 'Error', description: 'Unable to load workspace settings.', variant: 'destructive' });
      } finally {
        setCompanyLoaded(true);
        setIsLoading(false);
      }
    };

    void loadCompany();
  }, [companyId, toast]);

  const handleSave = async () => {
    if (!companyId) return;
    if (companyRole !== 'owner') {
      toast({ title: 'Not allowed', description: 'Only owners can edit workspace details.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from('companies').update({ name: workspaceName }).eq('id', companyId);
      if (error) throw error;
      setCompanyName(workspaceName);
      toast({ title: 'Workspace updated', description: 'Workspace name has been saved successfully.' });
      await logActivity({ user: 'You', action: 'updated your', target: 'Workspace name', type: 'success', iconName: 'CheckCircle', iconBg: 'bg-success/10 text-success' });
    } catch (err: any) {
      console.error('Save workspace failed:', err);
      toast({ title: 'Error', description: err?.message ?? 'Unable to save workspace.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const isEditable = companyRole === 'owner';

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">Workspace Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage your workspace name and visibility.</p>
      </div>

      {isLoading && !companyLoaded ? (
        <div className="rounded-2xl border border-border p-8 text-center text-sm text-muted-foreground">Loading workspace details...</div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-1.5 max-w-xl">
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Workspace Name</label>
            <input value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} disabled={!isEditable} className="block w-full rounded-xl border border-border bg-card text-foreground shadow-sm focus:border-primary focus:ring-primary/20 text-sm py-2.5 px-3 transition-colors" />
            {!isEditable && <p className="text-xs text-muted-foreground">Only company owners can edit workspace details.</p>}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleSave} disabled={!isEditable || isLoading} className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-xl shadow-primary-glow hover:opacity-90 disabled:opacity-50">Save Workspace</button>
          </div>
        </div>
      )}
    </div>
  );
}

function TeamTab({ companyId, companyRole }: { companyId: string | null; companyRole: string | null }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState<Array<{
    id: string;
    user_id: string;
    role: string;
    status: string;
    created_at: string;
    profile: { first_name?: string | null; last_name?: string | null; email?: string | null } | null;
  }>>([]);

  const isManager = companyRole === 'owner' || companyRole === 'admin';

  const loadMembers = async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('company_members')
        .select('id,user_id,role,status,created_at,user_profiles(first_name,last_name,email)')
        .eq('company_id', companyId)
        .eq('status', 'active');
      if (error) throw error;
      setMembers(
        (data ?? []).map((m: any) => ({
          id: m.id,
          user_id: m.user_id,
          role: m.role,
          status: m.status,
          created_at: m.created_at,
          profile: Array.isArray(m.user_profiles) ? m.user_profiles[0] ?? null : m.user_profiles,
        }))
      );
    } catch (err) {
      console.error('Load team members failed:', err);
      toast({ title: 'Error', description: 'Unable to load team members.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadMembers();
  }, [companyId]);

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!isManager || !companyId) {
      toast({ title: 'Not allowed', description: 'Only owner/admin can manage team.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.from('company_members').update({ role: newRole }).eq('id', memberId);
      if (error) throw error;
      toast({ title: 'Team updated', description: 'Member role has been updated.' });
      await loadMembers();
    } catch (err) {
      console.error('Update role failed:', err);
      toast({ title: 'Error', description: 'Unable to update member role.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (memberId: string, userId: string) => {
    if (!isManager || !companyId) {
      toast({ title: 'Not allowed', description: 'Only owner/admin can manage team.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.from('company_members').delete().eq('id', memberId);
      if (error) throw error;
      await supabase.from('user_profiles').update({ company_id: null }).eq('id', userId);
      toast({ title: 'Member removed', description: 'The member has been removed from the workspace.' });
      await loadMembers();
    } catch (err) {
      console.error('Remove member failed:', err);
      toast({ title: 'Error', description: 'Unable to remove member.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">Team Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage team members and roles.</p>
      </div>
      {isLoading ? (
        <div className="rounded-2xl border border-border p-8 text-center text-sm text-muted-foreground">Loading team members...</div>
      ) : (
        <div className="space-y-4">
          {members.length === 0 ? (
            <div className="rounded-2xl border border-border p-8 text-center text-sm text-muted-foreground">No active team members found.</div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => {
                const name = member.profile?.first_name || member.profile?.email || 'Unknown';
                const email = member.profile?.email || 'No email';
                const isOwner = member.role === 'owner';
                return (
                  <div key={member.id} className="rounded-2xl border border-border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="font-semibold text-foreground">{name}</p>
                      <p className="text-sm text-muted-foreground">{email}</p>
                      <p className="text-xs text-muted-foreground mt-1">Joined {new Date(member.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <select value={member.role} onChange={(e) => handleRoleChange(member.id, e.target.value)} disabled={!isManager || isOwner} className="rounded-xl border border-border bg-card text-foreground text-sm py-2.5 px-3">
                        <option value="owner">Owner</option>
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                      </select>
                      <button onClick={() => handleRemove(member.id, member.user_id)} disabled={!isManager || isOwner} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-destructive border border-destructive/20 rounded-xl hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed">
                        <Trash2 className="h-4 w-4" /> Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BillingTab({ companyId }: { companyId: string | null }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [subscription, setSubscription] = useState<{ plan: string; status: string; billing_cycle: string; expires_at: string } | null>(null);

  useEffect(() => {
    const loadSubscription = async () => {
      if (!companyId) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from('subscriptions').select('*').eq('company_id', companyId).single();
        if (error) {
          if (error.code === 'PGRST116' || error.details?.includes('result contains no rows')) {
            setSubscription(null);
            return;
          }
          throw error;
        }
        setSubscription(data);
      } catch (err: any) {
        if (err?.code === 'PGRST116' || err?.message?.includes('No rows')) {
          setSubscription(null);
        } else {
          console.error('Load subscription failed:', err);
          toast({ title: 'Error', description: 'Unable to load subscription details.', variant: 'destructive' });
        }
      } finally {
        setIsLoading(false);
      }
    };
    void loadSubscription();
  }, [companyId, toast]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-foreground mb-6">Billing & Subscription</h2>
      {isLoading ? (
        <div className="rounded-2xl border border-border p-8 text-center text-sm text-muted-foreground">Loading subscription details...</div>
      ) : subscription ? (
        <div className="grid gap-4">
          <div className="p-6 rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="text-lg font-semibold text-foreground">{subscription.plan}</p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-success">{subscription.status}</span>
            </div>
            <div className="mt-4 grid sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">Billing Cycle</p>
                <p>{subscription.billing_cycle}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Expires At</p>
                <p>{new Date(subscription.expires_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => toast({ title: 'Upgrade', description: 'Upgrade service is not yet connected.' })} className="w-full px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-xl hover:opacity-90 transition">Upgrade Plan</button>
            <button onClick={() => toast({ title: 'Manage', description: 'Manage subscription service is not yet connected.' })} className="w-full px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-xl hover:bg-muted transition">Manage Subscription</button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border p-8 text-center space-y-4">
          <p className="text-sm font-medium text-foreground">No active subscription</p>
          <p className="text-sm text-muted-foreground">Your company does not currently have an active subscription.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => toast({ title: 'Upgrade', description: 'Upgrade service is not yet connected.' })} className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-xl hover:opacity-90 transition">Upgrade Plan</button>
            <button onClick={() => toast({ title: 'Manage', description: 'Manage Subscription service is not yet connected.' })} className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-xl hover:bg-muted transition">Manage Subscription</button>
          </div>
        </div>
      )}
    </div>
  );
}

function IntegrationsTab() {
  const { toast } = useToast();
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold text-foreground mb-2">Connected Apps</h2>
      {[{ name: "Slack", icon: Slack, con: true }, { name: "GitHub", icon: Github, con: false }].map(i => (
        <div key={i.name} className="flex items-center justify-between p-4 border border-border rounded-xl">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center"><i.icon className="w-5 h-5" /></div>
            <p className="font-medium text-sm">{i.name}</p>
          </div>
          <button onClick={() => toast({ title: "Toggle Integration", description: `${i.name} settings updated.` })} className={`px-4 py-1.5 text-xs font-medium rounded-lg ${i.con ? "border border-border text-muted-foreground" : "bg-primary text-white"}`}>{i.con ? "Disconnect" : "Connect"}</button>
        </div>
      ))}
    </div>
  );
}

/* ── MAIN SETTINGS PAGE ── */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("General");
  const { session } = useAuth();

  const { companyId, isCompanyLoading, companyError } = useCompany();
  const [companyRole, setCompanyRole] = useState<string | null>(null);

  useEffect(() => {
    const loadRole = async () => {
      if (!companyId || !session?.user?.id) return;
      try {
        const { data, error } = await supabase.from('company_members').select('role').eq('company_id', companyId).eq('user_id', session.user.id).single();
        if (error) throw error;
        setCompanyRole(data.role ?? null);
      } catch (err) {
        console.warn('Failed to load company role:', err);
        setCompanyRole(null);
      }
    };
    void loadRole();
  }, [companyId, session?.user?.id]);

  const tabContent: Record<string, ReactNode> = {
    General: <GeneralTab session={session} />,
    Security: <SecurityTab />,
    Notifications: <NotificationsTab session={session} />,
    Billing: <BillingTab companyId={companyId} />,
    Integrations: <IntegrationsTab />,
    Workspace: <WorkspaceTab companyId={companyId} companyRole={companyRole} />,
    Team: <TeamTab companyId={companyId} companyRole={companyRole} />,
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">Manage your account settings and preferences.</p>
        {companyError && (
          <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Failed to load company context. Workspace and billing sections may be unavailable.
          </div>
        )}
      </header>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <nav className="w-full lg:w-64 flex-shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.label)}
                className={`group flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.label ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
            className="flex-1 bg-card rounded-2xl shadow-card border border-border overflow-hidden w-full"
          >
            {tabContent[activeTab]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
