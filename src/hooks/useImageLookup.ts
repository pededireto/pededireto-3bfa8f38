import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatSupabaseError } from "@/utils/supabaseError";

interface LookupParams {
  categoria: string;
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
  return text
    .replace(/\{\{nome\}\}/gi, params.nome || "the business")
    .replace(/\{\{sector\}\}/gi, params.sector || "")
    .replace(/\{\{descricao\}\}/gi, params.descricao || "")
    .replace(/\{\{personagens\}\}/gi, params.personagens || "")
    .replace(/\{\{ambiente\}\}/gi, params.ambiente || "")
    .replace(/\{\{textoSobreposto\}\}/gi, params.textoSobreposto || "");
}

/**
 * 🎯 VERSÃO ROBUSTA: Enriquece QUALQUER tipo de prompt
 */
function enrichPromptWithUserInputs(basePrompt: string, params: LookupParams): string {
  let enriched = basePrompt;

  // 1️⃣ DESCRIÇÃO: Injeta logo após a primeira vírgula (universal)
  if (params.descricao && params.descricao.trim()) {
    // Se já contém a descrição, skip
    if (!enriched.toLowerCase().includes(params.descricao.toLowerCase())) {
      // Injeta após a primeira vírgula ou no início
      const firstCommaIndex = enriched.indexOf(",");
      if (firstCommaIndex > 0) {
        enriched = enriched.slice(0, firstCommaIndex) + `, ${params.descricao}` + enriched.slice(firstCommaIndex);
      } else {
        enriched = `${params.descricao}, ${enriched}`;
      }
    }
  }

  // 2️⃣ PERSONAGENS: Substitui padrões genéricos OU injeta
  if (params.personagens && params.personagens.trim()) {
    // Tenta substituir padrões comuns
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

    // Se não substituiu, adiciona
    if (!replaced && !enriched.toLowerCase().includes(params.personagens.toLowerCase())) {
      enriched = enriched.replace(/,\s*/, `, ${params.personagens}, `);
    }
  }

  // 3️⃣ AMBIENTE: Injeta antes da proporção
  if (params.ambiente && params.ambiente.trim()) {
    if (!enriched.toLowerCase().includes(params.ambiente.toLowerCase())) {
      enriched = enriched.replace(/(,?\s*9:16|1:1|16:9)/i, `, ${params.ambiente}, 9:16`);
    }
  }

  // 4️⃣ NOME: Garante que aparece (se ainda não estiver)
  if (params.nome && params.nome.trim()) {
    if (!enriched.toLowerCase().includes(params.nome.toLowerCase())) {
      enriched = enriched.replace(/(Portuguese|Portugal|setting)/i, `${params.nome} $1`);
    }
  }

  // 5️⃣ Limpeza final
  enriched = enriched
    .replace(/,\s*,/g, ",")
    .replace(/\s{2,}/g, " ")
    .replace(/,\s*9:16/g, ", 9:16")
    .trim();

  return enriched;
}

/**
 * 🎨 Variante A: SEMPRE diferente (foco em ÂNGULO/COMPOSIÇÃO)
 */
function createVariantA(basePrompt: string): string {
  const angleModifiers = [
    "close-up shot of",
    "wide angle view showing",
    "overhead top-down perspective of",
    "detail shot focusing on",
    "eye-level composition of",
  ];

  // Escolhe um ângulo aleatório
  const angle = angleModifiers[Math.floor(Math.random() * angleModifiers.length)];

  // Adiciona NO INÍCIO (sempre visível)
  let variant = `${angle} ${basePrompt}`;

  // Remove duplicações de ângulo (caso o base já tenha)
  variant = variant.replace(
    /(close-up|wide angle|overhead|detail shot)\s+(close-up|wide angle|overhead|detail shot)/gi,
    "$1",
  );

  return variant;
}

/**
 * 🌅 Variante B: SEMPRE diferente (foco em ILUMINAÇÃO/MOOD)
 */
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

  // Injeta ANTES do aspect ratio
  let variant = basePrompt.replace(/(9:16|1:1|16:9)/i, `${lighting}${detail}$1`);

  return variant;
}

export function useImageLookup() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const lookupPrompt = async (params: LookupParams): Promise<LookupResult | null> => {
    setIsLoading(true);
    try {
      const { categoria, estilo, proporcao } = params;

      const filters = [{ categoria, estilo, proporcao }, { categoria, estilo }, { categoria }, {}];

      let row: any = null;
      for (const filter of filters) {
        let query = supabase.from("image_prompts_library").select("*").eq("is_active", true);

        if (filter.categoria) query = query.eq("categoria", filter.categoria);
        if (filter.estilo) query = query.eq("estilo", filter.estilo);
        if (filter.proporcao) query = query.eq("proporcao", filter.proporcao);

        const { data, error } = await query.limit(1).maybeSingle();

        if (error) {
          console.error("[useImageLookup] query error:", error);
          throw error;
        }

        if (data) {
          row = data;
          console.log(`✅ Template encontrado: ${data.titulo}`);
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

      // 📝 PROCESSAMENTO:

      // 1️⃣ Prompt Principal = Base + User Inputs
      let promptPrincipal = replacePlaceholders(row.prompt_principal, params);
      promptPrincipal = enrichPromptWithUserInputs(promptPrincipal, params);

      // 2️⃣ Variante A = (Base da BD OU Principal) + Ângulo SEMPRE diferente
      let baseForA = row.variante_a ? replacePlaceholders(row.variante_a, params) : promptPrincipal;
      baseForA = enrichPromptWithUserInputs(baseForA, params);
      const varianteA = createVariantA(baseForA);

      // 3️⃣ Variante B = (Base da BD OU Principal) + Iluminação SEMPRE diferente
      let baseForB = row.variante_b ? replacePlaceholders(row.variante_b, params) : promptPrincipal;
      baseForB = enrichPromptWithUserInputs(baseForB, params);
      const varianteB = createVariantB(baseForB);

      console.log("🎯 Principal:", promptPrincipal.substring(0, 80));
      console.log("🔄 Variante A:", varianteA.substring(0, 80));
      console.log("🌅 Variante B:", varianteB.substring(0, 80));

      return {
        prompt_principal: promptPrincipal,
        variante_a: varianteA,
        variante_b: varianteB,
        titulo: row.titulo || "Template",
        instrucoes: replacePlaceholders(row.instrucoes, params),
      };
    } catch (err: any) {
      const detail = formatSupabaseError(err, "Erro ao procurar template");
      toast({
        title: "Erro — Biblioteca de Imagem",
        description: detail,
        variant: "destructive",
      });
      console.error("[useImageLookup] error:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { lookupPrompt, isLoading };
}
