import { createFileRoute } from "@tanstack/react-router";
import Dashboard from "@/pages/Dashboard";

export const Route = createFileRoute("/dashboard/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Dashboard — Headroom" },
      {
        name: "description",
        content:
          "Your personal Headroom dashboard — track cognitive load, review past assessments, and see how your burnout patterns shift over time.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Dashboard — Headroom" },
      {
        property: "og:description",
        content:
          "Track your cognitive load and burnout patterns over time on your personal Headroom dashboard.",
      },
    ],
  }),
});
