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

// ── Gemini caller ─────────────────────────────────────────────────────────
async function callGemini(
  systemPrompt: string,
  userText: string,
  images?: Array<{ base64: string; mimeType: string }>,
  maxTokens = 3000,
): Promise<string> {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY nao configurado");

  const model = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const userParts: any[] = [];
  if (images && images.length > 0) {
    images.forEach((img, idx) => {
      const pureBase64 = img.base64.includes(",") ? img.base64.split(",")[1] : img.base64;
      userParts.push({ inline_data: { mime_type: img.mimeType, data: pureBase64 } });
      if (images.length > 1) userParts.push({ text: `[Imagem ${idx + 1}]` });
    });
  }
  userParts.push({ text: userText });

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: userParts }],
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7, responseMimeType: "application/json" },
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

const EXTRACT_PROFILE_PROMPT = `Analisa este texto de um perfil de negocio portugues e extrai os dados estruturados.

Responde APENAS com JSON valido, sem markdown, sem texto extra:
{
  "nome": "nome do negocio",
  "cidade": "cidade/localidade",
  "categoria_key": "uma de: obras|restauracao|beleza|saude|profissionais|transporte|comercio|educacao|tecnologia|eventos",
  "subcategoria": "subcategoria especifica do negocio",
  "servicos": "lista de servicos principais separados por virgula",
  "diferencial": "o que torna este negocio especial",
  "tom_sugerido": "um de: emocional|institucional|urgente|proximidade",
  "estilo_sugerido": "um de: institucional|promocao|historia|produto",
  "resumo_preview": "resumo de 1 linha: nome + cidade + categoria"
}`;

// REGRA GLOBAL DE VOZ: sempre PT-PT (Portugal), nunca brasileiro
const REGRA_VOZ_PTPT = `REGRA CRITICA DE IDIOMA: A VOZ OFF deve ser SEMPRE em Portugues de Portugal (PT-PT).
NUNCA uses expressoes brasileiras. Usa vocabulario, expressoes e entoacao de Portugal.
Exemplos PT-PT: "Ja provaste", "Fica a saber", "Experimenta", "Nao percas", "Reserva ja", "Ven ca".
NUNCA uses: "Voce", "Fica por dentro", "Confira", "Aproveite", "Nao perca" (brasileiro).`;

function buildReelPrompt(p: any): string {
  const temNegocio = p.nome || p.cidade || p.subcategoria;
  return `Es especialista em criar roteiros de video cinematograficos para IA (Grok Aurora) para negocios locais em Portugal.

${REGRA_VOZ_PTPT}

OBJECTIVO DO REEL: ${p.objectivo || "promover o negocio"}
${p.objectivoDescricao ? `DESCRICAO: ${p.objectivoDescricao}` : ""}

${
  temNegocio
    ? `DADOS DO NEGOCIO:
- Nome: ${p.nome || "nao especificado"}
- Cidade: ${p.cidade || "nao especificado"}
- Categoria: ${p.categoria || "nao especificado"}
- Subcategoria: ${p.subcategoria || "nao especificado"}
- Servicos: ${p.servicos || "nao especificado"}
- Diferencial: ${p.diferencial || "nao especificado"}
`
    : `NEGOCIO: Dados nao fornecidos - baseia-te na imagem e no objectivo.\n`
}

TOM POR EXTENSAO:
- Extensao 1 (0-6s): ${p.tomExt1 || "Emocional"}
- Extensao 2 (6-12s): ${p.tomExt2 || "Qualidade"}
- Extensao 3 (12-18s): ${p.tomExt3 || "Confianca"}
- Extensao 4 (18-24s): ${p.tomExt4 || "Urgencia"}
- Extensao 5 (24-30s): ${p.tomExt5 || "CTA directo"}

ESTILO DO VIDEO: ${p.estilo || "institucional"} - ${p.estiloDesc || ""}

REGRAS OBRIGATORIAS:
1 - EXTENSAO 1: comeca com "Animar esta imagem de forma natural e cinematografica."
2 - EXTENSOES 2-5: comecam com "Estender o video a partir do final da cena anterior."
3 - Movimentos suaves - NUNCA cortes bruscos
4 - VOZ em Portugues de Portugal (PT-PT) - ver regra critica acima
5 - TEXTO NO ECRA entre aspas duplas: "TEXTO"
6 - EXTENSAO 5 termina com URL "${p.businessUrl || "pededireto.pt"}" no TEXTO NO ECRA e na VOZ.
7 - Cada prompt maximo 3 frases. Sem newlines dentro dos valores.

Responde APENAS com JSON valido:
{
  "analise_imagem": "descricao: espaco, pessoas, servico, ambiente, emocao",
  "estilo_aplicado": "${p.estilo || "institucional"}",
  "extensoes": [
    {"num": 1, "titulo": "Animacao - ${p.tomExt1 || "Emocional"}", "prompt": "..."},
    {"num": 2, "titulo": "${p.tomExt2 || "Qualidade"} - desenvolvimento", "prompt": "..."},
    {"num": 3, "titulo": "${p.tomExt3 || "Confianca"} - detalhe", "prompt": "..."},
    {"num": 4, "titulo": "${p.tomExt4 || "Urgencia"} - resultado", "prompt": "..."},
    {"num": 5, "titulo": "CTA Final${p.nome ? " - " + p.nome : ""}", "prompt": "...com ${p.businessUrl || "pededireto.pt"}"}
  ],
  "copy_post": "legenda Instagram PT-PT com emojis e CTA para ${p.businessUrl || "pededireto.pt"}",
  "copy_story": "versao curta 2-3 linhas para story",
  "segmentacao": {
    "genero": "...", "idade": "...", "interesses": "...",
    "objetivo": "...", "orcamento_dia": "EX/dia"
  }
}`;
}

