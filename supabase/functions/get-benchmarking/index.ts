import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const ZHIPU_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";

function buildPrompt(category: string, subcategory: string): string {
  return `És um especialista em análise de mercado para pequenos e médios negócios em Portugal.

Para o sector ${subcategory} na categoria ${category}, devolve dados de benchmarking em formato JSON com esta estrutura exacta:

{
  "ticket_medio": "string com range de preços",
  "frequencia_cliente": "string descritiva",
  "canal_aquisicao_principal": "string",
  "factor_decisao_1": "string",
  "tendencia_2025": "string",
  "diferencial_competitivo": "string",
  "presenca_digital": {
    "website": "% estimada",
    "redes_sociais": "% estimada"
  },
  "keywords_google": ["keyword1", "keyword2", "keyword3"],
  "benchmark_avaliacoes": "string com média e nº reviews",
  "dica_ouro": "string com dica accionável"
}

Responde APENAS com o JSON, sem texto adicional. Dados específicos para Portugal, actualizados 2024/2025.`;
}

function extractJson(text: string): Record<string, unknown> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category, subcategory } = await req.json();

    if (!category || !subcategory) {
      return new Response(
        JSON.stringify({ error: "category and subcategory are required" }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. Check cache
    console.log(`[get-benchmarking] Checking cache for: ${category} / ${subcategory}`);
    const { data: cached, error: cacheErr } = await supabase
      .from("benchmarking_cache")
      .select("*")
      .eq("category", category)
      .eq("subcategory", subcategory)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached && !cacheErr) {
      console.log(`[get-benchmarking] Cache HIT — hit_count: ${cached.hit_count}`);
      await supabase
        .from("benchmarking_cache")
        .update({
          hit_count: (cached.hit_count || 0) + 1,
          last_hit_at: new Date().toISOString(),
        })
        .eq("id", cached.id);

      return new Response(
        JSON.stringify({ data: cached.data, source: "cache" }),
        { headers: jsonHeaders }
      );
    }

    console.log("[get-benchmarking] Cache MISS — calling AI APIs");
    const prompt = buildPrompt(category, subcategory);
    let benchmarkData: Record<string, unknown> | null = null;
    let source = "";

    // 2. Try Gemini (primary)
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (geminiKey) {
      try {
        console.log("[get-benchmarking] Trying Gemini API...");
        const geminiRes = await fetch(`${GEMINI_URL}?key=${geminiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
          }),
        });

        if (geminiRes.ok) {
          const geminiJson = await geminiRes.json();
          const text = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          console.log("[get-benchmarking] Gemini raw response length:", text.length);
          benchmarkData = extractJson(text);
          if (benchmarkData) {
            source = "gemini";
            console.log("[get-benchmarking] Gemini parsed successfully");
          } else {
            console.error("[get-benchmarking] Gemini response could not be parsed:", text.substring(0, 200));
          }
        } else {
          const errText = await geminiRes.text();
          console.error("[get-benchmarking] Gemini error:", geminiRes.status, errText.substring(0, 200));
        }
      } catch (geminiErr) {
        console.error("[get-benchmarking] Gemini call failed:", geminiErr);
      }
    } else {
      console.log("[get-benchmarking] GEMINI_API_KEY not configured, skipping");
    }

    // 3. Try Z.AI (fallback)
    if (!benchmarkData) {
      const zhipuKey = Deno.env.get("ZHIPU_API_KEY");
      if (zhipuKey) {
        try {
          console.log("[get-benchmarking] Trying Z.AI API (fallback)...");
          const zaiRes = await fetch(ZHIPU_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${zhipuKey}`,
            },
            body: JSON.stringify({
              model: "glm-4-flash",
              messages: [{ role: "user", content: prompt }],
              temperature: 0.3,
              max_tokens: 2048,
            }),
          });

          if (zaiRes.ok) {
            const zaiJson = await zaiRes.json();
            const content = zaiJson?.choices?.[0]?.message?.content || "";
            console.log("[get-benchmarking] Z.AI raw response length:", content.length);
            benchmarkData = extractJson(content);
            if (benchmarkData) {
              source = "zai";
              console.log("[get-benchmarking] Z.AI parsed successfully");
            } else {
              console.error("[get-benchmarking] Z.AI response could not be parsed:", content.substring(0, 200));
            }
          } else {
            const errText = await zaiRes.text();
            console.error("[get-benchmarking] Z.AI error:", zaiRes.status, errText.substring(0, 200));
          }
        } catch (zaiErr) {
          console.error("[get-benchmarking] Z.AI call failed:", zaiErr);
        }
      } else {
        console.log("[get-benchmarking] ZHIPU_API_KEY not configured, skipping");
      }
    }

    // 4. Both failed
    if (!benchmarkData) {
      console.error("[get-benchmarking] All AI APIs failed for:", category, subcategory);
      return new Response(
        JSON.stringify({ error: "unavailable" }),
        { headers: jsonHeaders }
      );
    }

    // 5. Save to cache
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await supabase.from("benchmarking_cache").upsert(
      {
        category,
        subcategory,
        data: benchmarkData,
        created_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        hit_count: 1,
        last_hit_at: now.toISOString(),
        renewed_by: source,
      },
      { onConflict: "category,subcategory" }
    );

    console.log(`[get-benchmarking] Cache saved (source: ${source}) for: ${category} / ${subcategory}`);

    return new Response(
      JSON.stringify({ data: benchmarkData, source }),
      { headers: jsonHeaders }
    );
  } catch (err) {
    console.error("[get-benchmarking] Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: "unavailable" }),
      { headers: jsonHeaders }
    );
  }
});
