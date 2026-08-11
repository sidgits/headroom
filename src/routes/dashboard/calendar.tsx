import { createFileRoute } from "@tanstack/react-router";
import CalendarPage from "@/pages/CalendarPage";

export const Route = createFileRoute("/dashboard/calendar")({
  component: CalendarPage,
  head: () => ({
    meta: [
      { title: "Calendar Analysis — Headroom" },
      {
        name: "description",
        content:
          "Upload your calendar and see cognitive load and burnout risk mapped across the next 90 days.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Calendar Analysis — Headroom" },
      {
        property: "og:description",
        content: "Cognitive load and burnout risk mapped across your calendar.",
      },
    ],
  }),
});
