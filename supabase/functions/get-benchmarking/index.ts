import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ZHIPU_API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const buildPrompt = (
  category: string,
  subcategory: string,
) => `És um especialista em análise de mercado para pequenos e médios negócios em Portugal.

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

const parseJSON = (content: string): Record<string, unknown> | null => {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
};

const callGemini = async (prompt: string, apiKey: string): Promise<Record<string, unknown> | null> => {
  try {
    console.log("Calling Gemini API...");
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
      }),
    });

    console.log("Gemini API status:", res.status);

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini API error:", res.status, errText);
      return null;
    }

    const json = await res.json();
    const content = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log("Gemini raw response:", content);

    const parsed = parseJSON(content);
    if (parsed) {
      console.log("Gemini data parsed successfully");
      return parsed;
    }

    console.error("Could not parse Gemini response");
    return null;
  } catch (err) {
    console.error("Gemini API call failed:", err);
    return null;
  }
};

const callZhipu = async (
  prompt: string,
  zhipuId: string,
  zhipuSecret: string,
): Promise<Record<string, unknown> | null> => {
  try {
    const zhipuKey = `${zhipuId}.${zhipuSecret}`;
    console.log("Calling Z.AI API as fallback...");

    const res = await fetch(ZHIPU_API_URL, {
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

    console.log("Z.AI API status:", res.status);

    if (!res.ok) {
      const errText = await res.text();
      console.error("Z.AI API error:", res.status, errText);
      return null;
    }

    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content || "";
    console.log("Z.AI raw response:", content);

    const parsed = parseJSON(content);
    if (parsed) {
      console.log("Z.AI data parsed successfully");
      return parsed;
    }

    console.error("Could not parse Z.AI response");
    return null;
  } catch (err) {
    console.error("Z.AI API call failed:", err);
    return null;
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category, subcategory } = await req.json();

    if (!category || !subcategory) {
      return new Response(JSON.stringify({ error: "category and subcategory are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. Check cache
    const { data: cached, error: cacheErr } = await supabase
      .from("benchmarking_cache")
      .select("*")
      .eq("category", category)
      .eq("subcategory", subcategory)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached && !cacheErr) {
      console.log("Cache hit for:", category, subcategory);
      await supabase
        .from("benchmarking_cache")
        .update({
          hit_count: (cached.hit_count || 0) + 1,
          last_hit_at: new Date().toISOString(),
        })
        .eq("id", cached.id);

      return new Response(JSON.stringify({ data: cached.data, source: "cache" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Build prompt
    const prompt = buildPrompt(category, subcategory);
    let benchmarkData: Record<string, unknown> | null = null;
    let source = "";

    // 3. Try Gemini first (primary)
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (geminiKey) {
      benchmarkData = await callGemini(prompt, geminiKey);
      if (benchmarkData) source = "gemini";
    } else {
      console.warn("GEMINI_API_KEY not configured — skipping to fallback");
    }

    // 4. Fallback to Z.AI if Gemini failed
    if (!benchmarkData) {
      const zhipuId = Deno.env.get("ZHIPU_API_ID");
      const zhipuSecret = Deno.env.get("ZHIPU_API_SECRET");

      if (zhipuId && zhipuSecret) {
        benchmarkData = await callZhipu(prompt, zhipuId, zhipuSecret);
        if (benchmarkData) source = "zai";
      } else {
        console.error("Z.AI secrets not configured either");
      }
    }

    // 5. Both failed
    if (!benchmarkData) {
      console.error("Both Gemini and Z.AI failed for:", category, subcategory);
      return new Response(JSON.stringify({ error: "unavailable" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
      { onConflict: "category,subcategory" },
    );

    console.log("Cache saved via", source, "for:", category, subcategory);

    return new Response(JSON.stringify({ data: benchmarkData, source }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("get-benchmarking error:", err);
    return new Response(JSON.stringify({ error: "unavailable" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
