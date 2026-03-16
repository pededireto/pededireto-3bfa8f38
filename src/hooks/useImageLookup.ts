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

function enrichPromptWithUserInputs(basePrompt: string, params: LookupParams): string {
  let enriched = basePrompt;

  if (params.descricao && params.descricao.trim()) {
    enriched = enriched.replace(/professional .+ in .+ setting/i, params.descricao);
    if (!enriched.includes(params.descricao)) {
      enriched = `${params.descricao}, ${enriched}`;
    }
  }

  if (params.personagens && params.personagens.trim()) {
    enriched = enriched.replace(/(professional|worker|specialist|technician|person)[^,]*/i, params.personagens);
    if (!enriched.includes(params.personagens)) {
      enriched = enriched.replace(/,\s*/, `, ${params.personagens}, `);
    }
  }

  if (params.ambiente && params.ambiente.trim()) {
    enriched = enriched.replace(
      /(modern|traditional|clean|warm|bright)\s+(salon|office|shop|restaurant|space|interior|setting)[^,]*/gi,
      params.ambiente,
    );
    if (!enriched.includes(params.ambiente)) {
      enriched = enriched.replace(/(,?\s*9:16 aspect ratio)/i, `, ${params.ambiente}, 9:16 aspect ratio`);
    }
  }

  if (params.nome && params.nome.trim()) {
    if (!enriched.toLowerCase().includes(params.nome.toLowerCase())) {
      enriched = enriched.replace(/(Portuguese|Portugal)/i, `${params.nome} $1`);
    }
  }

  enriched = enriched
    .replace(/,\s*,/g, ",")
    .replace(/\s{2,}/g, " ")
    .trim();

  return enriched;
}

function createVariantA(basePrompt: string, params: LookupParams): string {
  let variant = basePrompt;

  const angleModifiers = [
    "close-up hands working on",
    "over-the-shoulder view of",
    "wide angle showing full",
    "detail shot focusing on",
    "top-down perspective of",
  ];

  const randomAngle = angleModifiers[Math.floor(Math.random() * angleModifiers.length)];

  if (!variant.match(/close-up|wide angle|overhead|perspective|top-down/i)) {
    variant = `${randomAngle} ${variant}`;
  }

  if (!variant.includes("lighting") && !variant.includes("light")) {
    variant = variant.replace(/(9:16 aspect ratio)/i, "natural window light, $1");
  }

  return variant;
}

function createVariantB(basePrompt: string, params: LookupParams): string {
  let variant = basePrompt;

  const lightingStyles = [
    "golden hour warm glow",
    "soft diffused lighting",
    "dramatic side lighting",
    "bright professional lights",
    "warm ambient atmosphere",
  ];

  const randomLighting = lightingStyles[Math.floor(Math.random() * lightingStyles.length)];

  variant = variant.replace(/(9:16 aspect ratio)/i, `${randomLighting}, $1`);

  const atmosphereDetails = [
    "satisfied customer smiling",
    "before after transformation visible",
    "happy client in mirror reflection",
    "peaceful calm mood",
    "professional confident atmosphere",
  ];

  const randomAtmosphere = atmosphereDetails[Math.floor(Math.random() * atmosphereDetails.length)];

  if (!variant.includes("atmosphere") && !variant.includes("reflection") && !variant.includes("smiling")) {
    variant = variant.replace(/(photorealistic)/i, `${randomAtmosphere}, $1`);
  }

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

      let varianteA = row.variante_a ? replacePlaceholders(row.variante_a, params) : promptPrincipal;
      varianteA = enrichPromptWithUserInputs(varianteA, params);
      varianteA = createVariantA(varianteA, params);

      let varianteB = row.variante_b ? replacePlaceholders(row.variante_b, params) : promptPrincipal;
      varianteB = enrichPromptWithUserInputs(varianteB, params);
      varianteB = createVariantB(varianteB, params);

      console.log("🎯 Principal:", promptPrincipal.substring(0, 60));
      console.log("🔄 Variante A:", varianteA.substring(0, 60));
      console.log("🌅 Variante B:", varianteB.substring(0, 60));

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
