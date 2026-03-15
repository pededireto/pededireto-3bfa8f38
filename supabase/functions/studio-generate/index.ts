import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
  console.log(`[Gemini] model=${model}, images=${images?.length || 0}, maxTokens=${maxTokens}`);
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
    throw new Error("Resposta vazia da Gemini API");
  }
  return text;
}

const EXTRACT_PROFILE_PROMPT = `Analisa este texto de um perfil de negocio portugues e extrai os dados estruturados. Responde APENAS com JSON valido, sem markdown:
{"nome":"nome do negocio","cidade":"cidade/localidade","categoria_key":"obras|restauracao|beleza|saude|profissionais|transporte|comercio|educacao|tecnologia|eventos","subcategoria":"subcategoria especifica","servicos":"servicos principais separados por virgula","diferencial":"o que torna este negocio especial","tom_sugerido":"emocional|institucional|urgente|proximidade","estilo_sugerido":"institucional|promocao|historia|produto","resumo_preview":"resumo 1 linha"}`;

const REGRA_VOZ_PTPT = `REGRA CRITICA: VOZ OFF sempre em Portugues de Portugal (PT-PT). NUNCA brasileiro. PT-PT: "Ja provaste","Fica a saber","Experimenta","Nao percas","Reserva ja","Vem ca". NUNCA: "Voce","Confira","Aproveite","Nao perca".`;

function buildReelPrompt(p: any): string {
  const temNegocio = p.nome || p.cidade || p.subcategoria;
  return `Es especialista em roteiros cinematograficos para Grok Aurora para negocios locais em Portugal.
${REGRA_VOZ_PTPT}
OBJECTIVO: ${p.objectivo || "promover o negocio"} ${p.objectivoDescricao ? "- " + p.objectivoDescricao : ""}
${temNegocio ? `NEGOCIO: Nome=${p.nome || ""} Cidade=${p.cidade || ""} Categoria=${p.categoria || ""} Subcategoria=${p.subcategoria || ""} Servicos=${p.servicos || ""} Diferencial=${p.diferencial || ""}` : "NEGOCIO: Infere da imagem."}
TOMS: Ext1=${p.tomExt1 || "Emocional"} Ext2=${p.tomExt2 || "Qualidade"} Ext3=${p.tomExt3 || "Confianca"} Ext4=${p.tomExt4 || "Urgencia"} Ext5=${p.tomExt5 || "CTA"}
ESTILO: ${p.estilo || "institucional"} - ${p.estiloDesc || ""}
REGRAS: 1-Ext1 comeca com "Animar esta imagem de forma natural e cinematografica." 2-Ext2-5 comecam com "Estender o video a partir do final da cena anterior." 3-Movimentos suaves. 4-VOZ PT-PT. 5-TEXTO NO ECRA entre aspas. 6-Ext5 termina com "${p.businessUrl || "pededireto.pt"}". 7-Max 3 frases por prompt. Sem newlines nos valores.
Responde APENAS JSON valido:
{"analise_imagem":"descricao imagem","estilo_aplicado":"${p.estilo || "institucional"}","extensoes":[{"num":1,"titulo":"Animacao - ${p.tomExt1 || "Emocional"}","prompt":"..."},{"num":2,"titulo":"${p.tomExt2 || "Qualidade"} - desenvolvimento","prompt":"..."},{"num":3,"titulo":"${p.tomExt3 || "Confianca"} - detalhe","prompt":"..."},{"num":4,"titulo":"${p.tomExt4 || "Urgencia"} - resultado","prompt":"..."},{"num":5,"titulo":"CTA Final","prompt":"...com ${p.businessUrl || "pededireto.pt"}"}],"copy_post":"legenda Instagram PT-PT com emojis e CTA para ${p.businessUrl || "pededireto.pt"}","copy_story":"versao curta story 2-3 linhas","segmentacao":{"genero":"...","idade":"...","interesses":"...","objetivo":"...","orcamento_dia":"EX/dia"}}`;
}

