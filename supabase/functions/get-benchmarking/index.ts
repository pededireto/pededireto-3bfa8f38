import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ZHIPU_API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category, subcategory } = await req.json();

    if (!category || !subcategory) {
      return new Response(
        JSON.stringify({ error: "category and subcategory are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
      await supabase
        .from("benchmarking_cache")
        .update({
          hit_count: (cached.hit_count || 0) + 1,
          last_hit_at: new Date().toISOString()
        })
        .eq("id", cached.id);

      return new Response(
        JSON.stringify({ data: cached.data, source: "cache" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Build Z.AI API key from two secrets
    const zhipuId = Deno.env.get("ZHIPU_API_ID");
    const zhipuSecret = Deno.env.get("ZHIPU_API_SECRET");

    if (!zhipuId || !zhipuSecret) {
      console.error("ZHIPU_API_ID exists:", !!zhipuId);
      console.error("ZHIPU_API_SECRET exists:", !!zhipuSecret);
      return new Response(
        JSON.stringify({ error: "unavailable" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const zhipuKey = `${zhipuId}.${zhipuSecret}`;
    console.log("ZHIPU key constructed successfully");

    const prompt = `És um especialista em análise de mercado para pequenos e médios negócios em Portugal.

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

    let benchmarkData: Record<string, unknown> | null = null;

    try {
      console.log("Calling Z.AI API for:", category, subcategory);

      const apiRes = await fetch(ZHIPU_API_URL, {
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

      console.log("Z.AI API status:", apiRes.status);

      if (!apiRes.ok) {
        const errText = await apiRes.text();
        console.error("Z.AI API error:", apiRes.status, errText);
        return new Response(
          JSON.stringify({ error: "unavailable" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const apiJson = await apiRes.json();
      const content = apiJson?.choices?.[0]?.message?.content || "";
      console.log("Z.AI API raw response:", content);

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        benchmarkData = JSON.parse(jsonMatch[0]);
        console.log("Benchmark data parsed successfully");
      } else {
        console.error("Could not parse Z.AI response:", content);
        return new Response(
          JSON.stringify({ error: "unavailable" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (apiErr) {
      console.error("Z.AI API call failed:", apiErr);
      return new Response(
        JSON.stringify({ error: "unavailable" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Save to cache
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await supabase
      .from("benchmarking_cache")
      .upsert(
        {
          category,
          subcategory,
          data: benchmarkData,
          created_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          hit_count: 1,
          last_hit_at: now.toISOString(),
          renewed_by: "lazy",
        },
        { onConflict: "category,subcategory" }
      );

    console.log("Cache saved for:", category, subcategory);

    return new Response(
      JSON.stringify({ data: benchmarkData, source: "api" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("get-benchmarking error:", err);
    return new Response(
      JSON.stringify({ error: "unavailable" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
