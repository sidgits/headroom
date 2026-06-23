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
            <p className="text-sm text-muted-foreground">Last updated: June 23, 2026</p>
          </header>

          <section className="space-y-3 text-sm leading-relaxed">
            <p>
              This Privacy Policy explains how Digital Lexicon Corp ("Headroom", "we", "us", or "our") collects,
              uses, and protects your personal information when you use the Headroom cognitive load assessment
              platform (the "Service"), available at headroomapp.co. We are committed to processing your data in
              compliance with the EU General Data Protection Regulation (GDPR), the UK GDPR, and the California
              Consumer Privacy Act as amended by the CPRA (collectively, "CCPA").
            </p>
            <p>
              This page is maintained by Digital Lexicon Corp to answer common security and privacy questions about
              Headroom. It describes our data practices and the controls available to you. Our hosting and service
              providers process data only on our behalf and under contractual data-protection terms.
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
            <h2 className="text-xl font-semibold">2. Definitions & Scope</h2>
            <ul className="list-disc pl-6 text-sm space-y-1">
              <li>
                <strong>Personal Data / Personal Information</strong> — any information that identifies, relates
                to, describes, or can reasonably be associated with you, such as your name, email address, and
                assessment responses.
              </li>
              <li>
                <strong>Processing</strong> — any operation performed on Personal Data, including collection, use,
                storage, disclosure, or deletion.
              </li>
              <li>
                <strong>Service</strong> — the Headroom website, quiz, dashboard, and any related features,
                content, or applications offered by Digital Lexicon Corp.
              </li>
              <li>
                <strong>You / User</strong> — any individual who accesses or uses the Service.
              </li>
            </ul>
            <p className="text-sm leading-relaxed">
              This Privacy Policy applies to all users of the Service, regardless of location or subscription type,
              and to any Personal Data collected through the Service or in connection with providing it.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">3. Information We Collect</h2>
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
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">4. How We Use Your Information</h2>
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
            <h2 className="text-xl font-semibold">5. Legal Bases for Processing (GDPR)</h2>
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
            <h2 className="text-xl font-semibold">6. Data Sharing, Processors & DPAs</h2>
            <p className="text-sm leading-relaxed">
              Your data is never sold. We share it only with vetted service providers ("processors") acting on
              our behalf under contractual data-protection terms. Our current subprocessors are:
            </p>
            <ul className="list-disc pl-6 text-sm space-y-1">
              <li><strong>Supabase</strong> — authentication, database, and serverless hosting.</li>
              <li><strong>Google</strong> — only if you choose "Sign in with Google" (OAuth).</li>
              <li><strong>Stripe</strong> — payment processing for paid features.</li>
              <li><strong>Resend</strong> — transactional email delivery.</li>
            </ul>
            <p className="text-sm leading-relaxed">
              We may update our subprocessor list from time to time. If you are an enterprise customer and have
              executed a Data Processing Agreement (DPA) with us, we will notify you of any material changes to
              subprocessors in accordance with that agreement.
            </p>
            <p className="text-sm leading-relaxed">
              Enterprise customers may request a signed Data Processing Agreement by emailing{" "}
              <a href="mailto:sid@headroomapp.co" className="text-primary underline underline-offset-2">
                sid@headroomapp.co
              </a>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">7. International Data Transfers</h2>
            <p className="text-sm leading-relaxed">
              Digital Lexicon Corp is based in the United States. Personal Data collected through the Service may
              be transferred to, stored, or processed in the United States or other jurisdictions where our
              subprocessors operate.
            </p>
            <p className="text-sm leading-relaxed">
              Where Personal Data is transferred outside the European Economic Area (EEA), the UK, or Switzerland,
              we rely on appropriate transfer safeguards recognized under applicable data protection laws, such as
              EU Standard Contractual Clauses, UK International Data Transfer Agreements, and adequacy decisions.
              We supplement these contractual safeguards with technical measures such as encryption in transit and at
              rest.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">8. Data Retention</h2>
            <p className="text-sm leading-relaxed">
              We retain your account data for as long as your account is active. If you request deletion, we
              will erase your personal data within 30 days, except where retention is required for legal,
              accounting, or fraud-prevention purposes.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">9. Your Rights</h2>
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

            <h3 className="text-lg font-semibold pt-2">US State Privacy Rights</h3>
            <p className="text-sm leading-relaxed">
              Residents of California, Virginia, Colorado, Connecticut, and other U.S. states with comprehensive
              privacy laws have the following rights with respect to their Personal Information:
            </p>
            <ul className="list-disc pl-6 text-sm space-y-1">
              <li>
                <strong>Right to know / access</strong> — request the categories and specific pieces of Personal
                Information we have collected about you.
              </li>
              <li>
                <strong>Right to delete</strong> — request deletion of your Personal Information, subject to legal
                exceptions.
              </li>
              <li>
                <strong>Right to correct</strong> — request correction of inaccurate Personal Information.
              </li>
              <li>
                <strong>Right to opt out of sale or sharing</strong> — we do not sell or share Personal Information
                for cross-context behavioral advertising.
              </li>
              <li>
                <strong>Right to limit use of sensitive Personal Information</strong> — we do not collect sensitive
                Personal Information as defined under the CPRA.
              </li>
              <li>
                <strong>Right to non-discrimination</strong> — we will not discriminate against you for exercising
                your privacy rights.
              </li>
              <li>
                <strong>Right to appeal</strong> — if we decline your request, you may appeal by emailing{" "}
                <a href="mailto:sid@headroomapp.co" className="text-primary underline underline-offset-2">
                  sid@headroomapp.co
                </a>
                .
              </li>
            </ul>
            <p className="text-sm leading-relaxed">
              To exercise any right, email{" "}
              <a href="mailto:sid@headroomapp.co" className="text-primary underline underline-offset-2">
                sid@headroomapp.co
              </a>
              . We will respond within 30 days (GDPR) or 45 days (CCPA). Authorized agents must provide proof of
              authorization and verification of your identity.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">10. Security & Incident Response</h2>
            <p className="text-sm leading-relaxed">
              We use industry-standard safeguards including TLS encryption in transit, encryption at rest,
              row-level security on our database, and least-privilege access controls. No system is 100% secure,
              but we work continuously to protect your data.
            </p>
            <p className="text-sm leading-relaxed">
              If we become aware of a breach of Personal Data that poses a risk to your rights and freedoms, we will
              notify affected users and the relevant supervisory or regulatory authorities without undue delay and,
              where feasible, within 24 hours of becoming aware of the incident.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">11. Cookies & Tracking Technologies</h2>
            <p className="text-sm leading-relaxed">
              We use a minimal set of strictly necessary cookies and local storage to keep you signed in and to
              remember your assessment progress. We do not use third-party advertising or tracking cookies. We do not
              currently respond to "Do Not Track" signals because we do not engage in cross-site tracking.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">12. Children's Privacy</h2>
            <p className="text-sm leading-relaxed">
              The Service is not directed to children under 16, and we do not knowingly collect Personal Data from
              children under 16. If you believe we have collected data from a child under 16, please contact us at{" "}
              <a href="mailto:sid@headroomapp.co" className="text-primary underline underline-offset-2">
                sid@headroomapp.co
              </a>{" "}
              and we will promptly delete the information.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">13. Changes to This Policy</h2>
            <p className="text-sm leading-relaxed">
              We may update this Privacy Policy from time to time. Material changes will be communicated via
              email or a notice on the Service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">14. Contact</h2>
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
