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

function buildAutoFillPrompt(p: any): string {
  return `És um assistente de marketing visual para pequenos negócios portugueses.

Dado o seguinte negócio, gera sugestões inteligentes para criar uma imagem de marketing de alta qualidade.

NEGÓCIO:
- Nome: ${p.nome || "não especificado"}
- Sector/Categoria: ${p.sector || p.categoria || "não especificado"}

Gera sugestões criativas e específicas para este tipo de negócio.

Responde APENAS com JSON válido:
{
  "objetivo": "um de: negocio|produto|promocao|evento|pessoa|espaco",
  "composicao": "um de: profissional_clean|flyer_popular|recrutamento|luxo|portfolio",
  "oQueVendes": "descrição curta e específica do que o negócio vende/oferece",
  "paraQuem": "público-alvo específico",
  "beneficio": "principal benefício para o cliente",
  "pessoas": "um de: sem|cliente_satisfeito|profissional_acao|equipa",
  "ambiente": "descrição curta do cenário ideal para a imagem",
  "emocao": "um de: profissional|energetico|urgente|luxuoso|acolhedor",
  "textoImagem": "sugestão de headline curta para a imagem (máx 40 caracteres)"
}`;
}

function buildImagePrompt(p: any): string {
  // ── 1. TYPE ──────────────────────────────────────────────────────────────
  const typeMap: Record<string, string> = {
    negocio: "Corporate branding image",
    produto: "Product advertising image",
    promocao: "Marketing promotional flyer",
    evento: "Event promotion image",
    pessoa: "Marketing recruitment flyer",
    espaco: "Business space showcase image",
  };
  const TYPE = typeMap[p.objectivoImagem] || "Marketing image";

  // ── 2. COMPOSITION PRESETS (define style, marketing, vibe) ───────────────
  const compositionPresets: Record<string, { style: string; marketing: string; vibe: string }> = {
    profissional_clean: {
      style: "Bright environment, soft natural light, minimal design, clean composition, neutral tones with brand accent, even balanced lighting",
      marketing: "Corporate marketing layout, high clarity, generous negative space, space reserved for headline and call-to-action, trustworthy aesthetic",
      vibe: "professional, trustworthy, calm confidence",
    },
    flyer_popular: {
      style: "Colorful vibrant lighting, dynamic composition, high visual density, strong saturated colors (yellow, blue, red), attention-grabbing at a glance",
      marketing: "Busy promotional layout, high energy, multiple service highlights visible, Portuguese local business aesthetic, designed for social media impact",
      vibe: "energetic, festive, vibrant",
    },
    recrutamento: {
      style: "Dark background with strong contrast lighting, cinematic look, high-end commercial photography, modern corporate style, dramatic shadows",
      marketing: "Designed for recruitment campaign, bold layout, strong visual hierarchy, oversized bold typography space, urgent call-to-action composition, maximum visual weight on main message",
      vibe: "urgent, energetic, impactful",
    },
    luxo: {
      style: "Dark elegant tones, cinematic lighting, premium feel, shallow depth of field, soft dramatic lighting, sophisticated elegance, velvet-like depth",
      marketing: "Luxury branding composition, minimal but impactful, full-bleed atmospheric photography, editorial magazine aesthetic, premium gold/champagne accents",
      vibe: "luxurious, aspirational, exclusive",
    },
    portfolio: {
      style: "Natural lighting, raw textures, documentary style photography, authentic real-environment, honest aesthetic",
      marketing: "Focus on real work and results, process narrative visible, authentic composition showing scale and capability, grid-ready layout",
      vibe: "realistic, trustworthy, authentic",
    },
  };

  const preset = compositionPresets[p.estiloMarketing] || compositionPresets.profissional_clean;

  // ── 3. EMOTION OVERRIDE ──────────────────────────────────────────────────
  const emocaoOverrides: Record<string, string> = {
    profissional: "professional confident atmosphere, corporate competence, neutral palette with one brand accent color",
    energetico: "energetic dynamic atmosphere, vibrant saturated colors, sense of movement and action, bold contrasts, bright directional lighting",
    urgente: "urgent compelling atmosphere, bold attention-grabbing reds/yellows/blacks, high contrast, dramatic shadows, strong visual hierarchy",
    luxuoso: "luxurious premium atmosphere, dark moody tones with gold/champagne accents, soft dramatic lighting, sophisticated depth",
    acolhedor: "warm inviting atmosphere, cozy welcoming feel, soft golden hour light, warm amber palette (cream, soft brown, honey tones), gentle shadows",
  };
  const emotionDesc = p.humor ? emocaoOverrides[p.humor] || "" : "";

  // ── 4. VISUAL STYLE ─────────────────────────────────────────────────────
  const estiloMap: Record<string, string> = {
    foto: "professional commercial photography, photorealistic, DSLR quality, sharp focus",
    cinematografico: "cinematic photography, rich colors, shallow depth of field, anamorphic lens, film grain",
    ilustracao: "editorial illustration, clean lines, modern graphic design, vector-like quality",
    minimalista: "minimalist photography, clean negative space, simple powerful composition, one focal point",
    vintage: "vintage film photography, grain texture, warm faded tones, nostalgic 70s feel",
    neon: "cyberpunk neon aesthetic, vibrant glowing colors, futuristic urban atmosphere",
  };
  const visualStyle = estiloMap[p.estilo] || "professional commercial photography";

  // ── 5. SCENE (translated from PT inputs) ─────────────────────────────────
  let SCENE = "";
  if (p.oQueVendes) SCENE += `showing ${p.oQueVendes}`;
  if (p.paraQuem) SCENE += `, targeting ${p.paraQuem}`;
  if (p.beneficio) SCENE += `, representing ${p.beneficio}`;
  if (p.ambiente) SCENE += `. Environment: ${p.ambiente}`;

  // ── 6. PEOPLE ────────────────────────────────────────────────────────────
  const peopleMap: Record<string, string> = {
    sem: "",
    cliente_satisfeito: "A satisfied happy customer interacting with the product/service, natural expression, genuine smile",
    profissional_acao: "A professional actively working, confident posture, focused expression, wearing appropriate work attire",
    equipa: "A motivated professional team working together, diverse group, energy and collaboration visible",
  };
  const PEOPLE = peopleMap[p.personagens] || (p.personagens && p.personagens !== "sem" ? p.personagens : "");

  // ── 7. TEXT ON IMAGE ─────────────────────────────────────────────────────
  let TEXT_BLOCK = "";
  if (p.textoSobreposto && p.textoSobreposto.trim()) {
    TEXT_BLOCK = `\nText on image:\n"${p.textoSobreposto.trim()}"`;
  }

  // ── 8. BRAND ─────────────────────────────────────────────────────────────
  const BRAND = p.nome ? `for a company called ${p.nome}` : "";

  // ── 9. FORMAT ────────────────────────────────────────────────────────────
  const FORMAT = p.proporcao || "4:5";

  // ── 10. BENEFIT ENRICHMENT ───────────────────────────────────────────────
  let enrichment = "";
  const benefitLower = (p.beneficio || "").toLowerCase();
  if (benefitLower.includes("cliente") || benefitLower.includes("customer")) {
    enrichment += ", smartphone receiving notifications, business activity and engagement visible";
  }
  if (benefitLower.includes("vendas") || benefitLower.includes("sales") || benefitLower.includes("cresci")) {
    enrichment += ", upward growth charts subtly visible, success indicators";
  }

  // ── BUILD THE SYSTEM PROMPT ──────────────────────────────────────────────
  return `You are a WORLD-CLASS prompt engineer for AI image generators (Midjourney, DALL-E, Flux, Ideogram).

Your job is to create a SINGLE, STRUCTURED prompt that produces PROFESSIONAL MARKETING QUALITY images.

YOU MUST generate the prompt following this EXACT block structure:

BLOCK 1 — TYPE: "${TYPE}"
BLOCK 2 — MAIN SCENE: ${SCENE || "a professional marketing scene for a local Portuguese business"}${enrichment}
BLOCK 3 — PEOPLE: ${PEOPLE || "No people required — focus on objects, products, and environment detail"}
BLOCK 4 — FOCUS: Main focus on the key subject that represents the core value${p.beneficio ? `: ${p.beneficio}` : ""}
BLOCK 5 — VISUAL STYLE: ${visualStyle}
BLOCK 6 — COMPOSITION STYLE: ${preset.style}
BLOCK 7 — MARKETING LAYOUT: ${preset.marketing}
BLOCK 8 — MOOD & EMOTION: ${emotionDesc || preset.vibe}
BLOCK 9 — TEXT ON IMAGE: ${TEXT_BLOCK || "No text on image"}
BLOCK 10 — BRAND: ${BRAND || "generic local business"}
BLOCK 11 — QUALITY: Ultra realistic, high detail, 8k, professional advertising photography
BLOCK 12 — FORMAT: Vertical ${FORMAT} format

MANDATORY RULES:
1. The ENTIRE prompt must be in ENGLISH — EXCEPT text that goes ON the image (Block 9) which stays in original language
2. NEVER mix image description with text content — they are SEPARATE blocks
3. NEVER use vague adjectives: "beautiful", "nice", "good", "amazing"
4. Use CONCRETE descriptors: "warm amber 3200K lighting", "shallow f/1.4 depth of field"
5. The composition preset (Block 6-7) MUST strongly influence the entire visual structure
6. If people are included, describe them with detail (age range, expression, action, clothing)
7. If text on image exists, add: "with clear space reserved for overlaid text"
8. End with: --no watermark, logo, blur, distortion, amateur, low quality, text errors
9. Add: --ar ${FORMAT}
10. Total prompt length: 120-200 words
11. Auto-correct any spelling errors in the text-on-image content

Output ONLY valid JSON:
{
  "prompt_principal": "the complete structured prompt in English, 120-200 words",
  "variante_a": "variant with different camera angle/framing, 100-160 words",
  "variante_b": "variant with different lighting/mood, 100-160 words",
  "instrucoes": "3-4 practical steps in Portuguese on how to use this prompt"
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
    } else if (action === "auto_fill_image") {
      const systemPrompt = buildAutoFillPrompt(payload);
      const userText = `Preenche automaticamente os campos para criar uma imagem de marketing para: ${payload.nome || "negócio local"}. Sector: ${payload.sector || payload.categoria || "geral"}.`;
      rawText = await callGemini(systemPrompt, userText, undefined, 600);
    } else if (action === "generate_image_prompt") {
      const systemPrompt = buildImagePrompt(payload);
      const userText = `Gera prompts de imagem profissionais para: ${payload.nome || payload.descricao || "negócio local português"}. Composição: ${payload.estiloMarketing || "profissional"}. Estilo: ${payload.estilo || "foto"}. Proporção: ${payload.proporcao || "4:5"}. ${payload.oQueVendes ? "Produto/Serviço: " + payload.oQueVendes : ""} ${payload.paraQuem ? "Público: " + payload.paraQuem : ""} ${payload.beneficio ? "Benefício: " + payload.beneficio : ""}`.trim();
      const images = payload.referenceImageBase64
        ? [{ base64: payload.referenceImageBase64, mimeType: "image/jpeg" }]
        : undefined;
      rawText = await callGemini(systemPrompt, userText, images, 3000);
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
