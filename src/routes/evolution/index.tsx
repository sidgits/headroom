import { createFileRoute } from "@tanstack/react-router";
import Evolution from "@/pages/Evolution";

export const Route = createFileRoute("/evolution/")({
  component: Evolution,
  head: () => ({
    meta: [
      { title: "Headroom - How your work is impacting your brain - find out" },
      {
        name: "description",
        content:
          "Check your cognitive load and burnout risk by integrating your calendar",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://headroomapp.co/evolution" },
      {
        property: "og:title",
        content: "Headroom - How your work is impacting your brain - find out",
      },
      {
        property: "og:description",
        content:
          "Check your cognitive load and burnout risk by integrating your calendar",
      },
      { property: "og:image", content: "https://headroomapp.co/og-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "Headroom - How your work is impacting your brain - find out",
      },
      {
        name: "twitter:description",
        content:
          "Check your cognitive load and burnout risk by integrating your calendar",
      },
      { name: "twitter:image", content: "https://headroomapp.co/og-image.png" },
    ],
    links: [{ rel: "canonical", href: "https://headroomapp.co/evolution" }],
  }),
});
