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
    .replace(/\{\{sector\}\}/gi, params.sector || "local business")
    .replace(/\{\{descricao\}\}/gi, params.descricao || "a welcoming local establishment")
    .replace(/\{\{personagens\}\}/gi, params.personagens || "a friendly owner")
    .replace(/\{\{ambiente\}\}/gi, params.ambiente || "a warm, inviting interior")
    .replace(/\{\{textoSobreposto\}\}/gi, params.textoSobreposto || "");
}

export function useImageLookup() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const lookupPrompt = async (params: LookupParams): Promise<LookupResult | null> => {
    setIsLoading(true);
    try {
      const { categoria, estilo, proporcao } = params;

      // Progressive filtering: most specific → least specific
      const filters = [
        { categoria, estilo, proporcao },
        { categoria, estilo },
        { categoria },
        {},
      ];

      let row: any = null;

      for (const filter of filters) {
        let query = supabase
          .from("image_prompts_library")
          .select("*")
          .eq("is_active", true);

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

      // Increment usage_count (fire-and-forget)
      supabase
        .from("image_prompts_library")
        .update({ usage_count: (row.usage_count || 0) + 1 })
        .eq("id", row.id)
        .then();

      return {
        prompt_principal: replacePlaceholders(row.prompt_principal, params),
        variante_a: replacePlaceholders(row.variante_a, params),
        variante_b: replacePlaceholders(row.variante_b, params),
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
