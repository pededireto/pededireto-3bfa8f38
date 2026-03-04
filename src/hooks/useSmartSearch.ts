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

export interface BusinessGroup {
  label: string;
  businesses: SmartBusiness[];
}

export interface SmartSearchResult {
  isSmartMatch: boolean;
  isUrgent: boolean;
  searchedTerm: string;
  resolvedTerms: string[]; // array em vez de string única
  resolvedTerm: string; // mantido para compatibilidade (primeiro termo)
  intentType: string | null;
  urgencyLevel: number;
  businesses: SmartBusiness[]; // mantido para compatibilidade (todos juntos)
  businessGroups: BusinessGroup[]; // NOVO: negócios por grupo
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

// ── Buscar negócios por equivalente (subcategoria ou categoria) ───────────────

async function fetchBusinessesByEquivalent(equivalent: string): Promise<SmartBusiness[]> {
  // 1. Tentar subcategoria
  const { data: subMatches } = await supabase
    .from("subcategories")
    .select("id")
    .or(`name.ilike.%${equivalent}%,slug.ilike.%${equivalent}%`);

  if (subMatches && subMatches.length > 0) {
    const subIds = subMatches.map((s) => s.id);
    // Junction table lookup for multi-subcategory support
    const { data: junctionData } = await supabase
      .from("business_subcategories")
      .select("business_id")
      .in("subcategory_id", subIds);
    const businessIds = (junctionData || []).map((j: any) => j.business_id);

    if (businessIds.length > 0) {
      const { data: biz } = await supabase
        .from("businesses")
        .select(
          "id, name, slug, city, logo_url, subscription_plan, is_premium, categories(name, slug), subcategories(name, slug)",
        )
        .eq("is_active", true)
        .in("id", businessIds)
        .order("is_premium", { ascending: false })
        .limit(30);
      if (biz && biz.length > 0) return biz.map(formatBusiness);
    }
  }

  // 2. Tentar categoria
  const { data: catMatches } = await supabase
    .from("categories")
    .select("id")
    .or(`name.ilike.%${equivalent}%,slug.ilike.%${equivalent}%`);

  if (catMatches && catMatches.length > 0) {
    const catIds = catMatches.map((c) => c.id);
    const { data: biz } = await supabase
      .from("businesses")
      .select(
        "id, name, slug, city, logo_url, subscription_plan, is_premium, categories(name, slug), subcategories(name, slug)",
      )
      .eq("is_active", true)
      .in("category_id", catIds)
      .order("is_premium", { ascending: false })
      .limit(30);
    if (biz && biz.length > 0) return biz.map(formatBusiness);
  }

  // 3. Fallback por nome/descrição
  const { data: byText } = await supabase
    .from("businesses")
    .select(
      "id, name, slug, city, logo_url, subscription_plan, is_premium, categories(name, slug), subcategories(name, slug)",
    )
    .eq("is_active", true)
    .or(`name.ilike.%${equivalent}%,description.ilike.%${equivalent}%`)
    .order("is_premium", { ascending: false })
    .limit(30);

  return (byText ?? []).map(formatBusiness);
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
      let resolvedTerms: string[] = [];
      let primarySolution: string | null = null;
      let complementaryServices: string[] = [];
      let businessGroups: BusinessGroup[] = [];

      // ── CAMADA 1: Pattern Detection (Problema → Solução) ─────────────
      const { data: patternKeywords } = await supabase.from("pattern_keywords").select("keyword, weight, pattern_id");
      const { data: activePatterns } = await supabase
        .from("search_patterns")
        .select("id, intent_type, urgency_level")
        .eq("is_active", true);
      const activePatternIds = new Set(activePatterns?.map((p) => p.id) ?? []);
      const patternMap = new Map(activePatterns?.map((p) => [p.id, p]) ?? []);

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
      const bestPatternId: string | null = bestPatternEntry?.[0] ?? null;

      if (bestPatternId && bestPatternEntry[1] >= 3) {
        const bestPattern = patternMap.get(bestPatternId);
        intentType = bestPattern?.intent_type ?? null;
        urgencyLevel = bestPattern?.urgency_level ?? 0;

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

          complementaryServices = solutions
            .filter((s) => (s.priority ?? 0) > 1)
            .map((s) => (s.subcategories as any)?.name ?? (s.categories as any)?.name ?? "")
            .filter(Boolean);

          for (const solution of solutions) {
            const subId = (solution.subcategories as any)?.id;
            const catId = (solution.categories as any)?.id;
            const label = (solution.subcategories as any)?.name ?? (solution.categories as any)?.name ?? "";

            if (subId) {
              // Junction table lookup for multi-subcategory support
              const { data: junctionData } = await supabase
                .from("business_subcategories")
                .select("business_id")
                .eq("subcategory_id", subId);
              const businessIds = (junctionData || []).map((j: any) => j.business_id);

              if (businessIds.length > 0) {
                const { data: biz } = await supabase
                  .from("businesses")
                  .select(
                    "id, name, slug, city, logo_url, subscription_plan, is_premium, categories(name, slug), subcategories(name, slug)",
                  )
                  .eq("is_active", true)
                  .in("id", businessIds)
                  .order("is_premium", { ascending: false })
                  .limit(30);

                if (biz && biz.length > 0) {
                  businessGroups.push({ label, businesses: biz.map(formatBusiness) });
                  resolvedTerms.push(label);
                  isSmartMatch = true;
                  break;
                }
              }
            }

            if (businessGroups.length === 0 && catId) {
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
                businessGroups.push({ label, businesses: biz.map(formatBusiness) });
                resolvedTerms.push(label);
                isSmartMatch = true;
                break;
              }
            }
          }
        }
      }

      // ── CAMADA 2: Sinónimos — todos os equivalentes para o termo ──────
      if (!isSmartMatch) {
        const strippedTerm = stripIntent(query);
        const keywords = extractKeywords(strippedTerm || query);

        // Guard: skip synonym lookup if stripped term is too short (avoids false positives)
        if (strippedTerm.length < 3 && keywords.length === 0) {
          // Skip synonym layer entirely
        } else {

        const keywordCombos: string[] = [];
        for (let len = keywords.length; len >= 1; len--) {
          keywordCombos.push(keywords.slice(0, len).join(" "));
        }

        const candidates = [query, strippedTerm, ...keywordCombos].filter(Boolean);

        const { data: allSynonyms } = await supabase.from("search_synonyms").select("termo, equivalente");

        // Recolher TODOS os equivalentes únicos para os candidatos
        const equivalentsFound = new Set<string>();

        if (allSynonyms) {
          for (const candidate of candidates) {
            if (!candidate || candidate.length < 2) continue;
            // Só match exato — parcial desativado para evitar falsos positivos
            const matches = allSynonyms.filter((s) => normalize(s.termo) === normalize(candidate));
            matches.forEach((m) => equivalentsFound.add(m.equivalente));
          }
        }

        if (equivalentsFound.size > 0) {
          isSmartMatch = true;
          resolvedTerms = Array.from(equivalentsFound);
          primarySolution = resolvedTerms[0];

          // Buscar negócios para cada equivalente em paralelo
          const groupResults = await Promise.all(
            resolvedTerms.map(async (equiv) => {
              const bizList = await fetchBusinessesByEquivalent(equiv);
              return { label: equiv, businesses: bizList };
            }),
          );

          // Só incluir grupos com negócios
          businessGroups = groupResults.filter((g) => g.businesses.length > 0);
        }
        } // end else (guard)
      }

      // ── CAMADA 3: Fallback direto se ainda sem resultados ─────────────
      if (businessGroups.length === 0) {
        const termToSearch = resolvedTerms[0] ?? normalizedTerm;

        const { data: subMatches } = await supabase
          .from("subcategories")
          .select("id")
          .or(`name.ilike.%${termToSearch}%,slug.ilike.%${termToSearch}%`);

        if (subMatches && subMatches.length > 0) {
          const subIds = subMatches.map((s) => s.id);
          // Junction table lookup for multi-subcategory support
          const { data: junctionData } = await supabase
            .from("business_subcategories")
            .select("business_id")
            .in("subcategory_id", subIds);
          const businessIds = (junctionData || []).map((j: any) => j.business_id);

          if (businessIds.length > 0) {
            const { data: bySub } = await supabase
              .from("businesses")
              .select(
                "id, name, slug, city, logo_url, subscription_plan, is_premium, categories(name, slug), subcategories(name, slug)",
              )
              .eq("is_active", true)
              .in("id", businessIds)
              .order("is_premium", { ascending: false })
              .limit(30);

            if (bySub && bySub.length > 0) {
              businessGroups = [{ label: termToSearch, businesses: bySub.map(formatBusiness) }];
            }
          }
        }

        if (businessGroups.length === 0) {
          const { data: catMatches } = await supabase
            .from("categories")
            .select("id")
            .or(`name.ilike.%${termToSearch}%,slug.ilike.%${termToSearch}%`);

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
              businessGroups = [{ label: termToSearch, businesses: byCat.map(formatBusiness) }];
            }
          }
        }

        if (businessGroups.length === 0) {
          const { data: byText } = await supabase
            .from("businesses")
            .select(
              "id, name, slug, city, logo_url, subscription_plan, is_premium, categories(name, slug), subcategories(name, slug)",
            )
            .eq("is_active", true)
            .or(`name.ilike.%${termToSearch}%,description.ilike.%${termToSearch}%`)
            .order("is_premium", { ascending: false })
            .limit(30);

          if (byText && byText.length > 0) {
            businessGroups = [{ label: termToSearch, businesses: byText.map(formatBusiness) }];
          }
        }
      }

      // ── Filtro soft de cidade em todos os grupos ──────────────────────
      if (userCity && businessGroups.length > 0) {
        businessGroups = businessGroups.map((group) => {
          const cityFiltered = group.businesses.filter((b) => b.city?.toLowerCase().includes(userCity.toLowerCase()));
          return {
            ...group,
            businesses: cityFiltered.length > 0 ? cityFiltered : group.businesses,
          };
        });
      }

      // ── CAMADA 4: Detecção de Urgência ────────────────────────────────
      const isUrgent = urgencyLevel >= 4 || URGENCY_WORDS.some((w) => query.includes(normalize(w)));

      // ── Compatibilidade: businesses = todos os grupos juntos ──────────
      const allBusinesses = businessGroups.flatMap((g) => g.businesses);
      const totalFound = allBusinesses.length;

      // ── Log ───────────────────────────────────────────────────────────
      logSearch(term.trim(), totalFound, user?.id, intentType, isUrgent, userCity);

      return {
        isSmartMatch,
        isUrgent,
        searchedTerm: term.trim(),
        resolvedTerms,
        resolvedTerm: resolvedTerms[0] ?? normalizedTerm, // compatibilidade
        intentType,
        urgencyLevel,
        businesses: allBusinesses, // compatibilidade
        businessGroups,
        complementaryServices,
        primarySolution,
        totalFound,
        zeroResults: totalFound === 0,
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
