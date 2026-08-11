import { createFileRoute } from "@tanstack/react-router";
import EvolutionDemo from "@/pages/EvolutionDemo";

export const Route = createFileRoute("/evolution/demo")({
  component: EvolutionDemo,
  head: () => ({
    meta: [
      { title: "BehavioralOS — Loss-making engagements, flagged 90 days early" },
      {
        name: "description",
        content:
          "BehavioralOS is an early warning system for services delivery: the engagement that's about to lose money, flagged 90 days before the P&L shows it — proven by the Behavioral Equation of Profit.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://headroomapp.co/evolution/demo" },
      {
        property: "og:title",
        content: "BehavioralOS — the engagement that's about to lose money, flagged 90 days early",
      },
      {
        property: "og:description",
        content:
          "An interactive sample-data walkthrough: an early warning on a live engagement, and the Behavioral Equation of Profit arithmetic that produced it.",
      },
      { property: "og:image", content: "https://headroomapp.co/og-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "BehavioralOS — the engagement that's about to lose money, flagged 90 days early",
      },
      {
        name: "twitter:description",
        content:
          "An interactive sample-data walkthrough: an early warning on a live engagement, and the arithmetic behind it.",
      },
      { name: "twitter:image", content: "https://headroomapp.co/og-image.png" },
    ],
    links: [{ rel: "canonical", href: "https://headroomapp.co/evolution/demo" }],
  }),
});
