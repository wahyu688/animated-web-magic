import { useId, useState } from "react";
import { ArrowRight, Check, Loader2, RefreshCw, TriangleAlert, X } from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BusinessTypePicker, CurrencySelect } from "@/components/workspace/BusinessFields";
import { DEFAULT_BUSINESS_TYPE, getBusinessConfig, type BusinessType } from "@/lib/business";
import { guessCurrency, type CurrencyCode } from "@/lib/currency";
import { cn } from "@/lib/utils";

export type CheckoutKind = "trial" | "payment";

/** Collected before a new workspace is created. */
export interface WorkspaceSetup {
  name: string;
  businessType: BusinessType;
  currency: CurrencyCode;
}

export interface PaymentState {
  kind: CheckoutKind;
  stage: "setup" | "processing" | "success" | "error";
  plan: string;
  price: number | null;
  message?: string;
  /** Trial end date (ISO), set once a trial has started. */
  endsAt?: string | null;
  /** Workspace details from the setup step (new workspaces only). */
  setup?: WorkspaceSetup;
}

interface CheckoutDialogProps {
  payment: PaymentState | null;
  billing: "monthly" | "yearly";
  /** How long the simulated payment takes, so the progress bar can match it. */
  processingMs: number;
  onCancel: () => void;
  onRetry: () => void;
  onGoToDashboard: () => void;
  onSetupSubmit: (setup: WorkspaceSetup) => void;
  defaultWorkspaceName: string;
}

interface SetupStepProps {
  kind: CheckoutKind;
  plan: string;
  initial: WorkspaceSetup;
  onCancel: () => void;
  onSubmit: (setup: WorkspaceSetup) => void;
}

function SetupStep({ kind, plan, initial, onCancel, onSubmit }: SetupStepProps) {
  const [name, setName] = useState(initial.name);
  const [businessType, setBusinessType] = useState<BusinessType>(initial.businessType);
  const [currency, setCurrency] = useState<CurrencyCode>(initial.currency);
  const ids = useId();

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!name.trim()) return;
        onSubmit({ name: name.trim(), businessType, currency });
      }}
    >
      <div className="space-y-1.5">
        <DialogTitle>Set up your workspace</DialogTitle>
        <DialogDescription>
          This decides what the Financial page asks for and which numbers your dashboard shows. You can change it later in Settings.
        </DialogDescription>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${ids}-name`}>Workspace name</Label>
        <Input id={`${ids}-name`} value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} autoFocus />
      </div>

      <div className="space-y-2">
        <p id={`${ids}-type`} className="text-label text-foreground">What kind of business is it?</p>
        <BusinessTypePicker value={businessType} onChange={setBusinessType} labelledBy={`${ids}-type`} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${ids}-currency`}>Currency</Label>
        <CurrencySelect id={`${ids}-currency`} value={currency} onChange={setCurrency} describedBy={`${ids}-currency-hint`} />
        <p id={`${ids}-currency-hint`} className="text-caption font-normal text-muted-foreground">Every amount in your reports is shown in this currency.</p>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <Button type="button" size="lg" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="lg" disabled={!name.trim()}>
          {kind === "trial" ? `Start ${plan} trial` : "Continue to payment"}
        </Button>
      </div>
    </form>
  );
}

