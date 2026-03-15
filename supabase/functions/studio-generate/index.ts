import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Safe JSON parser ──────────────────────────────────────────────────────
function safeParseJSON(raw: string): any {
  let s = raw
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();
  const iObj = s.indexOf("{");
  const iArr = s.indexOf("[");
  let start: number, end: number;
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
      if (char === "\n") {
        result += "\\n";
        continue;
      }
      if (char === "\r") {
        result += "\\r";
        continue;
      }
      if (char === "\t") {
        result += "\\t";
        continue;
      }
    }
    result += char;
  }
  return JSON.parse(result);
}

// ── Gemini caller — suporta múltiplas imagens ─────────────────────────────
async function callGemini(
  systemPrompt: string,
  userText: string,
  images?: Array<{ base64: string; mimeType: string }>,
  maxTokens = 3000,
): Promise<string> {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY não configurado");

  const model = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const userParts: any[] = [];

  // Adicionar todas as imagens antes do texto
  if (images && images.length > 0) {
    images.forEach((img, idx) => {
      const pureBase64 = img.base64.includes(",") ? img.base64.split(",")[1] : img.base64;
      userParts.push({
        inline_data: { mime_type: img.mimeType, data: pureBase64 },
      });
      // Label para identificar cada imagem
      if (images.length > 1) {
        userParts.push({ text: `[Imagem ${idx + 1}]` });
      }
    });
  }

  userParts.push({ text: userText });

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: userParts }],
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.7,
      responseMimeType: "application/json",
    },
  };

  console.log(`[Gemini] model=${model}, images=${images?.length || 0}`);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Gemini] Error ${response.status}:`, errorText);
    throw new Error(`Gemini API error ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.error("[Gemini] Resposta inesperada:", JSON.stringify(result));
    throw new Error("Resposta vazia ou inesperada da Gemini API");
  }

  return text;
}

// ── Prompt builders ───────────────────────────────────────────────────────

const EXTRACT_PROFILE_PROMPT = `Analisa este texto de um perfil de negócio português e extrai os dados estruturados.

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
}`;

function buildReelPrompt(p: any): string {
  const temNegocio = p.nome || p.cidade || p.subcategoria;
  return `És especialista em criar roteiros de vídeo cinematográficos para IA (Grok Aurora) para negócios locais em Portugal.

OBJECTIVO DO REEL: ${p.objectivo || "promover o negócio"}
${p.objectivoDescricao ? `DESCRIÇÃO: ${p.objectivoDescricao}` : ""}

${
  temNegocio
    ? `DADOS DO NEGÓCIO:
- Nome: ${p.nome || "não especificado"}
- Cidade: ${p.cidade || "não especificado"}
- Categoria: ${p.categoria || "não especificado"}
- Subcategoria: ${p.subcategoria || "não especificado"}
- Serviços: ${p.servicos || "não especificado"}
- Diferencial: ${p.diferencial || "não especificado"}
`
    : `NEGÓCIO: Dados não fornecidos — baseia-te na imagem e no objectivo.\n`
}

TOM POR EXTENSÃO:
- Extensão 1 (0-6s): ${p.tomExt1 || "Emocional"}
- Extensão 2 (6-12s): ${p.tomExt2 || "Qualidade"}
- Extensão 3 (12-18s): ${p.tomExt3 || "Confiança"}
- Extensão 4 (18-24s): ${p.tomExt4 || "Urgência"}
- Extensão 5 (24-30s): ${p.tomExt5 || "CTA directo"}

ESTILO DO VÍDEO: ${p.estilo || "institucional"} — ${p.estiloDesc || ""}

REGRAS OBRIGATÓRIAS:
1 — EXTENSÃO 1: começa com "Animar esta imagem de forma natural e cinematográfica."
2 — EXTENSÕES 2-5: começam com "Estender o vídeo a partir do final da cena anterior."
3 — Movimentos suaves — NUNCA cortes bruscos
4 — VOZ em Português de Portugal
5 — TEXTO NO ECRÃ entre aspas duplas: "TEXTO"
6 — EXTENSÃO 5 termina com URL "${p.businessUrl || "pededireto.pt"}" no TEXTO NO ECRÃ e na VOZ.
7 — Cada prompt máximo 3 frases. Sem newlines dentro dos valores.

Responde APENAS com JSON válido:
{
  "analise_imagem": "descrição: espaço, pessoas, serviço, ambiente, emoção",
  "estilo_aplicado": "${p.estilo || "institucional"}",
  "extensoes": [
    {"num": 1, "titulo": "Animação — ${p.tomExt1 || "Emocional"}", "prompt": "..."},
    {"num": 2, "titulo": "${p.tomExt2 || "Qualidade"} — desenvolvimento", "prompt": "..."},
    {"num": 3, "titulo": "${p.tomExt3 || "Confiança"} — detalhe", "prompt": "..."},
    {"num": 4, "titulo": "${p.tomExt4 || "Urgência"} — resultado", "prompt": "..."},
    {"num": 5, "titulo": "CTA Final${p.nome ? " — " + p.nome : ""}", "prompt": "...com ${p.businessUrl || "pededireto.pt"}"}
  ],
  "copy_post": "legenda Instagram PT-PT com emojis e CTA para ${p.businessUrl || "pededireto.pt"}",
  "copy_story": "versão curta 2-3 linhas para story",
  "segmentacao": {
    "genero": "...", "idade": "...", "interesses": "...",
    "objetivo": "...", "orcamento_dia": "€X/dia"
  }
}`;
}

