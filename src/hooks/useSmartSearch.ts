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

// ── Intent stripping — remove palavras de intenção antes do match de sinónimos
// "fazer um site de delivery" → "site de delivery" → keywords: ["site","delivery"]
// Ordenadas do mais longo para o mais curto para evitar matches parciais
const INTENT_PREFIXES = [
  "preciso de um",
  "preciso de uma",
  "preciso dum",
  "preciso duma",
  "queria um",
  "queria uma",
  "queria ter",
  "gostava de ter",
  "gostava de um",
  "gostava de uma",
  "necessito de um",
  "necessito de uma",
  "necessito de",
  "estou a precisar de",
  "estou a precisar dum",
  "onde posso encontrar",
  "onde encontro",
  "onde ha",
  "onde tem",
  "como encontro",
  "como arranjo",
  "como contratar",
  "ajuda com",
  "ajuda para",
  "ajuda a",
  "procuro um",
  "procuro uma",
  "procuro",
  "busco um",
  "busco uma",
  "busco",
  "quero um",
  "quero uma",
  "quero",
  "preciso de",
  "preciso",
  "fazer um",
  "fazer uma",
  "fazer",
  "criar um",
  "criar uma",
  "criar",
  "arranjar um",
  "arranjar uma",
  "arranjar",
  "contratar um",
  "contratar uma",
  "contratar",
  "encontrar um",
  "encontrar uma",
  "encontrar",
  "chamar um",
  "chamar uma",
  "chamar",
  "tenho de",
  "tenho que",
  "alguem que",
  "alguem para",
  "um bom",
  "uma boa",
  "o melhor",
  "a melhor",
  "algum",
  "alguma",
]
  .map(normalize)
  .sort((a, b) => b.length - a.length);

const STOP_WORDS_SYNONYMS = new Set([
  "de",
  "do",
  "da",
  "dos",
  "das",
  "em",
  "no",
  "na",
  "nos",
  "nas",
  "por",
  "para",
  "com",
  "sem",
  "um",
  "uma",
  "uns",
  "umas",
  "o",
  "a",
  "os",
  "as",
  "e",
  "ou",
  "que",
  "se",
  "ao",
  "aos",
  "isto",
  "isso",
  "meu",
  "minha",
  "meus",
  "minhas",
]);

function stripIntent(text: string): string {
  const norm = normalize(text);
  for (const prefix of INTENT_PREFIXES) {
    if (norm.startsWith(prefix + " ")) return norm.slice(prefix.length).trim();
    if (norm === prefix) return "";
  }
  return norm;
}

function extractKeywords(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS_SYNONYMS.has(w));
}

// ─────────────────────────────────────────────────────────────────────────────

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

      // ── CAMADA 2: Sinónimos (melhorado com intent stripping) ──────────

      if (!isSmartMatch) {
        // Gerar candidatos por ordem de especificidade.
        // Exemplo: "fazer um site de delivery"
        //   strippedTerm  → "site de delivery"
        //   keywords      → ["site", "delivery"]
        //   combos        → ["site delivery", "site", "delivery"]
        //   candidatos    → [frase original, stripped, combos...]
        const strippedTerm = stripIntent(query);
        const keywords = extractKeywords(strippedTerm || query);

        const keywordCombos: string[] = [];
        for (let len = keywords.length; len >= 1; len--) {
          keywordCombos.push(keywords.slice(0, len).join(" "));
        }

        const candidates = [query, strippedTerm, ...keywordCombos].filter(Boolean);

        // Uma única query à BD em vez de N queries (mais eficiente)
        const { data: allSynonyms } = await supabase.from("search_synonyms").select("termo, equivalente");

        let synonymTerm: string | null = null;

        if (allSynonyms) {
          // PASSO 1: match exato em TODOS os candidatos primeiro
          for (const candidate of candidates) {
            if (!candidate || candidate.length < 2) continue;
            const exact = allSynonyms.find((s) => normalize(s.termo) === normalize(candidate));
            if (exact) {
              synonymTerm = exact.equivalente;
              break;
            }
          }

          // PASSO 2: match parcial só se não houve match exato
          // Mínimo 4 chars para evitar falsos positivos ("de", "ou", etc.)
          if (!synonymTerm) {
            for (const candidate of candidates) {
              if (!candidate || candidate.length < 4) continue;

              // Candidato contém o termo: "site de delivery" contém "fazer um site"
              const supersetMatch = allSynonyms.find(
                (s) => normalize(s.termo).length >= 4 && normalize(candidate).includes(normalize(s.termo)),
              );
              if (supersetMatch) {
                synonymTerm = supersetMatch.equivalente;
                break;
              }

              // Termo contém o candidato: "fazer um site" contém "site"
              const subsetMatch = allSynonyms.find(
                (s) => normalize(candidate).length >= 4 && normalize(s.termo).includes(normalize(candidate)),
              );
              if (subsetMatch) {
                synonymTerm = subsetMatch.equivalente;
                break;
              }
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
      // Estratégia: resolver o nome para IDs reais, depois filtrar por ID
      // (ilike em colunas de joins não funciona no Supabase)

      if (businesses.length === 0) {
        // 3a. Resolver subcategoria pelo nome/slug → buscar por subcategory_id
        const { data: subMatches } = await supabase
          .from("subcategories")
          .select("id")
          .or(`name.ilike.%${resolvedTerm}%,slug.ilike.%${resolvedTerm}%`);

        if (subMatches && subMatches.length > 0) {
          const subIds = subMatches.map((s) => s.id);
          const { data: bySub } = await supabase
            .from("businesses")
            .select(
              "id, name, slug, city, logo_url, subscription_plan, is_premium, categories(name, slug), subcategories(name, slug)",
            )
            .eq("is_active", true)
            .in("subcategory_id", subIds)
            .order("is_premium", { ascending: false })
            .limit(30);

          if (bySub && bySub.length > 0) {
            businesses = bySub.map(formatBusiness);
          }
        }
      }

      if (businesses.length === 0) {
        // 3b. Resolver categoria pelo nome/slug → buscar por category_id
        const { data: catMatches } = await supabase
          .from("categories")
          .select("id")
          .or(`name.ilike.%${resolvedTerm}%,slug.ilike.%${resolvedTerm}%`);

        if (catMatches && catMatches.length > 0) {
          const catIds = catMatches.map((c) => c.id);
          const { data: byCat } = await supabase
            .from("businesses")
            .select(
              "id, name, slug, city, logo_url, subscription_plan, is_premium, categories(name, slug), subcategories(name, slug)",
            )
            .eq("is_active", true)
            .in("category_id", catIds)
            .order("is_premium", { ascending: false })
            .limit(30);

          if (byCat && byCat.length > 0) {
            businesses = byCat.map(formatBusiness);
          }
        }
      }

      if (businesses.length === 0) {
        // 3c. Fallback: por nome/descrição do negócio
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
