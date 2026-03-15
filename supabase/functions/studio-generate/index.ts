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
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
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
    throw new Error("Resposta vazia ou inesperada da Gemini API");
  }
  return text;
}

const REGRA_VOZ_PTPT = `REGRA CRITICA DE IDIOMA: A VOZ OFF deve ser SEMPRE em Portugues de Portugal (PT-PT). NUNCA uses expressoes brasileiras. Exemplos PT-PT: "Ja provaste", "Fica a saber", "Nao percas", "Reserva ja". NUNCA uses: "Voce", "Confira", "Aproveite", "Nao perca".`;

const EXTRACT_PROFILE_PROMPT = `Analisa este texto de um perfil de negocio portugues e extrai os dados estruturados. Responde APENAS com JSON valido, sem markdown: {"nome":"string","cidade":"string","categoria_key":"obras|restauracao|beleza|saude|profissionais|transporte|comercio|educacao|tecnologia|eventos","subcategoria":"string","servicos":"string","diferencial":"string","tom_sugerido":"emocional|institucional|urgente|proximidade","estilo_sugerido":"institucional|promocao|historia|produto","resumo_preview":"string"}`;

function buildReelPrompt(p: any): string {
  const temNegocio = p.nome || p.cidade || p.subcategoria;
  return `Es especialista em criar roteiros de video cinematograficos para IA (Grok Aurora) para negocios locais em Portugal.\n\n${REGRA_VOZ_PTPT}\n\nOBJECTIVO DO REEL: ${p.objectivo || "promover o negocio"}\n${p.objectivoDescricao ? `DESCRICAO: ${p.objectivoDescricao}` : ""}\n\n${temNegocio ? `DADOS DO NEGOCIO:\n- Nome: ${p.nome || "nao especificado"}\n- Cidade: ${p.cidade || "nao especificado"}\n- Categoria: ${p.categoria || "nao especificado"}\n- Subcategoria: ${p.subcategoria || "nao especificado"}\n- Servicos: ${p.servicos || "nao especificado"}\n- Diferencial: ${p.diferencial || "nao especificado"}` : "NEGOCIO: Dados nao fornecidos - baseia-te na imagem."}\n\nTOM POR EXTENSAO:\n- Extensao 1 (0-6s): ${p.tomExt1 || "Emocional"}\n- Extensao 2 (6-12s): ${p.tomExt2 || "Qualidade"}\n- Extensao 3 (12-18s): ${p.tomExt3 || "Confianca"}\n- Extensao 4 (18-24s): ${p.tomExt4 || "Urgencia"}\n- Extensao 5 (24-30s): ${p.tomExt5 || "CTA directo"}\n\nESTILO DO VIDEO: ${p.estilo || "institucional"} - ${p.estiloDesc || ""}\n\nREGRAS OBRIGATORIAS:\n1 - EXTENSAO 1: comeca com "Animar esta imagem de forma natural e cinematografica."\n2 - EXTENSOES 2-5: comecam com "Estender o video a partir do final da cena anterior."\n3 - Movimentos suaves - NUNCA cortes bruscos\n4 - VOZ em Portugues de Portugal (PT-PT) - ver regra critica acima\n5 - TEXTO NO ECRA entre aspas duplas\n6 - EXTENSAO 5 termina com URL "${p.businessUrl || "pededireto.pt"}" no TEXTO NO ECRA e na VOZ.\n7 - Cada prompt maximo 3 frases. Sem newlines dentro dos valores.\n\nResponde APENAS com JSON valido sem formatacao extra: {"analise_imagem":"string","estilo_aplicado":"string","extensoes":[{"num":1,"titulo":"string","prompt":"string"},{"num":2,"titulo":"string","prompt":"string"},{"num":3,"titulo":"string","prompt":"string"},{"num":4,"titulo":"string","prompt":"string"},{"num":5,"titulo":"string","prompt":"string"}],"copy_post":"string","copy_story":"string","segmentacao":{"genero":"string","idade":"string","interesses":"string","objetivo":"string","orcamento_dia":"string"}}`;
}