function buildReelMultiImagePrompt(p: any): string {
  const numImages = p.images?.length || 1;
  const temNegocio = p.nome || p.cidade || p.subcategoria;
  return `Es especialista em roteiros cinematograficos para Grok Aurora para negocios locais em Portugal.
${REGRA_VOZ_PTPT}
${numImages} imagem(ns) fornecida(s). Analisa cada uma, decide sequencia cinematografica optima.
OBJECTIVO: ${p.objectivo || "promover"} ${p.objectivoDescricao || ""}
${temNegocio ? `NEGOCIO: Nome=${p.nome || ""} Cidade=${p.cidade || ""} Servicos=${p.servicos || ""} Diferencial=${p.diferencial || ""}` : "Infere da imagem."}
TOMS: Ext1=${p.tomExt1 || "Emocional"} Ext2=${p.tomExt2 || "Qualidade"} Ext3=${p.tomExt3 || "Confianca"} Ext4=${p.tomExt4 || "Urgencia"} Ext5=${p.tomExt5 || "CTA"}
REGRAS: Ext1="Animar a Imagem X...". Ext2-5="Estender...Transicao suave para Imagem X." quando muda. VOZ PT-PT. Ext5 termina com "${p.businessUrl || "pededireto.pt"}". Sem newlines nos valores.
Responde APENAS JSON valido:
{"analise_imagens":[{"index":1,"descricao":"...","melhor_para":"..."}],"logica_sequencia":"...","estilo_aplicado":"${p.estilo || "institucional"}","extensoes":[{"num":1,"titulo":"Animacao","image_index":1,"prompt":"..."},{"num":2,"titulo":"Desenvolvimento","image_index":1,"prompt":"..."},{"num":3,"titulo":"Confianca","image_index":1,"prompt":"..."},{"num":4,"titulo":"Urgencia","image_index":1,"prompt":"..."},{"num":5,"titulo":"CTA Final","image_index":1,"prompt":"...com ${p.businessUrl || "pededireto.pt"}"}],"copy_post":"...","copy_story":"...","segmentacao":{"genero":"...","idade":"...","interesses":"...","objetivo":"...","orcamento_dia":"EX/dia"}}`;
}

function buildImagePrompt(p: any): string {
  const hasContext = p.nome || p.sector || p.descricao || p.personagens || p.ambiente;
  return `Es especialista em prompts de imagem para marketing de negocios locais em Portugal.
CONTEXTO: objectivo=${p.objectivoImagem || ""} nome=${p.nome || ""} sector=${p.sector || ""} descricao=${p.descricao || ""} personagens=${p.personagens || ""} ambiente=${p.ambiente || ""} texto=${p.textoSobreposto || ""} extras=${p.extras || ""} estilo=${p.estilo || "local"} proporcao=${p.proporcao || "9:16"}
${!hasContext ? "MODO CRIATIVO: sem contexto especifico, se visualmente rico." : ""}
REGRAS: Prompts em ingles. Fotorrealista. Cinematografico. Proporcao ${p.proporcao || "9:16"}.
Responde APENAS JSON valido:
{"prompt_principal":"prompt ingles max 150 palavras proporcao ${p.proporcao || "9:16"} fotorrealista cinematografico","variante_a":"variante angulo diferente 100 palavras","variante_b":"variante iluminacao diferente 100 palavras","instrucoes":"3-4 passos PT-PT para usar no Grok e workflow Reel 5x6s"}`;
}

function buildReelStoryboardPrompt(p: any): string {
  return `Es director de fotografia e copywriter para redes sociais de negocios locais em Portugal.
${REGRA_VOZ_PTPT}
Cria storyboard de 5 cenas (6 segundos cada) para Reel de 30 segundos.
NEGOCIO: nome=${p.nome || ""} sector=${p.sector || ""} descricao=${p.descricao || ""} objectivo=${p.objectivoImagem || "promover"} personagens=${p.personagens || ""} ambiente=${p.ambiente || ""} extras=${p.extras || ""} estilo=${p.estilo || "local"} proporcao=${p.proporcao || "9:16"}
ESTRUTURA: Cena1=HOOK Cena2=DESENVOLVIMENTO Cena3=CONFIANCA Cena4=URGENCIA Cena5=CTA
REGRAS: voiceover max 12 palavras PT-PT. screen_text max 5 palavras em maiusculas. prompt imagem em ingles cinematografico. Sem newlines dentro dos valores string.
Responde APENAS com este JSON exacto com exactamente 5 itens em cenas:
{"instrucao_reel":"estrategia geral 1 frase","cenas":[{"titulo":"HOOK","foco":"foco curto","camera":"camera ingles","lighting":"lighting ingles","composition":"composition ingles","emotion":"emotion ingles","prompt":"prompt ingles cinematografico para Grok sem newlines","voiceover":"frase PT-PT max 12 palavras","screen_text":"TEXTO MAX 5 PALAVRAS"},{"titulo":"DESENVOLVIMENTO","foco":"...","camera":"...","lighting":"...","composition":"...","emotion":"...","prompt":"...","voiceover":"...","screen_text":"..."},{"titulo":"CONFIANCA","foco":"...","camera":"...","lighting":"...","composition":"...","emotion":"...","prompt":"...","voiceover":"...","screen_text":"..."},{"titulo":"URGENCIA","foco":"...","camera":"...","lighting":"...","composition":"...","emotion":"...","prompt":"...","voiceover":"...","screen_text":"..."},{"titulo":"CTA","foco":"...","camera":"...","lighting":"...","composition":"...","emotion":"...","prompt":"...","voiceover":"...","screen_text":"..."}]}`;
}

