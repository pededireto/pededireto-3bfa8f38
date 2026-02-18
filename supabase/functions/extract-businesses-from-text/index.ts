import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ✅ NORMALIZAÇÃO DE CAMPOS
// Recebe o objeto bruto da IA e normaliza para os nomes corretos da BD
function normalizeBusiness(raw: any): any {
  // Helper para pegar o primeiro valor não nulo de uma lista de chaves
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const val = raw[k];
      if (val && typeof val === "string" && val.trim() && val.trim() !== "-") {
        return val.trim();
      }
    }
    return null;
  };

  // ── EMAILS ──────────────────────────────────────────────────────────────
  // Recolhe todos os emails distintos encontrados no objeto
  const allEmails = [
    raw.email, raw.cta_email, raw.owner_email,
    raw.email_negocio, raw.email_responsavel,
  ]
    .filter((v) => v && typeof v === "string" && v.includes("@"))
    .map((v) => v.trim().toLowerCase())
    .filter((v, i, arr) => arr.indexOf(v) === i); // únicos

  const cta_email   = allEmails[0] || null; // 1º email → negócio
  const owner_email = allEmails[1] || allEmails[0] || null; // 2º se existir, senão reutiliza o 1º

  // ── TELEFONES ────────────────────────────────────────────────────────────
  const cta_phone = pick(
    "phone", "telefone", "cta_phone", "tel", "telephone"
  );

  // ── WHATSAPP ─────────────────────────────────────────────────────────────
  const cta_whatsapp = pick(
    "whatsapp", "cta_whatsapp", "wp", "wpp"
  );

  // ── WEBSITE ──────────────────────────────────────────────────────────────
  const cta_website = pick(
    "website", "site", "cta_website", "url", "web"
  );

  // ── OUTROS CAMPOS ────────────────────────────────────────────────────────
  const name       = pick("name", "nome", "negocio", "business");
  const address    = pick("address", "morada", "endereco", "endereço", "addr");
  const city       = pick("city", "cidade", "localidade");
  const category    = pick("category", "categoria");
  const subcategory = pick("subcategory", "subcategoria");
  const owner_name  = pick("owner_name", "responsavel", "responsável", "proprietario", "contact_name");

  return {
    name,
    address,
    city,
    cta_phone,
    cta_whatsapp,
    cta_email,
    owner_email,   // ← igual a cta_email se só houver 1
    owner_name,
    cta_website,
    category,
    subcategory,
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

    const { text, limit = 100, categoryId, subcategoryId } = await req.json();

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

    console.log(`Extracting businesses (${text.length} chars), categoryId=${categoryId || "none"}`);

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
                        name:         { type: "string" },
                        address:      { type: "string", nullable: true },
                        city:         { type: "string", nullable: true },
                        phone:        { type: "string", nullable: true },
                        whatsapp:     { type: "string", nullable: true },
                        email:        { type: "string", nullable: true },
                        owner_email:  { type: "string", nullable: true },
                        owner_name:   { type: "string", nullable: true },
                        website:      { type: "string", nullable: true },
                        category:     { type: "string", nullable: true },
                        subcategory:  { type: "string", nullable: true },
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

    // ✅ Normaliza campos + aplica categoria do dropdown se existir
    businesses = businesses
      .slice(0, safeLimit)
      .filter((b: any) => b.name && b.name.trim())
      .map((b: any) => {
        const normalized = normalizeBusiness(b);
        return {
          ...normalized,
          // Dropdown sobrepõe sempre o que a IA extraiu
          category_id:    categoryId    || null,
          subcategory_id: subcategoryId || null,
          category:    categoryId    ? null : normalized.category,
          subcategory: subcategoryId ? null : normalized.subcategory,
        };
      });

    console.log(`Extracted and normalized ${businesses.length} businesses.`);

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
