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
            { title: "Behavioral OS by Headroom — Early Warning for Delivery Margin" },
            {
              name: "description",
              content:
                "Behavioral OS is Headroom's organizational layer: it reads delivery behavior — fragmentation, shadow labor, drag — and turns margin erosion into a 90-day early warning instead of a quarter-end surprise.",
            },
            { property: "og:type", content: "website" },
            {
              property: "og:title",
              content: "Behavioral OS by Headroom — early warning for delivery margin",
            },
            {
              property: "og:description",
              content:
                "The organizational layer of Headroom: read delivery behavior and see margin risk 90 days before it lands in the P&L.",
            },
            { property: "og:url", content: "https://headroomapp.co/evolution" },
            { property: "og:image", content: "https://headroomapp.co/og-image.png" },
            { name: "twitter:card", content: "summary_large_image" },
            {
              name: "twitter:title",
              content: "Behavioral OS by Headroom — early warning for delivery margin",
            },
            {
              name: "twitter:description",
              content:
                "Read delivery behavior and see margin risk 90 days before it lands in the P&L.",
            },
            { name: "twitter:image", content: "https://headroomapp.co/og-image.png" },
          ],
          links: [{ rel: "canonical", href: "https://headroomapp.co/evolution" }],
        }
      : {
          meta: [
            { title: "Headroom - How your work is impacting your brain - find out" },
            {
              name: "description",
              content:
                "Check your cognitive load and burnout risk by integrating your calendar",
            },
            { property: "og:type", content: "website" },
            { property: "og:title", content: "Headroom - How your work is impacting your brain - find out" },
            {
              property: "og:description",
              content: "Check your cognitive load and burnout risk by integrating your calendar",
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
