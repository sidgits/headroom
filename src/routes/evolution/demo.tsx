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
      { property: "og:url", content: "https://headroomapp.co/evolution/demo" },
    ],
    links: [{ rel: "canonical", href: "https://headroomapp.co/evolution/demo" }],
  }),
});
