import { useEffect, useState } from "react";
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
  Crosshair,
  Sigma,
  PlayCircle,
} from "lucide-react";
import { Link } from "@/lib/router-compat";
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
  const domain = match?.[1];
  if (!domain) return false;
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
      nextErrors['name'] = "Name is required";
    } else if (formData.name.trim().length < 2) {
      nextErrors['name'] = "Name must be at least 2 characters";
    }

    const email = formData.email.trim().toLowerCase();
    if (!email) {
      nextErrors['email'] = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors['email'] = "Please enter a valid email address";
    } else if (!isCompanyEmail(email)) {
      nextErrors['email'] = "Please use your company email address";
    }

    if (!formData.company.trim()) {
      nextErrors['company'] = "Company name is required";
    } else if (formData.company.trim().length < 2) {
      nextErrors['company'] = "Company name must be at least 2 characters";
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
                        className="w-full rounded-xl border border-border bg-background/80 pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                    </div>
                    {errors['name'] && (
                      <p className="mt-1.5 text-xs text-red-500">{errors['name']}</p>
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
                        className="w-full rounded-xl border border-border bg-background/80 pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                    </div>
                    {errors['email'] && (
                      <p className="mt-1.5 text-xs text-red-500">{errors['email']}</p>
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
                        className="w-full rounded-xl border border-border bg-background/80 pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                    </div>
                    {errors['company'] && (
                      <p className="mt-1.5 text-xs text-red-500">{errors['company']}</p>
                    )}
                  </div>

                  {errors['submit'] && (
                    <p className="text-xs text-red-500 text-center">{errors['submit']}</p>
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
        <title>The Behavioral Equation of Profit — Margin and Burnout Are One Problem</title>
        <meta
          name="description"
          content="In services firms, margin erosion and people burnout are managed as two problems by two functions. One causes the other. The Behavioral OS turns that lagging indicator into a 90-day early warning."
        />
        <link rel="canonical" href="https://headroomapp.co/evolution" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://headroomapp.co/evolution" />
        <meta
          property="og:title"
          content="The Behavioral Equation of Profit — why margin and burnout are one problem"
        />
        <meta
          property="og:description"
          content="Profit doesn't erode randomly — it erodes behaviourally. The thesis, the equation and the worked example behind a 90-day early warning for services delivery."
        />
        <meta property="og:image" content="https://headroomapp.co/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="The Behavioral Equation of Profit — why margin and burnout are one problem"
        />
        <meta
          name="twitter:description"
          content="Profit doesn't erode randomly — it erodes behaviourally. The thesis behind a 90-day early warning for services delivery."
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
            The engagement that's about to lose money —{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              flagged 90 days early
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed"
          >
            Profitability is a lagging indicator of aligned human behaviour. The Behavioral OS
            turns that lagging indicator into a leading one: it watches how work is actually
            being done and warns you which engagement is going to erode, while there is still
            time to reprice or restaff.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-3"
          >
            <Link
              to="/evolution/demo"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-7 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
            >
              <PlayCircle className="w-4 h-4" />
              See a live warning
            </Link>
            <p className="text-xs text-muted-foreground max-w-xs">
              The warning is the product. Π — the Behavioral Equation of Profit — is why the
              warning is right.
            </p>
          </motion.div>
        </div>
      </header>

      {/* 1 — The problem */}
      <Section
        eyebrow="The problem"
        title="Two functions manage two problems that are actually one"
      >
        <div className="grid md:grid-cols-3 gap-4">
          <Card icon={LineChart} title="Finance owns the margin">
            Margin erosion shows up in the P&L a quarter after it happened, as a variance to
            explain rather than a condition to treat.
          </Card>
          <Card icon={Users} title="People owns the burnout">
            Engagement scores, attrition and wellbeing budgets — measured on a separate cycle, in
            a separate system, with no currency value attached.
          </Card>
          <Card icon={ShieldAlert} title="Nobody owns the connection">
            One causes the other. Because no function owns the link, nobody measures it — so the
            first evidence of behavioural erosion is a missed number.
          </Card>
        </div>
      </Section>

      {/* 2 — The insight */}
      <Section
        eyebrow="The insight"
        title="Profit doesn't erode randomly — it erodes behaviourally"
      >
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-3xl">
          Deal by deal, person by person, month by month. A scope concession here, a senior lead
          absorbed into firefighting there, a fortnight where no one on the pod gets a protected
          deep-work block. Each event is small, traceable and dated — which means the erosion has
          a signature long before it has a number.
        </p>
      </Section>

      {/* 3 — What the system produces */}
      <Section
        eyebrow="What the system produces"
        title="An early warning, not a scorecard"
      >
        <div className="rounded-2xl border border-primary/30 bg-card/60 backdrop-blur p-6 md:p-8">
          <p className="text-xs tracking-[0.25em] uppercase text-accent mb-4">The output</p>
          <p className="font-heading text-xl md:text-2xl text-foreground leading-snug max-w-3xl">
            "Engagement #4471 is at elevated slippage risk over the next 90 days. Senior
            allocation drifted 35% → 51%, two of three leads are trending into red-zone load, and
            three deliverables shipped outside scope this month. Reprice or restaff before the Q3
            review."
          </p>
          <p className="mt-5 text-sm text-muted-foreground leading-relaxed max-w-3xl">
            One artefact, owned by one person — the delivery or operations lead. It arrives before
            the P&L does, it names the behaviour that caused it, and every clause in it is
            traceable to a measured input. The equation below is what makes it a forecast instead
            of an opinion.
          </p>
          <Link
            to="/evolution/demo"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-background/60 px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <PlayCircle className="w-4 h-4 text-primary" />
            Open the working demo
          </Link>
        </div>
      </Section>

      {/* 4 — Why the warning isn't a guess */}
      <Section
        eyebrow="Why the warning isn't a guess"
        title="The Behavioral Equation of Profit"
      >
        <div className="rounded-2xl border border-primary/30 bg-card/60 backdrop-blur p-6 md:p-8">
          <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground mb-4">
            The engine — the refined formula
          </p>
          <p className="font-heading text-xl md:text-3xl text-foreground leading-snug">
            Π = (M<sub className="text-sm text-muted-foreground">discipline</sub> × R
            <sub className="text-sm text-muted-foreground">ideal</sub>) − [C
            <sub className="text-sm text-muted-foreground">baseline</sub> + L
            <sub className="text-sm text-muted-foreground">shadow-sm</sub> + (H
            <sub className="text-sm text-muted-foreground">drag</sub> × W
            <sub className="text-sm text-muted-foreground">scope</sub>)]
          </p>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            Every term on the right is something the OS can measure, and the scope weight factor
            keeps behavioural cost matched to the revenue stream being evaluated. The warning
            fires when these terms move — which is why it can be interrogated line by line rather
            than argued about.
          </p>
        </div>
      </Section>


      {/* Variable definitions */}
      <Section
        eyebrow="The vocabulary"
        title="Seven variables that turn behaviour into a ledger"
      >
        <div className="overflow-hidden rounded-2xl border border-border">
          {[
            {
              symbol: "Π",
              name: "Behavioral Profit",
              icon: Sigma,
              def: "The true financial surplus remaining after accounting for real-world human behaviour across the project lifecycle. Currency/time.",
            },
            {
              symbol: "M_discipline",
              name: "Management Discipline",
              icon: Scale,
              def: "A dimensionless multiplier (geometric mean of three sub-scores ≤ 1.0) for how effectively leadership holds pricing integrity, accurate scoping and operational boundaries.",
            },
            {
              symbol: "R_ideal",
              name: "Ideal Revenue",
              icon: TrendingUp,
              def: "The maximum value-based card-rate revenue a project should command under disciplined scoping, before client compromises or discounts.",
            },
            {
              symbol: "C_baseline",
              name: "Baseline Cost",
              icon: Users,
              def: "Visible, fixed accounting costs already on the balance sheet: direct salaries, hardware, licences and basic overhead.",
            },
            {
              symbol: "L_shadow",
              name: "Shadow Labor",
              icon: Layers,
              def: "Unbilled, untracked hours spent resolving operational friction, vague briefs, miscommunication and out-of-scope adjustments at execution.",
            },
            {
              symbol: "H_drag",
              name: "Cognitive Drag",
              icon: Gauge,
              def: "The financial penalty of an exhausted workforce: velocity degradation from context-switching inside deep work, plus amortised replacement cost of burnout-driven churn.",
            },
            {
              symbol: "W_scope",
              name: "Scope Weight Factor",
              icon: Crosshair,
              def: "A dimensionless scaling factor (≤ 1.0) matching behavioural cost to the revenue stream measured: localized statutory revenue ÷ total ecosystem portfolio value.",
            },
          ].map((row, i) => (
            <div
              key={row.symbol}
              className={`grid md:grid-cols-[220px_1fr] gap-2 md:gap-6 p-5 bg-card/50 ${
                i > 0 ? "border-t border-border" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <row.icon className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="font-heading text-sm text-foreground">{row.symbol}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{row.name}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{row.def}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Where we are today */}
      <Section eyebrow="Layer one — today" title="Headroom measures the individual mind at work">
        <div className="grid md:grid-cols-3 gap-4">
          <Card icon={Brain} title="Cognitive load, decomposed">
            Sweller's three loads — core, toxic, growth — scored deterministically
            from assessment responses and calendar telemetry.
          </Card>
          <Card icon={Activity} title="Work pattern archetypes">
            A ten-rule cascade that classifies how a person actually operates, plus the
            shadow-sm archetype they shift into under pressure.
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
                "Toxic load: fragmentation, context switching, off-hours work",
                "Core load: task complexity and duration weighting",
                "Growth load: protected deep-work capacity",
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
            Workflow telemetry is continuously cross-referenced with the organisation's
            fully loaded blended cost rate per hour — individual to team, team to
            engagement, engagement to portfolio.
          </p>
        </div>
      </Section>

      {/* Algorithmic conversions */}
      <Section
        eyebrow="Layer three — the conversions"
        title="How abstract behaviour lands on a standard P&L"
      >
        <div className="grid md:grid-cols-2 gap-4">
          {[
            {
              n: "01",
              icon: Scale,
              title: "Management Discipline",
              formula:
                "M_discipline = ∛(Scope Adherence × Pricing Integrity × Boundary Holding)",
              body: "Three sub-scores bounded 0–1.0: delivered vs. contracted scope, invoiced vs. rate-card rate, on-scope vs. total hours logged. A geometric mean, so a collapse in any single dimension pulls the whole multiplier down instead of being averaged away.",
            },
            {
              n: "02",
              icon: TrendingUp,
              title: "Ideal Revenue",
              formula: "R_ideal = Contracted Capacity Hours × Value-Based Card Rate",
              body: "The undamaged revenue ceiling, calculated purely from market and contract data before human friction or procurement discounts are subtracted.",
            },
            {
              n: "03",
              icon: Layers,
              title: "Shadow Labor",
              formula:
                "L_shadow = [Σ(Unscoped Deliverables × Baseline Production Hours) + Excess Meeting Hours] × Blended Hourly Cost Rate",
              body: "Monitors the unbilled effort required to fix systemic workflow friction. Hours logged as shadow-sm labour are strictly mutually exclusive from deep focus blocks, so nothing is double-counted.",
            },
            {
              n: "04",
              icon: Gauge,
              title: "Cognitive Drag",
              formula:
                "H_drag = (Focus Disruptions in T_deep × 0.38 h × Blended Rate) + [(90-Day Churn Count × Replacement Cost) ÷ 520 h] × Blended Rate",
              body: "Captures attention fragmentation and chronic burnout that predicts churn. Switching penalties apply only inside deep work blocks; the churn penalty is amortised over a 90-day onboarding stabilisation window of 520 working hours.",
            },
          ].map((c) => (
            <div
              key={c.n}
              className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                  <c.icon className="w-5 h-5 text-accent" />
                </div>
                <span className="text-xs tracking-[0.2em] text-muted-foreground">
                  {c.n}
                </span>
                <h3 className="font-heading text-lg font-semibold text-foreground">
                  {c.title}
                </h3>
              </div>
              <p className="rounded-xl bg-background/70 border border-border/70 px-4 py-3 font-mono text-xs leading-relaxed text-foreground/90 break-words">
                {c.formula}
              </p>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                {c.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* Worked example */}
      <Section
        eyebrow="Worked example — enterprise ecosystem"
        title="A $20M localized revenue line inside a $1.7B portfolio"
      >
        <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
          A localized $20,000,000 statutory revenue line, managed by a 37,000-person
          ecosystem that handles $1.7 billion in total cross-border contract portfolio
          value. The scope weight factor isolates the behavioural cost that actually
          belongs to this segment.
        </p>

        <div className="rounded-2xl border border-primary/30 bg-card/60 backdrop-blur p-6 mb-6 text-center">
          <p className="font-heading text-lg md:text-xl text-foreground">
            W<sub className="text-sm text-muted-foreground">scope</sub> = $20,000,000 ÷
            $1,700,000,000 = 0.0117 (1.17%)
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border">
          {[
            ["R_ideal", "$25,000,000", "Portfolio capacity at full un-discounted value-based rate card"],
            ["M_discipline", "0.823", "Geometric mean of Scope (0.85), Pricing (0.80), Boundaries (0.82)"],
            ["M_discipline × R_ideal", "$20,575,000", "Realized revenue inflow hitting the local entity"],
            ["C_baseline", "$16,000,000", "Visible balance sheet payroll, tools and overhead for this segment"],
            ["L_shadow", "$78,300", "De-duplicated unbilled hours spent troubleshooting for local clients"],
            ["H_drag (total system)", "$21,608,000", "Ecosystem switching tax ($7.73M) plus talent churn ($13.87M)"],
            ["H_drag × W_scope", "$252,813", "The isolated cognitive damage affecting just this revenue segment"],
          ].map(([term, value, basis], i) => (
            <div
              key={term}
              className={`grid md:grid-cols-[220px_160px_1fr] gap-1 md:gap-6 p-5 bg-card/50 ${
                i > 0 ? "border-t border-border" : ""
              }`}
            >
              <p className="font-heading text-sm text-foreground">{term}</p>
              <p className="text-sm text-accent font-medium">{value}</p>
              <p className="text-sm text-muted-foreground">{basis}</p>
            </div>
          ))}
          <div className="grid md:grid-cols-[220px_160px_1fr] gap-1 md:gap-6 p-5 border-t border-primary/30 bg-primary/10">
            <p className="font-heading text-sm font-semibold text-foreground">
              Π — Behavioral Profit
            </p>
            <p className="text-sm font-semibold text-foreground">$4,243,887</p>
            <p className="text-sm text-muted-foreground">
              $20,575,000 − [$16,000,000 + $78,300 + $252,813]
            </p>
          </div>
        </div>
      </Section>

      {/* Mid-page demo CTA */}
      <motion.section
        className="max-w-5xl mx-auto px-6 pb-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <Link
          to="/evolution/demo"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-7 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
        >
          <PlayCircle className="w-4 h-4" />
          Experience Demo
        </Link>
        <p className="mt-3 text-xs text-muted-foreground">
          See the Behavioral OS run end to end on live sample data.
        </p>
      </motion.section>


      {/* Reconciliation */}
      <Section
        eyebrow="Reconciliation"
        title="What the traditional ledger cannot see"
      >
        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="grid grid-cols-[1fr_120px_120px] md:grid-cols-[1fr_200px_200px] gap-3 md:gap-6 p-5 bg-secondary/60 border-b border-border">
            <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground">
              Ledger item
            </p>
            <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground text-right">
              Traditional
            </p>
            <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground text-right">
              Behavioral
            </p>
          </div>
          {[
            ["Discipline-adjusted inflow", "$20,575,000", "$20,575,000", true],
            ["Visible balance sheet costs (C_baseline)", "−$16,000,000", "−$16,000,000", false],
            ["Traditional net profit baseline", "+$4,575,000", "—", true],
            ["Invisible shadow-sm labour (L_shadow)", "Hidden in salaries", "−$78,300", false],
            ["Systemic cognitive drag (H_drag × W_scope)", "Hidden in HR/salaries", "−$252,813", false],
          ].map(([label, trad, beh, bold], i) => (
            <div
              key={label as string}
              className={`grid grid-cols-[1fr_120px_120px] md:grid-cols-[1fr_200px_200px] gap-3 md:gap-6 p-5 bg-card/50 ${
                i > 0 ? "border-t border-border" : ""
              }`}
            >
              <p
                className={`text-sm ${bold ? "font-semibold text-foreground" : "text-muted-foreground"}`}
              >
                {label}
              </p>
              <p
                className={`text-sm text-right ${bold ? "font-semibold text-foreground" : "text-muted-foreground"}`}
              >
                {trad}
              </p>
              <p
                className={`text-sm text-right ${bold ? "font-semibold text-foreground" : "text-muted-foreground"}`}
              >
                {beh}
              </p>
            </div>
          ))}
          <div className="grid grid-cols-[1fr_120px_120px] md:grid-cols-[1fr_200px_200px] gap-3 md:gap-6 p-5 border-t border-primary/30 bg-primary/10">
            <p className="text-sm font-semibold text-foreground">
              Π — true behavioural profit
            </p>
            <p className="text-sm text-right text-muted-foreground">—</p>
            <p className="text-sm text-right font-semibold text-foreground">
              +$4,243,887
            </p>
          </div>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6">
            <p className="text-xs tracking-[0.2em] uppercase text-accent mb-3">
              Mathematical proof
            </p>
            <p className="font-mono text-xs leading-relaxed text-muted-foreground">
              $4,575,000 − $4,243,887 = $331,113 total leakage
              <br />
              $78,300 + $252,813 = $331,113 total leakage
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6">
            <p className="text-xs tracking-[0.2em] uppercase text-accent mb-3">
              The ledger narrative
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Below the surface of the ledger, $331,113 is destroyed by human friction —
              $78,300 in unbilled reactive shadow-sm labour and $252,813 in cognitive fatigue
              from focus disruption and turnover. Scaled across the full $1.7 billion
              managed contract value, the same friction accounts for{" "}
              <span className="text-foreground font-medium">
                $28.2 million of annual enterprise value destruction
              </span>
              .
            </p>
          </div>
        </div>
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
          <Card icon={Crosshair} title="Scoped, not double-counted">
            The scope weight factor and mutually exclusive hour accounting keep every
            behavioural cost attributed once, to the revenue line it actually damages.
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
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-7 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Register Early Interest
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              to="/evolution/demo"
              className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-background/60 px-7 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <PlayCircle className="w-4 h-4 text-primary" />
              Experience Demo
            </Link>
          </div>
        </div>
      </section>


      <EarlyInterestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Evolution;
