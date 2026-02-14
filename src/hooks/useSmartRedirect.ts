import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface UserContext {
  role: string;
  business_id: string | null;
  business_count: number;
  pending_count: number;
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

        // ADMIN
        if (ctx.role === "admin") {
          if (location.pathname !== "/admin") {
            navigate("/admin", { replace: true });
          }
          return;
        }

        // BUSINESS USER
        if (ctx.business_id) {
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
