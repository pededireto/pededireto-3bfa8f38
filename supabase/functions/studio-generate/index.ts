import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Robust JSON parser — character-by-character scanner that fixes
 * literal newlines/tabs inside JSON string values produced by LLMs.
 */
function safeParseJSON(raw: string): any {
  // Remove markdown fences
  let s = raw
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();

  // Extract JSON object or array
  const iObj = s.indexOf("{");
  const iArr = s.indexOf("[");
  let start: number;
  let end: number;

  if (iObj === -1 && iArr === -1) throw new Error("No JSON found in response");

  if (iArr === -1 || (iObj !== -1 && iObj < iArr)) {
    start = iObj;
    end = s.lastIndexOf("}");
  } else {
    start = iArr;
    end = s.lastIndexOf("]");
  }

  if (end === -1) throw new Error("No JSON found in response");
  s = s.slice(start, end + 1);

  // Fix unescaped newlines, tabs and carriage returns inside JSON string values
  let result = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < s.length; i++) {
    const char = s[i];

    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      result += char;
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }

    if (inString) {
      if (char === "\n") { result += "\\n"; continue; }
      if (char === "\r") { result += "\\r"; continue; }
      if (char === "\t") { result += "\\t"; continue; }
    }

    result += char;
  }

  return JSON.parse(result);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...payload } = await req.json();

    let messages: any[];

    if (action === "extract_profile") {
      messages = [
        {
          role: "system",
          content: `Analisa este texto de um perfil de negócio português e extrai os dados estruturados.

Responde APENAS com JSON válido, sem markdown, sem texto extra:
{
  "nome": "nome do negócio",
  "cidade": "cidade/localidade",
  "categoria_key": "uma de: obras|restauracao|beleza|saude|profissionais|transporte|comercio|educacao|tecnologia|eventos",
  "subcategoria": "subcategoria específica do negócio",
  "servicos": "lista de serviços principais separados por vírgula",
  "diferencial": "o que torna este negócio especial — extraído do texto, com emoção se possível",
  "tom_sugerido": "um de: emocional|institucional|urgente|proximidade — baseado no texto",
  "estilo_sugerido": "um de: institucional|promocao|historia|produto — baseado no texto",
  "resumo_preview": "resumo de 1 linha: nome + cidade + categoria"
}`,
        },
        { role: "user", content: payload.text },
      ];
    } else if (action === "generate_reel") {
      const {
        nome, cidade, categoria, subcategoria, servicos, diferencial,
        estilo, estilo_descricao, toms, imageBase64,
      } = payload;

      const systemPrompt = `És especialista em criar roteiros de vídeo cinematográficos para IA (Grok Aurora) para negócios locais em Portugal.

VARIÁVEIS DO NEGÓCIO:
- Nome: ${nome}
- Cidade: ${cidade}
- Categoria: ${categoria}
- Subcategoria: ${subcategoria}
- Serviços: ${servicos}
- Diferencial / Emoção: ${diferencial}
- Estilo do vídeo: ${estilo} — ${estilo_descricao}

TOM POR EXTENSÃO (narrativa crescente ao longo dos 30s):
- Extensão 1 (0-6s): ${toms[0]} — apresentar o negócio e captar atenção
- Extensão 2 (6-12s): ${toms[1]} — mostrar qualidade do serviço/produto
- Extensão 3 (12-18s): ${toms[2]} — transmitir confiança e experiência
- Extensão 4 (18-24s): ${toms[3]} — criar motivação para agir
- Extensão 5 (24-30s): ${toms[4]} — CTA final com marca

REGRAS OBRIGATÓRIAS PARA OS PROMPTS GROK:
1 — EXTENSÃO 1: começa sempre com "Animar esta imagem de forma natural e cinematográfica."
2 — EXTENSÕES 2-5: começam SEMPRE com "Estender o vídeo a partir do final da cena anterior."
3 — Movimentos de câmara suaves e específicos: "a câmara aproxima-se ligeiramente", "plano aproximado do detalhe", "a câmara afasta-se ligeiramente" — NUNCA cortes bruscos ou "camera cuts to".
4 — VOZ sempre em Português de Portugal — usar o nome real "${nome}" e cidade "${cidade}" de forma natural. Adaptar ao tom definido por extensão.
5 — TEXTO NO ECRÃ entre aspas duplas: "TEXTO AQUI". Cada extensão tem texto de ecrã diferente e relevante.
6 — Nunca mudar o cenário principal — o vídeo é contínuo desde a imagem inicial.
7 — EXTENSÃO 5 termina sempre com "${nome}" visível e "pededireto.pt".

Analisa a imagem recebida: identifica espaço, pessoas, serviço, ambiente, emoção detectada.
O roteiro começa EXACTAMENTE nesse frame — nunca assumir um cenário diferente do que está na imagem.

IMPORTANTE: Cada prompt deve ser curto e directo (máximo 3 frases). Não uses newlines dentro dos valores de texto — escreve tudo numa linha contínua.

Responde APENAS com JSON válido, sem markdown, sem texto extra:
{
  "analise_imagem": "descrição da imagem em 1 linha",
  "estilo_aplicado": "${estilo}",
  "extensoes": [
    {"num": 1, "titulo": "Animação — ${toms[0]}", "prompt": "prompt completa em português para Grok numa só linha"},
    {"num": 2, "titulo": "${toms[1]} — serviço em acção", "prompt": "prompt completa numa só linha"},
    {"num": 3, "titulo": "${toms[2]} — detalhe", "prompt": "prompt completa numa só linha"},
    {"num": 4, "titulo": "${toms[3]} — resultado", "prompt": "prompt completa numa só linha"},
    {"num": 5, "titulo": "CTA Final — ${nome}", "prompt": "prompt completa com pededireto.pt numa só linha"}
  ],
  "copy_post": "legenda Instagram PT-PT com emojis, estilo ${estilo}, CTA para pededireto.pt",
  "copy_story": "versão curta 2-3 linhas para story",
  "segmentacao": {
    "genero": "...",
    "idade": "...",
    "interesses": "...",
    "objetivo": "...",
    "orcamento_dia": "€X/dia"
  }
}`;

      const userContent: any[] = [
        {
          type: "text",
          text: `Frame inicial do vídeo de ${subcategoria} para '${nome}' em ${cidade}.\nEstilo: ${estilo} | Toms: ${toms.join(" → ")}\nWebsite final: pededireto.pt`,
        },
      ];

      if (imageBase64) {
        userContent.unshift({
          type: "image_url",
          image_url: { url: imageBase64 },
        });
      }

      messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ];
    } else if (action === "generate_image_prompt") {
      const { nome, sector, descricao, estilo, texto_sobreposto, extras, referenceImageBase64 } = payload;

      const systemPrompt = `És especialista em prompts de geração de imagem para marketing em Portugal.
Negócio: ${nome} | Sector: ${sector} | O que mostrar: ${descricao} | Estilo: ${estilo}
${texto_sobreposto ? "Texto sobreposto: " + texto_sobreposto : ""}
${extras ? "Extras: " + extras : ""}

Responde APENAS com JSON válido, sem markdown. Escreve tudo numa linha contínua sem quebras de linha dentro dos valores. Estrutura:
{
  "prompt_principal": "prompt completa em inglês para Grok/ChatGPT/Leonardo, formato 9:16 vertical, fotorrealista, cinematográfico, cores profissionais, SEM texto na imagem, máximo 150 palavras",
  "variante_a": "variante com ângulo ou composição diferente, 100 palavras",
  "variante_b": "variante com estilo/iluminação diferente, 100 palavras",
  "instrucoes": "3-4 passos práticos em português de Portugal sobre como usar estas prompts no Grok com extensão de vídeo"
}`;

      const userContent: any[] = [
        { type: "text", text: `Gera prompts de imagem para o negócio ${nome} no sector ${sector}.` },
      ];

      if (referenceImageBase64) {
        userContent.unshift({
          type: "image_url",
          image_url: { url: referenceImageBase64 },
        });
      }

      messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ];
    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de pedidos excedido. Tenta novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON on the server side with the robust parser
    try {
      const parsed = safeParseJSON(rawContent);
      return new Response(JSON.stringify({ content: parsed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (parseErr) {
      console.error("JSON parse failed. Raw content:", rawContent);
      return new Response(
        JSON.stringify({ error: "A IA gerou uma resposta malformada. Tenta novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (e) {
    console.error("studio-generate error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
