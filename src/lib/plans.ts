export interface Plan {
  name: string;
  /** Per-month price in USD; null means custom pricing. */
  price: { monthly: number | null; yearly: number | null };
  desc: string;
  summary: string;
  featuresLead?: string;
  features: string[];
  highlighted: boolean;
  cta: string;
  badge?: string;
}

/** Plan catalogue shared by Pricing and Settings → Billing. */
export const PLANS: Plan[] = [
  {
    name: "Starter",
    price: { monthly: 29, yearly: 23 },
    desc: "Ideal for small teams and startups just getting started.",
    summary: "Up to 5 users · 10GB storage",
    features: ["Up to 5 Users", "10GB Cloud Storage", "Basic Email Support", "Public Projects"],
    highlighted: false,
    cta: "Get Started",
  },
  {
    name: "Professional",
    price: { monthly: 99, yearly: 79 },
    desc: "Perfect for scaling companies requiring advanced workflow.",
    summary: "Up to 20 users · 100GB storage",
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
    summary: "Unlimited users · Unlimited storage",
    features: ["Unlimited Users", "Unlimited Storage", "Dedicated Account Manager", "SSO & Enterprise Security", "Custom SLA"],
    highlighted: false,
    cta: "Contact Sales",
  },
];

export function findPlan(name: string | null | undefined) {
  return PLANS.find((plan) => plan.name.toLowerCase() === (name ?? "").toLowerCase());
}

export const TRIAL_LENGTH_DAYS = 14;

const TRIAL_STATUSES = ["trial", "trialing"];

export function isTrialStatus(status: string | null | undefined) {
  return TRIAL_STATUSES.includes(status ?? "");
}

/** A trial whose end date has passed no longer counts as an active plan. */
export function isTrialExpired(status: string | null | undefined, expiresAt: string | null | undefined) {
  if (!isTrialStatus(status) || !expiresAt) return false;
  const endsAt = new Date(expiresAt).getTime();
  return !Number.isNaN(endsAt) && endsAt <= Date.now();
}

export function isPlanActive(status: string | null | undefined, expiresAt: string | null | undefined) {
  if (status === "active") return true;
  return isTrialStatus(status) && !isTrialExpired(status, expiresAt);
}
