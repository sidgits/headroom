import { createFileRoute } from "@tanstack/react-router";
import Privacy from "@/pages/Privacy";

export const Route = createFileRoute("/privacy")({
  component: Privacy,
  head: () => ({
    meta: [
      { title: "Privacy Policy — Headroom" },
      {
        name: "description",
        content:
          "How Headroom collects, uses and protects your data — assessments, calendar analysis, AI coaching and payments. GDPR & CCPA compliant.",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Privacy Policy — Headroom" },
      {
        property: "og:description",
        content:
          "How Headroom collects, uses, and protects your personal data. GDPR & CCPA compliant.",
      },
      { property: "og:url", content: "https://headroomapp.co/privacy" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://headroomapp.co/privacy" }],
  }),
});
