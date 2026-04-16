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

/**
 * Tenta criar o negócio pendente a partir da BD ou do localStorage.
 * Retorna true se criou (ou tentou), false se não havia nada pendente.
 */
async function processPendingBusiness(userId: string): Promise<boolean> {
  // ── 1. Tentar via tabela pending_registrations (robusto) ──────────────
  try {
    const { data: pendingRows } = await (supabase as any)
      .from("pending_registrations")
      .select("*")
      .eq("user_id", userId)
      .is("processed_at", null)
      .limit(1);

    if (pendingRows && pendingRows.length > 0) {
      const row = pendingRows[0];
      const data = row.payload;

      const slug = generateSlug(data.name);
      const primarySubcategoryId = data.subcategory_ids?.[0] ?? null;

      const { data: businessId, error: rpcError } = await supabase.rpc("register_business_with_owner" as any, {
        p_name: data.name,
        p_slug: slug,
        p_city: data.city,
        p_cta_phone: data.cta_phone ?? "",
        p_cta_email: data.cta_email || data.owner_email || "",
        p_category_id: data.category_id,
        p_subcategory_id: primarySubcategoryId,
        p_owner_email: data.owner_email,
        p_registration_source: "onboarding_wizard",
        p_nif: data.nif || null,
        p_address: data.address || null,
        p_owner_name: data.owner_name || null,
        p_owner_phone: data.owner_phone || data.cta_phone || null,
      });

      if (rpcError) throw rpcError;

      // Subcategorias adicionais
      if (businessId && data.subcategory_ids?.length > 1) {
        const rows = data.subcategory_ids.slice(1).map((subId: string) => ({
          business_id: businessId,
          subcategory_id: subId,
        }));
        await supabase.from("business_subcategories").insert(rows);
      }

      // Marcar como processado
      await (supabase as any)
        .from("pending_registrations")
        .update({ processed_at: new Date().toISOString() })
        .eq("id", row.id);

      console.log("[useSmartRedirect] Negócio pendente criado via BD:", businessId);
      return true;
    }
  } catch (err) {
    console.error("[useSmartRedirect] Erro ao processar pending_registrations:", err);
    // Não bloqueia — tenta localStorage como fallback
  }

  // ── 2. Fallback: localStorage (compatibilidade retroactiva) ───────────
  const pending = localStorage.getItem("pendingBusinessRegistration");
  if (!pending) return false;

  try {
    const data = JSON.parse(pending);
    localStorage.removeItem("pendingBusinessRegistration");

    const slug = generateSlug(data.name);
    const primarySubcategoryId = data.subcategory_ids?.[0] ?? null;

    const { data: businessId, error: rpcError } = await supabase.rpc("register_business_with_owner" as any, {
      p_name: data.name,
      p_slug: slug,
      p_city: data.city,
      p_cta_phone: data.cta_phone ?? "",
      p_cta_email: data.cta_email || data.owner_email || "",
      p_category_id: data.category_id,
      p_subcategory_id: primarySubcategoryId,
      p_owner_email: data.owner_email,
      p_registration_source: "onboarding_wizard",
      p_nif: data.nif || null,
      p_address: data.address || null,
      p_owner_name: data.owner_name || null,
      p_owner_phone: data.owner_phone || data.cta_phone || null,
    });

    if (rpcError) throw rpcError;

    // Subcategorias adicionais
    if (businessId && data.subcategory_ids?.length > 1) {
      const rows = data.subcategory_ids.slice(1).map((subId: string) => ({
        business_id: businessId,
        subcategory_id: subId,
      }));
      await supabase.from("business_subcategories").insert(rows);
    }

    console.log("[useSmartRedirect] Negócio pendente criado via localStorage:", businessId);
    return true;
  } catch (err) {
    console.error("[useSmartRedirect] Erro ao criar negócio pendente (localStorage):", err);
    return false;
  }
}

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
        // Processar negócio pendente (BD + localStorage como fallback)
        await processPendingBusiness(user.id);

        // Contexto do utilizador
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