function buildReelMultiImagePrompt(p: any): string {
  const numImages = p.images?.length || 1;
  const temNegocio = p.nome || p.cidade || p.subcategoria;
  return `Es especialista em criar roteiros de video cinematograficos para IA (Grok Aurora) para negocios locais em Portugal.

${REGRA_VOZ_PTPT}

Foram fornecidas ${numImages} imagem(ns). A tua missao e:
1. Analisar cada imagem individualmente
2. Decidir a SEQUENCIA CINEMATOGRAFICA OPTIMA
3. Atribuir cada cena a imagem que melhor serve o seu tom narrativo
4. Criar prompts especificos para cada imagem/cena

OBJECTIVO DO REEL: ${p.objectivo || "promover o negocio"}
${p.objectivoDescricao ? `DESCRICAO: ${p.objectivoDescricao}` : ""}

${
  temNegocio
    ? `DADOS DO NEGOCIO:
- Nome: ${p.nome || "nao especificado"}
- Cidade: ${p.cidade || "nao especificado"}
- Categoria: ${p.categoria || "nao especificado"}
- Subcategoria: ${p.subcategoria || "nao especificado"}
- Servicos: ${p.servicos || "nao especificado"}
- Diferencial: ${p.diferencial || "nao especificado"}
`
    : "NEGOCIO: Infere da imagem.\n"
}

TOM POR EXTENSAO:
- Extensao 1 (0-6s): ${p.tomExt1 || "Emocional"} - captar atencao
- Extensao 2 (6-12s): ${p.tomExt2 || "Qualidade"} - desenvolver
- Extensao 3 (12-18s): ${p.tomExt3 || "Confianca"} - credibilidade
- Extensao 4 (18-24s): ${p.tomExt4 || "Urgencia"} - motivar
- Extensao 5 (24-30s): ${p.tomExt5 || "CTA directo"} - CTA final

ESTILO: ${p.estilo || "institucional"} - ${p.estiloDesc || ""}

REGRAS OBRIGATORIAS:
1 - EXTENSAO 1: "Animar a Imagem X de forma natural e cinematografica."
2 - EXTENSOES 2-5: "Estender o video a partir do final da cena anterior. Transicao suave para a Imagem X." (quando muda) OU "Estender o video a partir do final da cena anterior." (mesma imagem)
3 - Movimentos suaves - NUNCA cortes bruscos
4 - VOZ em Portugues de Portugal (PT-PT) - ver regra critica acima
5 - TEXTO NO ECRA entre aspas duplas
6 - EXTENSAO 5 termina com "${p.businessUrl || "pededireto.pt"}" visivel
7 - Cada prompt maximo 3 frases. Sem newlines nos valores.

Responde APENAS com JSON valido:
{
  "analise_imagens": [
    {"index": 1, "descricao": "o que ves nesta imagem", "melhor_para": "qual tom/cena serve melhor"}
  ],
  "logica_sequencia": "explicacao breve da ordem escolhida",
  "estilo_aplicado": "${p.estilo || "institucional"}",
  "extensoes": [
    {"num": 1, "titulo": "Animacao - ${p.tomExt1 || "Emocional"}", "image_index": 1, "prompt": "Animar a Imagem X..."},
    {"num": 2, "titulo": "${p.tomExt2 || "Qualidade"} - desenvolvimento", "image_index": 1, "prompt": "Estender..."},
    {"num": 3, "titulo": "${p.tomExt3 || "Confianca"} - detalhe", "image_index": 1, "prompt": "Estender..."},
    {"num": 4, "titulo": "${p.tomExt4 || "Urgencia"} - resultado", "image_index": 1, "prompt": "Estender..."},
    {"num": 5, "titulo": "CTA Final${p.nome ? " - " + p.nome : ""}", "image_index": 1, "prompt": "Estender...com ${p.businessUrl || "pededireto.pt"}"}
  ],
  "copy_post": "legenda Instagram PT-PT com emojis e CTA para ${p.businessUrl || "pededireto.pt"}",
  "copy_story": "versao curta 2-3 linhas para story",
  "segmentacao": {
    "genero": "...", "idade": "...", "interesses": "...",
    "objetivo": "...", "orcamento_dia": "EX/dia"
  }
}`;
}

