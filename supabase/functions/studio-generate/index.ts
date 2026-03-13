import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Safe JSON parser (character-by-character scanner) ─────────────────────
function safeParseJSON(raw: string): any {
  let s = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

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
    if (escaped) { result += char; escaped = false; continue; }
    if (char === "\\") { result += char; escaped = true; continue; }
    if (char === '"') { inString = !inString; result += char; continue; }
    if (inString) {
      if (char === "\n") { result += "\\n"; continue; }
      if (char === "\r") { result += "\\r"; continue; }
      if (char === "\t") { result += "\\t"; continue; }
    }
    result += char;
  }

  return JSON.parse(result);
}

// ── Gemini API caller ─────────────────────────────────────────────────────
async function callGemini(
  systemPrompt: string,
  userText: string,
  imageBase64?: string,
  imageMimeType?: string,
  maxTokens = 3000
): Promise<string> {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY não configurado");

  const model = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const userParts: any[] = [];

  if (imageBase64 && imageMimeType) {
    // Strip data URL prefix if present
    const pureBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
    userParts.push({
      inline_data: { mime_type: imageMimeType, data: pureBase64 },
    });
  }

  userParts.push({ text: userText });

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: userParts }],
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7, responseMimeType: "application/json" },
  };

  console.log(`[Gemini] model=${model}, hasImage=${!!imageBase64}, imageSize=${imageBase64?.length || 0} chars`);

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

${temNegocio ? `DADOS DO NEGÓCIO:
- Nome: ${p.nome || "não especificado"}
- Cidade: ${p.cidade || "não especificado"}
- Categoria: ${p.categoria || "não especificado"}
- Subcategoria: ${p.subcategoria || "não especificado"}
- Serviços: ${p.servicos || "não especificado"}
- Diferencial: ${p.diferencial || "não especificado"}
` : `NEGÓCIO: Dados não fornecidos — baseia-te na imagem e no objectivo.
Infere o tipo de negócio a partir do que vês na imagem.
`}

TOM POR EXTENSÃO (narrativa crescente ao longo dos 30s):
- Extensão 1 (0-6s): ${p.tomExt1 || "Emocional"} — apresentar e captar atenção
- Extensão 2 (6-12s): ${p.tomExt2 || "Qualidade"} — desenvolver o tema central
- Extensão 3 (12-18s): ${p.tomExt3 || "Confiança"} — reforçar credibilidade
- Extensão 4 (18-24s): ${p.tomExt4 || "Urgência"} — criar motivação para agir
- Extensão 5 (24-30s): ${p.tomExt5 || "CTA directo"} — CTA final com marca

ESTILO DO VÍDEO: ${p.estilo || "institucional"} — ${p.estiloDesc || ""}

REGRAS OBRIGATÓRIAS PARA OS PROMPTS GROK:
1 — EXTENSÃO 1: começa com "Animar esta imagem de forma natural e cinematográfica."
2 — EXTENSÕES 2-5: começam com "Estender o vídeo a partir do final da cena anterior."
3 — Movimentos suaves — NUNCA cortes bruscos
4 — VOZ em Português de Portugal — ${p.nome ? `usar "${p.nome}"` : "inferir nome do negócio da imagem"}
5 — TEXTO NO ECRÃ entre aspas duplas: "TEXTO"
6 — Cenário contínuo desde a imagem inicial
7 — EXTENSÃO 5 termina OBRIGATORIAMENTE com ${p.nome ? `"${p.nome}" e ` : ""}o URL "${p.businessUrl || "pededireto.pt"}" visível no TEXTO NO ECRÃ e mencionado na VOZ.

Analisa a imagem: identifica espaço, pessoas, serviço, ambiente, emoção.
O roteiro começa EXACTAMENTE nesse frame.

IMPORTANTE: Cada prompt deve ser curto e directo (máximo 3 frases). Não uses newlines dentro dos valores de texto.

