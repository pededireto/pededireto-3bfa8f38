import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { safeParseJSON } from "@/utils/safeParseJSON";
import { useToast } from "@/hooks/use-toast";

export function useStudioGenerate() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generate = async (action: string, payload: Record<string, any>) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("studio-generate", {
        body: { action, ...payload },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const parsed = safeParseJSON(data.content);
      return parsed;
    } catch (err: any) {
      toast({
        title: "Erro ao processar",
        description: err.message || "Erro ao processar resposta. Tenta novamente — a IA pode ocasionalmente gerar JSON malformado.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { generate, isLoading };
}