function buildImagePrompt(p: any): string {
  const hasContext = p.nome || p.sector || p.descricao || p.personagens || p.ambiente;
  return `Es especialista em criar prompts de geracao de imagem para marketing de negocios locais em Portugal.

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
- Proporcao: ${p.proporcao || "9:16"}

${!hasContext ? "MODO CRIATIVO: sem contexto especifico, se criativo e visualmente rico.\n" : ""}

REGRAS: Prompts em ingles, fotorrealista, cinematografico, proporcao ${p.proporcao || "9:16"}.

Responde APENAS com JSON valido:
{
  "prompt_principal": "prompt completa em ingles, max 150 palavras, proporcao ${p.proporcao || "9:16"}",
  "variante_a": "variante angulo diferente, 100 palavras",
  "variante_b": "variante iluminacao diferente, 100 palavras",
  "instrucoes": "3-4 passos praticos em portugues sobre como usar no Grok/Midjourney e depois no workflow Reel 5x6s"
}`;
}

// ── NOVO: generate_reel_storyboard ────────────────────────────────────────
// Gera 5 variantes de imagem (uma por cena do Reel) com parametros cinematograficos
// e voiceover + screen_text em PT-PT para cada cena
function buildReelStoryboardPrompt(p: any): string {
  return `Es um director de fotografia e copywriter especialista em conteudo para redes sociais de negocios locais em Portugal.

${REGRA_VOZ_PTPT}

A tua missao e criar um STORYBOARD COMPLETO para um Reel de 30 segundos.
Para cada uma das 5 cenas (6 segundos cada), geras:
- Parametros cinematograficos para gerar a imagem no Grok
- Voz off em PT-PT (max 12 palavras - tem de caber em 6 segundos)
- Texto no ecra (max 5 palavras - impacto visual imediato)
- Prompt completo de imagem em ingles

CONTEXTO DO NEGOCIO:
${p.nome ? `- Nome: ${p.nome}` : ""}
${p.sector ? `- Sector: ${p.sector}` : ""}
${p.descricao ? `- Historia/Descricao: ${p.descricao}` : ""}
${p.objectivoImagem ? `- Objectivo: ${p.objectivoImagem}` : "- Objectivo: promover o negocio"}
${p.personagens ? `- Personagens: ${p.personagens}` : ""}
${p.ambiente ? `- Ambiente: ${p.ambiente}` : ""}
${p.extras ? `- Extras: ${p.extras}` : ""}
- Estilo visual: ${p.estilo || "local"}
- Proporcao: ${p.proporcao || "9:16"}

ESTRUTURA NARRATIVA OBRIGATORIA DOS 30 SEGUNDOS:
- Cena 1 (0-6s) HOOK: captar atencao imediata - plano de impacto
- Cena 2 (6-12s) DESENVOLVIMENTO: apresentar o valor/produto
- Cena 3 (12-18s) CONFIANCA: credibilidade, detalhe, qualidade
- Cena 4 (18-24s) URGENCIA: motivar a acao
- Cena 5 (24-30s) CTA: chamada para acao clara

REGRAS DE QUALIDADE:
- O voiceover das 5 cenas conta uma historia coerente do inicio ao fim
- Cada prompt de imagem deve ser cinematografico e em ingles
- Camera, lighting, composition e emotion em ingles (para usar diretamente no Grok)
- Voiceover em PT-PT - NUNCA brasileiro
- screen_text impactante, max 5 palavras

Responde APENAS com JSON valido, sem markdown, sem texto extra:
{
  "instrucao_reel": "estrategia cinematografica geral para os 30 segundos em 1-2 frases",
  "cenas": [
    {
      "titulo": "HOOK",
      "foco": "captar atencao",
      "camera": "extreme close-up, rack focus",
      "lighting": "warm golden hour backlight",
      "composition": "rule of thirds, subject off-center",
      "emotion": "curiosity and desire",
      "prompt": "Cinematic extreme close-up of [descricao em ingles]... 9:16 vertical, photorealistic",
      "voiceover": "frase impactante em PT-PT, max 12 palavras",
      "screen_text": "TEXTO IMPACTO"
    },
    {
      "titulo": "DESENVOLVIMENTO",
      "foco": "apresentar valor",
      "camera": "medium shot, slow dolly in",
      "lighting": "soft diffused light, warm tones",
      "composition": "centered subject, depth layers",
      "emotion": "warmth and quality",
      "prompt": "...",
      "voiceover": "...",
      "screen_text": "..."
    },
    {
      "titulo": "CONFIANCA",
      "foco": "credibilidade",
      "camera": "close-up detail shot",
      "lighting": "natural window light",
      "composition": "macro texture, shallow depth of field",
      "emotion": "trust and authenticity",
      "prompt": "...",
      "voiceover": "...",
      "screen_text": "..."
    },
    {
      "titulo": "URGENCIA",
      "foco": "motivar accao",
      "camera": "dynamic angle, slight low angle",
      "lighting": "high contrast, dramatic",
      "composition": "leading lines, asymmetric",
      "emotion": "urgency and excitement",
      "prompt": "...",
      "voiceover": "...",
      "screen_text": "..."
    },
    {
      "titulo": "CTA",
      "foco": "chamada para accao",
      "camera": "wide establishing shot or brand close-up",
      "lighting": "clean, professional",
      "composition": "centered, balanced",
      "emotion": "confidence and invitation",
      "prompt": "...",
      "voiceover": "...",
      "screen_text": "..."
    }
  ]
}`;
}

