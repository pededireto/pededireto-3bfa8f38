import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatSupabaseError } from "@/utils/supabaseError";

interface Generation {
  id: string;
  user_id: string;
  type: "reel" | "image";
  title: string;
  subtitle: string | null;
  data: any;
  created_at: string;
}

export function useGenerations(limit?: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["generations", user?.id, limit],
    queryFn: async () => {
      let query = supabase
        .from("generations")
        .select("*")
        .order("created_at", { ascending: false });

      if (limit) query = query.limit(limit);

      const { data, error } = await query;
      if (error) throw error;
      return data as Generation[];
    },
    enabled: !!user,
  });
}

export function useSaveGeneration() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (gen: {
      type: "reel" | "image";
      title: string;
      subtitle?: string;
      data: any;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("generations")
        .insert({
          user_id: userData.user.id,
          type: gen.type,
          title: gen.title,
          subtitle: gen.subtitle || null,
          data: gen.data,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generations"] });
    },
    onError: (error: any) => {
      console.error("[useSaveGeneration] error:", error);
      toast({
        title: "Erro ao guardar geração",
        description: formatSupabaseError(error),
        variant: "destructive",
      });
    },
  });
}

export function useDeleteGeneration() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("generations")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generations"] });
      toast({ title: "Geração eliminada" });
    },
    onError: (error: any) => {
      console.error("[useDeleteGeneration] error:", error);
      toast({
        title: "Erro ao eliminar geração",
        description: formatSupabaseError(error),
        variant: "destructive",
      });
    },
  });
}
