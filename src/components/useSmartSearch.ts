import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ── Mapa de serviços complementares ─────────────────────────────────────────
const COMPLEMENTARY_SERVICES: Record<string, string[]> = {
  canalizador:          ["pedreiro", "materiais de construção", "impermeabilização"],
  eletricista:          ["obras remodelação", "ar condicionado"],
  serralheiro:          ["eletricista", "vidraceiro"],
  pedreiro:             ["canalizador", "eletricista", "pintor", "materiais de construção"],
  pintor:               ["pedreiro", "limpeza pós-obra"],
  telhado:              ["impermeabilização", "pedreiro"],
  impermeabilização:    ["pedreiro", "pintor"],
  caldeira:             ["eletricista", "energia solar"],
  mecânico:             ["reboque", "pneus"],
  mudanças:             ["limpeza", "montagem"],
  casamento:            ["fotógrafo", "catering", "decoração", "DJ"],
  dentista:             ["médico", "farmácia"],
  fisioterapia:         ["médico", "psicólogo"],
  nutricionista:        ["personal trainer", "médico"],
  explicador:           ["centro de estudos"],
  advogado:             ["contabilista"],
  contabilista:         ["advogado"],
  remodelação:          ["pedreiro", "eletricista", "canalizador", "pintor"],
  desinfestação:        ["limpeza profunda"],
  jardinagem:           ["limpeza"],
};

// ── Termos de urgência ───────────────────────────────────────────────────────
const URGENCY_TERMS = new Set([
  "cano rebentado", "rebentou um cano", "fuga de água", "fuga de agua",
  "cozinha inundada", "casa de banho inundada", "sem luz", "sem eletricidade",
  "sem electricidade", "curto circuito", "curto-circuito", "tomada a faiscar",
  "caldeira avariada", "sem aquecimento", "aquecimento avariado",
  "fiquei fechado fora", "perdi a chave", "porta arrombada",
  "telhado a pingar", "goteira", "carro avariado", "carro nao arranca",
  "pneu furado", "bateria descarregada", "sanita entupida",
  "baratas em casa", "ratos em casa",
]);

export interface SmartBusiness {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  category_name: string | null;
  category_slug: string | null;
  subscription_plan: string | null;
  is_premium: boolean | null;
  logo_url: string | null;
}

export interface SmartSearchResult {
  isSmartMatch: boolean;
  isUrgent: boolean;
  searchedTerm: string;
  resolvedTerm: string;
  businesses: SmartBusiness[];
  complementaryServices: string[];
  totalFound: number;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export const useSmartSearch = (term: string, userCity?: string | null) => {
  const normalizedTerm = normalize(term.trim());

  return useQuery({
    queryKey: ["smart-search", normalizedTerm, userCity],
    queryFn: async (): Promise<SmartSearchResult | null> => {
      if (!normalizedTerm || normalizedTerm.length < 3) return null;

      // ── 1. Buscar sinónimos ──────────────────────────────────────────────
      const { data: synonyms, error: synError } = await supabase
        .from("search_synonyms")
        .select("termo, equivalente");

      if (synError || !synonyms || synonyms.length === 0) return null;

      // ── 2. Encontrar match (exact → partial → keyword) ───────────────────
      let resolvedTerm: string | null = null;

      // 2a. Match exato
      const exactMatch = synonyms.find(
        (s) => normalize(s.termo) === normalizedTerm
      );
      if (exactMatch) resolvedTerm = exactMatch.equivalente;

      // 2b. Match parcial
      if (!resolvedTerm) {
        const partialMatch = synonyms.find(
          (s) =>
            normalizedTerm.includes(normalize(s.termo)) ||
            normalize(s.termo).includes(normalizedTerm)
        );
        if (partialMatch) resolvedTerm = partialMatch.equivalente;
      }

      // 2c. Match por palavra individual
      if (!resolvedTerm) {
        const words = normalizedTerm.split(/\s+/).filter((w) => w.length > 3);
        for (const word of words) {
          const wordMatch = synonyms.find(
            (s) =>
              normalize(s.termo).includes(word) ||
              normalize(s.equivalente) === word
          );
          if (wordMatch) {
            resolvedTerm = wordMatch.equivalente;
            break;
          }
        }
      }

      if (!resolvedTerm) return null;

      // ── 3. Buscar negócios com o termo resolvido ─────────────────────────
      let bizQuery = supabase
        .from("businesses")
        .select("id, name, slug, city, logo_url, subscription_plan, is_premium, categories(name, slug)")
        .eq("is_active", true)
        .or(`name.ilike.%${resolvedTerm}%,description.ilike.%${resolvedTerm}%`)
        .order("is_premium", { ascending: false })
        .limit(20);

      if (userCity) {
        bizQuery = bizQuery.ilike("city", `%${userCity}%`);
      }

      let { data: businesses } = await bizQuery;

      // Fallback: buscar por categoria se não encontrou por nome/descrição
      if (!businesses || businesses.length === 0) {
        const { data: catBiz } = await supabase
          .from("businesses")
          .select("id, name, slug, city, logo_url, subscription_plan, is_premium, categories(name, slug)")
          .eq("is_active", true)
          .ilike("categories.name", `%${resolvedTerm}%`)
          .order("is_premium", { ascending: false })
          .limit(20);
        businesses = catBiz || [];
      }

      // ── 4. Formatar ──────────────────────────────────────────────────────
      const formattedBusinesses: SmartBusiness[] = (businesses || []).map((b: any) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        city: b.city,
        logo_url: b.logo_url,
        subscription_plan: b.subscription_plan,
        is_premium: b.is_premium,
        category_name: b.categories?.name ?? null,
        category_slug: b.categories?.slug ?? null,
      }));

      // ── 5. Complementares ────────────────────────────────────────────────
      const normResolved = normalize(resolvedTerm);
      const complementary =
        COMPLEMENTARY_SERVICES[normResolved] ||
        COMPLEMENTARY_SERVICES[
          Object.keys(COMPLEMENTARY_SERVICES).find((k) => normalize(k) === normResolved) ?? ""
        ] ||
        [];

      // ── 6. Urgência ──────────────────────────────────────────────────────
      const isUrgent = URGENCY_TERMS.has(normalizedTerm);

      return {
        isSmartMatch: true,
        isUrgent,
        searchedTerm: term.trim(),
        resolvedTerm,
        businesses: formattedBusinesses,
        complementaryServices: complementary,
        totalFound: formattedBusinesses.length,
      };
    },
    enabled: normalizedTerm.length >= 3,
    staleTime: 30000,
  });
};