// ── NOVO: Prompt para multi-imagem ────────────────────────────────────────
function buildReelMultiImagePrompt(p: any): string {
  const numImages = p.images?.length || 1;
  const temNegocio = p.nome || p.cidade || p.subcategoria;

  return `És especialista em criar roteiros de vídeo cinematográficos para IA (Grok Aurora) para negócios locais em Portugal.

Foram fornecidas ${numImages} imagem(ns). A tua missão é:
1. Analisar cada imagem individualmente
2. Decidir a SEQUÊNCIA CINEMATOGRÁFICA ÓPTIMA — não tens de usar a ordem fornecida
3. Atribuir cada cena (extensão) à imagem que melhor serve o seu tom narrativo
4. Criar prompts específicos para cada imagem/cena

OBJECTIVO DO REEL: ${p.objectivo || "promover o negócio"}
${p.objectivoDescricao ? `DESCRIÇÃO: ${p.objectivoDescricao}` : ""}

${
  temNegocio
    ? `DADOS DO NEGÓCIO:
- Nome: ${p.nome || "não especificado"}
- Cidade: ${p.cidade || "não especificado"}
- Categoria: ${p.categoria || "não especificado"}
- Subcategoria: ${p.subcategoria || "não especificado"}
- Serviços: ${p.servicos || "não especificado"}
- Diferencial: ${p.diferencial || "não especificado"}
`
    : "NEGÓCIO: Infere da imagem.\n"
}

TOM POR EXTENSÃO:
- Extensão 1 (0-6s): ${p.tomExt1 || "Emocional"} — captar atenção
- Extensão 2 (6-12s): ${p.tomExt2 || "Qualidade"} — desenvolver
- Extensão 3 (12-18s): ${p.tomExt3 || "Confiança"} — credibilidade
- Extensão 4 (18-24s): ${p.tomExt4 || "Urgência"} — motivar
- Extensão 5 (24-30s): ${p.tomExt5 || "CTA directo"} — CTA final

ESTILO: ${p.estilo || "institucional"} — ${p.estiloDesc || ""}

REGRAS OBRIGATÓRIAS:
1 — EXTENSÃO 1: começa com "Animar a Imagem X de forma natural e cinematográfica." (X = número da imagem escolhida)
2 — EXTENSÕES 2-5: começam com "Estender o vídeo a partir do final da cena anterior. Transição suave para a Imagem X." (quando muda de imagem) OU "Estender o vídeo a partir do final da cena anterior." (quando continua na mesma imagem)
3 — Movimentos suaves — NUNCA cortes bruscos
4 — VOZ em Português de Portugal
5 — TEXTO NO ECRÃ entre aspas duplas
6 — EXTENSÃO 5 termina com "${p.businessUrl || "pededireto.pt"}" visível
7 — Cada prompt máximo 3 frases. Sem newlines nos valores.
8 — Se só foi fornecida 1 imagem, todas as extensões usam image_index: 1

LÓGICA DE SEQUÊNCIA:
- Identifica qual imagem tem mais impacto emocional → usa na Ext 1
- Identifica qual mostra melhor o produto/serviço → usa na Ext 2 ou 3
- Identifica qual transmite mais confiança/resultado → usa na Ext 3 ou 4
- Podes repetir imagens se fizer sentido narrativo
- Explica brevemente o raciocínio da sequência em "logica_sequencia"

Responde APENAS com JSON válido:
{
  "analise_imagens": [
    {"index": 1, "descricao": "o que vês nesta imagem", "melhor_para": "qual tom/cena serve melhor"},
    {"index": 2, "descricao": "...", "melhor_para": "..."}
  ],
  "logica_sequencia": "explicação breve de por que escolheste esta ordem",
  "estilo_aplicado": "${p.estilo || "institucional"}",
  "extensoes": [
    {"num": 1, "titulo": "Animação — ${p.tomExt1 || "Emocional"}", "image_index": 1, "prompt": "Animar a Imagem X..."},
    {"num": 2, "titulo": "${p.tomExt2 || "Qualidade"} — desenvolvimento", "image_index": 1, "prompt": "Estender..."},
    {"num": 3, "titulo": "${p.tomExt3 || "Confiança"} — detalhe", "image_index": 1, "prompt": "Estender..."},
    {"num": 4, "titulo": "${p.tomExt4 || "Urgência"} — resultado", "image_index": 1, "prompt": "Estender..."},
    {"num": 5, "titulo": "CTA Final${p.nome ? " — " + p.nome : ""}", "image_index": 1, "prompt": "Estender...com ${p.businessUrl || "pededireto.pt"}"}
  ],
  "copy_post": "legenda Instagram PT-PT com emojis e CTA para ${p.businessUrl || "pededireto.pt"}",
  "copy_story": "versão curta 2-3 linhas para story",
  "segmentacao": {
    "genero": "...", "idade": "...", "interesses": "...",
    "objetivo": "...", "orcamento_dia": "€X/dia"
  }
}`;
}

