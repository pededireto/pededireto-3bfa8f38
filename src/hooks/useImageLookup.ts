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

/**
 * Substitui placeholders básicos no template
 */
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
 * 🎯 NOVA FUNÇÃO: Enriquece o prompt base com inputs do utilizador
 */
function enrichPromptWithUserInputs(basePrompt: string, params: LookupParams): string {
  let enriched = basePrompt;

  // 1. Se tem DESCRIÇÃO específica do que deve aparecer → injeta no início
  if (params.descricao && params.descricao.trim()) {
    // Remove descrições genéricas do template base se existirem
    enriched = enriched.replace(/professional .+ in .+ setting/i, params.descricao);
    // Se não encontrou padrão para substituir, adiciona no início
    if (!enriched.includes(params.descricao)) {
      enriched = `${params.descricao}, ${enriched}`;
    }
  }

  // 2. Se tem PERSONAGENS específicos → injeta
  if (params.personagens && params.personagens.trim()) {
    // Tenta substituir personagens genéricos do template
    enriched = enriched.replace(/(professional|worker|specialist|technician|person)[^,]*/i, params.personagens);
    // Se não substituiu, adiciona
    if (!enriched.includes(params.personagens)) {
      enriched = enriched.replace(/,\s*/, `, ${params.personagens}, `);
    }
  }

  // 3. Se tem AMBIENTE específico → injeta
  if (params.ambiente && params.ambiente.trim()) {
    // Substitui ambientes genéricos
    enriched = enriched.replace(
      /(modern|traditional|clean|warm|bright)\s+(salon|office|shop|restaurant|space|interior|setting)[^,]*/gi,
      params.ambiente,
    );
    // Se não substituiu, adiciona antes de "9:16 aspect ratio"
    if (!enriched.includes(params.ambiente)) {
      enriched = enriched.replace(/(,?\s*9:16 aspect ratio)/i, `, ${params.ambiente}, 9:16 aspect ratio`);
    }
  }

  // 4. Se tem NOME do negócio → garante que aparece
  if (params.nome && params.nome.trim()) {
    if (!enriched.toLowerCase().includes(params.nome.toLowerCase())) {
      enriched = enriched.replace(/(Portuguese|Portugal)/i, `${params.nome} $1`);
    }
  }

  // 5. Limpa duplicações e espaços extra
  enriched = enriched
    .replace(/,\s*,/g, ",")
    .replace(/\s{2,}/g, " ")
    .trim();

  return enriched;
}

export function useImageLookup() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const lookupPrompt = async (params: LookupParams): Promise<LookupResult | null> => {
    setIsLoading(true);
    try {
      const { categoria, estilo, proporcao } = params;

      // 🔍 Progressive filtering: most specific → least specific
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
          console.log(`✅ Template encontrado: ${data.titulo} (${Object.keys(filter).join(", ")})`);
          break;
        }
      }

      if (!row) {
        toast({
          title: "Sem templates disponíveis",
          description: "Ainda não existem templates na biblioteca para esta combinação. Contacta o administrador.",
          variant: "destructive",
        });
        return null;
      }

      // 📊 Increment usage_count (fire-and-forget)
      supabase
        .from("image_prompts_library")
        .update({ usage_count: (row.usage_count || 0) + 1 })
        .eq("id", row.id)
        .then();

      // 🎨 ETAPA 1: Substitui placeholders básicos
      let promptPrincipal = replacePlaceholders(row.prompt_principal, params);
      let varianteA = replacePlaceholders(row.variante_a, params);
      let varianteB = replacePlaceholders(row.variante_b, params);

      // 🚀 ETAPA 2: Enriquece com inputs detalhados do utilizador
      promptPrincipal = enrichPromptWithUserInputs(promptPrincipal, params);
      varianteA = enrichPromptWithUserInputs(varianteA, params);
      varianteB = enrichPromptWithUserInputs(varianteB, params);

      console.log("🎯 Prompt enriquecido:", promptPrincipal);

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
