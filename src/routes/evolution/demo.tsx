import { createFileRoute } from "@tanstack/react-router";
import EvolutionDemo from "@/pages/EvolutionDemo";

export const Route = createFileRoute("/evolution/demo")({
  component: EvolutionDemo,
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://headroomapp.co/evolution/demo" },
      { property: "og:image", content: "https://headroomapp.co/og-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://headroomapp.co/og-image.png" },
    ],
    links: [{ rel: "canonical", href: "https://headroomapp.co/evolution/demo" }],
  }),
});