function StatusCircle({ tone, children }: { tone: "primary" | "success" | "danger"; children: React.ReactNode }) {
  const tones = {
    primary: "bg-primary-soft text-primary",
    success: "bg-success-soft text-success",
    danger: "bg-destructive-soft text-destructive",
  };
  return (
    <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${tones[tone]}`}>{children}</span>
  );
}

export default function CheckoutDialog({
  payment, billing, processingMs, onCancel, onRetry, onGoToDashboard, onSetupSubmit, defaultWorkspaceName,
}: CheckoutDialogProps) {
  const isProcessing = payment?.stage === "processing";
  const isSetup = payment?.stage === "setup";
  const isTrial = payment?.kind === "trial";
  const total = payment?.price != null ? `$${payment.price}/month` : "Custom";

  return (
    <Dialog
      open={payment !== null}
      onOpenChange={(open) => {
        // The workspace is being created while processing; don't let it be dismissed mid-way.
        if (!open && !isProcessing) onCancel();
      }}
    >
      <DialogContent
        className={cn(
          "max-h-[calc(100dvh-2rem)] gap-5 overflow-y-auto [&>button:last-child]:hidden",
          isSetup ? "max-w-[520px] p-6 text-left sm:p-7" : "max-w-[440px] p-8 text-center"
        )}
        onEscapeKeyDown={(event) => isProcessing && event.preventDefault()}
        onPointerDownOutside={(event) => isProcessing && event.preventDefault()}
      >
        {payment?.stage === "setup" && (
          <SetupStep
            kind={payment.kind}
            plan={payment.plan}
            initial={payment.setup ?? { name: defaultWorkspaceName, businessType: DEFAULT_BUSINESS_TYPE, currency: guessCurrency() }}
            onCancel={onCancel}
            onSubmit={onSetupSubmit}
          />
        )}

        {payment?.stage === "processing" && (
          <>
            <StatusCircle tone="primary">
              <Loader2 className="h-[30px] w-[30px] animate-spin" strokeWidth={2} />
            </StatusCircle>
            <div className="space-y-3">
              <DialogTitle>{isTrial ? "Setting up your workspace…" : "Processing payment…"}</DialogTitle>
              <DialogDescription>
                {isTrial ? "Starting your" : "Activating your"} <b className="font-semibold text-foreground">{payment.plan}</b>{" "}
                {isTrial ? "trial" : "plan"}. Please wait a moment.
              </DialogDescription>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-track" role="progressbar" aria-label={isTrial ? "Workspace setup progress" : "Payment progress"}>
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: "8%" }}
                animate={{ width: "92%" }}
                transition={{ duration: processingMs / 1000, ease: "easeOut" }}
              />
            </div>
          </>
        )}

        {payment?.stage === "success" && (
          <>
            <StatusCircle tone="success">
              <Check className="h-[30px] w-[30px]" strokeWidth={2.6} />
            </StatusCircle>
            <div className="space-y-1.5">
              <DialogTitle>{isTrial ? "Your free trial has started" : "Payment successful!"}</DialogTitle>
              <DialogDescription>
                {isTrial ? (
                  <>Explore everything in <b className="font-semibold text-foreground">{payment.plan}</b> free. No card needed.</>
                ) : (
                  <>Your <b className="font-semibold text-foreground">{payment.plan}</b> plan is now active.</>
                )}
              </DialogDescription>
            </div>
            <dl className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface-2 text-left text-small">
              {(isTrial
                ? [
                    ["Plan", `${payment.plan} (trial)`],
                    ...(payment.setup ? [["Workspace", `${getBusinessConfig(payment.setup.businessType).label} · ${payment.setup.currency}`]] : []),
                    ["Trial ends", payment.endsAt ? new Date(payment.endsAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"],
                    ["After trial", `${total} if you subscribe`],
                  ]
                : [
                    ["Plan", payment.plan],
                    ...(payment.setup ? [["Workspace", `${getBusinessConfig(payment.setup.businessType).label} · ${payment.setup.currency}`]] : []),
                    ["Billing", billing === "yearly" ? "Yearly" : "Monthly"],
                    ["Total", total],
                  ]
              ).map(([label, value]) => (
                <div key={label} className="flex justify-between px-4 py-3">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-semibold text-foreground tabular">{value}</dd>
                </div>
              ))}
            </dl>
            <Button size="lg" onClick={onGoToDashboard} autoFocus>
              Go to Dashboard <ArrowRight className="!size-[18px]" />
            </Button>
          </>
        )}

        {payment?.stage === "error" && (
          <>
            <StatusCircle tone="danger">
              <X className="h-[30px] w-[30px]" strokeWidth={2.4} />
            </StatusCircle>
            <div className="space-y-1.5">
              <DialogTitle>{isTrial ? "Couldn't start your trial" : "Payment failed"}</DialogTitle>
              <DialogDescription>
                {isTrial ? "We couldn't set up your workspace. Nothing was charged." : "We couldn't activate your plan. Your card hasn't been charged."}
              </DialogDescription>
            </div>
            {payment.message && (
              <p className="flex gap-2 rounded-[10px] bg-destructive-soft p-3 text-left text-small text-destructive">
                <TriangleAlert className="mt-px h-4 w-4 shrink-0" strokeWidth={1.75} />
                <span className="break-words">{payment.message}</span>
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button size="lg" variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
              <Button size="lg" onClick={onRetry} autoFocus>
                <RefreshCw className="!size-[18px]" strokeWidth={1.75} /> Try Again
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
