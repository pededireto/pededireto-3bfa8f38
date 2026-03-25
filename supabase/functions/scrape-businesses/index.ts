const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Strip HTML to visible text only.
 */
function htmlToCleanText(html: string, maxChars = 16000): string {
  let text = html;
  text = text.replace(/<(script|style|svg|noscript)[^>]*>[\s\S]*?<\/\1>/gi, " ");
  text = text.replace(/<!--[\s\S]*?-->/g, " ");
  text = text.replace(/<[^>]+>/g, " ");
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
  text = text.replace(/\s+/g, " ").trim();
  if (text.length > maxChars) text = text.substring(0, maxChars);
  return text;
}

/**
 * Encode object to Base64URL — byte-by-byte, safe for Deno.
 */
function base64urlEncode(obj: object): string {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Generate Zhipu AI JWT token.
 * apiId = ZHIPU_API_ID, apiSecret = ZHIPU_API_KEY
 * Zhipu requires timestamps in MILLISECONDS.
 */
async function generateZhipuToken(apiId: string, apiSecret: string): Promise<string> {
  const now = Date.now();
  const exp = now + 3_600_000;

  const headerB64 = base64urlEncode({ alg: "HS256", sign_type: "SIGN" });
  const payloadB64 = base64urlEncode({ api_key: apiId, exp, timestamp: now });
  const signingInput = `${headerB64}.${payloadB64}`;

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(apiSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBytes = new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(signingInput)));
  let sigBinary = "";
  for (let i = 0; i < sigBytes.length; i++) sigBinary += String.fromCharCode(sigBytes[i]);
  const sigB64 = btoa(sigBinary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  return `${signingInput}.${sigB64}`;
}

/**
 * Call Zhipu AI (GLM-4-Flash) as fallback.
 */
async function callZhipu(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`, // usar a key completa diretamente
    },
    body: JSON.stringify({
      model: "glm-4-flash",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 8000,
      temperature: 0.1,
    }),
    signal: AbortSignal.timeout(55000),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Zhipu API erro ${response.status}: ${errText.substring(0, 300)}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || "";
}

/**
 * Call Gemini API. Returns { text, rateLimited }.
 */
async function callGemini(prompt: string, geminiKey: string): Promise<{ text: string; rateLimited: boolean }> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 8000, temperature: 0.1 },
      }),
      signal: AbortSignal.timeout(55000),
    },
  );

  if (response.status === 429) return { text: "", rateLimited: true };

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API erro ${response.status}: ${errText.substring(0, 200)}`);
  }

  const data = await response.json();
  return { text: data?.candidates?.[0]?.content?.parts?.[0]?.text || "", rateLimited: false };
}

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

    // Facebook/Instagram — retornar manual_required
    const isSocialBlocked = url.includes("facebook.com") || url.includes("fb.com") || url.includes("instagram.com");
    if (isSocialBlocked) {
      return new Response(
        JSON.stringify({
          businesses: [
            {
              name: "",
              description: null,
              address: null,
              city: null,
              phone: null,
              whatsapp: null,
              email: null,
              owner_email: null,
              owner_name: null,
              owner_phone: null,
              website: null,
              nif: null,
              instagram_url: url.includes("instagram.com") ? url : null,
              facebook_url: url.includes("facebook.com") || url.includes("fb.com") ? url : null,
              other_social_url: null,
              logo_url: null,
              opening_hours: null,
              cta_booking_url: null,
              cta_order_url: null,
            },
          ],
          total: 1,
          manual_required: true,
          manual_reason: "Facebook e Instagram bloqueiam scraping. Preencha os dados manualmente.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch HTML
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
    } catch (fetchErr: any) {
      return new Response(JSON.stringify({ error: `Não foi possível aceder ao URL: ${fetchErr.message}` }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanText = htmlToCleanText(htmlContent, 16000);
    if (cleanText.length < 20) {
      return new Response(JSON.stringify({ error: "Página sem conteúdo útil extraível" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `És um extractor de dados de negócios para a plataforma Pede Direto Portugal.
Analisa o texto extraído de uma página web e extrai informações de negócios/empresas.
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
- Não inventes dados — só extrai o que está no texto
- Para opening_hours usa: {"segunda":"09:00-18:00"} ou null
- Telefones PT: 9XXXXXXXX, +351XXXXXXXXX, 2XXXXXXXX
- Detectar URLs de booking: calendly.com, doctolib.pt, thefork.pt, booking.com
- Detectar URLs de pedido: ubereats.com, glovoapp.com, bolt.food
- Fonte: ${source || "website"}

URL original: ${url}

Texto da página:
${cleanText}`;

    // --- Gemini primeiro ---
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    let rawText = "";
    let usedFallback = false;

    if (geminiKey) {
      try {
        const result = await callGemini(prompt, geminiKey);
        if (result.rateLimited) {
          console.warn("Gemini rate limited — a tentar Zhipu...");
          usedFallback = true;
        } else {
          rawText = result.text;
        }
      } catch (err: any) {
        console.error("Gemini falhou:", err.message);
        usedFallback = true;
      }
    } else {
      usedFallback = true;
    }

    // --- Zhipu fallback ---
    if (usedFallback || !rawText) {
      const zhipuId = Deno.env.get("ZHIPU_API_ID");
      const zhipuKey = Deno.env.get("ZHIPU_API_KEY");

      if (!zhipuId || !zhipuKey) {
        return new Response(
          JSON.stringify({
            error: "Limite de chamadas à API atingido. Tente novamente mais tarde.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      try {
        rawText = await callZhipu(prompt, zhipuId, zhipuKey);
        console.log("Resposta via Zhipu AI (fallback)");
      } catch (zhipuErr: any) {
        return new Response(
          JSON.stringify({
            error: `Ambas as APIs falharam. Zhipu: ${zhipuErr.message}`,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // --- Parse ---
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

    return new Response(
      JSON.stringify({
        businesses,
        total: businesses.length,
        provider: usedFallback ? "zhipu" : "gemini",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Erro desconhecido" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
