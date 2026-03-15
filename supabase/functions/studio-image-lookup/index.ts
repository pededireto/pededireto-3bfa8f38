import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Mapa de categorias do formulário para as da biblioteca ───────────────────
const CATEGORIA_MAP: Record<string, string[]> = {
  "negocio":    ["profissionais", "tecnologia", "transportes"],
  "restauracao":["restauracao"],
  "beleza":     ["beleza"],
  "saude":      ["saude"],
  "obras":      ["obras", "limpezas"],
  "educacao":   ["educacao"],
  "automovel":  ["automovel"],
  "eventos":    ["eventos"],
  "familia":    ["familia"],
  "transportes":["transportes"],
  "tecnologia": ["tecnologia"],
  "limpezas":   ["limpezas"],
  "profissionais": ["profissionais"],
};

// Mapa de estilos do formulário para os da biblioteca
const ESTILO_MAP: Record<string, string> = {
  "Moderno & Escuro": "moderno",
  "Limpo & Profissional": "limpo",
  "Local & Acolhedor": "local",
  "Urgência & Impacto": "urgencia",
  "moderno": "moderno",
  "limpo": "limpo",
  "local": "local",
  "urgencia": "urgencia",
};

// ── Personalizar prompt com dados do utilizador ──────────────────────────────
function personalizarPrompt(
  promptBase: string,
  dados: {
    nome?: string;
    sector?: string;
    descricao?: string;
    personagens?: string;
    ambiente?: string;
    textoSobreposto?: string;
  }
): string {
  let prompt = promptBase;

  // Substituir variáveis se existirem no template
  if (dados.nome) prompt = prompt.replace(/\{\{nome\}\}/g, dados.nome);
  if (dados.sector) prompt = prompt.replace(/\{\{sector\}\}/g, dados.sector);
  if (dados.descricao) prompt = prompt.replace(/\{\{descricao\}\}/g, dados.descricao);
  if (dados.personagens) prompt = prompt.replace(/\{\{personagens\}\}/g, dados.personagens);
  if (dados.ambiente) prompt = prompt.replace(/\{\{ambiente\}\}/g, dados.ambiente);

  // Enriquecer o prompt com contexto adicional do utilizador
  const enrichments: string[] = [];
  if (dados.nome) enrichments.push(`for ${dados.nome}`);
  if (dados.sector && dados.sector !== dados.nome) enrichments.push(dados.sector);
  if (dados.personagens && !promptBase.includes(dados.personagens)) {
    enrichments.push(`featuring ${dados.personagens}`);
  }
  if (dados.ambiente && !promptBase.includes(dados.ambiente)) {
    enrichments.push(dados.ambiente);
  }
  if (dados.textoSobreposto) {
    enrichments.push(`with text overlay: "${dados.textoSobreposto}"`);
  }

  // Inserir enrichments antes do ratio/aspect ratio
  if (enrichments.length > 0) {
    const ratioPos = prompt.lastIndexOf(", 9:16") !== -1
      ? prompt.lastIndexOf(", 9:16")
      : prompt.lastIndexOf(", 1:1") !== -1
      ? prompt.lastIndexOf(", 1:1")
      : prompt.lastIndexOf(", 16:9") !== -1
      ? prompt.lastIndexOf(", 16:9")
      : prompt.length;

    prompt = prompt.slice(0, ratioPos) + ", " + enrichments.join(", ") + prompt.slice(ratioPos);
  }

  return prompt;
}

// ── Handler principal ────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const payload = await req.json();
    const {
      categoria,      // ex: "restauracao", "beleza" ou objectivo do form
      estilo,         // ex: "Local & Acolhedor"
      proporcao = "9:16",
      objectivo,      // ex: "negocio", "produto", "evento"
      nome, sector, descricao, personagens, ambiente, textoSobreposto,
    } = payload;

    // Normalizar estilo
    const estiloNorm = ESTILO_MAP[estilo] || "local";

    // Determinar categorias a pesquisar
    const categoriaInput = categoria || sector || "profissionais";
    const categoriasParaPesquisar = CATEGORIA_MAP[categoriaInput.toLowerCase()] ||
      CATEGORIA_MAP[categoriaInput] ||
      [categoriaInput.toLowerCase()];

    console.log(`[studio-image-lookup] categoria=${categoriaInput} estilo=${estiloNorm} proporcao=${proporcao}`);

    // 1ª tentativa: match exacto categoria + estilo + proporção
    let { data: prompts, error } = await supabase
      .from("image_prompts_library")
      .select("*")
      .in("categoria", categoriasParaPesquisar)
      .eq("estilo", estiloNorm)
      .eq("proporcao", proporcao)
      .eq("is_active", true)
      .limit(10);

    if (error) throw error;

    // 2ª tentativa: relaxar proporção
    if (!prompts || prompts.length === 0) {
      const { data: fallback1 } = await supabase
        .from("image_prompts_library")
        .select("*")
        .in("categoria", categoriasParaPesquisar)
        .eq("estilo", estiloNorm)
        .eq("is_active", true)
        .limit(10);
      prompts = fallback1 || [];
    }

    // 3ª tentativa: relaxar estilo — qualquer template da categoria
    if (!prompts || prompts.length === 0) {
      const { data: fallback2 } = await supabase
        .from("image_prompts_library")
        .select("*")
        .in("categoria", categoriasParaPesquisar)
        .eq("is_active", true)
        .limit(10);
      prompts = fallback2 || [];
    }

    // 4ª tentativa: qualquer template activo
    if (!prompts || prompts.length === 0) {
      const { data: fallback3 } = await supabase
        .from("image_prompts_library")
        .select("*")
        .eq("is_active", true)
        .eq("estilo", estiloNorm)
        .limit(5);
      prompts = fallback3 || [];
    }

    if (!prompts || prompts.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhum template encontrado. Adiciona templates à biblioteca." }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Seleccionar o melhor match (prioridade: objectivo, depois random)
    let selected = prompts[0];
    if (objectivo) {
      const byObjectivo = prompts.find(p => p.objectivo === objectivo);
      if (byObjectivo) selected = byObjectivo;
    }
    // Se houver mais de 1, escolher aleatoriamente entre os 3 primeiros para variedade
    if (prompts.length > 1 && !objectivo) {
      const pool = prompts.slice(0, Math.min(3, prompts.length));
      selected = pool[Math.floor(Math.random() * pool.length)];
    }

    // Personalizar os 3 prompts com os dados do utilizador
    const dados = { nome, sector, descricao, personagens, ambiente, textoSobreposto };
    const promptPrincipal = personalizarPrompt(selected.prompt_principal, dados);
    const varianteA = personalizarPrompt(selected.variante_a, dados);
    const varianteB = personalizarPrompt(selected.variante_b, dados);

    // Incrementar usage_count (fire and forget)
    supabase.rpc("increment_prompt_usage", { prompt_id: selected.id }).catch(() => {});

    const instrucoes = selected.instrucoes ||
      `1. Copia o prompt principal.\n2. Abre o Grok Aurora e cola o prompt.\n3. Selecciona proporção ${proporcao}.\n4. Usa a imagem gerada no Gerador de Reel.`;

    return new Response(JSON.stringify({
      content: {
        prompt_principal: promptPrincipal,
        variante_a: varianteA,
        variante_b: varianteB,
        instrucoes,
        _source: {
          template_id: selected.id,
          categoria: selected.categoria,
          estilo: selected.estilo,
          titulo: selected.titulo,
        },
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("studio-image-lookup error:", e);
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
