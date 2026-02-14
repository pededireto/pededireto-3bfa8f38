import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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
        const { data, error } = await supabase.rpc("get_user_context");

        if (error || !data) return;

        hasRedirected.current = true;

        // 🔴 PRIORIDADE 1 — Redirect guardado (ex: claim)
        const storedRedirect = localStorage.getItem("postLoginRedirect");
        if (storedRedirect) {
          localStorage.removeItem("postLoginRedirect");
          navigate(storedRedirect, { replace: true });
          return;
        }

        // 🔴 PRIORIDADE 2 — ADMIN
        if (data.role === "admin") {
          if (location.pathname !== "/admin") {
            navigate("/admin", { replace: true });
          }
          return;
        }

        // 🔴 PRIORIDADE 3 — BUSINESS USER
        if (data.business_id) {
          if (location.pathname !== "/business-dashboard") {
            navigate("/business-dashboard", { replace: true });
          }
          return;
        }

        // 🔴 PRIORIDADE 4 — CONSUMER
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
