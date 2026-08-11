import { createFileRoute } from "@tanstack/react-router";
import Admin from "@/pages/Admin";

export const Route = createFileRoute("/admin")({
  component: Admin,
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Headroom" },
      {
        name: "description",
        content:
          "Internal Headroom admin dashboard for reviewing assessment completions and user activity.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Admin Dashboard — Headroom" },
      { property: "og:description", content: "Internal Headroom admin dashboard." },
    ],
  }),
});
