import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ✅ NORMALIZAÇÃO DE CAMPOS
function normalizeBusiness(raw: any): any {
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const val = raw[k];
      if (val && typeof val === "string" && val.trim() && !["−", "-", "n/a", "N/A"].includes(val.trim())) {
        return val.trim();
      }
    }
    return null;
  };

  // Recolhe todos os emails distintos encontrados
  const allEmails = [
    raw.email, raw.cta_email, raw.owner_email,
    raw.email_negocio, raw.email_responsavel,
  ]
    .filter((v) => v && typeof v === "string" && v.includes("@"))
    .map((v) => v.trim().toLowerCase())
    .filter((v, i, arr) => arr.indexOf(v) === i);

  const cta_email   = allEmails[0] || null;
  const owner_email = allEmails[1] || allEmails[0] || null;

  return {
    name:          pick("name", "nome", "negocio", "business"),
    address:       pick("address", "morada", "endereco", "endereço", "addr"),
    city:          pick("city", "cidade", "localidade"),
    cta_phone:     pick("phone", "telefone", "cta_phone", "tel", "telephone"),
    cta_whatsapp:  pick("whatsapp", "cta_whatsapp", "wp", "wpp"),
    cta_website:   pick("website", "site", "cta_website", "url", "web"),
    owner_name:    pick("owner_name", "responsavel", "responsável", "proprietario", "contact_name"),
    cta_email,
    owner_email,
    category:      pick("category", "categoria"),
    subcategory:   pick("subcategory", "subcategoria"),
  };
}

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

    const { text, limit = 100, categoryId, subcategoryId, saveToDatabase = false } = await req.json();

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

    const categoryInstruction = categoryId
      ? `- NÃO extraias categoria nem subcategoria do texto — já foram escolhidas manualmente pelo utilizador.`
      : `- Tenta extrair a categoria e subcategoria do negócio se estiverem mencionadas no texto. Se não encontrares, deixa null.`;

    const extractionPrompt = `Recebes um texto colado por um administrador com uma lista de negócios,
proveniente de pesquisas no Google, Google AI, blogs, excertos de Excel ou outros sites.
O texto pode estar desorganizado, conter cabeçalhos, separações por cidade ou freguesia,
tabelas em texto simples e campos como "N/A" ou "-".

A tua tarefa é extrair uma lista estruturada de negócios.

REGRAS OBRIGATÓRIAS:
- Extrai APENAS negócios reais mencionados no texto
- O campo "name" é OBRIGATÓRIO — se um negócio não tiver nome claro, ignora-o
- Nunca inventes dados
- Campos não encontrados devem ser null
- Valores como "-", "N/A", "n/a" devem ser tratados como null
- Se o texto indicar cidade ou localidade por contexto (cabeçalho), aplica essa cidade aos negócios seguintes até novo cabeçalho
- Se encontrares 2 emails para o mesmo negócio, coloca o email do negócio em "email" e o email do responsável em "owner_email"
- Se encontrares apenas 1 email, coloca-o em "email" — o sistema irá duplicá-lo automaticamente para o responsável
- Telefones devem ser mantidos como string, exatamente como aparecem no texto
- Remove espaços desnecessários no início/fim dos valores
- Retorna no MÁXIMO ${safeLimit} negócios
${categoryInstruction}

TEXTO A PROCESSAR:
${text.substring(0, 30000)}`;

    console.log(`Extracting businesses (${text.length} chars), categoryId=${categoryId || "none"}, save=${saveToDatabase}`);

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
                        name:        { type: "string" },
                        address:     { type: "string", nullable: true },
                        city:        { type: "string", nullable: true },
                        phone:       { type: "string", nullable: true },
                        whatsapp:    { type: "string", nullable: true },
                        email:       { type: "string", nullable: true },
                        owner_email: { type: "string", nullable: true },
                        owner_name:  { type: "string", nullable: true },
                        website:     { type: "string", nullable: true },
                        category:    { type: "string", nullable: true },
                        subcategory: { type: "string", nullable: true },
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

    // ✅ Normaliza campos
    businesses = businesses
      .slice(0, safeLimit)
      .filter((b: any) => b.name && b.name.trim())
      .map((b: any) => {
        const normalized = normalizeBusiness(b);
        return {
          ...normalized,
          category_id:    categoryId    || null,
          subcategory_id: subcategoryId || null,
          category:    categoryId    ? null : normalized.category,
          subcategory: subcategoryId ? null : normalized.subcategory,
        };
      });

    console.log(`Extracted ${businesses.length} businesses.`);

    // ✅ SE saveToDatabase=true → chama upsert_business_from_import para cada negócio
    if (saveToDatabase && businesses.length > 0) {
      const adminClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const results = {
        inserted: 0,
        updated:  0,
        errors:   [] as string[],
      };

      for (const b of businesses) {
        try {
          const { data, error } = await adminClient.rpc("upsert_business_from_import", {
            p_name:               b.name,
            p_city:               b.city               || null,
            p_address:            b.address             || null,
            p_cta_email:          b.cta_email           || null,
            p_owner_email:        b.owner_email         || null,
            p_cta_phone:          b.cta_phone           || null,
            p_cta_whatsapp:       b.cta_whatsapp        || null,
            p_cta_website:        b.cta_website         || null,
            p_owner_name:         b.owner_name          || null,
            p_category_id:        b.category_id         || null,
            p_subcategory_id:     b.subcategory_id      || null,
            p_registration_source: "import_text",
          });

          if (error) {
            console.error(`Upsert error for "${b.name}":`, error);
            results.errors.push(`${b.name}: ${error.message}`);
          } else {
            const action = (data as any)?.action;
            if (action === "inserted") results.inserted++;
            if (action === "updated")  results.updated++;
          }
        } catch (e: any) {
          results.errors.push(`${b.name}: ${e.message}`);
        }
      }

      console.log(`Upsert complete: ${results.inserted} inserted, ${results.updated} updated, ${results.errors.length} errors`);

      return new Response(JSON.stringify({ businesses, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ✅ SE saveToDatabase=false → devolve apenas a pré-visualização (passo 3 do frontend)
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
