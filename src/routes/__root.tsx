// ported from main.tsx — font loading
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/700.css";

import { useEffect } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import NotFound from "@/pages/NotFound";
import appCss from "../styles.css?url";

const SIGNIN_LOG_KEY = "signin_logged_session";

// ported from App.tsx — logs sign-ins once per session
const AuthLogger = () => {
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        const marker = `${session.user.id}:${session.access_token.slice(-12)}`;
        if (sessionStorage.getItem(SIGNIN_LOG_KEY) === marker) return;
        sessionStorage.setItem(SIGNIN_LOG_KEY, marker);
        // Defer to avoid blocking auth callback
        setTimeout(() => {
          supabase.functions.invoke("log-signin").catch((e) => {
            console.error("log-signin failed", e);
          });
        }, 0);
      }
      if (event === "SIGNED_OUT") {
        sessionStorage.removeItem(SIGNIN_LOG_KEY);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return null;
};

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthLogger />
          <main>
            <Outlet />
          </main>
        </TooltipProvider>
    </QueryClientProvider>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="text-muted-foreground">
          Something went wrong on our end. You can try again or head back home.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Try again
          </button>
          <a className="px-4 py-2 rounded-md border border-border" href="/">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      { title: "Headroom — Cognitive Load Assessment" },
      { name: "description", content: "Your brain has a capacity. Nobody told you what's filling it!" },
      { name: "author", content: "Headroom" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Headroom - Take Control of your Burnout & Cognitive Load" },
      { property: "og:description", content: "Your brain has a capacity. Nobody told you what's filling it!" },
      { property: "og:image", content: "https://headroomapp.co/og-image.png" },
      { property: "og:image:width", content: "1920" },
      { property: "og:image:height", content: "1080" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Headroom - Take Control of your Burnout & Cognitive Load" },
      { name: "twitter:description", content: "Your brain has a capacity. Nobody told you what's filling it!" },
      { name: "twitter:image", content: "https://headroomapp.co/og-image.png" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Headroom",
          url: "https://headroomapp.co/",
          description: "Your brain has a capacity. Nobody told you what's filling it!",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Headroom",
          url: "https://headroomapp.co/",
          logo: "https://headroomapp.co/headroom-logo.png",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: ErrorComponent,
});
