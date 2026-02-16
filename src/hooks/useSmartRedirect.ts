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

export function useSmartRedirect(user: any, loading?: boolean) {
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!user) return;
    if (loading) return;
    if (hasRedirected.current) return;

    const run = async () => {
      try {
        const { data, error } = await supabase.rpc("get_user_context" as any);
        
        if (error || !data) {
          console.error("useSmartRedirect - get_user_context error:", error);
          return;
        }

        const ctx = data as unknown as UserContext;
        console.log("🔍 User Context:", ctx); // Debug
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
          console.log("✅ Redirecting to /onboarding");
          if (location.pathname !== "/onboarding") {
            navigate("/onboarding", { replace: true });
          }
          return;
        }

        // 💬 CS TEAM
        if (ctx.role === "cs") {
          console.log("✅ Redirecting to /cs");
          if (location.pathname !== "/cs") {
            navigate("/cs", { replace: true });
          }
          return;
        }

        // 🏪 COMERCIAL TEAM
        if (ctx.role === "commercial" || ctx.is_commercial) {
          console.log("✅ Redirecting to /comercial");
          if (location.pathname !== "/comercial") {
            navigate("/comercial", { replace: true });
          }
          return;
        }

        // 👑 ADMIN / SUPER_ADMIN (acesso total a todos os painéis)
        if (ctx.role === "admin" || ctx.role === "super_admin" || ctx.is_admin) {
          console.log("✅ Admin detected, allowing any route");
          const validAdminRoutes = [
            "/admin",
            "/business-dashboard",
            "/comercial",
            "/onboarding",
            "/cs",
            "/perfil",
            "/dashboard"
          ];
          const isOnValidRoute = validAdminRoutes.some(r => location.pathname.startsWith(r));
          
          if (!isOnValidRoute) {
            navigate("/admin", { replace: true });
          }
          return;
        }

        // 🏢 BUSINESS USER (tem pelo menos 1 negócio)
        if (ctx.business_id || ctx.business_count > 0) {
          console.log("✅ Business user, redirecting to /business-dashboard");
          if (location.pathname !== "/business-dashboard") {
            navigate("/business-dashboard", { replace: true });
          }
          return;
        }

        // 👤 CONSUMER (utilizador normal sem negócio)
        console.log("✅ Consumer user, redirecting to /dashboard");
        if (location.pathname !== "/dashboard") {
          navigate("/dashboard", { replace: true });
        }

      } catch (err) {
        console.error("Smart redirect error:", err);
      }
    };

    run();
  }, [user, loading, navigate, location]);
}
