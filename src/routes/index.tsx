import { createFileRoute } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import Index from "@/pages/Index";
import Evolution from "@/pages/Evolution";

// behavos.headroomapp.co serves the Behavioral OS (Evolution) page at its root,
// while headroomapp.co/ keeps serving the assessment landing page.
// Host detection runs in the loader so SSR and hydration agree.
const getHostname = createIsomorphicFn()
  .server(async () => {
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    return (getRequestHeader("host") ?? "").split(":")[0] ?? "";
  })
  .client(() => window.location.hostname);

export const Route = createFileRoute("/")({
  loader: async () => {
    const hostname = (await getHostname()) ?? "";
    return { behavos: hostname.split(".")[0]?.toLowerCase() === "behavos" };
  },
  component: HomeRoute,
});

function HomeRoute() {
  const { behavos } = Route.useLoaderData();
  return behavos ? <Evolution /> : <Index />;
}
