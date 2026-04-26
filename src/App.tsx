import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index.tsx";
import Admin from "./pages/Admin.tsx";
import NotFound from "./pages/NotFound.tsx";

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
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin" element={<Admin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