function buildReelMultiImagePrompt(p: any): string {
  const numImages = p.images?.length || 1;
  const temNegocio = p.nome || p.cidade || p.subcategoria;
  return `Es especialista em criar roteiros de video cinematograficos para IA (Grok Aurora) para negocios locais em Portugal.\n\n${REGRA_VOZ_PTPT}\n\nForam fornecidas ${numImages} imagem(ns). Analisa cada uma, decide a sequencia cinematografica optima e cria prompts especificos.\n\nOBJECTIVO: ${p.objectivo || "promover o negocio"}\n${p.objectivoDescricao ? `DESCRICAO: ${p.objectivoDescricao}` : ""}\n\n${temNegocio ? `DADOS DO NEGOCIO:\n- Nome: ${p.nome || "nao especificado"}\n- Cidade: ${p.cidade || "nao especificado"}\n- Categoria: ${p.categoria || "nao especificado"}\n- Subcategoria: ${p.subcategoria || "nao especificado"}\n- Servicos: ${p.servicos || "nao especificado"}\n- Diferencial: ${p.diferencial || "nao especificado"}` : "NEGOCIO: Infere da imagem."}\n\nTOM POR EXTENSAO:\n- Extensao 1 (0-6s): ${p.tomExt1 || "Emocional"}\n- Extensao 2 (6-12s): ${p.tomExt2 || "Qualidade"}\n- Extensao 3 (12-18s): ${p.tomExt3 || "Confianca"}\n- Extensao 4 (18-24s): ${p.tomExt4 || "Urgencia"}\n- Extensao 5 (24-30s): ${p.tomExt5 || "CTA directo"}\n\nESTILO: ${p.estilo || "institucional"}\n\nREGRAS:\n1 - EXTENSAO 1: "Animar a Imagem X de forma natural e cinematografica."\n2 - EXTENSOES 2-5: "Estender o video a partir do final da cena anterior." ou "Estender... Transicao suave para a Imagem X." quando muda\n3 - VOZ em PT-PT - ver regra critica\n4 - TEXTO NO ECRA entre aspas duplas\n5 - EXTENSAO 5 termina com "${p.businessUrl || "pededireto.pt"}"\n6 - Sem newlines nos valores\n\nResponde APENAS com JSON valido sem formatacao extra: {"analise_imagens":[{"index":1,"descricao":"string","melhor_para":"string"}],"logica_sequencia":"string","estilo_aplicado":"string","extensoes":[{"num":1,"titulo":"string","image_index":1,"prompt":"string"},{"num":2,"titulo":"string","image_index":1,"prompt":"string"},{"num":3,"titulo":"string","image_index":1,"prompt":"string"},{"num":4,"titulo":"string","image_index":1,"prompt":"string"},{"num":5,"titulo":"string","image_index":1,"prompt":"string"}],"copy_post":"string","copy_story":"string","segmentacao":{"genero":"string","idade":"string","interesses":"string","objetivo":"string","orcamento_dia":"string"}}`;
}

function buildImagePrompt(p: any): string {
  const hasContext = p.nome || p.sector || p.descricao || p.personagens || p.ambiente;
  return `Es especialista em criar prompts de geracao de imagem para marketing de negocios locais em Portugal.\n\nCONTEXTO:\n${p.objectivoImagem ? `- Objectivo: ${p.objectivoImagem}\n` : ""}${p.nome ? `- Nome/Marca: ${p.nome}\n` : ""}${p.sector ? `- Sector: ${p.sector}\n` : ""}${p.descricao ? `- O que deve aparecer: ${p.descricao}\n` : ""}${p.personagens ? `- Personagens: ${p.personagens}\n` : ""}${p.ambiente ? `- Ambiente: ${p.ambiente}\n` : ""}${p.textoSobreposto ? `- Texto sobreposto: ${p.textoSobreposto}\n` : ""}${p.extras ? `- Extras: ${p.extras}\n` : ""}- Estilo: ${p.estilo || "local"}\n- Proporcao: ${p.proporcao || "9:16"}\n\n${!hasContext ? "MODO CRIATIVO: sem contexto especifico, se criativo.\n" : ""}REGRAS CRITICAS: Prompts em ingles. Fotorrealista. Cinematografico. Proporcao ${p.proporcao || "9:16"}. Cada prompt numa unica linha sem quebras de linha. Maximo 80 palavras por prompt.\n\nResponde APENAS com JSON valido numa unica linha: {"prompt_principal":"string","variante_a":"string","variante_b":"string","instrucoes":"string"}`;
}

