import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Mail, Minus, Plus, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/use-company";
import { clearCompanyCache } from "@/lib/company";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import SectionHeading from "@/components/public/SectionHeading";
import CheckoutDialog, { type PaymentState } from "@/components/public/pricing/CheckoutDialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Simulated payment length (no payment gateway yet).
const PROCESSING_MS = 1600;

const plans = [
  {
    name: "Starter",
    price: { monthly: 29, yearly: 23 },
    desc: "Ideal for small teams and startups just getting started.",
    features: ["Up to 5 Users", "10GB Cloud Storage", "Basic Email Support", "Public Projects"],
    highlighted: false,
    cta: "Get Started",
  },
  {
    name: "Professional",
    price: { monthly: 99, yearly: 79 },
    desc: "Perfect for scaling companies requiring advanced workflow.",
    featuresLead: "Everything in Starter, plus:",
    features: ["Up to 20 Users", "100GB Cloud Storage", "Priority Support", "Advanced Analytics"],
    highlighted: true,
    cta: "Upgrade Now",
    badge: "Most Popular",
  },
  {
    name: "Enterprise",
    price: { monthly: null, yearly: null },
    desc: "For organizations needing enterprise-grade security and scale.",
    features: ["Unlimited Users", "Unlimited Storage", "Dedicated Account Manager", "SSO & Enterprise Security", "Custom SLA"],
    highlighted: false,
    cta: "Contact Sales",
  },
];

const faqs = [
  { q: "Can I change my plan later?", a: "Yes. Upgrade or downgrade from Settings → Billing whenever you like. The new price applies from your next billing cycle." },
  { q: "What payment methods do you accept?", a: "We accept all major credit cards, PayPal, and wire transfers for Enterprise plans." },
  { q: "Is there a free trial?", a: "Yes! All plans include a 14-day free trial. No credit card required." },
];

type Billing = "monthly" | "yearly";

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

export default function PricingPage() {
  const [billing, setBilling] = useState<Billing>("yearly");
  const [payment, setPayment] = useState<PaymentState | null>(null);

  const navigate = useNavigate();
  const { session } = useAuth();
  const { companyId, isCompanyLoading } = useCompany();

  const handleSubscribe = async (planName: string, price: number | null) => {
    try {
      if (!session?.user) {
        navigate("/login?mode=signup");
        return;
      }

      const user = session.user;

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

      const existingCompanyId = profile?.company_id ?? member?.company_id;
      if (existingCompanyId) {
        navigate("/dashboard", { replace: true });
        return;
      }

      // Simulasi proses pembayaran (project tugas — belum ada payment gateway)
      setPayment({ stage: "processing", plan: planName, price });
      await new Promise((resolve) => setTimeout(resolve, PROCESSING_MS));

      // create workspace/company
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .insert({
          name: `${user.user_metadata?.first_name || "My"} Workspace`,
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
        .insert({
          company_id: company.id,
          plan: planName.toLowerCase(),
          status: "active",
          billing_cycle: billing,
        });

      if (subscriptionError) throw subscriptionError;

      clearCompanyCache();
      setPayment({ stage: "success", plan: planName, price });

    } catch (error) {
      console.error("Subscribe error:", error);
      const message = error instanceof Error ? error.message : "Something went wrong while activating your plan.";
      setPayment({ stage: "error", plan: planName, price, message });
    }
  };

  const handleGoToDashboard = () => {
    setPayment(null);
    navigate("/dashboard", { replace: true });
  };

  useEffect(() => {
    if (!isCompanyLoading && companyId && !payment) {
      navigate("/dashboard", { replace: true });
    }
  }, [companyId, isCompanyLoading, navigate, payment]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNavbar />

      <main>
        <section className="bg-[linear-gradient(180deg,#e8eeff_0%,hsl(var(--background))_100%)] px-5 pb-12 pt-12 sm:px-6 sm:pt-20">
          <SectionHeading
            as="h1"
            eyebrow="Pricing"
            title="Simple, transparent pricing"
            lead="Choose the plan that works best for your team. All plans include a 14-day free trial."
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

                  <div className="space-y-2 text-center">
                    <Button
                      size="lg"
                      variant={plan.highlighted ? "default" : "secondary"}
                      className="w-full"
                      onClick={() => handleSubscribe(plan.name, price)}
                    >
                      {plan.cta}
                      {plan.highlighted && <ArrowRight className="!size-[18px]" />}
                    </Button>
                    {plan.highlighted && (
                      <p className="text-caption font-normal text-muted-foreground">No credit card required for 14-day trial</p>
                    )}
                  </div>

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
        onRetry={() => payment && void handleSubscribe(payment.plan, payment.price)}
        onGoToDashboard={handleGoToDashboard}
      />
    </div>
  );
}