function buildImagePrompt(p: any): string {
  const hasContext = p.nome || p.sector || p.descricao || p.personagens || p.ambiente;
  return `És especialista em criar prompts de geração de imagem para marketing de negócios locais em Portugal.

CONTEXTO:
${p.objectivoImagem ? `- Objectivo: ${p.objectivoImagem}` : ""}
${p.nome ? `- Nome/Marca: ${p.nome}` : ""}
${p.sector ? `- Sector: ${p.sector}` : ""}
${p.descricao ? `- O que deve aparecer: ${p.descricao}` : ""}
${p.personagens ? `- Personagens: ${p.personagens}` : ""}
${p.ambiente ? `- Ambiente: ${p.ambiente}` : ""}
${p.textoSobreposto ? `- Texto sobreposto: ${p.textoSobreposto}` : ""}
${p.extras ? `- Extras: ${p.extras}` : ""}
- Estilo: ${p.estilo || "local"}
- Proporção: ${p.proporcao || "9:16"}

${!hasContext ? "MODO CRIATIVO: sem contexto específico, sê criativo e visualmente rico.\n" : ""}

REGRAS: Prompts em inglês, fotorrealista, cinematográfico, proporção ${p.proporcao || "9:16"}.

Responde APENAS com JSON válido:
{
  "prompt_principal": "prompt completa em inglês, máx 150 palavras, proporção ${p.proporcao || "9:16"}",
  "variante_a": "variante ângulo diferente, 100 palavras",
  "variante_b": "variante iluminação diferente, 100 palavras",
  "instrucoes": "3-4 passos práticos em português sobre como usar no Grok/Midjourney e depois no workflow Reel 5×6s"
}`;
}

// ── Main handler ──────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...payload } = await req.json();
    console.log(`[studio-generate] action=${action}`);

    let rawText = "";

    if (action === "extract_profile") {
      rawText = await callGemini(EXTRACT_PROFILE_PROMPT, payload.text, undefined, 600);
    } else if (action === "generate_reel") {
      // Single image — comportamento original
      const systemPrompt = buildReelPrompt(payload);
      const userMessage =
        `Frame inicial do vídeo. Objectivo: ${payload.objectivo || "promover o negócio"}. ${payload.objectivoDescricao ? "Descrição: " + payload.objectivoDescricao : ""} ${payload.nome ? "Negócio: " + payload.nome : ""} ${payload.cidade ? "Cidade: " + payload.cidade : ""}`.trim();
      const images = payload.imageBase64
        ? [{ base64: payload.imageBase64, mimeType: payload.imageMimeType || "image/jpeg" }]
        : undefined;
      rawText = await callGemini(systemPrompt, userMessage, images, 4096);
    } else if (action === "generate_reel_multi") {
      // Multi-image — nova action
      const systemPrompt = buildReelMultiImagePrompt(payload);
      const userMessage =
        `${payload.images?.length || 0} imagens fornecidas. Objectivo: ${payload.objectivo || "promover o negócio"}. ${payload.objectivoDescricao || ""} ${payload.nome ? "Negócio: " + payload.nome : ""}`.trim();

      // Converter array de imagens para o formato esperado
      const images: Array<{ base64: string; mimeType: string }> = (payload.images || []).map((img: any) => ({
        base64: img.base64,
        mimeType: img.mimeType || "image/jpeg",
      }));

      if (images.length === 0) {
        return new Response(JSON.stringify({ error: "Nenhuma imagem fornecida" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      rawText = await callGemini(systemPrompt, userMessage, images, 5000);
    } else if (action === "generate_image_prompt") {
      const systemPrompt = buildImagePrompt(payload);
      const userText = `Gera prompts de imagem para: ${payload.nome || payload.descricao || "negócio local português"}. Estilo: ${payload.estilo || "local"}. Proporção: ${payload.proporcao || "9:16"}.`;
      const images = payload.referenceImageBase64
        ? [{ base64: payload.referenceImageBase64, mimeType: "image/jpeg" }]
        : undefined;
      rawText = await callGemini(systemPrompt, userText, images, 1200);
    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const parsed = safeParseJSON(rawText);
      return new Response(JSON.stringify({ content: parsed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (parseErr) {
      console.error("JSON parse failed. Raw:", rawText);
      return new Response(JSON.stringify({ error: "A IA gerou uma resposta malformada. Tenta novamente." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("studio-generate error:", e);
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    const status = msg.includes("429") ? 429 : msg.includes("402") ? 402 : 500;
    const userMsg =
      status === 429
        ? "Limite de pedidos excedido. Tenta novamente em alguns segundos."
        : status === 402
          ? "Créditos insuficientes."
          : msg;
    return new Response(JSON.stringify({ error: userMsg }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
