import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ScoreBreakdownItem {
  category: string;
  label: string;
  points: number;
  maxPoints: number;
  filled: boolean;
}

export interface ScoreBreakdownData {
  totalScore: number;
  items: ScoreBreakdownItem[];
  planLevel: string;
}

/**
 * Client-side mirror of calculate_business_ranking_score.
 * Shows each field's contribution so the business owner
 * understands exactly how their score is built.
 */
export const useBusinessScoreBreakdown = (businessId: string | null) => {
  return useQuery({
    queryKey: ["business-score-breakdown", businessId],
    queryFn: async (): Promise<ScoreBreakdownData> => {
      if (!businessId) return { totalScore: 0, items: [], planLevel: "free" };

      // 1. Business data
      const { data: biz, error: bizErr } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", businessId)
        .single();
      if (bizErr) throw bizErr;

      // 2. Resolve plan level
      let planLevel = "free";
      if (biz.plan_id) {
        const { data: plan } = await supabase
          .from("commercial_plans")
          .select("tier, premium_level")
          .eq("id", biz.plan_id)
          .maybeSingle();
        if (plan?.tier === "pro" || plan?.premium_level) planLevel = "pro";
        else if (plan?.tier === "start") planLevel = "start";
      }
      // Trial override
      const trialEnd = (biz as any).trial_ends_at ? new Date((biz as any).trial_ends_at) : null;
      if (trialEnd && trialEnd > new Date()) planLevel = "pro";
      // Fallback
      if (planLevel === "free" && (biz as any).is_premium) planLevel = "pro";

      // 3. Get extra data
      const [subcatRes, reviewRes] = await Promise.all([
        supabase
          .from("business_subcategories" as any)
          .select("subcategory_id", { count: "exact", head: true })
          .eq("business_id", businessId),
        supabase
          .from("business_review_stats")
          .select("*")
          .eq("business_id", businessId)
          .maybeSingle(),
      ]);

      const subcatCount = subcatRes.count ?? 0;
      const reviewStats = reviewRes.data;

      // Photo count
      const images = Array.isArray((biz as any).images)
        ? (biz as any).images.filter((i: any) => i && i !== "")
        : [];
      const photoCount = images.length;

      // Days since update
      const daysSince = Math.floor(
        (Date.now() - new Date(biz.updated_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Days since creation
      const daysSinceCreation = Math.floor(
        (Date.now() - new Date(biz.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      // 4. Build breakdown items — mirrors DB function exactly
      const items: ScoreBreakdownItem[] = [];
      const add = (category: string, label: string, points: number, maxPoints: number, filled: boolean) => {
        items.push({ category, label, points: filled ? points : 0, maxPoints, filled });
      };

      // ── 1. PLANO ──
      const planPoints = planLevel === "pro" ? 20 : planLevel === "start" ? 12 : 0;
      add("Plano", `Plano ${planLevel.toUpperCase()}`, planPoints, 20, planPoints > 0);

      // ── 2. COMPLETUDE DO PERFIL ──
      add("Perfil", "Slug definido", 2, 2, !!(biz as any).slug);
      const descLen = biz.description?.length ?? 0;
      const descPts = descLen > 50 ? 8 : descLen > 20 ? 4 : 0;
      add("Perfil", "Descrição (mín. 50 caracteres)", descPts, 8, descPts > 0);
      add("Perfil", "Logótipo", 6, 6, !!biz.logo_url);

      // Presença pública
      add("Presença", "Subcategorias selecionadas", 4, 4, subcatCount > 0);
      add("Presença", "Alcance definido", 3, 3, !!(biz as any).alcance);
      add("Presença", "Cidade", 4, 4, !!biz.city);
      add("Presença", "Zona / Região", 3, 3, !!(biz as any).zone);
      add("Presença", "Morada pública", 4, 4, !!biz.public_address);
      add("Presença", "Telefone público", 5, 5, !!(biz as any).cta_phone);
      add("Presença", "Email público", 4, 4, !!(biz as any).cta_email);
      add("Presença", "Website", 3, 3, !!(biz as any).cta_website);
      add("Presença", "Horário dias úteis", 4, 4, !!(biz as any).schedule_weekdays);
      add("Presença", "Horário fim-de-semana", 2, 2, !!(biz as any).schedule_weekend);
      add("Presença", "Horário encerramento", 1, 1, !!(biz as any).schedule_closed);

      // Presença digital (START+)
      if (planLevel === "start" || planLevel === "pro") {
        add("Digital", "WhatsApp", 6, 6, !!(biz as any).cta_whatsapp);
        add("Digital", "Instagram", 3, 3, !!(biz as any).instagram_url);
        add("Digital", "Facebook", 3, 3, !!(biz as any).facebook_url);
        add("Digital", "Outra rede social", 2, 2, !!(biz as any).other_social_url);
      }

      // Fotos (incremental)
      const photoSteps = [4, 3, 2, 2, 2, 2]; // 1st to 6th photo
      for (let i = 0; i < 6; i++) {
        add("Fotos", `${i + 1}.ª Foto`, photoSteps[i], photoSteps[i], photoCount > i);
      }

      // PRO modules
      if (planLevel === "pro") {
        // Check modules from business_module_values
        const { data: modVals } = await (supabase as any)
          .from("business_module_values")
          .select("value, business_modules!inner(type)")
          .eq("business_id", businessId);
        const modArr = Array.isArray(modVals) ? modVals : [];
        const hasSelect = modArr.some((m: any) => m.business_modules?.type === "select" && m.value?.trim());
        const hasVideo = modArr.some((m: any) => m.business_modules?.type === "video" && m.value?.trim());
        add("PRO", "Tipo de Atendimento", 4, 4, hasSelect);
        add("PRO", "Vídeo", 6, 6, hasVideo);
      }

      // ── 3. AVALIAÇÕES (máx 25) ──
      let reviewPts = 0;
      if (reviewStats && (reviewStats as any).total_reviews > 0) {
        const n = (reviewStats as any).total_reviews;
        const avg = (reviewStats as any).average_rating;
        reviewPts = Math.min(Math.round((n / (n + 5)) * avg * 5), 25);
      }
      add("Avaliações", `Avaliações (${(reviewStats as any)?.total_reviews ?? 0} reviews)`, reviewPts, 25, reviewPts > 0);

      // ── 4. ACTIVIDADE RECENTE (máx 15) ──
      const activityPts = daysSince <= 15 ? 15 : daysSince <= 30 ? 12 : daysSince <= 60 ? 8 : daysSince <= 90 ? 5 : daysSince <= 180 ? 2 : 0;
      add("Atividade", `Perfil atualizado (há ${daysSince} dias)`, activityPts, 15, activityPts > 0);

      // ── 5. BOOST DE NOVIDADE ──
      const noveltyPts = daysSinceCreation <= 60 ? 5 : 0;
      add("Novidade", "Boost de novidade (primeiros 60 dias)", noveltyPts, 5, noveltyPts > 0);

      const totalScore = items.reduce((sum, i) => sum + i.points, 0);

      return { totalScore, items, planLevel };
    },
    enabled: !!businessId,
    staleTime: 5 * 60_000,
  });
};
