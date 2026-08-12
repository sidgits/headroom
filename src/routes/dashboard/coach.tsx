import { createFileRoute } from "@tanstack/react-router";
import CoachPage from "@/pages/CoachPage";

export const Route = createFileRoute("/dashboard/coach")({
  component: CoachPage,
  head: () => ({
    meta: [
      { title: "AI Coach — Headroom" },
      {
        name: "description",
        content:
          "Ask the Headroom AI coach about your workload, cognitive load patterns and burnout risk.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "AI Coach — Headroom" },
      {
        property: "og:description",
        content: "Personalized coaching on your workload and burnout risk.",
      },
    ],
  }),
});
