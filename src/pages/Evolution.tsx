import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Activity,
  Scale,
  TrendingUp,
  Layers,
  Cpu,
  ArrowRight,
  ArrowDown,
  Gauge,
  Users,
  ShieldAlert,
  LineChart,
  X,
  CheckCircle2,
  Building2,
  Mail,
  User,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const Section = ({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) => (
  <motion.section
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-80px" }}
    className="max-w-5xl mx-auto px-6 py-16 md:py-24"
  >
    <motion.p
      variants={fadeUp}
      custom={0}
      className="text-xs tracking-[0.25em] uppercase text-primary mb-3"
    >
      {eyebrow}
    </motion.p>
    <motion.h2
      variants={fadeUp}
      custom={1}
      className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-8 leading-tight"
    >
      {title}
    </motion.h2>
    <motion.div variants={fadeUp} custom={2}>
      {children}
    </motion.div>
  </motion.section>
);

const Card = ({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 hover:border-primary/40 transition-colors">
    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
      <Icon className="w-5 h-5 text-accent" />
    </div>
    <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground leading-relaxed">{children}</p>
  </div>
);

const GENERIC_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "yahoo.in",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "live.co.uk",
  "msn.com",
  "aol.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "qq.com",
  "163.com",
  "126.com",
  "protonmail.com",
  "proton.me",
  "pm.me",
  "mail.com",
  "yandex.com",
  "yandex.ru",
  "zoho.com",
  "gmx.com",
  "gmx.net",
  "hey.com",
  "fastmail.com",
  "fastmail.fm",
  "tutanota.com",
  "tutanota.de",
  "runbox.com",
  "hushmail.com",
  "lycos.com",
  "rediffmail.com",
  "sify.com",
]);

const isCompanyEmail = (email: string) => {
  const match = email.toLowerCase().trim().match(/@([^@]+)$/);
  if (!match) return false;
  const domain = match[1];
  if (GENERIC_EMAIL_DOMAINS.has(domain)) return false;
  // Also block subdomains of generic providers, e.g. mail.google.com
  const parts = domain.split(".");
  for (let i = 0; i < parts.length - 1; i++) {
    const sub = parts.slice(i).join(".");
    if (GENERIC_EMAIL_DOMAINS.has(sub)) return false;
  }
  return true;
};

