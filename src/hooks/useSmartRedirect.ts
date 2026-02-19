import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface UserContext {
  role: string;
  business_id: string | null;
  business_count: number;
  pending_count?: number;
  is_admin?: boolean;
  is_commercial?: boolean;
}

// Pages where smart redirect should run (auth entry points)
const REDIRECT_ELIGIBLE_PATHS = [
  "/login",
  "/register",
  "/registar/consumidor",
  "/register/business",
  "/admin/login",
  "/admin/register",
  "/dashboard",
];

export function useSmartRedirect(user: any, loading?: boolean) {
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Reset on user change
    if (!user) {
      hasRedirected.current = false;
      return;
    }
    if (loading) return;
    if (hasRedirected.current) return;

    // Only run on eligible pages — don't redirect from public/active pages
    const isEligible = REDIRECT_ELIGIBLE_PATHS.some(p => location.pathname === p);
    if (!isEligible) return;

    const run = async () => {
      try {
        const { data, error } = await supabase.rpc("get_user_context" as any);
        
        if (error || !data) {
          console.error("useSmartRedirect - get_user_context error:", error);
          return;
        }

        const ctx = data as unknown as UserContext;
        hasRedirected.current = true;

        // Redirect guardado (ex: claim)
        const storedRedirect = localStorage.getItem("postLoginRedirect");
        if (storedRedirect) {
          localStorage.removeItem("postLoginRedirect");
          navigate(storedRedirect, { replace: true });
          return;
        }

        // 🎯 ONBOARDING TEAM
        if (ctx.role === "onboarding") {
          navigate("/onboarding", { replace: true });
          return;
        }

        // 💬 CS TEAM
        if (ctx.role === "cs") {
          navigate("/cs", { replace: true });
          return;
        }

        // 🏪 COMERCIAL TEAM
        if (ctx.role === "commercial" || ctx.is_commercial) {
          navigate("/comercial", { replace: true });
          return;
        }

        // 👑 ADMIN / SUPER_ADMIN
        if (ctx.role === "admin" || ctx.role === "super_admin" || ctx.is_admin) {
          navigate("/admin", { replace: true });
          return;
        }

        // 🏢 BUSINESS USER
        if (ctx.business_id || ctx.business_count > 0) {
          navigate("/business-dashboard", { replace: true });
          return;
        }

        // 👤 CONSUMER
        navigate("/dashboard", { replace: true });

      } catch (err) {
        console.error("Smart redirect error:", err);
      }
    };

    run();
  }, [user, loading, navigate, location.pathname]);
}
