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
          "How Headroom collects, uses and protects your data — assessments, calendar analysis, AI coaching and payments.",
      },
    ],
  }),
});
