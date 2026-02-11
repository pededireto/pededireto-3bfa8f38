import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autorizado");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Apenas administradores" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { text, limit = 100 } = await req.json();

    if (!text || text.trim().length < 20) {
      return new Response(
        JSON.stringify({ error: "Texto demasiado curto para extração" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const safeLimit = Math.min(Math.max(1, Number(limit) || 100), 200);

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extractionPrompt = `Recebes um texto colado por um administrador com uma lista de negócios (ex: restaurantes),
proveniente de pesquisas no Google, Google AI, blogs ou outros sites.
O texto pode estar desorganizado, conter cabeçalhos, separações por cidade ou freguesia,
tabelas em texto simples e campos como "N/A".

A tua tarefa é extrair uma lista estruturada de negócios.

REGRAS OBRIGATÓRIAS:
- Extrai APENAS negócios reais mencionados no texto
- O campo "name" (nome do negócio) é OBRIGATÓRIO
- Se um negócio não tiver nome claro, ignora-o
- Nunca inventes dados
- Campos não encontrados devem ser null
- Se o texto indicar cidade ou localidade por contexto (ex: cabeçalho), aplica essa cidade aos negócios seguintes até novo cabeçalho
- Se o site for indicado como Instagram, Facebook ou Tripadvisor, guarda esse valor no campo "website"
- Telefones devem ser mantidos como string, exatamente como aparecem
- Remove espaços desnecessários no início/fim dos valores
- Retorna no MÁXIMO ${safeLimit} negócios

TEXTO A PROCESSAR:
${text.substring(0, 30000)}`;

    console.log(`Extracting businesses from pasted text (${text.length} chars)`);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "Extrais dados estruturados de texto colado por administradores. Respondes APENAS com JSON válido via tool calling.",
          },
          { role: "user", content: extractionPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_businesses",
              description: "Extrai lista de negócios do texto colado",
              parameters: {
                type: "object",
                properties: {
                  businesses: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        address: { type: "string", nullable: true },
                        city: { type: "string", nullable: true },
                        phone: { type: "string", nullable: true },
                        whatsapp: { type: "string", nullable: true },
                        email: { type: "string", nullable: true },
                        website: { type: "string", nullable: true },
                      },
                      required: ["name"],
                    },
                  },
                },
                required: ["businesses"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_businesses" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit excedido, tente novamente mais tarde" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos AI insuficientes" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      return new Response(
        JSON.stringify({ error: "Erro na extração de dados" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    let businesses: any[] = [];

    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        const parsed = JSON.parse(toolCall.function.arguments);
        businesses = parsed.businesses || [];
      }
    } catch (parseErr) {
      console.error("Parse error:", parseErr);
      return new Response(
        JSON.stringify({ error: "Erro ao processar dados extraídos", businesses: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    businesses = businesses.slice(0, safeLimit).filter((b: any) => b.name && b.name.trim());

    console.log(`Extracted ${businesses.length} businesses from pasted text`);

    return new Response(JSON.stringify({ businesses }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-businesses-from-text error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
