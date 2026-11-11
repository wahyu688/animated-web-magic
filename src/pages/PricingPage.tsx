import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Mail, Minus, Plus, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/use-company";
import { useWorkspaceSummary, type WorkspaceSummary } from "@/hooks/use-workspace-summary";
import { clearCompanyCache } from "@/lib/company";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import SectionHeading from "@/components/public/SectionHeading";
import CheckoutDialog, { type CheckoutKind, type PaymentState, type WorkspaceSetup } from "@/components/public/pricing/CheckoutDialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PLANS as plans, TRIAL_LENGTH_DAYS, isTrialExpired, isTrialStatus } from "@/lib/plans";

// Simulated payment length (no payment gateway yet).
const PROCESSING_MS = 1600;

const faqs = [
  { q: "Can I change my plan later?", a: "Yes. Come back to this page whenever you like to switch plans. The new price applies from your next billing cycle." },
  { q: "What payment methods do you accept?", a: "We accept all major credit cards, PayPal, and wire transfers for Enterprise plans." },
  { q: "Is there a free trial?", a: "Yes. Starter and Professional come with a 14-day free trial, no credit card required. When it ends, pick a plan to keep your workspace going." },
];

type Billing = "monthly" | "yearly";

interface SubscriptionValues {
  plan: string;
  status: "trialing" | "active";
  billing_cycle: Billing;
  expires_at: string | null;
}

function BillingToggle({ value, onChange }: { value: Billing; onChange: (value: Billing) => void }) {
  const options: { value: Billing; label: string }[] = [
    { value: "monthly", label: "Monthly" },
    { value: "yearly", label: "Yearly" },
  ];
  return (
    <div role="radiogroup" aria-label="Billing period" className="inline-flex items-center gap-0.5 rounded-[9px] border border-border bg-surface-2 p-[3px]">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex h-[34px] items-center gap-1.5 rounded-[7px] px-3.5 text-label transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
            {option.value === "yearly" && <Badge variant="success" size="sm">−20%</Badge>}
          </button>
        );
      })}
    </div>
  );
}

interface PlanActionProps {
  plan: string;
  price: number | null;
  highlighted: boolean;
  defaultCta: string;
  hasWorkspace: boolean;
  current: WorkspaceSummary | null;
  busy: boolean;
  onCheckout: (kind: CheckoutKind) => void;
}

