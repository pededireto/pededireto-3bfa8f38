import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─────────────────────────────────────────────
// Tipos exportados (usados pelo SmartSearchBanner)
// ─────────────────────────────────────────────

export interface SmartBusiness {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  city: string | null;
  cta_whatsapp: string | null;
  cta_phone: string | null;
}

export interface SmartSearchResult {
  isSmartMatch: boolean;      // true se encontrou via sinónimos
  isUrgent: boolean;          // true para termos urgentes (fuga de gás, inundação...)
  searchedTerm: string;       // o que o utilizador escreveu
  resolvedTerm: string;       // o termo canónico encontrado (ex: "canalizador")
  businesses: SmartBusiness[];
  complementaryServices: string[];
  totalFound: number;
}

// ─────────────────────────────────────────────
// Mapa de sinónimos → termo canónico
// ─────────────────────────────────────────────

const SYNONYMS: Record<string, string> = {
  // Canalização
  "cano partido": "canalizador",
  "cano rebentado": "canalizador",
  "fuga de água": "canalizador",
  "torneira a pingar": "canalizador",
  "entupimento": "canalizador",
  "sanita entupida": "canalizador",
  "canalização": "canalizador",
  "água": "canalizador",
  "plumber": "canalizador",

  // Eletricidade
  "luz apagada": "eletricista",
  "curto-circuito": "eletricista",
  "quadro elétrico": "eletricista",
  "tomada partida": "eletricista",
  "electricista": "eletricista",
  "electricidade": "eletricista",
  "eletricidade": "eletricista",

  // Gás
  "fuga de gás": "técnico de gás",
  "cheiro a gás": "técnico de gás",
  "caldeira avariada": "técnico de gás",
  "aquecimento avariado": "técnico de gás",

  // Mudanças
  "mudança de casa": "empresa de mudanças",
  "transportar móveis": "empresa de mudanças",
  "mudanças": "empresa de mudanças",

  // Limpeza
  "limpeza de casa": "empresa de limpeza",
  "limpar apartamento": "empresa de limpeza",
  "faxina": "empresa de limpeza",
  "empregada doméstica": "empresa de limpeza",

  // Pintura
  "pintar casa": "pintor",
  "paredes a descascar": "pintor",
  "pintura": "pintor",

  // Carpintaria
  "móvel partido": "carpinteiro",
  "porta partida": "carpinteiro",
  "carpintaria": "carpinteiro",

  // Jardim
  "jardim": "jardineiro",
  "cortar relva": "jardineiro",
  "poda": "jardineiro",
  "árvore": "jardineiro",

  // Serralharia
  "fechadura partida": "serralheiro",
  "porta bloqueada": "serralheiro",
  "chave perdida": "serralheiro",
  "serralharia": "serralheiro",

  // Informática
  "computador avariado": "técnico informático",
  "pc lento": "técnico informático",
  "vírus": "técnico informático",
  "informática": "técnico informático",
};

// Termos considerados urgentes
const URGENT_TERMS = new Set([
  "fuga de gás",
  "cheiro a gás",
  "fuga de água",
  "inundação",
  "curto-circuito",
  "incêndio",
  "cano rebentado",
]);

// Serviços complementares por termo canónico
const COMPLEMENTARY: Record<string, string[]> = {
  "canalizador":          ["eletricista", "empresa de limpeza", "empresa de reparações"],
  "eletricista":          ["canalizador", "técnico de gás", "empresa de reparações"],
  "técnico de gás":       ["canalizador", "eletricista"],
  "empresa de mudanças":  ["empresa de limpeza", "carpinteiro", "pintor"],
  "empresa de limpeza":   ["empresa de mudanças", "pintor"],
  "pintor":               ["empresa de limpeza", "carpinteiro"],
  "carpinteiro":          ["pintor", "serralheiro"],
  "jardineiro":           ["empresa de limpeza"],
  "serralheiro":          ["carpinteiro"],
  "técnico informático":  [],
};

// ─────────────────────────────────────────────
// Resolver sinónimo
// ─────────────────────────────────────────────

function resolveSynonym(term: string): { resolvedTerm: string; isUrgent: boolean } | null {
  const normalized = term.toLowerCase().trim();

  // Verificar correspondência directa no mapa
  for (const [synonym, canonical] of Object.entries(SYNONYMS)) {
    if (normalized.includes(synonym) || synonym.includes(normalized)) {
      return {
        resolvedTerm: canonical,
        isUrgent: URGENT_TERMS.has(synonym),
      };
    }
  }

  return null;
}

// ─────────────────────────────────────────────
// Hook principal
// ─────────────────────────────────────────────

export const useSmartSearch = (query: string, city?: string | null) => {
  return useQuery({
    queryKey: ["smart-search", query, city],
    queryFn: async (): Promise<SmartSearchResult> => {
      const empty: SmartSearchResult = {
        isSmartMatch: false,
        isUrgent: false,
        searchedTerm: query,
        resolvedTerm: query,
        businesses: [],
        complementaryServices: [],
        totalFound: 0,
      };

      if (!query || query.trim().length < 2) return empty;

      const resolved = resolveSynonym(query);
      if (!resolved) return empty;

      const { resolvedTerm, isUrgent } = resolved;

      // Pesquisar negócios na view pública usando o termo canónico
      let q = supabase
        .from("businesses_public")
        .select("id, name, slug, logo_url, city, cta_whatsapp, cta_phone")
        .or(`name.ilike.%${resolvedTerm}%,description.ilike.%${resolvedTerm}%`)
        .order("is_featured", { ascending: false })
        .order("is_premium", { ascending: false })
        .limit(12);

      // Filtrar por cidade se disponível
      if (city) {
        q = q.or(`city.ilike.%${city}%,alcance.eq.nacional`);
      }

      const { data, error } = await q;
      if (error) throw error;

      const businesses: SmartBusiness[] = (data || []).map((b: any) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        logo_url: b.logo_url,
        city: b.city,
        cta_whatsapp: b.cta_whatsapp,
        cta_phone: b.cta_phone,
      }));

      return {
        isSmartMatch: true,
        isUrgent,
        searchedTerm: query,
        resolvedTerm,
        businesses,
        complementaryServices: COMPLEMENTARY[resolvedTerm] || [],
        totalFound: businesses.length,
      };
    },
    enabled: query.trim().length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};
