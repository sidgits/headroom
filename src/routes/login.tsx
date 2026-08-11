import { createFileRoute } from "@tanstack/react-router";
import Login from "@/pages/Login";

export const Route = createFileRoute("/login")({
  component: Login,
  head: () => ({
    meta: [
      { title: "Sign In | Headroom" },
      {
        name: "description",
        content: "Sign in to Headroom to view your work profile, calendar insights and AI coach.",
      },
    ],
  }),
});
