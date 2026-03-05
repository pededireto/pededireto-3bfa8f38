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

const REDIRECT_ELIGIBLE_PATHS = [
  "/login",
  "/register",
  "/registar/consumidor",
  "/register/business",
  "/admin/login",
  "/admin/register",
  "/dashboard",
];

const generateSlug = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") +
  "-" +
  Date.now().toString(36);

export function useSmartRedirect(user: any, loading?: boolean) {
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!user) {
      hasRedirected.current = false;
      return;
    }
    if (loading) return;
    if (hasRedirected.current) return;

    const isEligible = REDIRECT_ELIGIBLE_PATHS.some((p) => location.pathname === p);
    if (!isEligible) return;

    const run = async () => {
      try {
        // ── Criar negócio pendente (se existir) ──────────────────────────
        // Acontece quando utilizador confirmou email após RegisterBusiness
        const pending = localStorage.getItem("pendingBusinessRegistration");
        if (pending) {
          try {
            const data = JSON.parse(pending);
            localStorage.removeItem("pendingBusinessRegistration");

            const slug = generateSlug(data.name);
            await supabase.rpc("register_business_with_owner" as any, {
              p_name: data.name,
              p_slug: slug,
              p_nif: data.nif || "",
              p_address: data.address || "",
              p_city: data.city,
              p_cta_email: data.cta_email,
              p_cta_phone: data.cta_phone,
              p_owner_name: data.owner_name,
              p_owner_phone: data.owner_phone,
              p_owner_email: data.owner_email,
              p_category_id: data.category_id,
              p_subcategory_id: data.subcategory_id,
              p_cta_whatsapp: data.cta_whatsapp || null,
              p_cta_website: data.cta_website || null,
              p_registration_source: "register_form",
            });
            // Negócio criado — deixa o redirect normal tratar o resto
            // (vai detetar business_count > 0 e ir para business-dashboard)
          } catch (err) {
            console.error("Erro ao criar negócio pendente:", err);
            // Não bloqueia o redirect mesmo se falhar
          }
        }

        // ── Contexto do utilizador ────────────────────────────────────────
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
