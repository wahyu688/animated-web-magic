import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/use-company";
import { clearCompanyCache } from "@/lib/company";


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
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);

  const navigate = useNavigate();
  const { user, session, refreshAuth } = useAuth();
  const { companyId, isCompanyLoading } = useCompany();

  useEffect(() => {
    let isMounted = true;
    const loadInvites = async () => {
      if (!user?.email) {
        if (isMounted) setPendingInvitesCount(0);
        return;
      }
      const normalizedEmail = user.email.toLowerCase().trim();
      const { data, error } = await supabase
        .from("invitations")
        .select("id", { count: "exact" })
        .eq("email", normalizedEmail)
        .eq("status", "pending");

      if (!isMounted) return;
      if (error) {
        console.error("Load pending invites error:", error);
        setPendingInvitesCount(0);
        return;
      }
      setPendingInvitesCount(data?.length ?? 0);
    };

    void loadInvites();

    return () => {
      isMounted = false;
    };
  }, [user?.email]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      clearCompanyCache();
      await refreshAuth();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleSubscribe = async (planName: string) => {
    try {
      if (!session?.user) {
        navigate("/login");
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
      navigate("/dashboard", { replace: true });

    } catch (error) {
      console.error("Subscribe error:", error);
    }
  };

  useEffect(() => {
    if (!isCompanyLoading && companyId) {
      navigate("/dashboard", { replace: true });
    }
  }, [companyId, isCompanyLoading, navigate]);

  return (
      <div className="min-h-screen bg-[#fcfcfd] text-slate-900">          
      {/* --- NAVBAR --- */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 border-b border-[#0f2ab3]/5"
        style={{
          background: "rgba(252,252,253,0.8)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

          <Link to="/" className="flex items-center gap-3">

            <img
              src="/nextflowIcon-Cd3kiR7z.ico"
              alt="NexusFlow Logo"
              className="w-11 h-11 object-contain"
            />

            <span className="text-xl font-black tracking-tight text-[#376CDD]">
              NEXUSFLOW
            </span>

          </Link>

          <div className="hidden md:flex items-center gap-10">
            <Link
              to="/"
              className="text-sm font-medium text-slate-600 hover:text-[#0f2ab3] transition-colors"
            >
              Home
            </Link>

            <Link
              to="/pricing"
              className="text-sm font-bold text-[#376CDD]"
            >
              Pricing
            </Link>

            <Link
              to="/about"
              className="text-sm font-medium text-slate-600 hover:text-[#0f2ab3] transition-colors"
            >
              About
            </Link>
          </div>

          {!user ? (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-[#0f2ab3] transition-colors">
                Login
              </Link>
              <Link
                to="/login"
                className="text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg transition-all hover:-translate-y-0.5 bg-[#376CDD]"
              >
                Get Started
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="text-sm font-medium text-slate-600 hover:text-[#0f2ab3] transition-colors"
              >
                Dashboard
              </Link>
              {pendingInvitesCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                  {pendingInvitesCount} invite{pendingInvitesCount > 1 ? "s" : ""}
                </span>
              )}
              <button onClick={handleLogout} className="text-sm font-medium text-slate-600 hover:text-[#0f2ab3] transition-colors">
                Logout
              </button>
            </div>
          )}

        </div>
      </nav>

      <div className="px-6 lg:px-10 pb-10 pt-36 max-w-6xl mx-auto">        
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-4 mt-2"
          >
            Simple, transparent pricing
          </motion.h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Choose the plan that works best for your team. All plans include a 14-day free trial.
          </p>

          {/* Toggle */}
          <div className="flex justify-center mb-10">
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
              
              <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSubscribe(plan.name)}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-sm transition-all duration-200 ${
                    plan.highlighted
                      ? "bg-primary text-primary-foreground shadow-primary-glow hover:opacity-90"
                      : "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"}`}>
                  {plan.cta}
              </motion.button>

              {plan.highlighted && (
                <p className="text-center text-[11px] text-muted-foreground mt-3">No credit card required for 14-day trial</p>
              )}
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto py-10">
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