interface EarlyInterestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EarlyInterestModal = ({ isOpen, onClose }: EarlyInterestModalProps) => {
  const [formData, setFormData] = useState({ name: "", email: "", company: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({ name: "", email: "", company: "" });
      setErrors({});
      setIsSubmitting(false);
      setIsSuccess(false);
    }
  }, [isOpen]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      nextErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      nextErrors.name = "Name must be at least 2 characters";
    }

    const email = formData.email.trim().toLowerCase();
    if (!email) {
      nextErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Please enter a valid email address";
    } else if (!isCompanyEmail(email)) {
      nextErrors.email = "Please use your company email address";
    }

    if (!formData.company.trim()) {
      nextErrors.company = "Company name is required";
    } else if (formData.company.trim().length < 2) {
      nextErrors.company = "Company name must be at least 2 characters";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const { error } = await supabase
      .from("early_interest_registrations" as any)
      .insert({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        company: formData.company.trim(),
      } as any);

    setIsSubmitting(false);
    if (error) {
      if (error.message?.includes("duplicate")) {
        setErrors({ email: "This email has already registered" });
      } else {
        setErrors({ submit: "Something went wrong. Please try again." });
      }
    } else {
      setIsSuccess(true);
      supabase.functions
        .invoke("send-transactional-email", {
          body: {
            templateName: "early-interest-notification",
            idempotencyKey: `early-interest-${formData.email.trim().toLowerCase()}`,
            templateData: {
              name: formData.name.trim(),
              email: formData.email.trim().toLowerCase(),
              company: formData.company.trim(),
              submittedAt: new Date().toUTCString(),
            },
          },
        })
        .catch(() => {});
    }
  };


  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl border border-border bg-card/95 backdrop-blur-xl p-8 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {isSuccess ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="font-heading text-2xl font-semibold text-foreground mb-3">
                  You&apos;re on the list
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Thank you for registering early interest. We&apos;ll reach out when the
                  first Behavioral OS portfolio pilots go live.
                </p>
                <button
                  onClick={onClose}
                  className="mt-8 inline-flex items-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-heading text-2xl font-semibold text-foreground mb-2">
                  Register early interest
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Be the first to pilot the Behavioral OS with your enterprise team.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="ei-name"
                      className="block text-xs font-medium text-foreground mb-1.5"
                    >
                      Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        id="ei-name"
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder="Your full name"
                        className="w-full rounded-xl border border-border bg-background/80 pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1.5 text-xs text-red-500">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="ei-email"
                      className="block text-xs font-medium text-foreground mb-1.5"
                    >
                      Company email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        id="ei-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, email: e.target.value }))
                        }
                        placeholder="you@company.com"
                        className="w-full rounded-xl border border-border bg-background/80 pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="ei-company"
                      className="block text-xs font-medium text-foreground mb-1.5"
                    >
                      Company
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        id="ei-company"
                        type="text"
                        value={formData.company}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, company: e.target.value }))
                        }
                        placeholder="Company name"
                        className="w-full rounded-xl border border-border bg-background/80 pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                    </div>
                    {errors.company && (
                      <p className="mt-1.5 text-xs text-red-500">{errors.company}</p>
                    )}
                  </div>

                  {errors.submit && (
                    <p className="text-xs text-red-500 text-center">{errors.submit}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Submitting..." : "Submit"}
                    {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Evolution = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    document.body.classList.add("evolution-page");
    return () => {
      document.body.classList.remove("evolution-page");
    };
  }, []);

  return (
    <div className="light min-h-screen bg-background">
      <Helmet>
        <title>Behavioral OS — How Headroom Evolves | Headroom</title>
        <meta
          name="description"
          content="Headroom evolves into a Behavioral OS: the Behavioral Equation of Profit turns cognitive load and delivery-risk signals into enterprise margin."
        />
        <link rel="canonical" href="https://headroomapp.co/evolution" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://headroomapp.co/evolution" />
        <meta property="og:title" content="Behavioral OS — How Headroom Evolves" />
        <meta
          property="og:description"
          content="How human endeavour translates into enterprise profitability in a large services organisation."
        />
        <meta property="og:image" content="https://headroomapp.co/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Behavioral OS — How Headroom Evolves" />
        <meta
          name="twitter:description"
          content="How human endeavour translates into enterprise profitability in a large services organisation."
        />
        <meta name="twitter:image" content="https://headroomapp.co/og-image.png" />
      </Helmet>
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, hsl(var(--primary) / 0.22), transparent 70%)",
          }}
        />
        <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-12 md:pt-28 md:pb-20">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors mb-10"
          >
            ← Headroom
          </Link>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-xs tracking-[0.3em] uppercase text-primary mb-4"
          >
            The road ahead
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="font-heading text-4xl md:text-6xl font-semibold leading-[1.05] text-foreground max-w-3xl"
          >
            Headroom becomes a{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Behavioral OS
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed"
          >
            An operating system for how human endeavour translates into enterprise
            profitability. It reads behaviour at the level of the individual, aggregates it
            across delivery, and prices it in the language the business already speaks:
            margin.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-10 rounded-2xl border border-primary/30 bg-card/60 backdrop-blur p-6 md:p-8"
          >
            <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground mb-4">
              The engine
            </p>
            <p className="font-heading text-xl md:text-3xl text-foreground leading-snug">
              Π = (M<sub className="text-sm text-muted-foreground">discipline</sub> × R
              <sub className="text-sm text-muted-foreground">ideal</sub>) − (C
              <sub className="text-sm text-muted-foreground">baseline</sub> + L
              <sub className="text-sm text-muted-foreground">shadow</sub> + H
              <sub className="text-sm text-muted-foreground">drag</sub>)
            </p>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              The Behavioral Equation of Profit. Profit is a lagging indicator of aligned
              human behaviour — every term on the right is something the OS can measure.
            </p>
          </motion.div>
        </div>
      </header>

      {/* Where we are today */}
      <Section eyebrow="Layer one — today" title="Headroom measures the individual mind at work">
        <div className="grid md:grid-cols-3 gap-4">
          <Card icon={Brain} title="Cognitive load, decomposed">
            Sweller's three loads — intrinsic, extraneous, germane — scored deterministically
            from assessment responses and calendar telemetry.
          </Card>
          <Card icon={Activity} title="Work pattern archetypes">
            A ten-rule cascade that classifies how a person actually operates, plus the
            shadow archetype they shift into under pressure.
          </Card>
          <Card icon={ShieldAlert} title="Burnout risk markers">
            A seven-rule cascade producing an early-intervention signal before performance
            visibly degrades.
          </Card>
        </div>
      </Section>

      {/* Signals */}
      <Section
        eyebrow="Layer two — signal fusion"
        title="Two telemetry streams, one behavioural ledger"
      >
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6">
            <p className="text-xs tracking-[0.2em] uppercase text-accent mb-4">
              Headroom — the human side
            </p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                "Extraneous load: fragmentation, context switching, off-hours work",
                "Intrinsic load: task complexity and duration weighting",
                "Germane load: protected deep-work capacity",
                "Archetype drift and burnout trajectory over time",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6">
            <p className="text-xs tracking-[0.2em] uppercase text-accent mb-4">
              MarginMix — the delivery side
            </p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                "Workforce risk: seniority mix and dependency concentration",
                "Coordination risk: interfaces, hand-offs, stakeholder count",
                "Commercial risk: pricing model vs. true effort profile",
                "Volatility, confidence and measurement exposure",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs text-muted-foreground/80">
              Deterministic composite risk scoring and estimated margin impact per
              engagement.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center gap-3 text-muted-foreground">
          <ArrowDown className="w-5 h-5 text-primary" />
          <p className="text-sm text-center max-w-xl">
            Individual cognitive signal is aggregated to team, team to engagement,
            engagement to portfolio — each level converted at a blended cost rate into
            currency.
          </p>
        </div>
      </Section>

      {/* The engine mapping */}
      <Section
        eyebrow="Layer three — the engine"
        title="Every behavioural signal maps to a term in the equation"
      >
        <div className="overflow-hidden rounded-2xl border border-border">
          {[
            {
              term: "M_discipline",
              label: "Management discipline multiplier",
              icon: Scale,
              source:
                "MarginMix commercial + coordination risk, Headroom leadership archetype mix",
            },
            {
              term: "R_ideal",
              label: "Value-based revenue ceiling",
              icon: TrendingUp,
              source: "Engagement pricing model and scope definition",
            },
            {
              term: "C_baseline",
              label: "Visible fixed cost",
              icon: Users,
              source: "Salaries, tooling, overhead — already in the ledger",
            },
            {
              term: "L_shadow",
              label: "Shadow labour",
              icon: Layers,
              source:
                "Headroom extraneous load × blended rate — unbilled hours from scope creep and friction",
            },
            {
              term: "H_drag",
              label: "Cognitive drag",
              icon: Gauge,
              source:
                "Burnout risk markers, focus-recovery tax and churn probability, priced",
            },
          ].map((row, i) => (
            <div
              key={row.term}
              className={`grid md:grid-cols-[200px_1fr] gap-2 md:gap-6 p-5 bg-card/50 ${
                i > 0 ? "border-t border-border" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <row.icon className="w-4 h-4 text-accent shrink-0" />
                <span className="font-heading text-sm text-foreground">{row.term}</span>
              </div>
              <div>
                <p className="text-sm text-foreground">{row.label}</p>
                <p className="text-sm text-muted-foreground mt-1">{row.source}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted-foreground leading-relaxed">
          The result is behavioural profit — the surplus that survives after discipline
          erosion, shadow labour and cognitive drag are subtracted. In a worked example,
          a naive $21,000 profit resolves to $10,395 once behaviour is priced.
        </p>
      </Section>

      {/* Enterprise view */}
      <Section
        eyebrow="Layer four — the enterprise"
        title="What a Behavioral OS looks like at scale"
      >
        <div className="grid md:grid-cols-2 gap-4">
          <Card icon={LineChart} title="Portfolio margin telemetry">
            Every engagement carries a live behavioural profit figure, not a quarterly
            post-mortem. Erosion is visible while it is still reversible.
          </Card>
          <Card icon={Cpu} title="Deterministic, not generative">
            Same inputs, same verdict, every time. Auditable rule cascades — the standard
            both Headroom and MarginMix already hold themselves to.
          </Card>
          <Card icon={Scale} title="Pricing that reflects reality">
            Delivery complexity and cognitive drag are priced into the bid, instead of
            being discovered in month four.
          </Card>
          <Card icon={ShieldAlert} title="Intervention before attrition">
            Burnout markers become an operating metric with a currency value attached —
            which is when organisations finally act on them.
          </Card>
        </div>
      </Section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="rounded-3xl border border-primary/30 bg-card/60 backdrop-blur p-8 md:p-12 text-center">
          <h2 className="font-heading text-2xl md:text-3xl font-semibold text-foreground">
            Be the first to experience the Behavioral OS
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            We are building the system for enterprise teams. Register your interest and we
            will reach out when the beta version goes live.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-7 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Register Early Interest
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      <EarlyInterestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Evolution;
