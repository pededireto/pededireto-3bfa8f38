import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── Favoritos ────────────────────────────────────────────────────────────────
export const useBusinessFavorites = (businessId: string | null) => {
  return useQuery({
    queryKey: ["business-favorites", businessId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("user_favorites")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId!);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
  });
};

// ─── Score do Perfil ──────────────────────────────────────────────────────────
export interface ProfileScoreData {
  score: number;
  fields: {
    label: string;
    filled: boolean;
    points: number;
    tip: string;
  }[];
}

export const useBusinessProfileScore = (businessId: string | null) => {
  return useQuery({
    queryKey: ["business-profile-score", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("name, description, logo_url, cta_whatsapp, cta_phone, cta_email, cta_website, schedule_weekdays, public_address, city, facebook_url, instagram_url")
        .eq("id", businessId!)
        .single();
      if (error) throw error;

      const fields = [
        { label: "Nome do negócio", filled: !!data.name, points: 10, tip: "Certifica-te que o nome está correto" },
        { label: "Descrição", filled: !!data.description, points: 15, tip: "Adiciona uma descrição detalhada para atrair mais clientes" },
        { label: "Logo / Imagem", filled: !!data.logo_url, points: 15, tip: "Negócios com logo têm 2x mais cliques" },
        { label: "WhatsApp ou Telefone", filled: !!(data.cta_whatsapp || data.cta_phone), points: 15, tip: "Adiciona pelo menos um contacto direto" },
        { label: "Email de contacto", filled: !!data.cta_email, points: 5, tip: "Permite que clientes te contactem por email" },
        { label: "Website", filled: !!data.cta_website, points: 5, tip: "Liga o teu website para mais credibilidade" },
        { label: "Horário de funcionamento", filled: !!data.schedule_weekdays, points: 10, tip: "Clientes querem saber quando podes atender" },
        { label: "Morada pública", filled: !!data.public_address, points: 10, tip: "Ajuda clientes a encontrarem-te no mapa" },
        { label: "Cidade", filled: !!data.city, points: 5, tip: "Essencial para aparecer em pesquisas locais" },
        { label: "Redes sociais", filled: !!(data.facebook_url || data.instagram_url), points: 10, tip: "Aumenta a confiança dos potenciais clientes" },
      ];

      const score = fields.reduce((acc, f) => acc + (f.filled ? f.points : 0), 0);
      return { score, fields } as ProfileScoreData;
    },
    enabled: !!businessId,
    staleTime: 10 * 60 * 1000,
  });
};

// ─── Pedidos de Serviço ───────────────────────────────────────────────────────
export interface ServiceRequestsData {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  viewed: number;
  acceptance_rate: number;
  avg_response_hours: number | null;
  recent: {
    id: string;
    description: string;
    urgency: string;
    location_city: string | null;
    status: string;
    sent_at: string;
    viewed_at: string | null;
    consumer_name: string | null;
  }[];
}

export const useBusinessServiceRequests = (businessId: string | null) => {
  return useQuery({
    queryKey: ["business-service-requests", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("request_business_matches" as any)
        .select(`
          id,
          status,
          sent_at,
          viewed_at,
          first_response_at,
          service_requests!inner(description, urgency, location_city, consumer_name)
        `)
        .eq("business_id", businessId!)
        .order("sent_at", { ascending: false });

      if (error) throw error;
      const rows = (data as any[]) ?? [];

      const total = rows.length;
      const accepted = rows.filter((r) => r.status === "accepted").length;
      const pending = rows.filter((r) => r.status === "pending" || r.status === "enviado").length;
      const rejected = rows.filter((r) => r.status === "rejected").length;
      const viewed = rows.filter((r) => r.viewed_at).length;

      const responseTimes = rows
        .filter((r) => r.first_response_at && r.sent_at)
        .map((r) => (new Date(r.first_response_at).getTime() - new Date(r.sent_at).getTime()) / 3600000);

      const avg_response_hours = responseTimes.length
        ? Math.round((responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) * 10) / 10
        : null;

      const recent = rows.slice(0, 5).map((r) => ({
        id: r.id,
        description: r.service_requests?.description ?? "",
        urgency: r.service_requests?.urgency ?? "normal",
        location_city: r.service_requests?.location_city ?? null,
        status: r.status,
        sent_at: r.sent_at,
        viewed_at: r.viewed_at,
        consumer_name: r.service_requests?.consumer_name ?? null,
      }));

      return {
        total,
        pending,
        accepted,
        rejected,
        viewed,
        acceptance_rate: total > 0 ? Math.round((accepted / total) * 100 * 10) / 10 : 0,
        avg_response_hours,
        recent,
      } as ServiceRequestsData;
    },
    enabled: !!businessId,
    staleTime: 2 * 60 * 1000,
  });
};

