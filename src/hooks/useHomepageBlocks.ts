import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HomepageBlock {
  id: string;
  type: string;
  title: string | null;
  config: Record<string, any> | null;
  is_active: boolean;
  order_index: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export const useHomepageBlocks = () => {
  return useQuery({
    queryKey: ["homepage-blocks", "active"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("homepage_blocks" as any)
        .select("*")
        .eq("is_active", true)
        .order("order_index", { ascending: true });

      if (error) throw error;

      return (data as unknown as HomepageBlock[]).filter((b) => {
        if (b.start_date && new Date(b.start_date) > new Date(now)) return false;
        if (b.end_date && new Date(b.end_date) < new Date(now)) return false;
        return true;
      });
    },
    staleTime: 30000,
  });
};

export const useAllHomepageBlocks = () => {
  return useQuery({
    queryKey: ["homepage-blocks", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_blocks" as any)
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as unknown as HomepageBlock[];
    },
  });
};

export const useCreateHomepageBlock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (block: Partial<HomepageBlock>) => {
      const { data, error } = await supabase
        .from("homepage_blocks" as any)
        .insert(block as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["homepage-blocks"] }),
    onError: (error: any) => {
      console.error("[useCreateHomepageBlock] error:", error);
    },
  });
};

export const useUpdateHomepageBlock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<HomepageBlock>) => {
      const { data, error } = await supabase
        .from("homepage_blocks" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["homepage-blocks"] }),
    onError: (error: any) => {
      console.error("[useUpdateHomepageBlock] error:", error);
    },
  });
};

export const useDeleteHomepageBlock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("homepage_blocks" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["homepage-blocks"] }),
    onError: (error: any) => {
      console.error("[useDeleteHomepageBlock] error:", error);
    },
  });
};
