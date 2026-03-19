import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SectorBenchmarkData {
  ticket_medio: string;
  frequencia_cliente: string;
  canal_aquisicao_principal: string;
  factor_decisao_1: string;
  tendencia_2025: string;
  diferencial_competitivo: string;
  presenca_digital: {
    website: string;
    redes_sociais: string;
  };
  keywords_google: string[];
  benchmark_avaliacoes: string;
  dica_ouro: string;
}

interface BusinessProfile {
  website: string | null;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
}

interface SubcategoryInfo {
  category: string;
  subcategory: string;
}

export const useBusinessBenchmarkSector = (
  businessId: string | null | undefined,
  selectedSubcategory?: string
) => {
  const { data: bizInfo } = useQuery({
    queryKey: ["biz-sector-info", businessId],
    queryFn: async () => {
      // 1. Buscar dados base do negócio
      const { data: biz, error: bizErr } = await (supabase as any)
        .from("businesses")
        .select("cta_website, cta_whatsapp, instagram_url, facebook_url")
        .eq("id", businessId!)
        .single();

      if (bizErr) throw bizErr;

      // 2. Buscar TODAS as subcategorias de business_subcategories
      const { data: bizSubs, error: subsErr } = await (supabase as any)
        .from("business_subcategories")
        .select("subcategory_id")
        .eq("business_id", businessId!);

      if (subsErr) throw subsErr;
      if (!bizSubs || bizSubs.length === 0) {
        return {
          category: "",
          subcategory: "",
          allSubcategories: [] as SubcategoryInfo[],
          profile: {
            website: biz.cta_website,
            whatsapp: biz.cta_whatsapp,
            instagram: biz.instagram_url,
            facebook: biz.facebook_url,
          } as BusinessProfile,
        };
      }

      // 3. Para cada subcategoria, buscar nome e categoria
      const subcategoryIds = bizSubs.map((s: any) => s.subcategory_id);
      const { data: subs, error: subNamesErr } = await supabase
        .from("subcategories")
        .select("id, name, category_id")
        .in("id", subcategoryIds);

      if (subNamesErr) throw subNamesErr;

      // 4. Buscar nomes das categorias
      const categoryIds = [...new Set(subs?.map((s: any) => s.category_id) || [])];
      const { data: cats, error: catErr } = await supabase.from("categories").select("id, name").in("id", categoryIds);

      if (catErr) throw catErr;

      // 5. Montar lista de subcategorias com categoria
      const allSubcategories: SubcategoryInfo[] = (subs || []).map((sub: any) => {
        const cat = cats?.find((c: any) => c.id === sub.category_id);
        return {
          category: cat?.name || "",
          subcategory: sub.name || "",
        };
      });

      // 6. Verificar qual subcategoria tem cache disponível
      for (const item of allSubcategories) {
        if (!item.category || !item.subcategory) continue;
        const { data: cached } = await (supabase as any)
          .from("benchmarking_cache")
          .select("id")
          .eq("category", item.category)
          .eq("subcategory", item.subcategory)
          .gt("expires_at", new Date().toISOString())
          .maybeSingle();

        if (cached) {
          return {
            category: item.category,
            subcategory: item.subcategory,
            allSubcategories,
            profile: {
              website: biz.cta_website,
              whatsapp: biz.cta_whatsapp,
              instagram: biz.instagram_url,
              facebook: biz.facebook_url,
            } as BusinessProfile,
          };
        }
      }

      // 7. Nenhuma tem cache — usar a primeira subcategoria com dados válidos
      const first = allSubcategories.find(s => s.category.length > 0 && s.subcategory.length > 0);
      return {
        category: first?.category || "",
        subcategory: first?.subcategory || "",
        allSubcategories,
        profile: {
          website: biz.cta_website,
          whatsapp: biz.cta_whatsapp,
          instagram: biz.instagram_url,
          facebook: biz.facebook_url,
        } as BusinessProfile,
      };
    },
    enabled: !!businessId,
    staleTime: 10 * 60 * 1000,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["sector-benchmark", bizInfo?.category, bizInfo?.subcategory],
    queryFn: async () => {
      const { data: res, error: fnErr } = await supabase.functions.invoke("get-benchmarking", {
        body: {
          category: bizInfo!.category,
          subcategory: bizInfo!.subcategory,
          business_id: businessId,
        },
      });
      if (fnErr) {
        console.error("[useBusinessBenchmarkSector] Edge function error:", fnErr);
        return null;
      }
      if (res?.error) {
        console.warn("[useBusinessBenchmarkSector] API unavailable:", res.error);
        return null;
      }
      return res.data as SectorBenchmarkData;
    },
    enabled: !!(bizInfo?.category && bizInfo.category.length > 0 && bizInfo?.subcategory && bizInfo.subcategory.length > 0),
    staleTime: 30 * 60 * 1000,
    retry: false,
  });

  return {
    data,
    isLoading: isLoading || !bizInfo,
    error,
    profile: bizInfo?.profile,
    category: bizInfo?.category,
    subcategory: bizInfo?.subcategory,
    allSubcategories: bizInfo?.allSubcategories || [],
  };
};
