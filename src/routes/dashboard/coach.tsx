import { createFileRoute } from "@tanstack/react-router";
import CoachPage from "@/pages/CoachPage";

export const Route = createFileRoute("/dashboard/coach")({
  component: CoachPage,
  head: () => ({
    meta: [{ title: "AI Coach — Headroom" }],
  }),
});
