import { Suspense, lazy, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index.tsx";

// Route-level code splitting keeps the initial bundle small; heavy deps
// (PDF export, charts) now load only when these routes are visited.
const Admin = lazy(() => import("./pages/Admin.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const Evolution = lazy(() => import("./pages/Evolution.tsx"));
const Login = lazy(() => import("./pages/Login.tsx"));
const CalendarPage = lazy(() => import("./pages/CalendarPage.tsx"));
const CoachPage = lazy(() => import("./pages/CoachPage.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const RouteFallback = () => (
  <div className="h-screen bg-background flex items-center justify-center">
    <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
  </div>
);

const queryClient = new QueryClient();

const SIGNIN_LOG_KEY = "signin_logged_session";

const useLogSignin = () => {
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
};

const AuthLogger = () => {
  useLogSignin();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthLogger />
      <BrowserRouter>
        <main>
          <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard/calendar" element={<CalendarPage />} />
            <Route path="/dashboard/coach" element={<CoachPage />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/evolution" element={<Evolution />} />
            
            <Route path="/admin" element={<Admin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />

          </Routes>
          </Suspense>
        </main>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
