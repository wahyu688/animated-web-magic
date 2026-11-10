import { ArrowRight, Check, Loader2, RefreshCw, TriangleAlert, X } from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface PaymentState {
  stage: "processing" | "success" | "error";
  plan: string;
  price: number | null;
  message?: string;
}

interface CheckoutDialogProps {
  payment: PaymentState | null;
  billing: "monthly" | "yearly";
  /** How long the simulated payment takes, so the progress bar can match it. */
  processingMs: number;
  onCancel: () => void;
  onRetry: () => void;
  onGoToDashboard: () => void;
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

export default function CheckoutDialog({ payment, billing, processingMs, onCancel, onRetry, onGoToDashboard }: CheckoutDialogProps) {
  const isProcessing = payment?.stage === "processing";

  return (
    <Dialog
      open={payment !== null}
      onOpenChange={(open) => {
        // The workspace is being created while processing; don't let it be dismissed mid-way.
        if (!open && !isProcessing) onCancel();
      }}
    >
      <DialogContent
        className="max-w-[440px] gap-5 p-8 text-center [&>button:last-child]:hidden"
        onEscapeKeyDown={(event) => isProcessing && event.preventDefault()}
        onPointerDownOutside={(event) => isProcessing && event.preventDefault()}
      >
        {payment?.stage === "processing" && (
          <>
            <StatusCircle tone="primary">
              <Loader2 className="h-[30px] w-[30px] animate-spin" strokeWidth={2} />
            </StatusCircle>
            <div className="space-y-3">
              <DialogTitle>Processing payment…</DialogTitle>
              <DialogDescription>
                Activating your <b className="font-semibold text-foreground">{payment.plan}</b> plan. Please wait a moment.
              </DialogDescription>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-track" role="progressbar" aria-label="Payment progress">
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
              <DialogTitle>Payment successful!</DialogTitle>
              <DialogDescription>
                Your <b className="font-semibold text-foreground">{payment.plan}</b> plan is now active.
              </DialogDescription>
            </div>
            <dl className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface-2 text-left text-small">
              {[
                ["Plan", payment.plan],
                ["Billing", billing === "yearly" ? "Yearly" : "Monthly"],
                ["Total", payment.price != null ? `$${payment.price}/month` : "Custom"],
              ].map(([label, value]) => (
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
              <DialogTitle>Payment failed</DialogTitle>
              <DialogDescription>We couldn't create your workspace. Your card hasn't been charged.</DialogDescription>
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
