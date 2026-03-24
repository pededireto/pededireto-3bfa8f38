// supabase/functions/scrape-businesses/index.ts
// Edge Function Deno — extrai negócios de qualquer URL via Claude API

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScrapedBusiness {
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  owner_email: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  website: string | null;
  nif: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  other_social_url: string | null;
  logo_url: string | null;
  opening_hours: Record<string, string> | null;
  cta_booking_url: string | null;
  cta_order_url: string | null;
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, source, limit = 20 } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "URL obrigatório" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validação básica de URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Protocolo inválido");
      }
    } catch {
      return new Response(JSON.stringify({ error: "URL inválido" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Fazer fetch ao URL alvo
    let htmlContent = "";
    try {
      const fetchResponse = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; PedeDiretoBot/1.0)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "pt-PT,pt;q=0.9,en;q=0.8",
        },
        signal: AbortSignal.timeout(20000), // 20s timeout
      });

      if (!fetchResponse.ok) {
        return new Response(JSON.stringify({ error: `Erro ao aceder ao URL: HTTP ${fetchResponse.status}` }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      htmlContent = await fetchResponse.text();

      // Limitar tamanho do HTML para não exceder context window
      if (htmlContent.length > 80000) {
        htmlContent = htmlContent.substring(0, 80000);
      }
    } catch (fetchErr: any) {
      return new Response(JSON.stringify({ error: `Não foi possível aceder ao URL: ${fetchErr.message}` }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Enviar HTML à Claude API para extracção estruturada
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY não configurada" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `És um extractor de dados de negócios para a plataforma Pede Direto Portugal.
Analisa o HTML fornecido e extrai informações de negócios/empresas.
Responde APENAS com JSON válido, sem texto adicional, sem markdown, sem blocos de código.
O JSON deve ter exactamente esta estrutura:
{
  "businesses": [
    {
      "name": "string (obrigatório)",
      "description": "string ou null",
      "address": "string ou null (morada completa com rua e número)",
      "city": "string ou null (cidade/localidade)",
      "phone": "string ou null (formato +351XXXXXXXXX ou 2XXXXXXXX ou 9XXXXXXXX)",
      "whatsapp": "string ou null",
      "email": "string ou null",
      "owner_email": "string ou null",
      "owner_name": "string ou null",
      "owner_phone": "string ou null",
      "website": "string ou null (URL completo)",
      "nif": "string ou null (9 dígitos)",
      "instagram_url": "string ou null (URL completo)",
      "facebook_url": "string ou null (URL completo)",
      "other_social_url": "string ou null",
      "logo_url": "string ou null (URL completo da imagem)",
      "opening_hours": null,
      "cta_booking_url": "string ou null",
      "cta_order_url": "string ou null"
    }
  ]
}
Regras:
- Extrai no máximo ${limit} negócios
- Se a página for de um único negócio, retorna um array com um único elemento
- Se for uma listagem, extrai todos os negócios visíveis
- Campos não encontrados devem ser null, nunca strings vazias
- Para opening_hours, usa formato: {"segunda": "09:00-18:00", "sexta": "09:00-18:00"} ou null
- Não inventes dados — apenas extrai o que está explicitamente na página
- Fonte: ${source || "desconhecida"}`;

    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Extrai os negócios deste HTML:\n\nURL: ${url}\n\n${htmlContent}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(55000), // 55s timeout (limite Supabase ~60s)
    });

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text();
      return new Response(
        JSON.stringify({ error: `Erro na Claude API: ${claudeResponse.status} — ${errText.substring(0, 200)}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const claudeData = await claudeResponse.json();
    const rawText = claudeData?.content?.[0]?.text || "";

    // 3. Parse do JSON retornado pela Claude
    let parsed: { businesses: ScrapedBusiness[] };
    try {
      // Limpar possíveis marcadores markdown residuais
      const cleaned = rawText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      parsed = JSON.parse(cleaned);

      if (!Array.isArray(parsed?.businesses)) {
        throw new Error("Estrutura inválida");
      }
    } catch (parseErr: any) {
      console.error("Erro ao fazer parse da resposta Claude:", rawText.substring(0, 500));
      return new Response(JSON.stringify({ error: `Erro ao interpretar resposta: ${parseErr.message}` }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Sanitizar e normalizar os dados
    const businesses: ScrapedBusiness[] = parsed.businesses
      .filter((b) => b?.name && typeof b.name === "string" && b.name.trim().length > 0)
      .slice(0, limit)
      .map((b) => ({
        name: b.name.trim(),
        description: b.description || null,
        address: b.address || null,
        city: b.city || null,
        phone: b.phone || null,
        whatsapp: b.whatsapp || null,
        email: b.email || null,
        owner_email: b.owner_email || null,
        owner_name: b.owner_name || null,
        owner_phone: b.owner_phone || null,
        website: b.website || null,
        nif: b.nif || null,
        instagram_url: b.instagram_url || null,
        facebook_url: b.facebook_url || null,
        other_social_url: b.other_social_url || null,
        logo_url: b.logo_url || null,
        opening_hours: b.opening_hours && typeof b.opening_hours === "object" ? b.opening_hours : null,
        cta_booking_url: b.cta_booking_url || null,
        cta_order_url: b.cta_order_url || null,
      }));

    console.log(`✅ scrape-businesses: ${businesses.length} negócios extraídos de ${url}`);

    return new Response(JSON.stringify({ businesses, total: businesses.length, source: source || "url", url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Erro geral scrape-businesses:", err);
    return new Response(JSON.stringify({ error: err.message || "Erro desconhecido" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
