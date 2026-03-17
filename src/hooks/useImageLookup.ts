import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatSupabaseError } from "@/utils/supabaseError";

interface LookupParams {
  categoria: string;
  subcategoria?: string;
  estilo: string;
  proporcao: string;
  objectivo?: string;
  nome?: string;
  sector?: string;
  descricao?: string;
  personagens?: string;
  ambiente?: string;
  textoSobreposto?: string;
}

interface LookupResult {
  prompt_principal: string;
  variante_a: string;
  variante_b: string;
  titulo: string;
  instrucoes: string;
}

function replacePlaceholders(text: string | null, params: LookupParams): string {
  if (!text) return "";

  let result = text;
  result = result.replace(/\{\{nome\}\}/gi, params.nome || "the business");
  result = result.replace(/\{\{sector\}\}/gi, params.sector || "");
  result = result.replace(/\{\{descricao\}\}/gi, params.descricao || "");
  result = result.replace(/\{\{personagens\}\}/gi, params.personagens || "");
  result = result.replace(/\{\{ambiente\}\}/gi, params.ambiente || "");
  result = result.replace(/\{\{textoSobreposto\}\}/gi, params.textoSobreposto || "");

  return result;
}

function enrichPromptWithUserInputs(basePrompt: string, params: LookupParams): string {
  let enriched = basePrompt;

  if (params.descricao && params.descricao.trim()) {
    const lowerEnriched = enriched.toLowerCase();
    const lowerDesc = params.descricao.toLowerCase();

    if (!lowerEnriched.includes(lowerDesc)) {
      const firstCommaIndex = enriched.indexOf(",");
      if (firstCommaIndex > 0) {
        enriched = enriched.slice(0, firstCommaIndex) + `, ${params.descricao}` + enriched.slice(firstCommaIndex);
      } else {
        enriched = `${params.descricao}, ${enriched}`;
      }
    }
  }

  if (params.personagens && params.personagens.trim()) {
    const personPatterns = [
      /professional \w+/i,
      /\w+ worker/i,
      /\w+ specialist/i,
      /chef/i,
      /barista/i,
      /mechanic/i,
      /doctor/i,
    ];

    let replaced = false;
    for (const pattern of personPatterns) {
      if (pattern.test(enriched)) {
        enriched = enriched.replace(pattern, params.personagens);
        replaced = true;
        break;
      }
    }

    if (!replaced) {
      const lowerEnriched = enriched.toLowerCase();
      const lowerPers = params.personagens.toLowerCase();
      if (!lowerEnriched.includes(lowerPers)) {
        const firstComma = enriched.indexOf(",");
        if (firstComma > 0) {
          enriched = enriched.slice(0, firstComma + 1) + ` ${params.personagens},` + enriched.slice(firstComma + 1);
        }
      }
    }
  }

  if (params.ambiente && params.ambiente.trim()) {
    const lowerEnriched = enriched.toLowerCase();
    const lowerAmb = params.ambiente.toLowerCase();

    if (!lowerEnriched.includes(lowerAmb)) {
      enriched = enriched.replace(/(,?\s*9:16|1:1|16:9)/i, `, ${params.ambiente}, 9:16`);
    }
  }

  if (params.nome && params.nome.trim()) {
    const lowerEnriched = enriched.toLowerCase();
    const lowerNome = params.nome.toLowerCase();

    if (!lowerEnriched.includes(lowerNome)) {
      enriched = enriched.replace(/(Portuguese|Portugal|setting)/i, `${params.nome} $1`);
    }
  }

  enriched = enriched
    .replace(/,\s*,/g, ",")
    .replace(/\s{2,}/g, " ")
    .trim();

  return enriched;
}

function createVariantA(basePrompt: string): string {
  const angleModifiers = [
    "close-up shot of",
    "wide angle view showing",
    "overhead top-down perspective of",
    "detail shot focusing on",
    "eye-level composition of",
  ];

  const angle = angleModifiers[Math.floor(Math.random() * angleModifiers.length)];
  return `${angle} ${basePrompt}`;
}

function createVariantB(basePrompt: string): string {
  const lightingMoods = [
    "golden hour warm lighting, ",
    "soft diffused natural light, ",
    "dramatic side lighting with shadows, ",
    "bright professional studio lighting, ",
    "warm ambient candlelight atmosphere, ",
  ];

  const extraDetails = [
    "satisfied customer visible, ",
    "transformation result highlighted, ",
    "happy client smiling, ",
    "professional atmosphere evident, ",
    "inviting welcoming mood, ",
  ];

  const lighting = lightingMoods[Math.floor(Math.random() * lightingMoods.length)];
  const detail = extraDetails[Math.floor(Math.random() * extraDetails.length)];

  return basePrompt.replace(/(9:16|1:1|16:9)/i, `${lighting}${detail}$1`);
}

export function useImageLookup() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const lookupPrompt = async (params: LookupParams): Promise<LookupResult | null> => {
    setIsLoading(true);
    try {
      const { categoria, subcategoria, estilo, proporcao } = params;

      const filters: Array<Record<string, string>> = [
        { categoria, subcategoria: subcategoria || "", estilo, proporcao },
        { categoria, subcategoria: subcategoria || "", estilo },
        { categoria, estilo, proporcao },
        { categoria, estilo },
        { categoria },
        {},
      ];

      let row: any = null;

      for (const filter of filters) {
        let query = (supabase as any).from("image_prompts_library").select("*").eq("is_active", true);

        if (filter.categoria) query = query.eq("categoria", filter.categoria);
        if (filter.subcategoria) query = query.eq("subcategoria", filter.subcategoria);
        if (filter.estilo) query = query.eq("estilo", filter.estilo);
        if (filter.proporcao) query = query.eq("proporcao", filter.proporcao);

        const { data, error } = await query.limit(1).maybeSingle();

        if (error) {
          console.error("[useImageLookup] query error:", error);
          throw error;
        }

        if (data) {
          row = data;
          console.log(`✅ Template: ${data.titulo}`);
          break;
        }
      }

      if (!row) {
        toast({
          title: "Sem templates disponíveis",
          description: "Ainda não existem templates para esta combinação.",
          variant: "destructive",
        });
        return null;
      }

      supabase
        .from("image_prompts_library")
        .update({ usage_count: (row.usage_count || 0) + 1 })
        .eq("id", row.id)
        .then();

      let promptPrincipal = replacePlaceholders(row.prompt_principal, params);
      promptPrincipal = enrichPromptWithUserInputs(promptPrincipal, params);

      let baseForA = row.variante_a ? replacePlaceholders(row.variante_a, params) : promptPrincipal;
      baseForA = enrichPromptWithUserInputs(baseForA, params);
      const varianteA = createVariantA(baseForA);

      let baseForB = row.variante_b ? replacePlaceholders(row.variante_b, params) : promptPrincipal;
      baseForB = enrichPromptWithUserInputs(baseForB, params);
      const varianteB = createVariantB(baseForB);

      return {
        prompt_principal: promptPrincipal,
        variante_a: varianteA,
        variante_b: varianteB,
        titulo: row.titulo || "Template",
        instrucoes: replacePlaceholders(row.instrucoes, params),
      };
    } catch (err: any) {
      const detail = formatSupabaseError(err, "Erro ao procurar template");
      toast({ title: "Erro — Biblioteca de Imagem", description: detail, variant: "destructive" });
      console.error("[useImageLookup] error:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { lookupPrompt, isLoading };
}
