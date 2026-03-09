import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Lock, Bell, CreditCard, Puzzle, Camera, Shield, Smartphone, Key, Mail, Monitor, Globe, Slack, Github, Webhook, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const tabs = [
  { icon: User, label: "General" },
  { icon: Lock, label: "Security" },
  { icon: Bell, label: "Notifications" },
  { icon: CreditCard, label: "Billing" },
  { icon: Puzzle, label: "Integrations" },
];

/* ── Shared Footer ── */
function SettingsFooter({ onSave }: { onSave: () => void }) {
  return (
    <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
      <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-xl transition-colors">Cancel</button>
      <motion.button 
        onClick={onSave}
        whileHover={{ scale: 1.02 }} 
        whileTap={{ scale: 0.98 }} 
        className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-xl shadow-primary-glow hover:opacity-90 transition-opacity"
      >
        Save Changes
      </motion.button>
    </div>
  );
}

/* ── General Tab ── */
function GeneralTab() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      toast({
        title: "Photo updated",
        description: `Successfully uploaded ${e.target.files[0].name}`,
      });
    }
  };

  const handleRemovePhoto = () => {
    toast({
      title: "Photo removed",
      description: "Your profile photo has been reset to default.",
      variant: "destructive"
    });
  };

  const handleSave = () => {
    toast({
      title: "Profile updated",
      description: "Your general profile settings have been saved successfully.",
    });
  };

  return (
    <>
      <div className="px-6 py-6 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground">Profile Details</h2>
        <p className="text-sm text-muted-foreground mt-1">Update your photo and personal details here.</p>
      </div>
      <div className="p-6 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative group cursor-pointer" onClick={handleUploadClick}>
            <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-2xl ring-4 ring-muted transition-transform group-hover:scale-105">A</div>
            <div className="absolute inset-0 flex items-center justify-center bg-foreground/40 rounded-full opacity-0 group-hover:opacity-100 transition-all">
              <Camera className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">Profile Photo</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-3">Accepts JPG, GIF or PNG. 1MB Max.</p>
            <div className="flex gap-3">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              <button onClick={handleUploadClick} className="px-3 py-1.5 text-xs font-medium bg-card border border-border rounded-lg shadow-sm hover:bg-muted text-foreground transition-colors">Upload New</button>
              <button onClick={handleRemovePhoto} className="px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors">Remove</button>
            </div>
          </div>
        </div>
        <hr className="border-border" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { label: "First Name", value: "Alex", span: false },
            { label: "Last Name", value: "Morgan", span: false },
            { label: "Email Address", value: "alex@nexus.com", span: true, type: "email" },
          ].map((f) => (
            <div key={f.label} className={`space-y-1.5 ${f.span ? "md:col-span-2" : ""}`}>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">{f.label}</label>
              <input type={f.type || "text"} defaultValue={f.value} className="block w-full rounded-xl border border-border bg-card text-foreground shadow-sm focus:border-primary focus:ring-primary/20 text-sm py-2.5 px-3 transition-colors" />
            </div>
          ))}
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Bio</label>
            <textarea rows={4} placeholder="Tell us a little about yourself..." className="block w-full rounded-xl border border-border bg-card text-foreground shadow-sm focus:border-primary focus:ring-primary/20 text-sm py-2.5 px-3 transition-colors resize-none" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Timezone</label>
            <select className="block w-full rounded-xl border border-border bg-card text-foreground shadow-sm focus:border-primary focus:ring-primary/20 text-sm py-2.5 px-3 transition-colors">
              <option>Pacific Standard Time (PST)</option>
              <option>Eastern Standard Time (EST)</option>
              <option>Greenwich Mean Time (GMT)</option>
              <option>Western Indonesia Time (WIB)</option>
            </select>
          </div>
        </div>
        <SettingsFooter onSave={handleSave} />
      </div>
    </>
  );
}

