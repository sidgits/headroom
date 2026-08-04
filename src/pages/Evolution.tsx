import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
} from "lucide-react";

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

const Evolution = () => {
  useEffect(() => {
    document.title = "Behavioral OS — How Headroom Evolves | Headroom";
    document.body.classList.add("evolution-page");
    const setMeta = (name: string, content: string, attr: "name" | "property" = "name") => {
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    setMeta(
      "description",
      "Headroom evolves into a Behavioral OS: the Behavioral Equation of Profit turns cognitive load and delivery-risk signals into enterprise margin.",
    );
    setMeta("og:title", "Behavioral OS — How Headroom Evolves", "property");
    setMeta(
      "og:description",
      "How human endeavour translates into enterprise profitability in a large services organisation.",
      "property",
    );
    setMeta("og:type", "website", "property");
    setMeta("twitter:card", "summary_large_image");
    return () => {
      document.body.classList.remove("evolution-page");
    };
  }, []);

  return (
    <div className="light min-h-screen bg-background">
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
            Be the first to see the Behavioral OS
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            We are opening early access to enterprise teams. Register your interest and we
            will reach out when the first portfolio pilots go live.
          </p>
          <a
            href="mailto:hello@headroomapp.co?subject=Register%20Early%20Interest%20%E2%80%94%20Behavioral%20OS"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-7 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Register Early Interest
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>
    </div>
  );
};

export default Evolution;