function buildReelStoryboardPrompt(p: any): string {
  return `Es director de fotografia e copywriter para negocios locais em Portugal.\n\n${REGRA_VOZ_PTPT}\n\nCria um storyboard de 5 cenas para Reel de 30 segundos.\n\nNEGOCIO:\n${p.nome ? `- Nome: ${p.nome}\n` : ""}${p.sector ? `- Sector: ${p.sector}\n` : ""}${p.descricao ? `- Descricao: ${p.descricao}\n` : ""}${p.objectivoImagem ? `- Objectivo: ${p.objectivoImagem}\n` : ""}${p.personagens ? `- Personagens: ${p.personagens}\n` : ""}${p.ambiente ? `- Ambiente: ${p.ambiente}\n` : ""}${p.extras ? `- Extras: ${p.extras}\n` : ""}- Estilo: ${p.estilo || "local"}\n- Proporcao: ${p.proporcao || "9:16"}\n\nESTRUTURA: Cena1=HOOK(0-6s), Cena2=DESENVOLVIMENTO(6-12s), Cena3=CONFIANCA(12-18s), Cena4=URGENCIA(18-24s), Cena5=CTA(24-30s)\n\nREGRAS CRITICAS:\n- Cada campo e uma string simples sem newlines\n- prompt: em ingles, cinematografico, para Grok image generation, max 60 palavras\n- voiceover: PT-PT, max 12 palavras, NUNCA brasileiro\n- screen_text: max 5 palavras em maiusculas\n- camera, lighting, composition, emotion: em ingles\n\nResponde APENAS com JSON valido numa unica linha: {"instrucao_reel":"string","cenas":[{"titulo":"HOOK","foco":"string","camera":"string","lighting":"string","composition":"string","emotion":"string","prompt":"string","voiceover":"string","screen_text":"string"},{"titulo":"DESENVOLVIMENTO","foco":"string","camera":"string","lighting":"string","composition":"string","emotion":"string","prompt":"string","voiceover":"string","screen_text":"string"},{"titulo":"CONFIANCA","foco":"string","camera":"string","lighting":"string","composition":"string","emotion":"string","prompt":"string","voiceover":"string","screen_text":"string"},{"titulo":"URGENCIA","foco":"string","camera":"string","lighting":"string","composition":"string","emotion":"string","prompt":"string","voiceover":"string","screen_text":"string"},{"titulo":"CTA","foco":"string","camera":"string","lighting":"string","composition":"string","emotion":"string","prompt":"string","voiceover":"string","screen_text":"string"}]}`;
}

function buildReelFullPackagePrompt(p: any): string {
  const cenas = (p.cenas || []).map((c: any) => `CENA ${c.num} - ${c.titulo}: ${c.prompt}`).join(" | ");
  return `Es copywriter para negocios locais em Portugal.\n\n${REGRA_VOZ_PTPT}\n\nCria pacote completo de conteudo para Reel de 30 segundos.\n\nNEGOCIO:\n${p.nome ? `- Nome: ${p.nome}\n` : ""}${p.sector ? `- Sector: ${p.sector}\n` : ""}${p.descricao ? `- Descricao: ${p.descricao}\n` : ""}${p.instrucao_reel ? `ESTRATEGIA: ${p.instrucao_reel}\n` : ""}\nSTORYBOARD: ${cenas}\n\nREGRAS:\n- Tudo em PT-PT - NUNCA brasileiro\n- Legenda max 2200 caracteres\n- Hashtags: mix PT+ingles, max 30\n- Copy anuncio: max 125 caracteres\n- CTA: max 4 palavras\n\nResponde APENAS com JSON valido: {"reel":{"script":"string","duracao":"30s"},"instagram":{"legenda":"string","hashtags":["string"]},"ads":{"copy":"string","cta":"string"}}`;
}

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
      const systemPrompt = buildReelPrompt(payload);
      const userMessage =
        `Frame inicial do video. Objectivo: ${payload.objectivo || "promover o negocio"}. ${payload.nome ? "Negocio: " + payload.nome : ""} ${payload.cidade ? "Cidade: " + payload.cidade : ""}`.trim();
      const images = payload.imageBase64
        ? [{ base64: payload.imageBase64, mimeType: payload.imageMimeType || "image/jpeg" }]
        : undefined;
      rawText = await callGemini(systemPrompt, userMessage, images, 4096);
    } else if (action === "generate_reel_multi") {
      const systemPrompt = buildReelMultiImagePrompt(payload);
      const userMessage =
        `${payload.images?.length || 0} imagens. Objectivo: ${payload.objectivo || "promover o negocio"}. ${payload.nome ? "Negocio: " + payload.nome : ""}`.trim();
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
      rawText = await callGemini(systemPrompt, userText, images, 2000);
    } else if (action === "generate_reel_storyboard") {
      const systemPrompt = buildReelStoryboardPrompt(payload);
      const userText = `Cria o storyboard para: ${payload.nome || payload.descricao || "negocio local portugues"}. Estilo: ${payload.estilo || "local"}. Proporcao: ${payload.proporcao || "9:16"}.`;
      const images = payload.referenceImageBase64
        ? [{ base64: payload.referenceImageBase64, mimeType: "image/jpeg" }]
        : undefined;
      rawText = await callGemini(systemPrompt, userText, images, 4000);
    } else if (action === "generate_reel_full_package") {
      const systemPrompt = buildReelFullPackagePrompt(payload);
      const userText = `Cria o pacote completo para o Reel de ${payload.nome || "negocio local portugues"}.`;
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
