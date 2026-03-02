import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ── Interfaces ───────────────────────────────────────────────────────────────

export interface SmartBusiness {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  category_name: string | null;
  category_slug: string | null;
  subcategory_name: string | null;
  subscription_plan: string | null;
  is_premium: boolean | null;
  logo_url: string | null;
}

export interface SmartSearchResult {
  isSmartMatch: boolean;
  isUrgent: boolean;
  searchedTerm: string;
  resolvedTerm: string;
  intentType: string | null;
  urgencyLevel: number;
  businesses: SmartBusiness[];
  complementaryServices: string[];
  primarySolution: string | null;
  totalFound: number;
  zeroResults: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

const URGENCY_WORDS = [
  "urgente",
  "urgência",
  "emergência",
  "rebentou",
  "partiu",
  "fuga",
  "avaria",
  "socorro",
  "agora",
  "imediato",
  "sem luz",
  "sem água",
  "inundada",
  "entupida",
];

// ── Logging (never break UX) ─────────────────────────────────────────────────

async function logSearch(
  term: string,
  resultsCount: number,
  userId?: string,
  intentType?: string | null,
  isUrgent?: boolean,
  cityDetected?: string | null,
) {
  try {
    await supabase.from("search_logs").insert({
      search_term: term,
      search_type: "smart",
      results_count: resultsCount,
    });
  } catch {
    /* silent */
  }

  if (userId) {
    try {
      await supabase.from("search_logs_intelligent").insert({
        user_id: userId,
        raw_query: term,
        detected_intent: intentType ?? null,
        urgency_detected: isUrgent ?? false,
        location_detected: cityDetected ?? null,
      } as any);
    } catch {
      /* silent */
    }
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export const useSmartSearch = (term: string, userCity?: string | null) => {
  const { user } = useAuth();
  const normalizedTerm = normalize(term.trim());

  return useQuery({
    queryKey: ["smart-search", normalizedTerm, userCity],
    queryFn: async (): Promise<SmartSearchResult | null> => {
      if (!normalizedTerm || normalizedTerm.length < 2) return null;

      const query = normalizedTerm;
      let isSmartMatch = false;
      let intentType: string | null = null;
      let urgencyLevel = 0;
      let resolvedTerm = normalizedTerm;
      let primarySolution: string | null = null;
      let complementaryServices: string[] = [];
      let businesses: SmartBusiness[] = [];

      // ── CAMADA 1: Pattern Detection (Problema → Solução) ─────────────
      const { data: patternKeywords } = await supabase.from("pattern_keywords").select("keyword, weight, pattern_id");
      const { data: activePatterns } = await supabase
        .from("search_patterns")
        .select("id, intent_type, urgency_level")
        .eq("is_active", true);
      const activePatternIds = new Set(activePatterns?.map((p) => p.id) ?? []);
      const patternMap = new Map(activePatterns?.map((p) => [p.id, p]) ?? []);

      // Score each pattern by keyword match (com stemming básico)
      const patternScores: Record<string, number> = {};
      patternKeywords?.forEach((pk) => {
        if (!pk.pattern_id || !activePatternIds.has(pk.pattern_id)) return;
        const keywordLower = normalize(pk.keyword);
        const keywordRoot = keywordLower.slice(0, Math.max(4, keywordLower.length - 2));
        if (query.includes(keywordLower) || query.includes(keywordRoot)) {
          patternScores[pk.pattern_id] = (patternScores[pk.pattern_id] || 0) + (pk.weight ?? 1);
        }
      });

      const bestPatternEntry = Object.entries(patternScores).sort(([, a], [, b]) => b - a)[0];
      let bestPatternId: string | null = bestPatternEntry?.[0] ?? null;

      if (bestPatternId && bestPatternEntry[1] > 0) {
        const bestPattern = patternMap.get(bestPatternId);
        intentType = bestPattern?.intent_type ?? null;
        urgencyLevel = bestPattern?.urgency_level ?? 0;
        isSmartMatch = true;

        const { data: solutions } = await supabase
          .from("pattern_categories")
          .select(
            `
            priority, reasoning,
            categories(id, name, slug),
            subcategories(id, name, slug)
          `,
          )
          .eq("pattern_id", bestPatternId)
          .order("priority");

        if (solutions && solutions.length > 0) {
          primarySolution = (solutions[0].subcategories as any)?.name ?? (solutions[0].categories as any)?.name ?? null;
          resolvedTerm = primarySolution ?? normalizedTerm;

          complementaryServices = solutions
            .filter((s) => (s.priority ?? 0) > 1)
            .map((s) => (s.subcategories as any)?.name ?? (s.categories as any)?.name ?? "")
            .filter(Boolean);

          // Iterar soluções por prioridade até encontrar negócios
          for (const solution of solutions) {
            const subId = (solution.subcategories as any)?.id;
            const catId = (solution.categories as any)?.id;

            if (subId) {
              const { data: biz } = await supabase
                .from("businesses")
                .select(
                  "id, name, slug, city, logo_url, subscription_plan, is_premium, subcategory_id, categories(name, slug), subcategories(name, slug)",
                )
                .eq("is_active", true)
                .eq("subcategory_id", subId)
                .order("is_premium", { ascending: false })
                .limit(30);

              if (biz && biz.length > 0) {
                businesses = biz.map(formatBusiness);
                primarySolution = (solution.subcategories as any)?.name ?? primarySolution;
                resolvedTerm = primarySolution ?? normalizedTerm;
                break;
              }
            }

            if (businesses.length === 0 && catId) {
              const { data: biz } = await supabase
                .from("businesses")
                .select(
                  "id, name, slug, city, logo_url, subscription_plan, is_premium, category_id, categories(name, slug), subcategories(name, slug)",
                )
                .eq("is_active", true)
                .eq("category_id", catId)
                .order("is_premium", { ascending: false })
                .limit(30);

              if (biz && biz.length > 0) {
                businesses = biz.map(formatBusiness);
                primarySolution = (solution.categories as any)?.name ?? primarySolution;
                resolvedTerm = primarySolution ?? normalizedTerm;
                break;
              }
            }
          }
        }
      }

      // ── CAMADA 2: Sinónimos (se CAMADA 1 não encontrou) ──────────────

      if (!isSmartMatch) {
        const { data: exactMatch } = await supabase
          .from("search_synonyms")
          .select("equivalente")
          .ilike("termo", query)
          .maybeSingle();

        let synonymTerm: string | null = exactMatch?.equivalente ?? null;

        if (!synonymTerm) {
          const stopWords = new Set([
            "fazer",
            "quero",
            "tenho",
            "preciso",
            "minha",
            "meu",
            "meus",
            "minhas",
            "uma",
            "para",
            "com",
            "que",
            "como",
            "onde",
            "quando",
            "qual",
            "quais",
            "esta",
            "este",
            "essa",
            "esse",
            "isso",
            "aqui",
            "ali",
            "mais",
            "muito",
            "pouco",
            "agora",
            "hoje",
            "urgente",
            "preciso",
            "ajuda",
            "queria",
            "gostava",
          ]);

          const words = query
            .split(/\s+/)
            .filter((w) => w.length >= 5)
            .filter((w) => !stopWords.has(w.toLowerCase()));

          for (const word of words) {
            const { data: partialMatch } = await supabase
              .from("search_synonyms")
              .select("equivalente")
              .ilike("termo", `%${word}%`)
              .limit(1)
              .maybeSingle();
            if (partialMatch) {
              synonymTerm = partialMatch.equivalente;
              break;
            }
          }
        }

        if (synonymTerm) {
          isSmartMatch = true;
          resolvedTerm = synonymTerm;
          primarySolution = synonymTerm;
        }
      }

      // ── CAMADA 3: Buscar Negócios (se ainda sem resultados) ──────────

      if (businesses.length === 0) {
        // Try by category name
        const { data: byCat } = await supabase
          .from("businesses")
          .select(
            "id, name, slug, city, logo_url, subscription_plan, is_premium, categories(name, slug), subcategories(name, slug)",
          )
          .eq("is_active", true)
          .ilike("categories.name", `%${resolvedTerm}%`)
          .order("is_premium", { ascending: false })
          .limit(30);

        const filtered = (byCat ?? []).filter((b: any) => b.categories);
        if (filtered.length > 0) {
          businesses = filtered.map(formatBusiness);
        }
      }

      if (businesses.length === 0) {
        // Try by subcategory name
        const { data: bySub } = await supabase
          .from("businesses")
          .select(
            "id, name, slug, city, logo_url, subscription_plan, is_premium, categories(name, slug), subcategories(name, slug)",
          )
          .eq("is_active", true)
          .ilike("subcategories.name", `%${resolvedTerm}%`)
          .order("is_premium", { ascending: false })
          .limit(30);

        const filtered = (bySub ?? []).filter((b: any) => b.subcategories);
        if (filtered.length > 0) {
          businesses = filtered.map(formatBusiness);
        }
      }

      if (businesses.length === 0) {
        // Fallback: by name/description
        const { data: byText } = await supabase
          .from("businesses")
          .select(
            "id, name, slug, city, logo_url, subscription_plan, is_premium, categories(name, slug), subcategories(name, slug)",
          )
          .eq("is_active", true)
          .or(`name.ilike.%${resolvedTerm}%,description.ilike.%${resolvedTerm}%`)
          .order("is_premium", { ascending: false })
          .limit(30);

        businesses = (byText ?? []).map(formatBusiness);
      }

      // ── Filtro soft de cidade ────────────────────────────────────────

      if (userCity && businesses.length > 0) {
        const cityFiltered = businesses.filter((b) => b.city?.toLowerCase().includes(userCity.toLowerCase()));
        if (cityFiltered.length > 0) businesses = cityFiltered;
      }

      // ── CAMADA 4: Detecção de Urgência ───────────────────────────────

      const isUrgent = urgencyLevel >= 4 || URGENCY_WORDS.some((w) => query.includes(normalize(w)));

      // ── Log assíncrono ───────────────────────────────────────────────

      logSearch(term.trim(), businesses.length, user?.id, intentType, isUrgent, userCity);

      return {
        isSmartMatch,
        isUrgent,
        searchedTerm: term.trim(),
        resolvedTerm,
        intentType,
        urgencyLevel,
        businesses,
        complementaryServices,
        primarySolution,
        totalFound: businesses.length,
        zeroResults: businesses.length === 0,
      };
    },
    enabled: normalizedTerm.length >= 2,
    staleTime: 30_000,
  });
};

// ── Formatter ────────────────────────────────────────────────────────────────

function formatBusiness(b: any): SmartBusiness {
  return {
    id: b.id,
    name: b.name,
    slug: b.slug,
    city: b.city,
    logo_url: b.logo_url,
    subscription_plan: b.subscription_plan,
    is_premium: b.is_premium,
    category_name: b.categories?.name ?? null,
    category_slug: b.categories?.slug ?? null,
    subcategory_name: b.subcategories?.name ?? null,
  };
}
