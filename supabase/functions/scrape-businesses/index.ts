const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
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

    try {
      new URL(url);
    } catch {
      return new Response(JSON.stringify({ error: "URL inválido" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let htmlContent = "";
    try {
      const fetchResponse = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; PedeDiretoBot/1.0)",
          Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
          "Accept-Language": "pt-PT,pt;q=0.9",
        },
        signal: AbortSignal.timeout(20000),
      });

      if (!fetchResponse.ok) {
        return new Response(JSON.stringify({ error: `Erro ao aceder ao URL: HTTP ${fetchResponse.status}` }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      htmlContent = await fetchResponse.text();
      if (htmlContent.length > 80000) htmlContent = htmlContent.substring(0, 80000);
    } catch (fetchErr: any) {
      return new Response(JSON.stringify({ error: `Não foi possível aceder ao URL: ${fetchErr.message}` }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY não configurada" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `És um extractor de dados de negócios para a plataforma Pede Direto Portugal.
Analisa o HTML e extrai informações de negócios/empresas.
Responde APENAS com JSON válido, sem texto adicional, sem markdown, sem blocos de código.
Estrutura obrigatória:
{
  "businesses": [
    {
      "name": "string",
      "description": null,
      "address": null,
      "city": null,
      "phone": null,
      "whatsapp": null,
      "email": null,
      "owner_email": null,
      "owner_name": null,
      "owner_phone": null,
      "website": null,
      "nif": null,
      "instagram_url": null,
      "facebook_url": null,
      "other_social_url": null,
      "logo_url": null,
      "opening_hours": null,
      "cta_booking_url": null,
      "cta_order_url": null
    }
  ]
}
Regras:
- Máximo ${limit} negócios
- Campos não encontrados = null, nunca string vazia
- Não inventes dados — só extrai o que está na página
- Para opening_hours usa: {"segunda":"09:00-18:00"} ou null
- Fonte: ${source || "website"}

URL: ${url}

${htmlContent}`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 8000,
            temperature: 0.1,
          },
        }),
        signal: AbortSignal.timeout(55000),
      },
    );

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      return new Response(
        JSON.stringify({ error: `Erro Gemini API: ${geminiResponse.status} — ${errText.substring(0, 200)}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const geminiData = await geminiResponse.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let parsed: { businesses: any[] };
    try {
      const cleaned = rawText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed?.businesses)) throw new Error("Estrutura inválida");
    } catch (parseErr: any) {
      return new Response(JSON.stringify({ error: `Erro ao interpretar resposta: ${parseErr.message}` }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const businesses = parsed.businesses
      .filter((b) => b?.name?.trim?.())
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

    return new Response(JSON.stringify({ businesses, total: businesses.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Erro desconhecido" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
