import { useEffect, useState } from "react";
import { Lock, Mail, Save, SendHorizontal, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ROLE_OPTIONS, type UiRole } from "@/lib/team";

interface MemberAccessDialogProps {
  open: boolean;
  mode: "invite" | "edit";
  workspaceName?: string;
  initialEmail?: string;
  initialRole?: UiRole;
  saving: boolean;
  onClose: () => void;
  onSubmit: (email: string, role: UiRole) => void;
}

export default function MemberAccessDialog({
  open, mode, workspaceName, initialEmail = "", initialRole = "Editor", saving, onClose, onSubmit,
}: MemberAccessDialogProps) {
  const [email, setEmail] = useState(initialEmail);
  const [role, setRole] = useState<UiRole>(initialRole);

  useEffect(() => {
    if (open) {
      setEmail(initialEmail);
      setRole(initialRole);
    }
  }, [open, initialEmail, initialRole]);

  const isEdit = mode === "edit";

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !saving && onClose()}>
      <DialogContent className="max-w-[460px] gap-5 rounded-2xl p-6 [&>button:last-child]:hidden">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-primary-soft text-primary">
            <Mail className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div className="flex-1 space-y-1">
            <DialogTitle className="text-[18px] font-semibold leading-6">{isEdit ? "Edit Member Access" : "Invite Colleague"}</DialogTitle>
            <DialogDescription className="text-small">
              {isEdit
                ? `Change what this member can do${workspaceName ? ` in ${workspaceName}` : ""}.`
                : "When they sign up or log in with this email, they'll be asked to join your workspace."}
            </DialogDescription>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close" disabled={saving}>
            <X strokeWidth={1.75} />
          </Button>
        </div>

        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) onSubmit(email.trim().toLowerCase(), role);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="member-email">Email Address</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" strokeWidth={1.75} />
              <Input
                id="member-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="pl-9 pr-9"
                disabled={isEdit}
                autoFocus={!isEdit}
                required
              />
              {isEdit && <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" strokeWidth={1.75} />}
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="mb-2 text-label text-foreground">Assign Role</legend>
            <div role="radiogroup" className="space-y-2">
              {ROLE_OPTIONS.map((option) => {
                const selected = role === option.role;
                return (
                  <button
                    key={option.role}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setRole(option.role)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-[10px] border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selected ? "border-primary bg-primary-soft ring-1 ring-primary" : "border-border hover:border-border-strong"
                    )}
                  >
                    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", selected ? "bg-card text-primary" : "bg-surface-2 text-muted-foreground")}>
                      <option.icon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <span className="flex-1">
                      <span className="block text-label text-foreground">{option.role}</span>
                      <span className="block text-caption font-normal text-muted-foreground">{option.description}</span>
                    </span>
                    <span
                      className={cn(
                        "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2",
                        selected ? "border-primary" : "border-border-strong"
                      )}
                      aria-hidden="true"
                    >
                      {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" loading={saving} disabled={!email.trim()}>
              {!saving && (isEdit ? <Save strokeWidth={1.75} /> : <SendHorizontal strokeWidth={1.75} />)}
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Send Invite"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