function buildReelFullPackagePrompt(p: any): string {
  const cenasFormatadas = (p.cenas || []).map((c: any) => `CENA ${c.num}-${c.titulo}: ${c.prompt}`).join(" | ");
  return `Es copywriter especialista em marketing digital para negocios locais em Portugal.
${REGRA_VOZ_PTPT}
NEGOCIO: nome=${p.nome || ""} sector=${p.sector || ""} descricao=${p.descricao || ""}
STORYBOARD: ${cenasFormatadas}
${p.instrucao_reel ? `ESTRATEGIA: ${p.instrucao_reel}` : ""}
REGRAS: Tudo PT-PT. Legenda max 2200 chars com emojis. Max 30 hashtags. Copy anuncio max 125 chars. Sem newlines nos valores.
Responde APENAS JSON valido:
{"reel":{"script":"narracao completa 30s guia para criador","duracao":"30s"},"instagram":{"legenda":"legenda com emojis e CTA","hashtags":["#portugal","#negociolocal","#pededireto"]},"ads":{"copy":"texto anuncio max 125 chars","cta":"Reserva Ja"}}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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
    // ✅ FIX PRINCIPAL: normalizedAction correctamente definido
    const normalizedAction = (action || "").trim().toLowerCase();
    console.log(`[studio-generate] action=${action} normalized=${normalizedAction}`);

    let rawText = "";

    if (normalizedAction === "extract_profile") {
      rawText = await callGemini(EXTRACT_PROFILE_PROMPT, payload.text, undefined, 600);
    } else if (normalizedAction === "generate_reel") {
      const images = payload.imageBase64
        ? [{ base64: payload.imageBase64, mimeType: payload.imageMimeType || "image/jpeg" }]
        : undefined;
      rawText = await callGemini(
        buildReelPrompt(payload),
        `Frame inicial. Objectivo: ${payload.objectivo || "promover"}. ${payload.objectivoDescricao || ""} ${payload.nome || ""} ${payload.cidade || ""}`.trim(),
        images,
        4096,
      );
    } else if (normalizedAction === "generate_reel_multi") {
      const images: Array<{ base64: string; mimeType: string }> = (payload.images || []).map((img: any) => ({
        base64: img.base64,
        mimeType: img.mimeType || "image/jpeg",
      }));
      if (images.length === 0)
        return new Response(JSON.stringify({ error: "Nenhuma imagem fornecida" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      rawText = await callGemini(
        buildReelMultiImagePrompt(payload),
        `${images.length} imagens. Objectivo: ${payload.objectivo || "promover"}. ${payload.nome || ""}`.trim(),
        images,
        5000,
      );
    } else if (normalizedAction === "generate_image_prompt") {
      const images = payload.referenceImageBase64
        ? [{ base64: payload.referenceImageBase64, mimeType: "image/jpeg" }]
        : undefined;
      rawText = await callGemini(
        buildImagePrompt(payload),
        `Prompts para: ${payload.nome || payload.descricao || "negocio local"}. Estilo: ${payload.estilo || "local"}. Proporcao: ${payload.proporcao || "9:16"}.`,
        images,
        1200,
      );
    } else if (normalizedAction === "generate_reel_storyboard") {
      const images = payload.referenceImageBase64
        ? [{ base64: payload.referenceImageBase64, mimeType: "image/jpeg" }]
        : undefined;
      rawText = await callGemini(
        buildReelStoryboardPrompt(payload),
        `Storyboard 5 cenas para: ${payload.nome || payload.descricao || "negocio local"}. Estilo: ${payload.estilo || "local"}.`,
        images,
        4000,
      );
    } else if (normalizedAction === "generate_reel_full_package") {
      rawText = await callGemini(
        buildReelFullPackagePrompt(payload),
        `Pacote completo para Reel de ${payload.nome || "negocio local"}.`,
        undefined,
        2000,
      );
    } else {
      console.error(`[studio-generate] Unknown action: "${action}" normalized="${normalizedAction}"`);
      return new Response(JSON.stringify({ error: `Accao desconhecida: ${action}` }), {
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
      const preview = rawText ? rawText.substring(0, 800) : "rawText vazio";
      console.error("JSON parse failed preview:", preview);
      return new Response(
        JSON.stringify({
          error: "Resposta malformada: " + preview,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
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