/** Supabase errors are plain objects ({ message, code }), not Error instances. */
function describeCheckoutError(error: unknown) {
  const { message, code } = (error ?? {}) as { message?: string; code?: string };
  if (!message) return "Something went wrong while activating your plan.";
  // PostgREST can't find the new columns: the business_profile migration hasn't been run.
  if (code === "PGRST204" && /business_type|currency/.test(message)) {
    return "The database is missing the business type and currency columns. Run 2026-11-11_business_profile.sql in Supabase, then try again.";
  }
  return code ? `${message} (${code})` : message;
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** CTA block under the price: free trial for new visitors, subscribe/switch for existing workspaces. */
function PlanAction({ plan, price, highlighted, defaultCta, hasWorkspace, current, busy, onCheckout }: PlanActionProps) {
  const variant = highlighted ? "default" : "secondary";
  const isThisPlan = current?.plan === plan.toLowerCase();
  const trialEnded = isThisPlan && isTrialExpired(current?.status, current?.expiresAt);
  const onActiveTrial = isThisPlan && isTrialStatus(current?.status) && !trialEnded;

  if (isThisPlan && current?.status === "active") {
    return (
      <Button size="lg" variant="secondary" className="w-full" disabled>
        <Check className="!size-[18px]" strokeWidth={2.2} /> Current plan
      </Button>
    );
  }

  // Enterprise has no self-serve trial.
  const canTrial = !hasWorkspace && price != null;

  if (canTrial) {
    return (
      <div className="space-y-2 text-center">
        <Button size="lg" variant={variant} className="w-full" disabled={busy} onClick={() => onCheckout("trial")}>
          Start {TRIAL_LENGTH_DAYS}-day free trial
          {highlighted && <ArrowRight className="!size-[18px]" />}
        </Button>
        <p className="text-caption font-normal text-muted-foreground">
          No credit card required. Or{" "}
          <button
            type="button"
            disabled={busy}
            onClick={() => onCheckout("payment")}
            className="rounded-sm font-medium text-primary-text underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            subscribe now
          </button>
        </p>
      </div>
    );
  }

  const label = !hasWorkspace || (price == null && !isThisPlan)
    ? defaultCta
    : current?.status === "active" && !isThisPlan
      ? `Switch to ${plan}`
      : `Subscribe to ${plan}`;

  return (
    <div className="space-y-2 text-center">
      <Button size="lg" variant={variant} className="w-full" disabled={busy} onClick={() => onCheckout("payment")}>
        {label}
        {highlighted && <ArrowRight className="!size-[18px]" />}
      </Button>
      {onActiveTrial && current?.expiresAt && (
        <p className="text-caption font-normal text-muted-foreground">Your trial runs until {formatShortDate(current.expiresAt)}.</p>
      )}
      {trialEnded && <p className="text-caption font-normal text-warning">Your free trial has ended.</p>}
    </div>
  );
}

export default function PricingPage() {
  const [billing, setBilling] = useState<Billing>("yearly");
  const [payment, setPayment] = useState<PaymentState | null>(null);

  const navigate = useNavigate();
  const { session } = useAuth();
  const { companyId } = useCompany();

  const workspace = useWorkspaceSummary(companyId);
  const hasWorkspace = Boolean(companyId);

  /** Points the workspace's subscription row at the new plan (insert if it never had one). */
  const saveSubscription = async (targetCompanyId: string, values: SubscriptionValues) => {
    const { data: updated, error: updateError } = await supabase
      .from("subscriptions")
      .update(values)
      .eq("company_id", targetCompanyId)
      .select("id");

    if (updateError) throw updateError;
    if (updated && updated.length > 0) return;

    const { error: insertError } = await supabase
      .from("subscriptions")
      .insert({ company_id: targetCompanyId, ...values });

    if (insertError) {
      // RLS: only owners/admins may change a workspace's plan.
      if (insertError.code === "42501") throw new Error("Only workspace owners and admins can change the plan.");
      throw insertError;
    }
  };

  const defaultWorkspaceName = `${session?.user?.user_metadata?.first_name || "My"} Workspace`;

  /** New workspaces pick a name, business type and currency first; existing ones go straight to checkout. */
  const startCheckout = (kind: CheckoutKind, planName: string, price: number | null) => {
    if (!session?.user) {
      navigate("/login?mode=signup");
      return;
    }
    if (hasWorkspace) {
      void handleCheckout(kind, planName, price);
      return;
    }
    setPayment({ kind, stage: "setup", plan: planName, price });
  };

  const handleCheckout = async (kind: CheckoutKind, planName: string, price: number | null, setup?: WorkspaceSetup) => {
    try {
      if (!session?.user) {
        navigate("/login?mode=signup");
        return;
      }

      const user = session.user;
      setPayment({ kind, stage: "processing", plan: planName, price, setup });

      // Simulasi proses pembayaran (project tugas — belum ada payment gateway). Trials skip it.
      if (kind === "payment") {
        await new Promise((resolve) => setTimeout(resolve, PROCESSING_MS));
      }

      const endsAt = kind === "trial" ? new Date(Date.now() + TRIAL_LENGTH_DAYS * 86_400_000).toISOString() : null;
      const subscription: SubscriptionValues = {
        plan: planName.toLowerCase(),
        status: kind === "trial" ? "trialing" : "active",
        billing_cycle: billing,
        expires_at: endsAt,
      };

      let existingCompanyId = companyId;
      if (!existingCompanyId) {
        const [{ data: profile }, { data: member }] = await Promise.all([
          supabase
            .from("user_profiles")
            .select("company_id")
            .eq("id", user.id)
            .maybeSingle(),
          supabase
            .from("company_members")
            .select("company_id")
            .eq("user_id", user.id)
            .eq("status", "active")
            .limit(1)
            .maybeSingle(),
        ]);
        existingCompanyId = profile?.company_id ?? member?.company_id ?? null;
      }

      if (existingCompanyId) {
        // One trial per workspace; an existing workspace can only subscribe.
        if (kind === "trial") throw new Error("Your workspace has already used its free trial. Choose a plan to keep going.");
        await saveSubscription(existingCompanyId, subscription);
      } else {
        // create workspace/company
        const { data: company, error: companyError } = await supabase
          .from("companies")
          .insert({
            name: setup?.name || `${user.user_metadata?.first_name || "My"} Workspace`,
            ...(setup ? { business_type: setup.businessType, currency: setup.currency } : {}),
          })
          .select()
          .single();

        if (companyError) throw companyError;

        // insert member
        const { error: memberError } = await supabase
          .from("company_members")
          .insert({
            company_id: company.id,
            user_id: user.id,
            role: "owner",
            status: "active",
          });

        if (memberError) throw memberError;

        // update profile
        const { error: profileError } = await supabase
          .from("user_profiles")
          .update({
            company_id: company.id,
            role: "owner",
          })
          .eq("id", user.id);

        if (profileError) throw profileError;

        // create subscription
        const { error: subscriptionError } = await supabase
          .from("subscriptions")
          .insert({ company_id: company.id, ...subscription });

        if (subscriptionError) throw subscriptionError;
      }

      clearCompanyCache();
      setPayment({ kind, stage: "success", plan: planName, price, endsAt, setup });
    } catch (error) {
      console.error("Checkout error:", error);
      setPayment({ kind, stage: "error", plan: planName, price, setup, message: describeCheckoutError(error) });
    }
  };

  const handleGoToDashboard = () => {
    setPayment(null);
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNavbar />

      <main>
        <section className="bg-[linear-gradient(180deg,#e8eeff_0%,hsl(var(--background))_100%)] px-5 pb-12 pt-12 sm:px-6 sm:pt-20">
          <SectionHeading
            as="h1"
            eyebrow="Pricing"
            title="Simple, transparent pricing"
            lead="Choose the plan that works best for your team. Try Starter or Professional free for 14 days, no credit card required."
            className="max-w-[600px]"
            leadClassName="max-w-[560px]"
          />
          <div className="mt-5 flex justify-center">
            <BillingToggle value={billing} onChange={setBilling} />
          </div>
        </section>

        <section className="px-5 sm:px-6">
          <div className="mx-auto grid max-w-[1200px] items-center gap-6 lg:grid-cols-3">
            {plans.map((plan, index) => {
              const price = plan.price[billing];
              const yearlySaving = plan.price.monthly != null && plan.price.yearly != null
                ? (plan.price.monthly - plan.price.yearly) * 12
                : null;

              return (
                <motion.article
                  key={plan.name}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: index * 0.04, ease: "easeOut" }}
                  className={cn(
                    "flex flex-col gap-6 rounded-[20px] bg-card px-7",
                    plan.highlighted ? "border-2 border-primary py-9 shadow-md" : "border border-border py-8 shadow-xs"
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-[19px] font-semibold leading-6 tracking-[-0.01em] text-foreground">{plan.name}</h2>
                      {plan.badge && (
                        <Badge variant="solid">
                          <Sparkles strokeWidth={2} /> {plan.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[13px] leading-5 text-muted-foreground">{plan.desc}</p>
                  </div>

                  <div className="space-y-3">
                    <p className="flex items-end gap-1.5">
                      {price != null ? (
                        <>
                          <span className="text-[44px] font-bold leading-[44px] tracking-[-0.03em] text-foreground tabular">${price}</span>
                          <span className="pb-1.5 text-small text-muted-foreground">/month</span>
                        </>
                      ) : (
                        <span className="text-[40px] font-bold leading-[44px] tracking-[-0.03em] text-foreground">Custom</span>
                      )}
                    </p>
                    <p className={cn("text-caption font-normal", price != null && billing === "yearly" ? "text-success" : "text-muted-foreground")}>
                      {price == null
                        ? "Tailored to your team."
                        : billing === "yearly"
                          ? `Billed yearly. Save $${yearlySaving} a year.`
                          : "Billed monthly. Cancel anytime."}
                    </p>
                  </div>

                  <PlanAction
                    plan={plan.name}
                    price={price}
                    highlighted={plan.highlighted}
                    defaultCta={plan.cta}
                    hasWorkspace={hasWorkspace}
                    current={workspace}
                    busy={payment?.stage === "processing"}
                    onCheckout={(kind) => startCheckout(kind, plan.name, price)}
                  />

                  <div className="h-px bg-border" />

                  <ul className="space-y-3">
                    {plan.featuresLead && <li className="text-label text-foreground">{plan.featuresLead}</li>}
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2.5 text-small text-foreground">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </motion.article>
              );
            })}
          </div>
        </section>

        <section className="px-5 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-8 lg:flex-row lg:gap-16">
            <div className="space-y-3 lg:w-[360px] lg:shrink-0">
              <h2 className="text-[28px] font-bold leading-[34px] tracking-[-0.025em] text-foreground sm:text-h2">Questions, answered</h2>
              <p className="text-body text-muted-foreground">
                Can't find what you need? Write to us and a founder will reply within a day.
              </p>
              <Button asChild variant="secondary">
                <Link to="/about">
                  <Mail strokeWidth={1.75} /> Contact Sales
                </Link>
              </Button>
            </div>

            <Accordion type="single" collapsible defaultValue={faqs[0].q} className="flex-1 overflow-hidden rounded-2xl border border-border bg-card">
              {faqs.map((faq) => (
                <AccordionItem key={faq.q} value={faq.q} className="border-b border-border last:border-b-0">
                  <AccordionTrigger className="group gap-4 px-6 py-5 text-left text-[16px] font-semibold leading-[22px] text-foreground hover:no-underline [&>svg:last-child]:hidden">
                    {faq.q}
                    <Plus className="h-[18px] w-[18px] shrink-0 text-muted-foreground group-data-[state=open]:hidden" strokeWidth={1.75} />
                    <Minus className="hidden h-[18px] w-[18px] shrink-0 text-muted-foreground group-data-[state=open]:block" strokeWidth={1.75} />
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-5 text-body text-muted-foreground">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>

      <PublicFooter />

      <CheckoutDialog
        payment={payment}
        billing={billing}
        processingMs={PROCESSING_MS}
        onCancel={() => setPayment(null)}
        onRetry={() => payment && void handleCheckout(payment.kind, payment.plan, payment.price, payment.setup)}
        onSetupSubmit={(setup) => payment && void handleCheckout(payment.kind, payment.plan, payment.price, setup)}
        defaultWorkspaceName={defaultWorkspaceName}
        onGoToDashboard={handleGoToDashboard}
      />
    </div>
  );
}
