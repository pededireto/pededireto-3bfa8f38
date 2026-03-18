import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ZHIPU_API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";

const PRELOAD_CATEGORIES = [
  { category: "Beleza", subcategory: "Barbeiro" },
  { category: "Beleza", subcategory: "Cabeleireiro" },
  { category: "Beleza", subcategory: "Manicure & Pedicure" },
  { category: "Saúde", subcategory: "Dentista" },
  { category: "Saúde", subcategory: "Fisioterapia" },
  { category: "Construção", subcategory: "Electricista" },
  { category: "Construção", subcategory: "Canalizador" },
  { category: "Limpezas & Manutenção", subcategory: "Limpeza Doméstica" },
  { category: "Restauração", subcategory: "Restaurante" },
  { category: "Serviços Profissionais", subcategory: "Contabilidade" },
];

async function callZhipuAPI(category: string, subcategory: string, apiKey: string) {
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

  const res = await fetch(ZHIPU_API_URL, {
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
    console.error(`Z.AI error for ${category}/${subcategory}:`, res.status, errText);
    return null;
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content || "";
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) return null;
  return JSON.parse(match[0]);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const zhipuKey = Deno.env.get("ZHIPU_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    if (!zhipuKey) {
      return new Response(JSON.stringify({ error: "ZHIPU_API_KEY not set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: string[] = [];

    // 1. Check if cache is empty → preload top categories
    const { count } = await supabase.from("benchmarking_cache").select("id", { count: "exact", head: true });

    if (count === 0) {
      for (const item of PRELOAD_CATEGORIES) {
        const data = await callZhipuAPI(item.category, item.subcategory, zhipuKey);
        if (data) {
          const now = new Date();
          await supabase.from("benchmarking_cache").upsert(
            {
              category: item.category,
              subcategory: item.subcategory,
              data,
              created_at: now.toISOString(),
              expires_at: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              hit_count: 0,
              renewed_by: "preload",
            },
            { onConflict: "category,subcategory" }
          );
          results.push(`preloaded: ${item.category}/${item.subcategory}`);
        }
        // Rate limiting: wait 1s between calls
        await new Promise((r) => setTimeout(r, 1000));
      }
      return new Response(JSON.stringify({ preloaded: results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Renew popular categories expiring within 5 days
    const fiveDaysFromNow = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    const { data: popular } = await supabase
      .from("benchmarking_cache")
      .select("*")
      .gte("hit_count", 10)
      .lt("expires_at", fiveDaysFromNow)
      .order("hit_count", { ascending: false });

    if (popular) {
      for (const row of popular) {
        const data = await callZhipuAPI(row.category, row.subcategory, zhipuKey);
        if (data) {
          const now = new Date();
          await supabase
            .from("benchmarking_cache")
            .update({
              data,
              created_at: now.toISOString(),
              expires_at: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              renewed_by: "cron",
            })
            .eq("id", row.id);
          results.push(`renewed: ${row.category}/${row.subcategory}`);
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    // 3. Check expired caches >5 days without renewal → admin notification
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const { data: stale } = await supabase
      .from("benchmarking_cache")
      .select("*")
      .lt("expires_at", fiveDaysAgo)
      .gt("hit_count", 0);

    if (stale && stale.length > 0) {
      for (const row of stale) {
        await supabase.from("internal_notifications").insert({
          type: "cache_expired",
          target_role: "admin",
          title: "Cache de benchmarking expirada",
          message: `Cache expirada: ${row.category} / ${row.subcategory} — ${row.hit_count} consultas registadas.`,
        });
        results.push(`notified: ${row.category}/${row.subcategory}`);
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("renew-benchmarking-cache error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