// ─── Avaliações ───────────────────────────────────────────────────────────────
export interface ReviewsData {
  total: number;
  average_rating: number;
  verified_count: number;
  pending_response: number;
  rating_5: number;
  rating_4: number;
  rating_3: number;
  rating_2: number;
  rating_1: number;
  recent: {
    id: string;
    rating: number;
    title: string | null;
    comment: string | null;
    is_verified: boolean;
    business_response: string | null;
    created_at: string;
    pending_response: boolean;
  }[];
}

export const useBusinessReviewsData = (businessId: string | null) => {
  return useQuery({
    queryKey: ["business-reviews-data", businessId],
    queryFn: async () => {
      const { data: stats, error: statsError } = await supabase
        .from("business_review_stats")
        .select("*")
        .eq("business_id", businessId!)
        .single();

      const { data: reviews, error: reviewsError } = await supabase
        .from("business_reviews")
        .select("id, rating, title, comment, is_verified, business_response, created_at")
        .eq("business_id", businessId!)
        .eq("moderation_status", "approved")
        .order("created_at", { ascending: false })
        .limit(5);

      if (reviewsError) throw reviewsError;

      const recentMapped = (reviews ?? []).map((r) => ({
        ...r,
        pending_response: !r.business_response,
      }));

      return {
        total: stats?.total_reviews ?? 0,
        average_rating: stats?.average_rating ?? 0,
        verified_count: stats?.verified_reviews_count ?? 0,
        pending_response: recentMapped.filter((r) => r.pending_response).length,
        rating_5: stats?.rating_5_count ?? 0,
        rating_4: stats?.rating_4_count ?? 0,
        rating_3: stats?.rating_3_count ?? 0,
        rating_2: stats?.rating_2_count ?? 0,
        rating_1: stats?.rating_1_count ?? 0,
        recent: recentMapped,
      } as ReviewsData;
    },
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
  });
};

// ─── Badges ───────────────────────────────────────────────────────────────────
export interface BadgeData {
  name: string;
  description: string | null;
  icon_url: string | null;
  color: string | null;
  earned_at: string;
  earned_automatically: boolean;
}

export const useBusinessBadges = (businessId: string | null) => {
  return useQuery({
    queryKey: ["business-badges", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_earned_badges")
        .select(`
          earned_at,
          earned_automatically,
          business_badges!inner(name, description, icon_url, color, is_active)
        `)
        .eq("business_id", businessId!)
        .eq("business_badges.is_active", true)
        .order("earned_at", { ascending: false });

      if (error) throw error;

      return ((data as any[]) ?? []).map((b) => ({
        name: b.business_badges?.name,
        description: b.business_badges?.description,
        icon_url: b.business_badges?.icon_url,
        color: b.business_badges?.color,
        earned_at: b.earned_at,
        earned_automatically: b.earned_automatically,
      })) as BadgeData[];
    },
    enabled: !!businessId,
    staleTime: 10 * 60 * 1000,
  });
};

// ─── Histórico Mensal ─────────────────────────────────────────────────────────
export interface MonthlyHistoryItem {
  mes: string;
  visualizacoes: number;
  cliques: number;
  ctr_percent: number | null;
}

