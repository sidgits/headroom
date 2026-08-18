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
                "Profit doesn't erode randomly — it erodes behaviorally. The thesis, the equation and the worked example behind a 90-day early warning for services delivery.",
            },
            { property: "og:image", content: "https://headroomapp.co/og-image.png" },
            { name: "twitter:card", content: "summary_large_image" },
            { name: "twitter:image", content: "https://headroomapp.co/og-image.png" },
          ],
        }
      : {
          meta: [
            { title: "Headroom App — Cognitive Load & Burnout Assessment" },
            {
              name: "description",
              content:
                "Headroom App is a web app that measures cognitive load and burnout risk. Take the free assessment, get your Work Pattern archetype, then track Core, Toxic and Growth Load from your calendar.",
            },
            { property: "og:type", content: "website" },
            { property: "og:title", content: "Headroom App — Cognitive Load & Burnout Assessment" },
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
          scripts: [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                name: "Headroom App",
                alternateName: "Headroom",
                url: "https://headroomapp.co/",
                applicationCategory: "BusinessApplication",
                operatingSystem: "Web browser (any device)",
                description:
                  "Headroom App measures cognitive load and burnout risk. A short assessment reveals your Work Pattern archetype, then calendar analysis tracks Core Load, Toxic Load and Growth Load with AI coaching.",
                offers: { "@type": "Offer", price: "9", priceCurrency: "USD" },
                publisher: { "@id": "https://headroomapp.co/#organization" },
              }),
            },
          ],
        },
  component: HomeRoute,
});


function HomeRoute() {
  const { behavos } = Route.useLoaderData();
  return behavos ? <Evolution /> : <Index />;
}
