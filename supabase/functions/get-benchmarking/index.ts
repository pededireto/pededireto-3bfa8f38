import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
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

async function tryLovableAI(prompt: string, apiKey: string): Promise<Record<string, unknown> | null> {
  try {
    console.log("[get-benchmarking] Trying Lovable AI Gateway...");
    const res = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[get-benchmarking] Lovable AI error:", res.status, errText.substring(0, 300));
      return null;
    }

    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content || "";
    console.log("[get-benchmarking] Lovable AI response length:", content.length);
    return extractJson(content);
  } catch (e) {
    console.error("[get-benchmarking] Lovable AI call failed:", e);
    return null;
  }
}

async function tryGemini(prompt: string, apiKey: string): Promise<Record<string, unknown> | null> {
  try {
    console.log("[get-benchmarking] Trying Gemini API (fallback 1)...");
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[get-benchmarking] Gemini error:", res.status, errText.substring(0, 200));
      return null;
    }

    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return extractJson(text);
  } catch (e) {
    console.error("[get-benchmarking] Gemini call failed:", e);
    return null;
  }
}

async function tryZhipu(prompt: string, apiKey: string): Promise<Record<string, unknown> | null> {
  try {
    console.log("[get-benchmarking] Trying Z.AI API (fallback 2)...");
    const res = await fetch(ZHIPU_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "glm-4-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 2048,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[get-benchmarking] Z.AI error:", res.status, errText.substring(0, 200));
      return null;
    }

    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content || "";
    return extractJson(content);
  } catch (e) {
    console.error("[get-benchmarking] Z.AI call failed:", e);
    return null;
  }
}

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

    // 2. Try Lovable AI Gateway (primary — pre-configured, no quota issues)
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (lovableKey) {
      benchmarkData = await tryLovableAI(prompt, lovableKey);
      if (benchmarkData) source = "lovable-ai";
    }

    // 3. Try Gemini (fallback 1)
    if (!benchmarkData) {
      const geminiKey = Deno.env.get("GEMINI_API_KEY");
      if (geminiKey) {
        benchmarkData = await tryGemini(prompt, geminiKey);
        if (benchmarkData) source = "gemini";
      }
    }

    // 4. Try Z.AI (fallback 2)
    if (!benchmarkData) {
      const zhipuKey = Deno.env.get("ZHIPU_API_KEY");
      if (zhipuKey) {
        benchmarkData = await tryZhipu(prompt, zhipuKey);
        if (benchmarkData) source = "zai";
      }
    }

    // 5. All failed
    if (!benchmarkData) {
      console.error("[get-benchmarking] All AI APIs failed for:", category, subcategory);
      return new Response(
        JSON.stringify({ error: "unavailable" }),
        { headers: jsonHeaders }
      );
    }

    // 6. Save to cache
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
