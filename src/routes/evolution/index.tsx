import { createFileRoute } from "@tanstack/react-router";
import Evolution from "@/pages/Evolution";

export const Route = createFileRoute("/evolution/")({
  component: Evolution,
  head: () => ({
    meta: [
      { title: "The Behavioral Equation of Profit — Margin and Burnout Are One Problem" },
      {
        name: "description",
        content:
          "In services firms, margin erosion and people burnout are managed as two problems by two functions. One causes the other. The Behavioral OS turns that lagging indicator into a 90-day early warning.",
      },
      { property: "og:url", content: "https://headroomapp.co/evolution" },
    ],
    links: [{ rel: "canonical", href: "https://headroomapp.co/evolution" }],
  }),
});
