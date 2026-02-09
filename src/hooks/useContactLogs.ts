import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ContactLog {
  id: string;
  business_id: string;
  user_id: string;
  tipo_contacto: "telefone" | "email" | "whatsapp" | "outro";
  nota: string | null;
  created_at: string;
}

export const useContactLogs = (businessId: string | undefined) => {
  return useQuery({
    queryKey: ["contact-logs", businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const { data, error } = await supabase
        .from("business_contact_logs")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ContactLog[];
    },
    enabled: !!businessId,
  });
};

export const useCreateContactLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: { business_id: string; tipo_contacto: string; nota?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("business_contact_logs")
        .insert({
          business_id: log.business_id,
          user_id: user.id,
          tipo_contacto: log.tipo_contacto,
          nota: log.nota || null,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contact-logs", variables.business_id] });
    },
  });
};
