import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Helmet>
        <title>Privacy Policy — Headroom</title>
        <meta
          name="description"
          content="How Headroom collects, uses, and protects your personal data. GDPR & CCPA compliant."
        />
        <link rel="canonical" href="https://headroomapp.co/privacy" />
        <meta property="og:title" content="Privacy Policy — Headroom" />
        <meta property="og:description" content="How Headroom collects, uses, and protects your personal data. GDPR & CCPA compliant." />
        <meta property="og:url" content="https://headroomapp.co/privacy" />
      </Helmet>

      <main className="flex-1 px-6 py-12">
        <article className="mx-auto w-full max-w-3xl space-y-6 text-foreground">
          <header className="space-y-2">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">
              ← Back to Home
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">Last updated: June 6, 2026</p>
          </header>

          <section className="space-y-3 text-sm leading-relaxed">
            <p>
              This Privacy Policy explains how Digital Lexicon Corp ("Headroom", "we", "us", or "our") collects,
              uses, and protects your personal information when you use the Headroom cognitive load assessment
              platform (the "Service"), available at headroomapp.co. We are committed to processing your data in
              compliance with the EU General Data Protection Regulation (GDPR), the UK GDPR, and the California
              Consumer Privacy Act as amended by the CPRA (collectively, "CCPA").
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">1. Data Controller</h2>
            <p className="text-sm leading-relaxed">
              Digital Lexicon Corp, registered in Delaware, USA, is the data controller responsible for your
              personal data. For any privacy-related inquiries, contact us at{" "}
              <a href="mailto:sid@headroomapp.co" className="text-primary underline underline-offset-2">
                sid@headroomapp.co
              </a>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">2. Information We Collect</h2>
            <p className="text-sm leading-relaxed">
              We deliberately limit the personal data we collect to what is necessary to deliver the Service:
            </p>
            <ul className="list-disc pl-6 text-sm space-y-1">
              <li>
                <strong>Name</strong> — provided by you at the results screen, or imported from your Google
                profile if you sign in with Google.
              </li>
              <li>
                <strong>Email address</strong> — provided by you, or supplied by Google when you sign in with
                Google.
              </li>
              <li>
                <strong>Assessment responses & results</strong> — the answers you give to the Headroom quiz and
                the archetype/score generated from them.
              </li>
              <li>
                <strong>Authentication & technical data</strong> — sign-in events, session tokens, IP address,
                browser/device type, and timestamps, used for security and abuse prevention.
              </li>
              <li>
                <strong>Payment data</strong> — if you upgrade, payment is processed by Stripe. We do not store
                your card details; we only retain a transaction reference and subscription status.
              </li>
            </ul>
            <p className="text-sm leading-relaxed">
              We do <strong>not</strong> knowingly collect data from children under 16, nor do we collect special
              categories of data (e.g., health, biometric, or political data).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-sm space-y-1">
              <li>To create your account and deliver your personalized assessment results.</li>
              <li>To email you your results, receipts, and important service notifications.</li>
              <li>To provide access to your dashboard and any features you have purchased.</li>
              <li>To secure the Service, prevent fraud and abuse, and comply with legal obligations.</li>
              <li>To improve the Service in aggregate, anonymized form.</li>
            </ul>
            <p className="text-sm leading-relaxed">
              We do not sell or "share" (as defined under the CCPA) your personal information, and we do not use
              your data for cross-context behavioral advertising.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">4. Legal Bases for Processing (GDPR)</h2>
            <ul className="list-disc pl-6 text-sm space-y-1">
              <li>
                <strong>Contract</strong> — to provide the Service you have requested (Art. 6(1)(b) GDPR).
              </li>
              <li>
                <strong>Consent</strong> — where you have given consent, e.g., to receive marketing emails (Art.
                6(1)(a)). You may withdraw consent at any time.
              </li>
              <li>
                <strong>Legitimate interests</strong> — to secure and improve our Service, provided your
                interests do not override ours (Art. 6(1)(f)).
              </li>
              <li>
                <strong>Legal obligation</strong> — to comply with applicable laws (Art. 6(1)(c)).
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">5. Data Sharing & Processors</h2>
            <p className="text-sm leading-relaxed">
              Your data is never sold. We share it only with vetted service providers ("processors") acting on
              our behalf under contractual data-protection terms:
            </p>
            <ul className="list-disc pl-6 text-sm space-y-1">
              <li><strong>Supabase</strong> — authentication, database, and serverless hosting.</li>
              <li><strong>Google</strong> — only if you choose "Sign in with Google" (OAuth).</li>
              <li><strong>Stripe</strong> — payment processing for paid features.</li>
              <li><strong>Resend / email provider</strong> — transactional email delivery.</li>
            </ul>
            <p className="text-sm leading-relaxed">
              Where data is transferred outside the EEA/UK, we rely on appropriate safeguards such as the EU
              Standard Contractual Clauses.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">6. Data Retention</h2>
            <p className="text-sm leading-relaxed">
              We retain your account data for as long as your account is active. If you request deletion, we
              will erase your personal data within 30 days, except where retention is required for legal,
              accounting, or fraud-prevention purposes.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">7. Your Rights</h2>
            <p className="text-sm leading-relaxed">
              Depending on your location, you have the right to:
            </p>
            <ul className="list-disc pl-6 text-sm space-y-1">
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate or incomplete data.</li>
              <li>Request deletion ("right to be forgotten" / CCPA right to delete).</li>
              <li>Restrict or object to processing.</li>
              <li>Data portability — receive your data in a machine-readable format.</li>
              <li>Withdraw consent at any time.</li>
              <li>Opt out of the sale or sharing of personal information (we do neither by default).</li>
              <li>Non-discrimination for exercising your privacy rights (CCPA).</li>
              <li>Lodge a complaint with your local data protection authority.</li>
            </ul>
            <p className="text-sm leading-relaxed">
              To exercise any right, email{" "}
              <a href="mailto:sid@headroomapp.co" className="text-primary underline underline-offset-2">
                sid@headroomapp.co
              </a>
              . We will respond within 30 days (GDPR) or 45 days (CCPA).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">8. Security</h2>
            <p className="text-sm leading-relaxed">
              We use industry-standard safeguards including TLS encryption in transit, encryption at rest,
              row-level security on our database, and least-privilege access controls. No system is 100% secure,
              but we work continuously to protect your data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">9. Cookies</h2>
            <p className="text-sm leading-relaxed">
              We use a minimal set of strictly necessary cookies and local storage to keep you signed in and to
              remember your assessment progress. We do not use third-party advertising or tracking cookies.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">10. Changes to This Policy</h2>
            <p className="text-sm leading-relaxed">
              We may update this Privacy Policy from time to time. Material changes will be communicated via
              email or a notice on the Service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">11. Contact</h2>
            <p className="text-sm leading-relaxed">
              Digital Lexicon Corp · Delaware, USA · {" "}
              <a href="mailto:sid@headroomapp.co" className="text-primary underline underline-offset-2">
                sid@headroomapp.co
              </a>
            </p>
          </section>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
