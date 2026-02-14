import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface UserContext {
  role: string;
  business_id: string | null;
  business_count: number;
  pending_count: number;
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

        if (error || !data) return;

        const ctx = data as unknown as UserContext;
        hasRedirected.current = true;

        // Redirect guardado (ex: claim)
        const storedRedirect = localStorage.getItem("postLoginRedirect");
        if (storedRedirect) {
          localStorage.removeItem("postLoginRedirect");
          navigate(storedRedirect, { replace: true });
          return;
        }

        // ADMIN / SUPER_ADMIN
        if (ctx.role === "admin" || ctx.role === "super_admin" || ctx.is_admin) {
          if (location.pathname !== "/admin") {
            navigate("/admin", { replace: true });
          }
          return;
        }

        // COMERCIAL
        if (ctx.role === "comercial" || ctx.is_commercial) {
          if (location.pathname !== "/comercial") {
            navigate("/comercial", { replace: true });
          }
          return;
        }

        // BUSINESS USER (has at least one business)
        if (ctx.business_id || ctx.business_count > 0) {
          if (location.pathname !== "/business-dashboard") {
            navigate("/business-dashboard", { replace: true });
          }
          return;
        }

        // CONSUMER
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
