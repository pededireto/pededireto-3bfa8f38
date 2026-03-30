import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface CommercialChecklist {
  id: string;
  business_id: string;
  commercial_id: string;
  questions_checked: string[];
  objections_checked: string[];
  visit_result: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useChecklist = (businessId: string | undefined) => {
  return useQuery({
    queryKey: ["commercial-checklist", businessId],
    queryFn: async () => {
      if (!businessId) return null;
      const { data, error } = await supabase
        .from("commercial_checklist" as any)
        .select("*")
        .eq("business_id", businessId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as CommercialChecklist | null;
    },
    enabled: !!businessId,
  });
};

export const useUpsertChecklist = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      business_id: string;
      questions_checked?: string[];
      objections_checked?: string[];
      visit_result?: string | null;
      notes?: string | null;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data: existing } = await supabase
        .from("commercial_checklist" as any)
        .select("id")
        .eq("business_id", params.business_id)
        .eq("commercial_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("commercial_checklist" as any)
          .update({ ...params, updated_at: new Date().toISOString() })
          .eq("id", (existing as any).id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("commercial_checklist" as any)
          .insert({ ...params, commercial_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["commercial-checklist", v.business_id] });
    },
  });
};

// Sales script data
export const DIAGNOSIS_QUESTIONS = [
  "Há quanto tempo tens o negócio aberto?",
  "De onde vêm a maioria dos clientes novos?",
  "Usas alguma plataforma online?",
  "Estás satisfeito com o retorno actual?",
  "Se pudesses mudar uma coisa no marketing, o quê?",
];

export const OBJECTIONS: { label: string; response: string }[] = [
  {
    label: "Não tenho tempo",
    response: "Compreendo. O registo demora 2 minutos e nós tratamos de tudo. Depois de registado, o perfil trabalha por si 24/7 — recebe contactos sem ter de fazer nada.",
  },
  {
    label: "Já tenho clientes suficientes",
    response: "Óptimo! Mas e se pudesse escolher os melhores clientes? Na PedeDireto recebe contactos de pessoas que já estão a procurar exactamente o que oferece — clientes com intenção de compra.",
  },
  {
    label: "Já uso redes sociais e Google",
    response: "As redes sociais são óptimas para branding, mas a PedeDireto é diferente: aqui as pessoas vêm especificamente à procura de serviços como o seu. É um canal adicional, não substituto.",
  },
  {
    label: "9,90€ é caro para mim agora",
    response: "Entendo. Mas pense assim: se um único cliente novo pagar o seu serviço, o investimento já está recuperado. E pode começar gratuitamente para testar a plataforma.",
  },
  {
    label: "Não conheço a plataforma",
    response: "A PedeDireto está a crescer rapidamente em Portugal. Já temos milhares de negócios registados e utilizadores activos. Estamos a investir em SEO e marketing para trazer mais clientes para os nossos parceiros.",
  },
  {
    label: "Não tenho jeito para tecnologia",
    response: "Não precisa! Nós tratamos de tudo — criamos o seu perfil, adicionamos fotos e informações. Depois é só receber os contactos dos clientes por telefone ou WhatsApp.",
  },
  {
    label: "Já fui enganado por outras plataformas",
    response: "Compreendo a desconfiança. A PedeDireto é diferente: sem contratos de fidelização, cancela quando quiser, sem comissões sobre vendas. Paga um valor fixo e baixo, ou começa gratuitamente.",
  },
  {
    label: "Tenho de falar com o sócio/família",
    response: "Claro, faz sentido. Posso deixar-lhe uma proposta por email para partilhar? Assim tem toda a informação para discutir. Volto a contactar em 2 dias — quando dá mais jeito?",
  },
  {
    label: "Vou pensar e digo-te qualquer coisa",
    response: "Sem problema! Deixe-me mostrar-lhe o perfil de um negócio semelhante ao seu que já está na plataforma — para ver como fica. Posso contactá-lo na quinta-feira?",
  },
];

export const VISIT_RESULTS = [
  { value: "registo_gratuito", label: "Registo gratuito feito ✅", emoji: "✅" },
  { value: "plano_pago", label: "Plano pago fechado ✅", emoji: "💰" },
  { value: "followup_agendado", label: "Follow-up agendado 🔄", emoji: "🔄" },
  { value: "nao_interessado", label: "Não interessado ❌", emoji: "❌" },
  { value: "voltar_mais_tarde", label: "Voltar mais tarde ⏰", emoji: "⏰" },
];
