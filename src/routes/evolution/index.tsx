import { createFileRoute } from "@tanstack/react-router";
import Evolution from "@/pages/Evolution";

export const Route = createFileRoute("/evolution/")({
  component: Evolution,
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://headroomapp.co/evolution" },
      { property: "og:image", content: "https://headroomapp.co/og-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://headroomapp.co/og-image.png" },
    ],
    links: [{ rel: "canonical", href: "https://headroomapp.co/evolution" }],
  }),
});
