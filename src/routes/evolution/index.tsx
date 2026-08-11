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
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://headroomapp.co/evolution" },
      {
        property: "og:title",
        content: "The Behavioral Equation of Profit — why margin and burnout are one problem",
      },
      {
        property: "og:description",
        content:
          "Profit doesn't erode randomly — it erodes behaviourally. The thesis, the equation and the worked example behind a 90-day early warning for services delivery.",
      },
      { property: "og:image", content: "https://headroomapp.co/og-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "The Behavioral Equation of Profit — why margin and burnout are one problem",
      },
      {
        name: "twitter:description",
        content:
          "Profit doesn't erode randomly — it erodes behaviourally. The thesis behind a 90-day early warning for services delivery.",
      },
      { name: "twitter:image", content: "https://headroomapp.co/og-image.png" },
    ],
    links: [{ rel: "canonical", href: "https://headroomapp.co/evolution" }],
  }),
});
