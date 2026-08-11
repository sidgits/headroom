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
  head: ({ loaderData }) =>
    loaderData?.behavos
      ? {
          meta: [
            { title: "The Behavioral Equation of Profit — Margin and Burnout Are One Problem" },
            {
              name: "description",
              content:
                "In services firms, margin erosion and people burnout are managed as two problems by two functions. One causes the other. The Behavioral OS turns that lagging indicator into a 90-day early warning.",
            },
            { property: "og:type", content: "website" },
            {
              property: "og:title",
              content: "The Behavioral Equation of Profit — why margin and burnout are one problem",
            },
            {
              property: "og:description",
              content:
                "Profit doesn't erode randomly — it erodes behaviourally. The thesis, the equation and the worked example behind a 90-day early warning for services delivery.",
            },
            { property: "og:image", content: "https://headroomapp.co/og-image.png" },
            { name: "twitter:card", content: "summary_large_image" },
            { name: "twitter:image", content: "https://headroomapp.co/og-image.png" },
          ],
        }
      : {
          meta: [
            { title: "Headroom — Cognitive Load Assessment" },
            {
              name: "description",
              content:
                "Find out what's really filling your head. Take the free Headroom cognitive load assessment and get your personal work profile.",
            },
            { property: "og:type", content: "website" },
            { property: "og:title", content: "Headroom — Cognitive Load Assessment" },
            {
              property: "og:description",
              content: "Your brain has a capacity. Nobody told you what's filling it.",
            },
            { property: "og:url", content: "https://headroomapp.co/" },
            { property: "og:image", content: "https://headroomapp.co/og-image.png" },
            { name: "twitter:card", content: "summary_large_image" },
            { name: "twitter:image", content: "https://headroomapp.co/og-image.png" },
          ],
          links: [{ rel: "canonical", href: "https://headroomapp.co/" }],
        },
  component: HomeRoute,
});


function HomeRoute() {
  const { behavos } = Route.useLoaderData();
  return behavos ? <Evolution /> : <Index />;
}
