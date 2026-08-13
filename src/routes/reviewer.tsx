import { createFileRoute } from "@tanstack/react-router";
import Reviewer from "@/pages/Reviewer";

export const Route = createFileRoute("/reviewer")({
  component: Reviewer,
  head: () => ({
    meta: [
      { title: "Reviewer Access — Headroom" },
      {
        name: "description",
        content:
          "Reviewer entry point for Headroom: unlocks the Google Calendar connection flow without sign-up or payment.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Reviewer Access — Headroom" },
      {
        property: "og:description",
        content: "Reviewer entry point for the Headroom Google Calendar integration.",
      },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
