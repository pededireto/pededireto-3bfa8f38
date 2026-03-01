import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ── Serviços complementares ──────────────────────────────────────────────────
const COMPLEMENTARY_SERVICES: Record<string, string[]> = {
  canalizador: ["pedreiro", "materiais de construção", "impermeabilização"],
  eletricista: ["obras remodelação", "ar condicionado"],
  serralheiro: ["eletricista", "vidraceiro"],
  pedreiro: ["canalizador", "eletricista", "pintor", "materiais de construção"],
  pintor: ["pedreiro", "limpeza pós-obra"],
  telhado: ["impermeabilização", "pedreiro"],
  impermeabilização: ["pedreiro", "pintor"],
  caldeira: ["eletricista", "energia solar"],
  mecânico: ["reboque", "pneus"],
  mudanças: ["limpeza", "montagem"],
  casamento: ["fotógrafo", "catering", "decoração", "DJ"],
  dentista: ["médico", "farmácia"],
  fisioterapia: ["médico", "psicólogo"],
  nutricionista: ["personal trainer", "médico"],
  explicador: ["centro de estudos"],
  advogado: ["contabilista"],
  contabilista: ["advogado"],
  remodelação: ["pedreiro", "eletricista", "canalizador", "pintor"],
  desinfestação: ["limpeza profunda"],
  jardinagem: ["limpeza"],
  farmácia: ["médico", "enfermagem"],
  "cuidados domiciliários": ["enfermagem", "médico", "fisioterapia"],
  "energia solar": ["eficiência energética", "eletricista"],
  tatuagens: ["estética"],
  "pet shop": ["veterinário", "jardinagem"],
};

// ── Termos de urgência ───────────────────────────────────────────────────────
const URGENCY_TERMS = new Set([
  "cano rebentado",
  "rebentou um cano",
  "fuga de água",
  "fuga de agua",
  "cozinha inundada",
  "casa de banho inundada",
  "sem luz",
  "sem eletricidade",
  "sem electricidade",
  "curto circuito",
  "curto-circuito",
  "tomada a faiscar",
  "caldeira avariada",
  "sem aquecimento",
  "aquecimento avariado",
  "fiquei fechado fora",
  "perdi a chave",
  "porta arrombada",
  "telhado a pingar",
  "goteira",
  "carro avariado",
  "carro nao arranca",
  "pneu furado",
  "bateria descarregada",
  "sanita entupida",
  "baratas em casa",
  "ratos em casa",
  "fuga de gás",
  "cheira a gás",
  "casa inundada",
  "tou tramado",
  "urgente",
  "emergência",
  "socorro",
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
  zeroResults: boolean;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// ── Log de pesquisa — usa colunas reais da tabela search_logs ────────────────
async function logSearch(term: string, resultsCount: number) {
  try {
    await supabase.from("search_logs").insert({
      search_term: term,
      search_type: "smart",
      results_count: resultsCount,
    });
  } catch {
    // Silently fail — logging nunca deve quebrar a pesquisa
  }
}

export const useSmartSearch = (term: string, userCity?: string | null) => {
  const normalizedTerm = normalize(term.trim());

  return useQuery({
    queryKey: ["smart-search", normalizedTerm, userCity],
    queryFn: async (): Promise<SmartSearchResult | null> => {
      if (!normalizedTerm || normalizedTerm.length < 2) return null;

      // ── 1. Exact match server-side ───────────────────────────────────────
      const { data: exactSynonyms } = await supabase
        .from("search_synonyms")
        .select("termo, equivalente")
        .ilike("termo", normalizedTerm)
        .limit(1);

      let resolvedTerm: string | null = exactSynonyms?.[0]?.equivalente ?? null;

      // ── 2. Partial match por palavras ────────────────────────────────────
      if (!resolvedTerm) {
        const words = normalizedTerm.split(/\s+/).filter((w) => w.length > 2);
        for (const word of words) {
          const { data: partialSynonyms } = await supabase
            .from("search_synonyms")
            .select("termo, equivalente")
            .ilike("termo", `%${word}%`)
            .limit(5);

          if (partialSynonyms && partialSynonyms.length > 0) {
            const best = partialSynonyms.sort((a, b) => b.termo.length - a.termo.length)[0];
            resolvedTerm = best.equivalente;
            break;
          }
        }
      }

      const searchTerm = resolvedTerm ?? normalizedTerm;

      // ── 3. Buscar negócios por categoria ─────────────────────────────────
      let businesses: any[] = [];

      const { data: byCategory } = await supabase
        .from("businesses")
        .select("id, name, slug, city, logo_url, subscription_plan, is_premium, categories(name, slug)")
        .eq("is_active", true)
        .ilike("categories.name", `%${searchTerm}%`)
        .order("is_premium", { ascending: false })
        .limit(20);

      if (byCategory && byCategory.length > 0) {
        businesses = byCategory.filter((b) => b.categories);
      }

      // ── 4. Fallback: por nome/descrição ──────────────────────────────────
      if (businesses.length === 0) {
        const { data: byText } = await supabase
          .from("businesses")
          .select("id, name, slug, city, logo_url, subscription_plan, is_premium, categories(name, slug)")
          .eq("is_active", true)
          .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
          .order("is_premium", { ascending: false })
          .limit(20);

        businesses = byText || [];
      }

      // ── 5. Filtro de cidade (soft — só aplica se houver resultados) ───────
      if (userCity && businesses.length > 0) {
        const cityFiltered = businesses.filter((b) => b.city?.toLowerCase().includes(userCity.toLowerCase()));
        if (cityFiltered.length > 0) businesses = cityFiltered;
      }

      // ── 6. Formatar ──────────────────────────────────────────────────────
      const formattedBusinesses: SmartBusiness[] = businesses.map((b: any) => ({
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

      // ── 7. Complementares ────────────────────────────────────────────────
      const normResolved = normalize(searchTerm);
      const complementary =
        COMPLEMENTARY_SERVICES[normResolved] ||
        COMPLEMENTARY_SERVICES[Object.keys(COMPLEMENTARY_SERVICES).find((k) => normalize(k) === normResolved) ?? ""] ||
        [];

      // ── 8. Urgência ──────────────────────────────────────────────────────
      const isUrgent =
        URGENCY_TERMS.has(normalizedTerm) ||
        normalizedTerm.includes("urgente") ||
        normalizedTerm.includes("emergencia");

      // ── 9. Log assíncrono usando colunas reais da search_logs ────────────
      logSearch(term.trim(), formattedBusinesses.length);

      return {
        isSmartMatch: !!resolvedTerm,
        isUrgent,
        searchedTerm: term.trim(),
        resolvedTerm: searchTerm,
        businesses: formattedBusinesses,
        complementaryServices: complementary,
        totalFound: formattedBusinesses.length,
        zeroResults: formattedBusinesses.length === 0,
      };
    },
    enabled: normalizedTerm.length >= 2,
    staleTime: 30_000,
  });
};