Responde APENAS com JSON válido, sem markdown:
{
  "analise_imagem": "descrição: espaço, pessoas, serviço, ambiente, emoção",
  "estilo_aplicado": "${p.estilo || "institucional"}",
  "extensoes": [
    {"num": 1, "titulo": "Animação — ${p.tomExt1 || "Emocional"}", "prompt": "..."},
    {"num": 2, "titulo": "${p.tomExt2 || "Qualidade"} — desenvolvimento", "prompt": "..."},
    {"num": 3, "titulo": "${p.tomExt3 || "Confiança"} — detalhe", "prompt": "..."},
    {"num": 4, "titulo": "${p.tomExt4 || "Urgência"} — resultado", "prompt": "..."},
    {"num": 5, "titulo": "CTA Final${p.nome ? " — " + p.nome : ""}", "prompt": "...com pededireto.pt"}
  ],
  "copy_post": "legenda Instagram PT-PT com emojis, objectivo ${p.objectivo || "negócio"}, CTA para pededireto.pt",
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
O teu objectivo é gerar prompts ricas, específicas e cinematográficas para o Grok/Midjourney/Leonardo.

CONTEXTO FORNECIDO:
${p.objectivoImagem ? `- Objectivo: ${p.objectivoImagem}` : ""}
${p.nome ? `- Nome/Marca: ${p.nome}` : ""}
${p.sector ? `- Sector: ${p.sector}` : ""}
${p.descricao ? `- O que deve aparecer: ${p.descricao}` : ""}
${p.personagens ? `- Personagens/Pessoas: ${p.personagens}` : ""}
${p.ambiente ? `- Ambiente/Localização: ${p.ambiente}` : ""}
${p.textoSobreposto ? `- Texto sobreposto: ${p.textoSobreposto}` : ""}
${p.extras ? `- Elementos adicionais: ${p.extras}` : ""}
- Estilo visual: ${p.estilo || "local"}
- Proporção: ${p.proporcao || "9:16"}

ESTILOS VISUAIS:
- moderno: fundo escuro, neon verde/laranja, iluminação dramática, cyberpunk subtil
- limpo: fundo neutro/branco, luz natural suave, minimalista, profissional
- local: cores quentes terrosas, textura rústica portuguesa, luz de lanterna, acolhedor
- urgencia: alto contraste, vermelho/laranja vibrante, composição dinâmica, impacto imediato

${!hasContext ? `MODO CRIATIVO: O utilizador não forneceu contexto específico.
Sê criativo — gera uma prompt visualmente rica e apelativa baseada no estilo seleccionado (${p.estilo || "local"}).
Cria algo que qualquer negócio local português adoraria usar.
` : ""}

REGRAS OBRIGATÓRIAS:
1 — Prompts em inglês (melhor compatibilidade com todos os geradores)
2 — Proporção ${p.proporcao || "9:16"} obrigatória no final
3 — NUNCA incluir texto na imagem (excepto se textoSobreposto fornecido — nesse caso: "with text overlay: '${p.textoSobreposto || ""}'" no final)
4 — Fotorrealista e cinematográfico — nunca genérico
5 — Específico em detalhes de luz, composição e ângulo de câmara

Responde APENAS com JSON válido, sem markdown:
{
  "prompt_principal": "prompt completa em inglês, máximo 150 palavras, proporção ${p.proporcao || "9:16"}, fotorrealista, cinematográfica",
  "variante_a": "variante com ângulo/composição diferente, 100 palavras, proporção ${p.proporcao || "9:16"}",
  "variante_b": "variante com estilo/iluminação diferente, 100 palavras, proporção ${p.proporcao || "9:16"}",
  "instrucoes": "3-4 passos práticos em português de Portugal sobre como usar estas prompts no Grok/Midjourney e depois usar a imagem no workflow Grok Reel 5×6s"
}`;
}

// ── Main handler ──────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    console.log(`[studio-generate] action=${action}, imageSize=${payload.imageBase64?.length || 0} chars`);

    let rawText = "";

    if (action === "extract_profile") {
      rawText = await callGemini(EXTRACT_PROFILE_PROMPT, payload.text, undefined, undefined, 600);
    } else if (action === "generate_reel") {
      const systemPrompt = buildReelPrompt(payload);
      const userMessage = `Frame inicial do vídeo. Objectivo: ${payload.objectivo || "promover o negócio"}. ${payload.objectivoDescricao ? "Descrição: " + payload.objectivoDescricao : ""} ${payload.nome ? "Negócio: " + payload.nome : ""} ${payload.cidade ? "Cidade: " + payload.cidade : ""}`.trim();
      rawText = await callGemini(systemPrompt, userMessage, payload.imageBase64, payload.imageMimeType || "image/jpeg", 4096);
    } else if (action === "generate_image_prompt") {
      const systemPrompt = buildImagePrompt(payload);
      const userText = `Gera prompts de imagem para: ${payload.nome || payload.descricao || "negócio local português"}. Estilo: ${payload.estilo || "local"}. Proporção: ${payload.proporcao || "9:16"}.`;
      rawText = await callGemini(systemPrompt, userText, payload.referenceImageBase64, payload.referenceImageBase64 ? "image/jpeg" : undefined, 1200);
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
      console.error("JSON parse failed. Raw content:", rawText);
      return new Response(
        JSON.stringify({ error: "A IA gerou uma resposta malformada. Tenta novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (e) {
    console.error("studio-generate error:", e);

    // Handle Gemini-specific errors
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    const status = msg.includes("429") ? 429 : msg.includes("402") ? 402 : 500;
    const userMsg = status === 429
      ? "Limite de pedidos excedido. Tenta novamente em alguns segundos."
      : status === 402
      ? "Créditos insuficientes."
      : msg;

    return new Response(
      JSON.stringify({ error: userMsg }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