export const useBusinessMonthlyHistory = (businessId: string | null) => {
  return useQuery({
    queryKey: ["business-monthly-history", businessId],
    queryFn: async () => {
      const since = new Date();
      since.setMonth(since.getMonth() - 12);

      const { data, error } = await supabase
        .from("business_analytics_events")
        .select("event_type, created_at")
        .eq("business_id", businessId!)
        .gte("created_at", since.toISOString());

      if (error) throw error;

      // Agrupar por mês no cliente
      const monthMap: Record<string, { views: number; clicks: number }> = {};
      (data ?? []).forEach((row) => {
        const mes = row.created_at.slice(0, 7); // "2026-02"
        if (!monthMap[mes]) monthMap[mes] = { views: 0, clicks: 0 };
        if (row.event_type === "view") monthMap[mes].views++;
        if (["click_whatsapp", "click_phone", "click_email", "click_website"].includes(row.event_type)) {
          monthMap[mes].clicks++;
        }
      });

      return Object.entries(monthMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([mes, v]) => ({
          mes,
          visualizacoes: v.views,
          cliques: v.clicks,
          ctr_percent: v.views > 0 ? Math.round((v.clicks / v.views) * 100 * 10) / 10 : null,
        })) as MonthlyHistoryItem[];
    },
    enabled: !!businessId,
    staleTime: 10 * 60 * 1000,
  });
};

// ─── Benchmarking ─────────────────────────────────────────────────────────────
export interface BenchmarkingData {
  posicao_geral: number;
  posicao_cidade: number;
  views_this_month: number;
  media_views_categoria: number;
  media_leads_categoria: number;
  media_ctr_categoria: number;
  total_negocios_categoria: number;
}

export const useBusinessBenchmarkingPro = (businessId: string | null) => {
  return useQuery({
    queryKey: ["business-benchmarking-pro", businessId],
    queryFn: async () => {
      // Buscar category_id do negócio
      const { data: biz, error: bizError } = await supabase
        .from("businesses")
        .select("category_id, city")
        .eq("id", businessId!)
        .single();
      if (bizError) throw bizError;

      // Buscar métricas de todos os negócios da mesma categoria
      const { data: metrics, error: metricsError } = await supabase
        .from("business_analytics_metrics")
        .select("business_id, views_this_month, leads_this_month, conversion_rate_this_month")
        .order("views_this_month", { ascending: false });
      if (metricsError) throw metricsError;

      const { data: businesses, error: bizListError } = await supabase
        .from("businesses")
        .select("id, city")
        .eq("category_id", biz.category_id!)
        .eq("is_active", true);
      if (bizListError) throw bizListError;

      const categoryIds = new Set(businesses.map((b) => b.id));
      const categoryMetrics = (metrics ?? []).filter((m) => categoryIds.has(m.business_id));

      // Ranking geral na categoria
      const sortedGeral = [...categoryMetrics].sort((a, b) => (b.views_this_month ?? 0) - (a.views_this_month ?? 0));
      const posicao_geral = sortedGeral.findIndex((m) => m.business_id === businessId) + 1;

      // Ranking na cidade
      const cityIds = new Set(businesses.filter((b) => b.city === biz.city).map((b) => b.id));
      const cityMetrics = categoryMetrics.filter((m) => cityIds.has(m.business_id));
      const sortedCity = [...cityMetrics].sort((a, b) => (b.views_this_month ?? 0) - (a.views_this_month ?? 0));
      const posicao_cidade = sortedCity.findIndex((m) => m.business_id === businessId) + 1;

      // Médias
      const total = categoryMetrics.length;
      const media_views = total > 0 ? Math.round(categoryMetrics.reduce((s, m) => s + (m.views_this_month ?? 0), 0) / total) : 0;
      const media_leads = total > 0 ? Math.round(categoryMetrics.reduce((s, m) => s + (m.leads_this_month ?? 0), 0) / total) : 0;
      const media_ctr = total > 0 ? Math.round((categoryMetrics.reduce((s, m) => s + (m.conversion_rate_this_month ?? 0), 0) / total) * 10) / 10 : 0;

      const myMetrics = categoryMetrics.find((m) => m.business_id === businessId);

      return {
        posicao_geral: posicao_geral || 0,
        posicao_cidade: posicao_cidade || 0,
        views_this_month: myMetrics?.views_this_month ?? 0,
        media_views_categoria: media_views,
        media_leads_categoria: media_leads,
        media_ctr_categoria: media_ctr,
        total_negocios_categoria: total,
      } as BenchmarkingData;
    },
    enabled: !!businessId,
    staleTime: 10 * 60 * 1000,
  });
};
