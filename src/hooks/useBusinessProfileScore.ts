import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isFieldVisible, getVisibleFieldCount, type PlanTier } from "@/utils/planFieldVisibility";

export interface ProfileScoreData {
  score: number;
  max: number;
  percentage: number;
  suggestions: string[];
}

/**
 * 29 fields that make up 100% profile completeness.
 * Denominator adjusts to the active tier.
 */
const PROFILE_FIELDS: { key: string; label: string; check: (b: any, extra: any) => boolean }[] = [
  { key: "name", label: "Nome do negócio", check: (b) => !!b.name?.trim() },
  { key: "description", label: "Descrição do negócio", check: (b) => !!b.description?.trim() },
  { key: "logo_url", label: "Logótipo", check: (b) => !!b.logo_url?.trim() },
  { key: "category", label: "Categoria", check: (b, e) => !!b.category_id || (e.categoryCount > 0) },
  { key: "alcance", label: "Alcance definido", check: (b) => !!b.alcance?.trim() },
  { key: "city", label: "Cidade onde opera", check: (b, e) => !!b.city?.trim() || (e.cityCount > 0) },
  { key: "public_address", label: "Morada pública", check: (b) => !!b.public_address?.trim() },
  { key: "cta_phone", label: "Telefone público", check: (b) => !!b.cta_phone?.trim() },
  { key: "cta_email", label: "Email público", check: (b) => !!b.cta_email?.trim() },
  { key: "cta_website", label: "Website", check: (b) => !!b.cta_website?.trim() },
  { key: "schedule", label: "Horário de funcionamento", check: (b) => !!(b.schedule_weekdays?.trim() || b.opening_hours) },
  { key: "cta_whatsapp", label: "WhatsApp", check: (b) => !!b.cta_whatsapp?.trim() },
  { key: "instagram_url", label: "Instagram", check: (b) => !!b.instagram_url?.trim() },
  { key: "facebook_url", label: "Facebook", check: (b) => !!b.facebook_url?.trim() },
  { key: "other_social_url", label: "Outra rede social", check: (b) => !!b.other_social_url?.trim() },
  { key: "photo_1", label: "1.ª Foto", check: (b) => Array.isArray(b.images) && b.images.length >= 1 && !!b.images[0] },
  { key: "photo_2", label: "2.ª Foto", check: (b) => Array.isArray(b.images) && b.images.length >= 2 && !!b.images[1] },
  { key: "nif", label: "NIF", check: (b) => !!b.nif?.trim() },
  { key: "address", label: "Morada fiscal", check: (b) => !!b.address?.trim() },
  { key: "owner_name", label: "Responsável", check: (b) => !!b.owner_name?.trim() },
  { key: "owner_phone", label: "Telefone do responsável", check: (b) => !!b.owner_phone?.trim() },
  { key: "owner_email", label: "Email do responsável", check: (b) => !!b.owner_email?.trim() },
  { key: "attendance_type", label: "Tipo de Atendimento", check: () => false },
  { key: "photo_3", label: "3.ª Foto", check: (b) => Array.isArray(b.images) && b.images.length >= 3 && !!b.images[2] },
  { key: "photo_4", label: "4.ª Foto", check: (b) => Array.isArray(b.images) && b.images.length >= 4 && !!b.images[3] },
  { key: "photo_5", label: "5.ª Foto", check: (b) => Array.isArray(b.images) && b.images.length >= 5 && !!b.images[4] },
  { key: "photo_6", label: "6.ª Foto", check: (b) => Array.isArray(b.images) && b.images.length >= 6 && !!b.images[5] },
  { key: "video", label: "Vídeo", check: () => false },
  { key: "promotions", label: "Promoções activas", check: () => false },
];

/**
 * Resolve the active tier from business data.
 */
const resolveActiveTier = (biz: any): PlanTier => {
  const now = new Date();
  const trialEnd = biz.trial_ends_at ? new Date(biz.trial_ends_at) : null;
  const isOnTrial = !!trialEnd && trialEnd > now;

  if (isOnTrial) return "pro";

  const hasActive = biz.subscription_status === "active";
  if (hasActive) {
    // is_premium = true → PRO (matches the DB view logic)
    if (biz.is_premium) return "pro";
    const plan = biz.subscription_plan;
    if (plan === "pro" || plan === "1_year" || plan === "1_month") return "pro";
    if (plan === "start") return "start";
    // Any other active non-free plan = start
    if (plan && plan !== "free") return "start";
  }

  return "free";
};

export const useBusinessProfileScore = (businessId: string | null | undefined) => {
  return useQuery({
    queryKey: ["business-profile-score", businessId],
    queryFn: async (): Promise<ProfileScoreData> => {
      const { data: biz, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", businessId!)
        .maybeSingle();

      if (error) throw error;
      if (!biz) return { score: 0, max: 0, percentage: 0, suggestions: [] };

      const tier = resolveActiveTier(biz);
      const tierMax = getVisibleFieldCount(tier);

      const [catRes, cityRes] = await Promise.all([
        supabase
          .from("business_categories")
          .select("id", { count: "exact", head: true })
          .eq("business_id", businessId!),
        supabase
          .from("business_cities")
          .select("id", { count: "exact", head: true })
          .eq("business_id", businessId!),
      ]);

      const extra = {
        categoryCount: catRes.count ?? 0,
        cityCount: cityRes.count ?? 0,
      };

      let score = 0;
      const suggestions: string[] = [];

      for (const field of PROFILE_FIELDS) {
        // Skip fields not visible in the active tier
        if (!isFieldVisible(field.key, tier)) continue;

        if (field.check(biz, extra)) {
          score++;
        } else {
          suggestions.push(field.label);
        }
      }

      const percentage = tierMax > 0 ? Math.round((score / tierMax) * 100) : 0;

      return {
        score,
        max: tierMax,
        percentage,
        suggestions,
      };
    },
    enabled: !!businessId,
    staleTime: 60 * 1000,
  });
};
