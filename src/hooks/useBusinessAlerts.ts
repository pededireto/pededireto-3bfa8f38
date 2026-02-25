import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProactiveAlert {
  id: string;
  type: "drop" | "no_response" | "missing_info" | "competitor" | "trend_up" | "low_conversion";
  severity: "info" | "warning" | "success";
  title: string;
  message: string;
  action_label?: string;
  action_tab?: string;
  created_at: string;
}

const generateAlerts = (
  currentViews: number,
  previousViews: number,
  totalContacts: number,
  pendingRequests: number,
  conversionRate: number,
  hasCategory: boolean,
  hasWhatsapp: boolean,
  hasSchedule: boolean,
  hasDescription: boolean,
): ProactiveAlert[] => {
  const alerts: ProactiveAlert[] = [];
  const now = new Date().toISOString();

  // Queda de visualizações > 30%
  if (previousViews > 0 && currentViews < previousViews * 0.7) {
    const drop = Math.round(((previousViews - currentViews) / previousViews) * 100);
    alerts.push({
      id: "drop_views",
      type: "drop",
      severity: "warning",
      title: `Visualizações caíram ${drop}%`,
      message: `Nas últimas 2 semanas recebeste ${currentViews} visualizações vs ${previousViews} nas 2 semanas anteriores. Verifica se o perfil está completo.`,
      action_label: "Editar perfil",
      action_tab: "edit",
      created_at: now,
    });
  }

  // Subida de visualizações > 20%
  if (previousViews > 0 && currentViews > previousViews * 1.2) {
    const rise = Math.round(((currentViews - previousViews) / previousViews) * 100);
    alerts.push({
      id: "trend_up",
      type: "trend_up",
      severity: "success",
      title: `Visibilidade aumentou ${rise}% 🚀`,
      message: `O teu negócio está a ganhar tração. Mantém o perfil atualizado para continuar a crescer.`,
      created_at: now,
    });
  }

  // Pedidos sem resposta
  if (pendingRequests >= 3) {
    alerts.push({
      id: "no_response",
      type: "no_response",
      severity: "warning",
      title: `${pendingRequests} pedidos sem resposta`,
      message: "Empresas que respondem em menos de 1h têm 3x mais conversões. Responde agora.",
      action_label: "Ver pedidos",
      action_tab: "requests",
      created_at: now,
    });
  }

  // Taxa de conversão baixa (muitas views, poucos contactos)
  if (currentViews >= 20 && conversionRate < 10) {
    alerts.push({
      id: "low_conversion",
      type: "low_conversion",
      severity: "warning",
      title: "Taxa de conversão abaixo da média",
      message: `${conversionRate}% dos visitantes contactam-te. A média da plataforma é ~15%. Adiciona WhatsApp e horário para melhorar.`,
      action_label: "Editar perfil",
      action_tab: "edit",
      created_at: now,
    });
  }

  // Perfil incompleto — sem categoria
  if (!hasCategory) {
    alerts.push({
      id: "missing_category",
      type: "missing_info",
      severity: "warning",
      title: "Sem categoria definida",
      message: "O teu negócio não aparece nas pesquisas por categoria nem no benchmarking. Corrige já.",
      action_label: "Editar perfil",
      action_tab: "edit",
      created_at: now,
    });
  }

  // Sem WhatsApp
  if (!hasWhatsapp && currentViews > 10) {
    alerts.push({
      id: "missing_whatsapp",
      type: "missing_info",
      severity: "info",
      title: "WhatsApp não configurado",
      message: "Negócios com WhatsApp recebem 2x mais contactos. É o canal preferido em Portugal.",
      action_label: "Adicionar WhatsApp",
      action_tab: "edit",
      created_at: now,
    });
  }

  // Sem horário
  if (!hasSchedule) {
    alerts.push({
      id: "missing_schedule",
      type: "missing_info",
      severity: "info",
      title: "Horário não preenchido",
      message: "Mostrar o horário aumenta a confiança dos clientes e melhora o teu score de perfil.",
      action_label: "Adicionar horário",
      action_tab: "edit",
      created_at: now,
    });
  }

  // Descrição curta
  if (!hasDescription) {
    alerts.push({
      id: "missing_description",
      type: "missing_info",
      severity: "info",
      title: "Descrição do negócio em falta",
      message: "Uma boa descrição aumenta a confiança dos clientes e melhora o posicionamento nas pesquisas.",
      action_label: "Escrever descrição",
      action_tab: "edit",
      created_at: now,
    });
  }

  // Ordenar: warning primeiro, depois info, depois success
  const order = { warning: 0, info: 1, success: 2 };
  return alerts.sort((a, b) => order[a.severity] - order[b.severity]);
};

export const useBusinessAlerts = (
  businessId: string | null | undefined,
  business?: {
    category_id?: string | null;
    cta_whatsapp?: string | null;
    schedule_weekdays?: string | null;
    description?: string | null;
  },
) => {
  return useQuery({
    queryKey: ["business-alerts", businessId],
    queryFn: async (): Promise<ProactiveAlert[]> => {
      if (!businessId) return [];

      const now = new Date();
      const since14 = new Date(now);
      since14.setDate(now.getDate() - 14);
      const since28 = new Date(now);
      since28.setDate(now.getDate() - 28);

      // Eventos últimos 14 dias (período atual)
      const { data: currentEvents } = await (supabase as any)
        .from("analytics_events")
        .select("event_type")
        .eq("business_id", businessId)
        .gte("created_at", since14.toISOString());

      // Eventos 14-28 dias (período anterior)
      const { data: previousEvents } = await (supabase as any)
        .from("analytics_events")
        .select("event_type")
        .eq("business_id", businessId)
        .gte("created_at", since28.toISOString())
        .lt("created_at", since14.toISOString());

      // Pedidos pendentes — usando 'enviado' que é o valor correcto do enum
      const { count: pendingRequests } = await (supabase as any)
        .from("request_business_matches")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId)
        .eq("status", "enviado"); // ← corrigido de "pending" para "enviado"

      const current = (currentEvents || []) as Array<{ event_type: string }>;
      const previous = (previousEvents || []) as Array<{ event_type: string }>;

      const currentViews = current.filter((e) => e.event_type === "view").length;
      const previousViews = previous.filter((e) => e.event_type === "view").length;
      const currentContacts = current.filter((e) => e.event_type.startsWith("click_")).length;
      const conversionRate = currentViews > 0 ? Math.round((currentContacts / currentViews) * 100) : 0;

      return generateAlerts(
        currentViews,
        previousViews,
        currentContacts,
        pendingRequests || 0,
        conversionRate,
        !!business?.category_id,
        !!business?.cta_whatsapp,
        !!business?.schedule_weekdays,
        !!(business?.description && business.description.length > 50),
      );
    },
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
  });
};
