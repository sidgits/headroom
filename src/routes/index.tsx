import { createFileRoute } from "@tanstack/react-router";
import Index from "@/pages/Index";
import Evolution from "@/pages/Evolution";

// behavos.headroomapp.co serves the Behavioral OS (Evolution) page at its root,
// while headroomapp.co/ keeps serving the assessment landing page.
// Host detection runs in the loader so SSR and hydration agree.
export const Route = createFileRoute("/")({
  loader: async () => {
    let hostname = "";
    if (import.meta.env.SSR) {
      const { getRequestHeader } = await import("@tanstack/react-start/server");
      hostname = (getRequestHeader("host") ?? "").split(":")[0] ?? "";
    } else {
      hostname = window.location.hostname;
    }
    return { behavos: hostname.split(".")[0]?.toLowerCase() === "behavos" };
  },
  component: HomeRoute,
});

function HomeRoute() {
  const { behavos } = Route.useLoaderData();
  return behavos ? <Evolution /> : <Index />;
}
