import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SubcategoryRelation {
  id: string;
  subcategory_id: string;
  related_subcategory_id: string;
  relation_type: string;
  priority: number;
  created_at: string;
  // Joined fields
  subcategory_name?: string;
  related_subcategory_name?: string;
  subcategory_slug?: string;
  related_subcategory_slug?: string;
  category_name?: string;
  related_category_name?: string;
}

export const useSubcategoryRelations = () => {
  return useQuery({
    queryKey: ["subcategory-relations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subcategory_relations" as any)
        .select(`
          id, subcategory_id, related_subcategory_id, relation_type, priority, created_at,
          subcategory:subcategory_id(name, slug, category_id, categories:category_id(name)),
          related:related_subcategory_id(name, slug, category_id, categories:category_id(name))
        `)
        .order("priority", { ascending: true });

      if (error) throw error;

      return (data as any[]).map((r: any) => ({
        id: r.id,
        subcategory_id: r.subcategory_id,
        related_subcategory_id: r.related_subcategory_id,
        relation_type: r.relation_type,
        priority: r.priority,
        created_at: r.created_at,
        subcategory_name: r.subcategory?.name ?? "",
        related_subcategory_name: r.related?.name ?? "",
        subcategory_slug: r.subcategory?.slug ?? "",
        related_subcategory_slug: r.related?.slug ?? "",
        category_name: r.subcategory?.categories?.name ?? "",
        related_category_name: r.related?.categories?.name ?? "",
      })) as SubcategoryRelation[];
    },
  });
};

export const useCreateSubcategoryRelation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rel: { subcategory_id: string; related_subcategory_id: string; relation_type: string; priority: number }) => {
      const { data, error } = await supabase
        .from("subcategory_relations" as any)
        .insert(rel as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subcategory-relations"] }),
  });
};

export const useDeleteSubcategoryRelation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subcategory_relations" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subcategory-relations"] }),
  });
};
