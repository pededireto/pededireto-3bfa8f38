import { supabase } from "@/integrations/supabase/client";

export const useImageLookup = () => {
  const lookup = async (payload: {
    categoria?: string;
    estilo?: string;
    proporcao?: string;
    objectivo?: string;
    nome?: string;
    sector?: string;
    descricao?: string;
    personagens?: string;
    ambiente?: string;
    textoSobreposto?: string;
    extras?: string;
  }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sem sessão activa");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/studio-image-lookup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || `Erro ${response.status}`);
      }

      return json.content;
    } catch (error: any) {
      console.error("useImageLookup error:", error);
      throw error;
    }
  };

  return { lookup };
};
