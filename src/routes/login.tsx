import { createFileRoute } from "@tanstack/react-router";
import Login from "@/pages/Login";

export const Route = createFileRoute("/login")({
  component: Login,
  head: () => ({
    meta: [
      { title: "Sign In | Headroom" },
      {
        name: "description",
        content:
          "Sign in to Headroom to view your work profile, calendar insights and AI coach.",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Sign In | Headroom" },
      {
        property: "og:description",
        content: "Sign in to Headroom to view your work profile, calendar insights and AI coach.",
      },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://headroomapp.co/login" }],
  }),
});
