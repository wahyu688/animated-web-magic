import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Bell, Check, CreditCard, Globe, LayoutGrid, Lock, Monitor, ShieldCheck, TriangleAlert, Upload, User, Users, Zap, type LucideIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../lib/supabase";
import { logActivity } from "../lib/activityLogger";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/use-company";
import { announceProfileUpdated } from "@/lib/profile-events";
import { findPlan, isPlanActive, isTrialExpired, isTrialStatus } from "@/lib/plans";
import { LEGACY_BUSINESS_TYPE, getBusinessConfig, isBusinessType, type BusinessType } from "@/lib/business";
import { getCurrency, type CurrencyCode } from "@/lib/currency";
import { announceBusinessProfileChanged } from "@/hooks/use-business-profile";
import { BusinessTypePicker, CurrencySelect } from "@/components/workspace/BusinessFields";
import PageHeader from "@/components/app/PageHeader";
import UserAvatar from "@/components/layout/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const TABS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "general", label: "General", icon: User },
  { id: "security", label: "Security", icon: Lock },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "integrations", label: "Integrations", icon: LayoutGrid },
  { id: "workspace", label: "Workspace", icon: Monitor },
  { id: "team", label: "Team", icon: Users },
];

const TIMEZONES = [
  "(GMT-8) America/Los_Angeles",
  "(GMT-5) America/New_York",
  "(GMT+0) Europe/London",
  "(GMT+1) Europe/Berlin",
  "(GMT+7) Asia/Jakarta",
  "(GMT+8) Asia/Singapore",
  "(GMT+8) Asia/Makassar",
  "(GMT+9) Asia/Jayapura",
  "(GMT+9) Asia/Tokyo",
  "(GMT+10) Australia/Sydney",
];

const MAX_AVATAR_BYTES = 1024 * 1024;

/* ── Shared layout ── */

function SettingsCard({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="overflow-hidden rounded-xl border border-border bg-card shadow-xs"
    >
      <div className="divide-y divide-border">{children}</div>
      {footer && <div className="flex items-center justify-end gap-2 border-t border-border bg-surface-2 px-6 py-4">{footer}</div>}
    </motion.div>
  );
}

function SettingsSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="grid gap-5 px-6 py-6 sm:px-7 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
      <div>
        <h2 className="text-[15px] font-semibold leading-[22px] text-foreground">{title}</h2>
        {description && <p className="mt-1 text-small text-muted-foreground">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function FooterButtons({ dirty, canSave = true, saving, onCancel, onSave, label = "Save changes" }: {
  dirty: boolean;
  /** Extra condition for the save button, e.g. form validity. */
  canSave?: boolean;
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
  label?: string;
}) {
  return (
    <>
      <Button variant="ghost" onClick={onCancel} disabled={!dirty || saving}>Cancel</Button>
      <Button onClick={onSave} disabled={!dirty || !canSave} loading={saving}>
        {!saving && <Check />} {label}
      </Button>
    </>
  );
}

/* ── General ── */

interface ProfileForm {
  first_name: string;
  last_name: string;
  bio: string;
  timezone: string;
}

function GeneralTab() {
  const { toast } = useToast();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saved, setSaved] = useState<ProfileForm | null>(null);
  const [form, setForm] = useState<ProfileForm>({ first_name: "", last_name: "", bio: "", timezone: TIMEZONES[4] });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    supabase.from("user_profiles").select("first_name, last_name, bio, timezone, avatar_url").eq("id", userId).maybeSingle().then(({ data, error }) => {
      if (error) {
        toast({ title: "Couldn't load your profile", description: "Refresh the page and try again.", variant: "destructive" });
        return;
      }
      const loaded = {
        first_name: data?.first_name ?? "",
        last_name: data?.last_name ?? "",
        bio: data?.bio ?? "",
        timezone: data?.timezone || TIMEZONES[4],
      };
      setSaved(loaded);
      setForm(loaded);
      setAvatarUrl(data?.avatar_url ?? null);
    });
  }, [userId, toast]);

  const dirty = saved !== null && JSON.stringify(saved) !== JSON.stringify(form);

  const handleSave = async () => {
    if (!userId) return;
    setIsSaving(true);
    const { error } = await supabase
      .from("user_profiles")
      .update({ ...form, first_name: form.first_name.trim(), last_name: form.last_name.trim(), updated_at: new Date().toISOString() })
      .eq("id", userId);
    setIsSaving(false);

    if (error) {
      toast({ title: "Couldn't save your profile", description: error.message, variant: "destructive" });
      return;
    }
    setSaved(form);
    announceProfileUpdated();
    toast({ title: "Profile updated", description: "Your teammates will see the new details." });
    await logActivity({ user: "You", action: "updated", target: "their profile", type: "success", iconName: "CheckCircle", iconBg: "bg-success/10 text-success" });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!userId || !file) return;
    if (!/^image\/(jpeg|png|gif)$/.test(file.type)) {
      toast({ title: "Unsupported file", description: "Use a JPG, GIF or PNG image.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast({ title: "File is too large", description: "Profile photos can be up to 1MB.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const filePath = `avatars/${userId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const { error: updateError } = await supabase.from("user_profiles").update({ avatar_url: urlData.publicUrl }).eq("id", userId);
      if (updateError) throw updateError;
      setAvatarUrl(urlData.publicUrl);
      announceProfileUpdated();
      toast({ title: "Photo updated" });
    } catch (err) {
      console.error("Avatar upload failed:", err);
      toast({ title: "Upload failed", description: "Your photo wasn't changed. Try again.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!userId) return;
    const { error } = await supabase.from("user_profiles").update({ avatar_url: null }).eq("id", userId);
    if (error) {
      toast({ title: "Couldn't remove the photo", description: "Try again.", variant: "destructive" });
      return;
    }
    setAvatarUrl(null);
    announceProfileUpdated();
  };

  const initials = `${form.first_name.charAt(0)}${form.last_name.charAt(0)}`.toUpperCase() || (session?.user?.email?.charAt(0).toUpperCase() ?? "?");
  const timezoneOptions = TIMEZONES.includes(form.timezone) ? TIMEZONES : [form.timezone, ...TIMEZONES];

  if (!saved) return <SettingsCard><div className="space-y-4 p-6"><Skeleton className="h-16 w-full" /><Skeleton className="h-64 w-full" /></div></SettingsCard>;

  return (
    <SettingsCard footer={<FooterButtons dirty={dirty} saving={isSaving} onCancel={() => setForm(saved)} onSave={handleSave} />}>
      <SettingsSection title="Profile photo" description="Accepts JPG, GIF or PNG. 1MB max.">
        <div className="flex flex-wrap items-center gap-4">
          <UserAvatar initials={initials} imageUrl={avatarUrl} size={64} className="text-[22px]" />
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/jpeg,image/png,image/gif" />
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()} loading={isUploading}>
            {!isUploading && <Upload strokeWidth={1.75} />} Upload New
          </Button>
          {avatarUrl && <Button variant="ghost" onClick={handleRemovePhoto}>Remove</Button>}
        </div>
      </SettingsSection>

      <SettingsSection title="Personal info" description="This is how teammates see you in NexusFlow.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="first-name">First Name</Label>
            <Input id="first-name" autoComplete="given-name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="last-name">Last Name</Label>
            <Input id="last-name" autoComplete="family-name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Input id="email" type="email" disabled value={session?.user?.email ?? ""} className="pr-9" aria-describedby="email-hint" />
              <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" strokeWidth={1.75} />
            </div>
            <p id="email-hint" className="text-caption font-normal text-muted-foreground">Email is managed by the authentication provider.</p>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              rows={4}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="A line or two about what you work on"
              className="w-full resize-none rounded-lg border border-input bg-card px-3 py-2.5 text-[15px] text-foreground shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-subtle focus:border-primary focus:ring-[3px] focus:ring-primary/15"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={form.timezone} onValueChange={(value) => setForm({ ...form, timezone: value })}>
              <SelectTrigger id="timezone" className="h-10 justify-start md:text-[15px] [&>svg:last-child]:ml-auto">
                <Globe className="h-4 w-4 shrink-0 text-subtle" strokeWidth={1.75} />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timezoneOptions.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingsSection>
    </SettingsCard>
  );
}

/* ── Security ── */

function SecurityTab() {
  const { toast } = useToast();
  const [passwords, setPasswords] = useState({ next: "", confirm: "" });
  const [isSaving, setIsSaving] = useState(false);

  const tooShort = passwords.next.length > 0 && passwords.next.length < 8;
  const mismatch = passwords.confirm.length > 0 && passwords.next !== passwords.confirm;
  const valid = passwords.next.length >= 8 && passwords.next === passwords.confirm;

  const handleSave = async () => {
    if (!valid) return;
    setIsSaving(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.next });
    setIsSaving(false);
    if (error) {
      toast({ title: "Couldn't change your password", description: error.message, variant: "destructive" });
      return;
    }
    setPasswords({ next: "", confirm: "" });
    toast({ title: "Password changed", description: "Use the new password next time you sign in." });
    await logActivity({ user: "You", action: "changed", target: "their password", type: "warning", iconName: "AlertTriangle", iconBg: "bg-warning/10 text-warning" });
  };

  return (
    <SettingsCard
      footer={
        <FooterButtons
          dirty={passwords.next !== "" || passwords.confirm !== ""}
          canSave={valid}
          saving={isSaving}
          onCancel={() => setPasswords({ next: "", confirm: "" })}
          onSave={() => void handleSave()}
          label="Update password"
        />
      }
    >
      <SettingsSection title="Password" description="Change the password you use to sign in.">
        <div className="max-w-[520px] space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" strokeWidth={1.75} />
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={passwords.next}
                onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                aria-invalid={tooShort}
                aria-describedby="new-password-hint"
                className="pl-9"
              />
            </div>
            <p id="new-password-hint" className={cn("text-caption font-normal", tooShort ? "text-destructive" : "text-muted-foreground")}>
              At least 8 characters.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" strokeWidth={1.75} />
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                aria-invalid={mismatch}
                aria-describedby={mismatch ? "confirm-error" : undefined}
                className="pl-9"
              />
            </div>
            {mismatch && <p id="confirm-error" className="text-caption font-normal text-destructive">Passwords don't match.</p>}
          </div>
          <p className="flex items-center gap-2.5 rounded-[10px] bg-success-soft px-4 py-3 text-small text-foreground">
            <ShieldCheck className="h-[18px] w-[18px] shrink-0 text-success" strokeWidth={1.75} />
            Sign-in and passwords are handled by Supabase Authentication.
          </p>
        </div>
      </SettingsSection>
    </SettingsCard>
  );
}

/* ── Notifications ── */

interface NotificationPrefs {
  email_notifications: boolean;
  push_notifications: boolean;
  marketing_notifications: boolean;
}

// One switch per user_settings column (the same three the Activity page shows).
const PREF_ROWS: { key: keyof NotificationPrefs; label: string; description: string }[] = [
  { key: "email_notifications", label: "Activity & mentions", description: "Mentions, replies and changes to your work." },
  { key: "push_notifications", label: "Browser notifications", description: "Alerts while NexusFlow is open in your browser." },
  { key: "marketing_notifications", label: "Product news", description: "Occasional updates about new NexusFlow features." },
];

function NotificationsTab() {
  const { toast } = useToast();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [saved, setSaved] = useState<NotificationPrefs | null>(null);
  const [prefs, setPrefs] = useState<NotificationPrefs>({ email_notifications: true, push_notifications: true, marketing_notifications: false });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("user_settings")
      .select("email_notifications, push_notifications, marketing_notifications")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          toast({ title: "Couldn't load your preferences", description: "Refresh the page and try again.", variant: "destructive" });
          return;
        }
        const loaded = {
          email_notifications: data?.email_notifications ?? true,
          push_notifications: data?.push_notifications ?? true,
          marketing_notifications: data?.marketing_notifications ?? false,
        };
        setSaved(loaded);
        setPrefs(loaded);
      });
  }, [userId, toast]);

  const dirty = saved !== null && JSON.stringify(saved) !== JSON.stringify(prefs);

  const handleSave = async () => {
    if (!userId) return;
    setIsSaving(true);
    const { error } = await supabase.from("user_settings").upsert({ user_id: userId, ...prefs, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    setIsSaving(false);
    if (error) {
      toast({ title: "Couldn't save your preferences", description: "Try again.", variant: "destructive" });
      return;
    }
    setSaved(prefs);
    toast({ title: "Preferences saved" });
  };

  if (!saved) return <SettingsCard><div className="p-6"><Skeleton className="h-40 w-full" /></div></SettingsCard>;

  return (
    <SettingsCard footer={<FooterButtons dirty={dirty} saving={isSaving} onCancel={() => setPrefs(saved)} onSave={handleSave} />}>
      <SettingsSection title="Notifications" description="Choose what NexusFlow tells you about.">
        <ul className="space-y-5">
          {PREF_ROWS.map((row) => (
            <li key={row.key} className="flex items-center justify-between gap-4">
              <label htmlFor={row.key} className="min-w-0 cursor-pointer">
                <span className="block text-label text-foreground">{row.label}</span>
                <span className="block text-small text-muted-foreground">{row.description}</span>
              </label>
              <Switch id={row.key} checked={prefs[row.key]} onCheckedChange={(value) => setPrefs({ ...prefs, [row.key]: value })} />
            </li>
          ))}
        </ul>
        <p className="mt-5 text-caption font-normal text-muted-foreground">
          Emails aren't sent yet; these choices are saved for when delivery is switched on.
        </p>
      </SettingsSection>
    </SettingsCard>
  );
}

/* ── Billing ── */

interface Subscription {
  plan: string;
  status: string;
  billing_cycle: string | null;
  expires_at: string | null;
}

function BillingTab({ companyId }: { companyId: string | null }) {
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null | undefined>(undefined);

  useEffect(() => {
    if (!companyId) return;
    supabase
      .from("subscriptions")
      .select("plan, status, billing_cycle, expires_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          toast({ title: "Couldn't load billing", description: "Refresh the page and try again.", variant: "destructive" });
          setSubscription(null);
          return;
        }
        setSubscription(data);
      });
  }, [companyId, toast]);

  const plan = findPlan(subscription?.plan);
  const cycle = subscription?.billing_cycle === "monthly" ? "monthly" : "yearly";
  const price = plan?.price[cycle];
  const isActive = subscription && isPlanActive(subscription.status, subscription.expires_at);
  const isTrial = isTrialStatus(subscription?.status);
  const trialEnded = isTrialExpired(subscription?.status, subscription?.expires_at);

  return (
    <SettingsCard>
      <SettingsSection title="Billing & Subscription" description="Your plan, billing cycle and renewal date.">
        {subscription === undefined ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : subscription && isActive ? (
          <div className="space-y-4 rounded-xl border border-primary bg-primary-soft/50 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-primary text-primary-foreground">
                <Zap className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-h3 text-foreground">{plan?.name ?? subscription.plan}</p>
                {plan && <p className="text-small text-muted-foreground">{plan.summary}</p>}
              </div>
              <Badge variant="success" className="capitalize">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> {isTrial ? "Trial" : subscription.status}
              </Badge>
            </div>
            <dl className="grid gap-2.5 sm:grid-cols-3">
              {[
                ["Current Plan", plan?.name ?? subscription.plan],
                ["Billing Cycle", `${cycle === "yearly" ? "Yearly" : "Monthly"}${price ? ` · $${price}/month` : ""}`],
                [isTrial ? "Trial ends" : "Renews / Expires", subscription.expires_at ? new Date(subscription.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "No end date"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[10px] border border-border bg-card px-3.5 py-3">
                  <dt className="text-caption font-normal text-muted-foreground">{label}</dt>
                  <dd className="text-label text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-caption font-normal text-muted-foreground">
                {isTrial ? "Subscribe before your trial ends to keep your workspace going." : "Invoices aren't available in the app yet."}
              </p>
              <Button asChild size="sm" variant={isTrial ? "default" : "secondary"}>
                <Link to="/pricing">{isTrial ? "Choose a plan" : "Change plan"}</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-dashed border-border-strong p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-surface-2 text-muted-foreground">
              <CreditCard className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-label text-foreground">{trialEnded ? "Your free trial has ended" : "No active subscription"}</p>
              <p className="text-small text-muted-foreground">
                {trialEnded ? "Choose a plan to keep using your workspace." : "This workspace doesn't currently have an active plan."}
              </p>
            </div>
            <Button asChild size="sm" className="ml-auto shrink-0">
              <Link to="/pricing">Choose a plan</Link>
            </Button>
          </div>
        )}
      </SettingsSection>
    </SettingsCard>
  );
}

/* ── Integrations ── */

function IntegrationsTab() {
  const apps = [
    { name: "Slack", initial: "S", tone: "bg-[#4a154b] text-white", description: "Post task and calendar updates to a channel." },
    { name: "GitHub", initial: "G", tone: "bg-[#0b1220] text-white dark:bg-white dark:text-[#0b1220]", description: "Link pull requests to Project Board tasks." },
  ];
  return (
    <SettingsCard>
      <SettingsSection title="Connected Apps" description="Bring updates from the tools you already use.">
        <ul className="space-y-3">
          {apps.map((app) => (
            <li key={app.name} className="flex items-center gap-3.5 rounded-xl border border-border p-4">
              <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-[15px] font-semibold", app.tone)} aria-hidden="true">
                {app.initial}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-label text-foreground">
                  {app.name} <Badge variant="neutral" size="sm">Coming soon</Badge>
                </p>
                <p className="text-small text-muted-foreground">{app.description}</p>
              </div>
              <Button variant="secondary" size="sm" disabled>Connect</Button>
            </li>
          ))}
        </ul>
      </SettingsSection>
    </SettingsCard>
  );
}

/* ── Workspace ── */

interface WorkspaceValues {
  name: string;
  businessType: BusinessType;
  currency: CurrencyCode;
}

function WorkspaceTab({ companyId, companyRole }: { companyId: string | null; companyRole: string | null }) {
  const { toast } = useToast();
  const [saved, setSaved] = useState<WorkspaceValues | null>(null);
  const [draft, setDraft] = useState<WorkspaceValues | null>(null);
  // False until the business_profile migration has added the columns.
  const [hasProfileColumns, setHasProfileColumns] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const isOwner = companyRole === "owner";

  useEffect(() => {
    if (!companyId) return;
    // select("*") so a database without the new columns still loads the name.
    supabase.from("companies").select("*").eq("id", companyId).maybeSingle().then(({ data, error }) => {
      if (error) {
        toast({ title: "Couldn't load the workspace", description: "Refresh the page and try again.", variant: "destructive" });
        return;
      }
      const values: WorkspaceValues = {
        name: data?.name ?? "",
        businessType: isBusinessType(data?.business_type) ? data.business_type : LEGACY_BUSINESS_TYPE,
        currency: getCurrency(data?.currency).code,
      };
      setHasProfileColumns(data ? "business_type" in data && "currency" in data : true);
      setSaved(values);
      setDraft(values);
    });
  }, [companyId, toast]);

  const typeChanged = Boolean(saved && draft && saved.businessType !== draft.businessType);
  const currencyChanged = Boolean(saved && draft && saved.currency !== draft.currency);
  const dirty = Boolean(saved && draft && draft.name.trim() !== "" && (draft.name.trim() !== saved.name || typeChanged || currencyChanged));

  const handleSave = async () => {
    if (!companyId || !isOwner || !saved || !draft) return;
    setIsSaving(true);
    const changes: Record<string, string> = {};
    if (draft.name.trim() !== saved.name) changes.name = draft.name.trim();
    if (typeChanged) changes.business_type = draft.businessType;
    if (currencyChanged) changes.currency = draft.currency;
    const { error } = await supabase.from("companies").update(changes).eq("id", companyId);
    setIsSaving(false);
    if (error) {
      toast({ title: "Couldn't update the workspace", description: error.message, variant: "destructive" });
      return;
    }
    const next = { ...draft, name: draft.name.trim() };
    setSaved(next);
    setDraft(next);
    if (typeChanged || currencyChanged) announceBusinessProfileChanged(companyId);
    toast({ title: "Workspace updated", description: "Everyone will see the changes after their next refresh." });
    if (changes.name) {
      await logActivity({ user: "You", action: "renamed the workspace to", target: changes.name, type: "success", iconName: "CheckCircle", iconBg: "bg-success/10 text-success" });
    }
    if (typeChanged || currencyChanged) {
      await logActivity({
        user: "You", action: "changed the workspace business type to", target: `${getBusinessConfig(next.businessType).label} · ${next.currency}`,
        type: "success", iconName: "CheckCircle", iconBg: "bg-success/10 text-success",
      });
    }
  };

  const update = (patch: Partial<WorkspaceValues>) => setDraft((current) => (current ? { ...current, ...patch } : current));
  const ownerHint = isOwner ? "Only you, as the owner, can change this." : "Only the workspace owner can change this.";

  return (
    <SettingsCard footer={isOwner && <FooterButtons dirty={dirty} saving={isSaving} onCancel={() => setDraft(saved)} onSave={handleSave} />}>
      <SettingsSection title="Workspace" description="The name everyone in your company sees.">
        {!draft ? (
          <Skeleton className="h-10 w-full max-w-[420px]" />
        ) : (
          <div className="max-w-[420px] space-y-1.5">
            <Label htmlFor="workspace-name">Workspace Name</Label>
            <Input id="workspace-name" value={draft.name} onChange={(e) => update({ name: e.target.value })} disabled={!isOwner} aria-describedby="workspace-hint" />
            <p id="workspace-hint" className="text-caption font-normal text-muted-foreground">{ownerHint}</p>
          </div>
        )}
      </SettingsSection>

      <SettingsSection title="Business type & currency" description="Decides what the Financial page asks for, which KPIs the Dashboard shows, and how amounts are written.">
        {!draft ? (
          <Skeleton className="h-56 w-full max-w-[520px]" />
        ) : !hasProfileColumns ? (
          <p className="max-w-[520px] rounded-[10px] border border-warning/20 bg-warning-soft px-4 py-3 text-small text-foreground">
            Your database doesn't have business types yet. Run <code className="font-mono text-caption">2026-11-11_business_profile.sql</code> in Supabase to turn them on.
          </p>
        ) : (
          <div className="max-w-[520px] space-y-4">
            <div className="space-y-2">
              <p id="business-type-label" className="text-label text-foreground">Business type</p>
              <BusinessTypePicker value={draft.businessType} onChange={(businessType) => update({ businessType })} disabled={!isOwner} labelledBy="business-type-label" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="workspace-currency">Currency</Label>
              <CurrencySelect id="workspace-currency" value={draft.currency} onChange={(currency) => update({ currency })} disabled={!isOwner} describedBy="currency-hint" />
              <p id="currency-hint" className="text-caption font-normal text-muted-foreground">{ownerHint}</p>
            </div>
            {(typeChanged || currencyChanged) && (
              <div role="status" className="flex gap-2.5 rounded-[10px] border border-warning/20 bg-warning-soft px-4 py-3 text-small text-foreground">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" strokeWidth={1.75} />
                <div className="space-y-1">
                  {typeChanged && (
                    <p>The Financial form and KPIs will switch to {getBusinessConfig(draft.businessType).label}. Months you already saved keep their numbers, but fields the new type asks for will be empty until you fill them in.</p>
                  )}
                  {currencyChanged && <p>Amounts aren't converted. Numbers you already entered will be shown in {draft.currency} as they are.</p>}
                </div>
              </div>
            )}
          </div>
        )}
      </SettingsSection>
    </SettingsCard>
  );
}

/* ── Team ── */

function TeamTab() {
  return (
    <SettingsCard>
      <SettingsSection title="Team" description="Invite colleagues, change roles and remove members.">
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-primary-soft text-primary">
            <Users className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <p className="min-w-0 flex-1 text-small text-muted-foreground">Members and invitations are managed on the Team page.</p>
          <Button asChild variant="secondary">
            <Link to="/team">Open Team <ArrowRight /></Link>
          </Button>
        </div>
      </SettingsSection>
    </SettingsCard>
  );
}

/* ── Page ── */

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = TABS.some((tab) => tab.id === searchParams.get("tab")) ? searchParams.get("tab")! : "general";
  const { session } = useAuth();
  const { companyId } = useCompany();
  const [companyRole, setCompanyRole] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId || !session?.user?.id) return;
    supabase
      .from("company_members")
      .select("role")
      .eq("company_id", companyId)
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => setCompanyRole(data?.role ?? null));
  }, [companyId, session?.user?.id]);

  const content: Record<string, ReactNode> = {
    general: <GeneralTab />,
    security: <SecurityTab />,
    notifications: <NotificationsTab />,
    billing: <BillingTab companyId={companyId} />,
    integrations: <IntegrationsTab />,
    workspace: <WorkspaceTab companyId={companyId} companyRole={companyRole} />,
    team: <TeamTab />,
  };

  return (
    <div className="space-y-6 px-4 pb-12 pt-6 sm:px-6 lg:px-8 lg:pt-7">
      <PageHeader title="Settings" description="Manage your account settings and preferences." />

      <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
          <ul className="flex gap-1 lg:flex-col">
            {TABS.map((tab) => {
              const active = tab.id === activeTab;
              return (
                <li key={tab.id}>
                  <button
                    type="button"
                    onClick={() => setSearchParams({ tab: tab.id }, { replace: true })}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-10 w-full items-center gap-3 whitespace-nowrap rounded-lg border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active ? "border-border bg-card font-semibold text-primary-text shadow-xs" : "border-transparent text-foreground hover:bg-surface-2"
                    )}
                  >
                    <tab.icon className={cn("h-[18px] w-[18px]", active ? "text-primary" : "text-muted-foreground")} strokeWidth={1.75} />
                    {tab.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div key={activeTab} className="min-w-0">{content[activeTab]}</div>
      </div>
    </div>
  );
}
