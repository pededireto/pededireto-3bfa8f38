import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function useSmartRedirect(user: any) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const run = async () => {
      const { data, error } = await supabase.rpc("get_user_context");

      if (error) {
        console.error(error);
        return;
      }

      const ctx = data;

      if (ctx.is_admin) {
        navigate("/admin");
        return;
      }

      if (ctx.is_commercial) {
        navigate("/comercial");
        return;
      }

      if (ctx.business_count > 0 || ctx.pending_count > 0) {
        navigate("/business-dashboard");
        return;
      }

      navigate("/dashboard");
    };

    run();
  }, [user, navigate]);
}