// ── NOVO: generate_reel_full_package ──────────────────────────────────────
// Recebe as cenas ja geradas e produz script + legenda + hashtags + copy de anuncio
function buildReelFullPackagePrompt(p: any): string {
  const cenasFormatadas = (p.cenas || []).map((c: any) => `CENA ${c.num} - ${c.titulo}:\n${c.prompt}`).join("\n\n");

  return `Es copywriter especialista em marketing digital para negocios locais em Portugal.

${REGRA_VOZ_PTPT}

Com base no storyboard do Reel abaixo, cria o pacote de conteudo completo.

NEGOCIO:
${p.nome ? `- Nome: ${p.nome}` : ""}
${p.sector ? `- Sector: ${p.sector}` : ""}
${p.descricao ? `- Descricao: ${p.descricao}` : ""}

STORYBOARD DO REEL:
${cenasFormatadas}

${p.instrucao_reel ? `ESTRATEGIA CINEMATOGRAFICA: ${p.instrucao_reel}` : ""}

REGRAS:
- Tudo em Portugues de Portugal (PT-PT) - NUNCA brasileiro
- Legenda com emojis, max 2200 caracteres (limite Instagram)
- Hashtags: mix de PT + ingles, max 30
- Script: naracao coerente dos 30 segundos, guia para o criador
- Copy do anuncio: direto, urgente, max 125 caracteres (limite Meta primary text)
- CTA: maximo 4 palavras, acao clara

Responde APENAS com JSON valido:
{
  "reel": {
    "script": "naracao completa dos 30 segundos - o que dizer em cada cena, guia para o criador",
    "duracao": "30s"
  },
  "instagram": {
    "legenda": "legenda completa com emojis, hashtags no final, CTA para o negocio",
    "hashtags": ["#portugal", "#negociolocal", "..."]
  },
  "ads": {
    "copy": "texto do anuncio Meta Ads, max 125 caracteres, direto e urgente",
    "cta": "Reserva Ja"
  }
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

    // ── Normalizar actions antigas ─────────────────────────
    const actionMap: Record<string, string> = {
      generate_reel_completo: "generate_reel_full_package",
      generate_image_prompt_reel: "generate_reel_storyboard",
      reel_storyboard: "generate_reel_storyboard",
    };

    const normalizedAction = actionMap[action] || action;

    console.log("[studio-generate] action recebida:", action);
    console.log("[studio-generate] action normalizada:", normalizedAction);
    console.log("[studio-generate] payload keys:", Object.keys(payload || {}));

    let rawText = "";

    if (action === "extract_profile") {
      rawText = await callGemini(EXTRACT_PROFILE_PROMPT, payload.text, undefined, 600);
    } else if (action === "generate_reel") {
      const systemPrompt = buildReelPrompt(payload);
      const userMessage =
        `Frame inicial do video. Objectivo: ${payload.objectivo || "promover o negocio"}. ${payload.objectivoDescricao ? "Descricao: " + payload.objectivoDescricao : ""} ${payload.nome ? "Negocio: " + payload.nome : ""} ${payload.cidade ? "Cidade: " + payload.cidade : ""}`.trim();
      const images = payload.imageBase64
        ? [{ base64: payload.imageBase64, mimeType: payload.imageMimeType || "image/jpeg" }]
        : undefined;
      rawText = await callGemini(systemPrompt, userMessage, images, 4096);
    } else if (action === "generate_reel_multi") {
      const systemPrompt = buildReelMultiImagePrompt(payload);
      const userMessage =
        `${payload.images?.length || 0} imagens fornecidas. Objectivo: ${payload.objectivo || "promover o negocio"}. ${payload.objectivoDescricao || ""} ${payload.nome ? "Negocio: " + payload.nome : ""}`.trim();
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
      const userText = `Gera prompts de imagem para: ${payload.nome || payload.descricao || "negocio local portugues"}. Estilo: ${payload.estilo || "local"}. Proporcao: ${payload.proporcao || "9:16"}.`;
      const images = payload.referenceImageBase64
        ? [{ base64: payload.referenceImageBase64, mimeType: "image/jpeg" }]
        : undefined;
      rawText = await callGemini(systemPrompt, userText, images, 1200);
    } else if (action === "generate_reel_storyboard") {
      // Novo: storyboard com camera/lighting/composition/emotion/voiceover/screen_text
      const systemPrompt = buildReelStoryboardPrompt(payload);
      const userText = `Cria o storyboard completo para: ${payload.nome || payload.descricao || "negocio local portugues"}. Estilo: ${payload.estilo || "local"}. Proporcao: ${payload.proporcao || "9:16"}.`;
      const images = payload.referenceImageBase64
        ? [{ base64: payload.referenceImageBase64, mimeType: "image/jpeg" }]
        : undefined;
      rawText = await callGemini(systemPrompt, userText, images, 3000);
    } else if (action === "generate_reel_full_package") {
      // Novo: script + legenda + hashtags + copy de anuncio
      const systemPrompt = buildReelFullPackagePrompt(payload);
      const userText = `Cria o pacote completo de conteudo para o Reel de ${payload.nome || "negocio local portugues"}.`;
      rawText = await callGemini(systemPrompt, userText, undefined, 2000);
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
          ? "Creditos insuficientes."
          : msg;
    return new Response(JSON.stringify({ error: userMsg }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
