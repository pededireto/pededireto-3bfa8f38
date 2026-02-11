import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SOURCES: Record<string, { label: string; domain: string }> = {
  guianet: { label: "Guianet", domain: "guianet.pt" },
  ubereats: { label: "UberEats", domain: "ubereats.com" },
  bolt_food: { label: "Bolt Food", domain: "food.bolt.eu" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate admin
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

    const { source, url, limit = 50 } = await req.json();

    // Validate source
    const sourceConfig = SOURCES[source];
    if (!sourceConfig) {
      return new Response(JSON.stringify({ error: "Fonte inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate URL domain
    if (!url || !url.includes(sourceConfig.domain)) {
      return new Response(
        JSON.stringify({ error: `URL deve pertencer a ${sourceConfig.domain}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate limit
    const safeLimit = Math.min(Math.max(1, Number(limit) || 50), 50);

    // Scrape with Firecrawl
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) {
      return new Response(JSON.stringify({ error: "Firecrawl não configurado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Scraping ${url} (source: ${source})`);

    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    if (!scrapeResponse.ok) {
      const errText = await scrapeResponse.text();
      console.error("Firecrawl error:", scrapeResponse.status, errText);
      return new Response(
        JSON.stringify({ error: `Erro no scraping: ${scrapeResponse.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const scrapeData = await scrapeResponse.json();
    const markdown = scrapeData?.data?.markdown || scrapeData?.markdown || "";

    if (!markdown || markdown.length < 50) {
      return new Response(
        JSON.stringify({ error: "Não foi possível extrair conteúdo da página", businesses: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract structured data with Lovable AI
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extractionPrompt = `Analisa o seguinte conteúdo de uma página web da fonte "${sourceConfig.label}" e extrai uma lista de negócios/empresas.

Para cada negócio encontrado, extrai os seguintes campos (usa null quando não disponível):
- name: nome do negócio (obrigatório)
- address: morada completa
- city: cidade
- phone: número de telefone
- whatsapp: número de WhatsApp (geralmente igual ao telefone)
- email: email de contacto
- website: URL do website
- nif: número de identificação fiscal

REGRAS:
- Retorna no MÁXIMO ${safeLimit} negócios
- Campos não encontrados devem ser null
- O campo "name" é obrigatório; ignora entradas sem nome
- Não inventes dados; extrai apenas o que está explicitamente no conteúdo
- Números de telefone devem incluir indicativo se disponível

Conteúdo da página:
${markdown.substring(0, 15000)}`;

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
            content: "Extrais dados estruturados de páginas web. Respondes APENAS com JSON válido.",
          },
          { role: "user", content: extractionPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_businesses",
              description: "Extrai lista de negócios do conteúdo",
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
                        nif: { type: "string", nullable: true },
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
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos AI insuficientes" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
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

    // Limit results
    businesses = businesses.slice(0, safeLimit).filter((b: any) => b.name && b.name.trim());

    console.log(`Extracted ${businesses.length} businesses from ${source}`);

    return new Response(JSON.stringify({ businesses, source, url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scrape-businesses error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
