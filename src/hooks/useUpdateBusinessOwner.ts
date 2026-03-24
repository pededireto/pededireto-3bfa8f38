// Hook especializado para o owner atualizar o seu negócio
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface OwnerBusinessUpdate {
  id: string;
  name: string;
  description?: string | null;
  logo_url?: string | null;
  category_id?: string | null;
  subcategory_id?: string | null;
  city?: string | null;
  zone?: string | null;
  alcance?: "local" | "nacional" | "hibrido";
  public_address?: string | null;
  cta_phone?: string | null;
  cta_email?: string | null;
  cta_website?: string | null;
  schedule_weekdays?: string | null;
  schedule_weekend?: string | null;
  schedule_closed?: string | null;
  // PRO
  cta_whatsapp?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  other_social_url?: string | null;
  cta_booking_url?: string | null;
  cta_order_url?: string | null;
  images?: string[] | null;
  // Visibilidade
  show_whatsapp?: boolean;
  show_schedule?: boolean;
  show_social?: boolean;
  show_gallery?: boolean;
  // Dados Legais
  nif?: string | null;
  address?: string | null;
  owner_name?: string | null;
  owner_phone?: string | null;
  owner_email?: string | null;
  // Admin
  is_active?: boolean;
}

export const useUpdateBusinessOwner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: OwnerBusinessUpdate) => {
      const { data, error } = await supabase.from("businesses").update(updates).eq("id", id).select().maybeSingle(); // .single() lançava PGRST116 quando RLS bloqueava ou não retornava rows

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      queryClient.invalidateQueries({ queryKey: ["business"] });
      queryClient.invalidateQueries({ queryKey: ["business-by-user"] });
    },
    onError: (error: any) => {
      console.error("[useUpdateBusinessOwner] error:", error);
    },
  });
};