/* ── Security Tab ── */
function SecurityTab() {
  const { toast } = useToast();
  const [twoFAEnabled, setTwoFAEnabled] = useState(true);
  
  const [sessions, setSessions] = useState([
    { id: 1, device: "MacBook Pro — Chrome", location: "San Francisco, US", time: "Current session", icon: Monitor, active: true },
    { id: 2, device: "iPhone 15 — Safari", location: "San Francisco, US", time: "2 hours ago", icon: Smartphone, active: false },
    { id: 3, device: "Windows PC — Firefox", location: "New York, US", time: "3 days ago", icon: Monitor, active: false },
  ]);

  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });

  const handleUpdatePassword = () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast({ title: "Error", description: "Please fill in all password fields.", variant: "destructive" });
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast({ title: "Error", description: "New passwords do not match.", variant: "destructive" });
      return;
    }
    toast({ title: "Password updated", description: "Your password has been changed successfully." });
    setPasswords({ current: "", new: "", confirm: "" });
  };

  const handleRevokeSession = (id: number) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    toast({ title: "Session revoked", description: "The selected device has been logged out." });
  };

  const handleToggle2FA = () => {
    setTwoFAEnabled(!twoFAEnabled);
    toast({ 
      title: !twoFAEnabled ? "2FA Enabled" : "2FA Disabled", 
      description: !twoFAEnabled ? "Two-factor authentication is now active." : "Two-factor authentication has been turned off." 
    });
  };

  return (
    <>
      <div className="px-6 py-6 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground">Security</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage your password and account security settings.</p>
      </div>
      <div className="p-6 space-y-8">
        {/* Change Password */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Key className="h-4 w-4 text-primary" /> Change Password</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Current Password</label>
              <input type="password" value={passwords.current} onChange={(e) => setPasswords({...passwords, current: e.target.value})} placeholder="••••••••" className="block w-full rounded-xl border border-border bg-card text-foreground shadow-sm focus:border-primary focus:ring-primary/20 text-sm py-2.5 px-3 transition-colors" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">New Password</label>
              <input type="password" value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} placeholder="••••••••" className="block w-full rounded-xl border border-border bg-card text-foreground shadow-sm focus:border-primary focus:ring-primary/20 text-sm py-2.5 px-3 transition-colors" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Confirm Password</label>
              <input type="password" value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} placeholder="••••••••" className="block w-full rounded-xl border border-border bg-card text-foreground shadow-sm focus:border-primary focus:ring-primary/20 text-sm py-2.5 px-3 transition-colors" />
            </div>
          </div>
          <div className="mt-4">
            <motion.button onClick={handleUpdatePassword} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-xl shadow-primary-glow hover:opacity-90 transition-opacity">
              Update Password
            </motion.button>
          </div>
        </div>

        <hr className="border-border" />

        {/* 2FA */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Two-Factor Authentication</h3>
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${twoFAEnabled ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Authenticator App</p>
                <p className="text-xs text-muted-foreground">{twoFAEnabled ? "Enabled — Last verified 3 days ago" : "Not configured"}</p>
              </div>
            </div>
            <button onClick={handleToggle2FA} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${twoFAEnabled ? "bg-primary" : "bg-border"}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-primary-foreground transition-transform ${twoFAEnabled ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        </div>

        <hr className="border-border" />

        {/* Active Sessions */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Monitor className="h-4 w-4 text-primary" /> Active Sessions</h3>
          <div className="space-y-3">
            <AnimatePresence>
              {sessions.map((s) => (
                <motion.div layout key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                      <s.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.device}</p>
                      <p className="text-xs text-muted-foreground">{s.location} · {s.time}</p>
                    </div>
                  </div>
                  {s.active ? (
                    <span className="text-xs font-medium text-success bg-success/10 px-2.5 py-1 rounded-full">Current</span>
                  ) : (
                    <button onClick={() => handleRevokeSession(s.id)} className="text-xs font-medium text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-lg transition-colors">Revoke</button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Notifications Tab ── */
function NotificationsTab() {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState({
    email_mentions: true,
    email_updates: false,
    email_digest: true,
    push_mentions: true,
    push_tasks: true,
    push_comments: false,
  });

  const toggle = (key: keyof typeof prefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${on ? "bg-primary" : "bg-border"}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-primary-foreground transition-transform ${on ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );

  const handleSave = () => {
    toast({ title: "Preferences saved", description: "Your notification settings have been updated." });
  };

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
              { key: "email_mentions" as const, label: "Mentions & Replies", desc: "When someone mentions you or replies to your comment" },
              { key: "email_updates" as const, label: "Project Updates", desc: "Status changes and milestone completions" },
              { key: "email_digest" as const, label: "Weekly Digest", desc: "A summary of your activity every Monday" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Toggle on={prefs[item.key]} onToggle={() => toggle(item.key)} />
              </div>
            ))}
          </div>
        </div>
        <hr className="border-border" />
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Bell className="h-4 w-4 text-primary" /> Push Notifications</h3>
          <div className="space-y-4">
            {[
              { key: "push_mentions" as const, label: "Direct Mentions", desc: "Instant notification when tagged" },
              { key: "push_tasks" as const, label: "Task Assignments", desc: "When a task is assigned to you" },
              { key: "push_comments" as const, label: "New Comments", desc: "Comments on tasks you're following" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Toggle on={prefs[item.key]} onToggle={() => toggle(item.key)} />
              </div>
            ))}
          </div>
        </div>
        <SettingsFooter onSave={handleSave} />
      </div>
    </>
  );
}

/* ── Billing Tab ── */
function BillingTab() {
  const { toast } = useToast();

  const handleAction = (action: string) => {
    toast({ title: "Action Triggered", description: `You clicked "${action}". Redirecting to payment portal...` });
  };

  return (
    <>
      <div className="px-6 py-6 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground">Billing</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage your subscription and payment methods.</p>
      </div>
      <div className="p-6 space-y-8">
        {/* Current Plan */}
        <div className="p-6 rounded-xl border-2 border-primary/20 bg-primary/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-foreground">Professional Plan</h3>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Active</span>
              </div>
              <p className="text-sm text-muted-foreground">$99/month · Next billing date: Nov 24, 2024</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleAction("Change Plan")} className="px-4 py-2 text-sm font-medium border border-border rounded-xl hover:bg-muted text-foreground transition-colors">Change Plan</button>
              <button onClick={() => handleAction("Cancel Plan")} className="px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-xl transition-colors">Cancel</button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4">
            {[
              { label: "Users", value: "8 / 20" },
              { label: "Storage", value: "42GB / 100GB" },
              { label: "API Calls", value: "12K / 50K" },
            ].map((u) => (
              <div key={u.label}>
                <p className="text-xs text-muted-foreground mb-1">{u.label}</p>
                <p className="text-sm font-semibold text-foreground">{u.value}</p>
                <div className="w-full bg-border rounded-full h-1.5 mt-1.5">
                  <div className="bg-primary h-1.5 rounded-full" style={{ width: `${parseInt(u.value) / parseInt(u.value.split("/ ")[1]) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <hr className="border-border" />

        {/* Payment Method */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /> Payment Method</h3>
          <div className="flex items-center justify-between p-4 rounded-xl border border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-blue-400 flex items-center justify-center text-primary-foreground text-[10px] font-bold">VISA</div>
              <div>
                <p className="text-sm font-medium text-foreground">•••• •••• •••• 4242</p>
                <p className="text-xs text-muted-foreground">Expires 12/2026</p>
              </div>
            </div>
            <button onClick={() => handleAction("Update Payment Method")} className="text-sm font-medium text-primary hover:underline">Update</button>
          </div>
        </div>

        <hr className="border-border" />

        {/* Invoice History */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4">Invoice History</h3>
          <div className="space-y-2">
            {[
              { date: "Oct 24, 2024", amount: "$99.00", status: "Paid" },
              { date: "Sep 24, 2024", amount: "$99.00", status: "Paid" },
              { date: "Aug 24, 2024", amount: "$99.00", status: "Paid" },
            ].map((inv) => (
              <div key={inv.date} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-32">{inv.date}</span>
                  <span className="text-sm font-medium text-foreground">{inv.amount}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">{inv.status}</span>
                  <button onClick={() => handleAction(`Download Invoice ${inv.date}`)} className="text-xs text-primary hover:underline font-medium">Download</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Integrations Tab ── */
function IntegrationsTab() {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState([
    { name: "Slack", desc: "Get notified about project updates in your Slack channels", icon: Slack, connected: true },
    { name: "GitHub", desc: "Link repositories and track commits directly from the dashboard", icon: Github, connected: true },
    { name: "Webhooks", desc: "Send event data to your own endpoints for custom automations", icon: Webhook, connected: false },
    { name: "Google Calendar", desc: "Sync events and deadlines with your Google Calendar", icon: Globe, connected: false },
  ]);

  const toggleConnect = (name: string, isCurrentlyConnected: boolean) => {
    setIntegrations((prev) =>
      prev.map((i) => (i.name === name ? { ...i, connected: !i.connected } : i))
    );
    toast({ 
      title: isCurrentlyConnected ? "Disconnected" : "Connected", 
      description: `${name} has been successfully ${isCurrentlyConnected ? "disconnected from" : "connected to"} your account.` 
    });
  };

  return (
    <>
      <div className="px-6 py-6 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground">Integrations</h2>
        <p className="text-sm text-muted-foreground mt-1">Connect your favorite tools to streamline your workflow.</p>
      </div>
      <div className="p-6 space-y-4">
        {integrations.map((int) => (
          <motion.div
            key={int.name}
            layout
            className="flex items-center justify-between p-5 rounded-xl border border-border hover:shadow-card-hover transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-foreground">
                <int.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{int.name}</p>
                <p className="text-xs text-muted-foreground">{int.desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {int.connected && (
                <span className="text-xs font-medium text-success bg-success/10 px-2.5 py-1 rounded-full">Connected</span>
              )}
              <button
                onClick={() => toggleConnect(int.name, int.connected)}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                  int.connected
                    ? "border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50"
                    : "bg-primary text-primary-foreground shadow-primary-glow hover:opacity-90"
                }`}
              >
                {int.connected ? "Disconnect" : "Connect"}
              </button>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
}

/* ── Main Settings Page ── */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("General");

  const tabContent: Record<string, React.ReactNode> = {
    General: <GeneralTab />,
    Security: <SecurityTab />,
    Notifications: <NotificationsTab />,
    Billing: <BillingTab />,
    Integrations: <IntegrationsTab />,
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">Manage your account settings and preferences.</p>
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
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="flex-1 bg-card rounded-2xl shadow-card border border-border overflow-hidden w-full"
          >
            {tabContent[activeTab]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}