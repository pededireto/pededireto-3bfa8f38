import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface BusinessApiKey {
  id: string;
  business_id: string;
  provider: "openai" | "google" | "ideogram";
  api_key_hint: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useBusinessApiKey = (businessId?: string) => {
  return useQuery({
    queryKey: ["business-api-key", businessId],
    queryFn: async () => {
      if (!businessId) return null;
      const { data, error } = await (supabase as any)
        .from("business_api_keys")
        .select("id, business_id, provider, api_key_hint, is_active, created_at, updated_at")
        .eq("business_id", businessId)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data as BusinessApiKey | null;
    },
    enabled: !!businessId,
  });
};

export const useSaveApiKey = () => {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      businessId,
      provider,
      apiKey,
    }: {
      businessId: string;
      provider: "openai" | "google" | "ideogram";
      apiKey: string;
    }) => {
      const hint = apiKey.slice(-4);

      const { data, error } = await (supabase as any)
        .from("business_api_keys")
        .upsert(
          {
            business_id: businessId,
            provider,
            api_key_encrypted: apiKey,
            api_key_hint: hint,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "business_id,provider" }
        )
        .select("id, business_id, provider, api_key_hint, is_active, created_at, updated_at")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["business-api-key", vars.businessId] });
      toast({ title: "Chave API guardada", description: "A tua chave foi verificada e guardada com sucesso." });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao guardar chave", description: err.message, variant: "destructive" });
    },
  });
};

export const useRemoveApiKey = () => {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, businessId }: { id: string; businessId: string }) => {
      const { error } = await (supabase as any)
        .from("business_api_keys")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return businessId;
    },
    onSuccess: (businessId) => {
      qc.invalidateQueries({ queryKey: ["business-api-key", businessId] });
      toast({ title: "Ligação removida", description: "A chave API foi apagada." });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });
};

export const useVerifyApiKey = () => {
  return useMutation({
    mutationFn: async ({
      provider,
      apiKey,
    }: {
      provider: "openai" | "google" | "ideogram";
      apiKey: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("verify-api-key", {
        body: { provider, api_key: apiKey },
      });
      if (error) throw error;
      if (data?.valid !== true) throw new Error(data?.error || "Chave inválida");
      return true;
    },
  });
};
