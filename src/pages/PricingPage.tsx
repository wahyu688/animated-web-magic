import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Link } from "react-router-dom"; // <-- Tambahan untuk navigasi

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
    features: ["Everything in Starter, plus:", "Up to 20 Users", "100GB Cloud Storage", "Priority Support", "Advanced Analytics"],
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
  { q: "Can I change my plan later?", a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle." },
  { q: "What payment methods do you accept?", a: "We accept all major credit cards, PayPal, and wire transfers for Enterprise plans." },
  { q: "Is there a free trial?", a: "Yes! All plans include a 14-day free trial. No credit card required." },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="min-h-screen bg-background-light pt-32 pb-20">
      
      {/* Tombol Back to Home (Khusus untuk tampilan mandiri di luar Layout Dashboard) */}
      <div className="max-w-6xl mx-auto px-6 mb-8">
        <Link to="/" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
          ← Back to Home
        </Link>
      </div>

      <div className="p-6 lg:p-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-4"
          >
            Simple, transparent pricing
          </motion.h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10">
            Choose the plan that works best for your team. All plans include a 14-day free trial.
          </p>

          {/* Toggle */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex items-center p-1.5 bg-card border border-border rounded-2xl shadow-sm">
              <button
                onClick={() => setBilling("monthly")}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                  billing === "monthly" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling("yearly")}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                  billing === "yearly" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Yearly <span className="ml-1 text-[10px] uppercase bg-success/20 text-success px-1.5 py-0.5 rounded-full">-20%</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-20">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className={`relative flex flex-col rounded-2xl bg-card p-8 transition-shadow duration-300 ${
                plan.highlighted
                  ? "border-2 border-primary shadow-card-hover scale-[1.02] z-10"
                  : "border border-border shadow-card hover:shadow-card-hover"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                  {plan.badge}
                </div>
              )}
              <div className={`mb-8 ${plan.badge ? "mt-2" : ""}`}>
                <h3 className="text-primary text-lg font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  {plan.price[billing] ? (
                    <>
                      <span className="text-4xl md:text-5xl font-black text-foreground">${plan.price[billing]}</span>
                      <span className="text-muted-foreground font-medium">/month</span>
                    </>
                  ) : (
                    <span className="text-4xl md:text-5xl font-black text-foreground">Custom</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-3">{plan.desc}</p>
              </div>
              <div className="flex-1 space-y-4 mb-10">
                {plan.features.map((f, fi) => (
                  <div key={fi} className="flex items-start gap-3 text-sm">
                    <Check className="h-5 w-5 text-primary shrink-0" />
                    <span className={fi === 0 && plan.highlighted ? "font-semibold text-primary" : "text-foreground"}>{f}</span>
                  </div>
                ))}
              </div>
              
              {/* Tombol yang mengarah ke /login */}
              <Link to="/login">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-sm transition-all duration-200 ${
                    plan.highlighted
                      ? "bg-primary text-primary-foreground shadow-primary-glow hover:opacity-90"
                      : "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
                  }`}
                >
                  {plan.cta}
                </motion.button>
              </Link>

              {plan.highlighted && (
                <p className="text-center text-[11px] text-muted-foreground mt-3">No credit card required for 14-day trial</p>
              )}
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto py-16">
          <h2 className="text-2xl font-black text-foreground text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-6 rounded-xl bg-card border border-border shadow-sm"
              >
                <h4 className="font-bold text-foreground mb-2">{faq.q}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}