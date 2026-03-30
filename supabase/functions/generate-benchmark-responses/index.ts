import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const TIPOS = [
  {
    tipo: "abertura",
    chave: "Frase de abertura da conversa comercial",
    instrucao: `Cria UMA frase de abertura para um comercial usar ao telefone ou numa visita a este negócio.
A frase deve mencionar uma tendência real do sector que mostre que o comercial conhece o mercado.
Máximo 2 frases. Tom consultivo, não de vendedor. Em português de Portugal.
Exemplo de formato: "Tenho estado a analisar o mercado de [sector] e reparei que [tendência relevante]. É por isso que queria falar consigo."`,
  },
  {
    tipo: "prova_social",
    chave: "Prova social com dados de avaliações do sector",
    instrucao: `Cria UMA frase de prova social baseada nos dados de avaliações e benchmark do sector.
Deve ser concreta, com dados reais do benchmark fornecido.
Máximo 2 frases. Em português de Portugal.`,
  },
  {
    tipo: "urgencia",
    chave: "Criar sentido de urgência",
    instrucao: `Cria UMA frase para criar sentido de urgência genuíno (não artificial) baseado nas tendências reais do sector.
Deve ser baseada em factos do benchmark, não em pressão artificial.
Máximo 2 frases. Em português de Portugal.`,
  },
  {
    tipo: "objeccao_preco",
    chave: "9,90€ é caro para mim agora",
    instrucao: `Cria UMA resposta curta e accionável à objecção de preço "9,90€ é caro para mim agora".
Usa o ticket médio real do sector para mostrar que um único cliente recupera o investimento.
Máximo 2 frases. Tom empático. Em português de Portugal.`,
  },
  {
    tipo: "objeccao_clientes",
    chave: "Já tenho clientes suficientes",
    instrucao: `Cria UMA resposta à objecção "Já tenho clientes suficientes".
Usa as tendências do sector para mostrar que o mercado está a mudar e que manter a posição actual pode não ser suficiente.
Máximo 2 frases. Tom respeitoso. Em português de Portugal.`,
  },
  {
    tipo: "objeccao_redes",
    chave: "Já uso redes sociais e Google",
    instrucao: `Cria UMA resposta à objecção "Já uso redes sociais e Google".
Usa os dados de presença digital do sector para contextualizar.
Diferencia claramente entre presença nas redes (branding) e aparecer a quem já quer comprar (intenção de compra).
Máximo 2 frases. Em português de Portugal.`,
  },
  {
    tipo: "objeccao_tempo",
    chave: "Não tenho tempo",
    instrucao: `Cria UMA resposta à objecção "Não tenho tempo".
Explica em termos concretos do sector que o perfil trabalha autonomamente.
Máximo 2 frases. Em português de Portugal.`,
  },
  {
    tipo: "objeccao_tecnologia",
    chave: "Não tenho jeito para tecnologia",
    instrucao: `Cria UMA resposta à objecção "Não tenho jeito para tecnologia".
Adapta ao sector específico para mostrar que não é necessário esforço técnico.
Máximo 2 frases. Em português de Portugal.`,
  },
  {
    tipo: "objeccao_confianca",
    chave: "Já fui enganado por outras plataformas",
    instrucao: `Cria UMA resposta à objecção "Já fui enganado por outras plataformas".
Diferencia a Pede Direto das outras plataformas com argumentos concretos: sem contrato, sem comissões, cancela quando quiser.
Máximo 2 frases. Tom empático e directo. Em português de Portugal.`,
  },
  {
    tipo: "objeccao_socio",
    chave: "Tenho de falar com o sócio/família",
    instrucao: `Cria UMA resposta à objecção "Tenho de falar com o sócio/família".
Facilita o processo de decisão. Oferece enviar proposta por email para partilhar.
Máximo 2 frases. Em português de Portugal.`,
  },
  {
    tipo: "objeccao_pensar",
    chave: "Vou pensar e digo-te qualquer coisa",
    instrucao: `Cria UMA resposta à objecção "Vou pensar e digo-te qualquer coisa".
Mantém a conversa aberta sem pressionar. Sugere um próximo passo concreto.
Máximo 2 frases. Em português de Portugal.`,
  },
  {
    tipo: "diagnostico_canal",
    chave: "De onde vêm a maioria dos clientes novos?",
    instrucao: `Cria UMA dica contextual curta para o comercial usar quando pergunta "De onde vêm a maioria dos clientes novos?".
Baseada no canal de aquisição principal do sector.
Máximo 1 frase. Começa com "Neste sector:". Em português de Portugal.`,
  },
  {
    tipo: "diagnostico_online",
    chave: "Usas alguma plataforma online?",
    instrucao: `Cria UMA dica contextual curta para o comercial usar quando pergunta "Usas alguma plataforma online?".
Baseada nos dados de presença digital do sector (website % e redes sociais %).
Máximo 1 frase. Começa com "Neste sector:". Em português de Portugal.`,
  },
  {
    tipo: "resumo_60s",
    chave: "Resumo de 60 segundos para preparação de visita",
    instrucao: `Cria um resumo de preparação de visita para o comercial ler em 60 segundos antes de entrar numa visita ou fazer uma chamada.
Deve incluir: o que o negócio pode ganhar, como chegam os clientes, a maior tendência do sector, e o que os melhores fazem.
Formato: 4 pontos curtos, cada um com no máximo 1 frase.
Começa cada ponto com emoji e label: 💰 GANHAM: | 🎯 CLIENTES: | ⚡ TENDÊNCIA: | 🏆 MELHORES FAZEM:
Em português de Portugal.`,
  },
];

async function callGemini(prompt: string): Promise<string> {
  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${err}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category, subcategory } = await req.json();

    if (!category || !subcategory) {
      return new Response(
        JSON.stringify({ error: "category e subcategory são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: benchmarkRow, error: benchErr } = await supabase
      .from("benchmarking_cache")
      .select("data")
      .eq("category", category)
      .eq("subcategory", subcategory)
      .maybeSingle();

    if (benchErr || !benchmarkRow) {
      return new Response(
        JSON.stringify({ error: `Benchmark não encontrado para ${category} / ${subcategory}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const benchmark = benchmarkRow.data as any;

    const contexto = `
SECTOR: ${category} — ${subcategory}

DADOS DO BENCHMARK:
- Ticket médio: ${benchmark.ticket_medio || "N/A"}
- Como chegam os clientes: ${benchmark.canal_aquisicao_principal || "N/A"}
- Factor de decisão principal: ${benchmark.factor_decisao_1 || "N/A"}
- Tendências 2025: ${benchmark.tendencia_2025 || "N/A"}
- Diferencial competitivo: ${benchmark.diferencial_competitivo || "N/A"}
- Benchmark de avaliações: ${benchmark.benchmark_avaliacoes || "N/A"}
- Presença digital: website ${benchmark.presenca_digital?.website || "N/A"}, redes sociais ${benchmark.presenca_digital?.redes_sociais || "N/A"}

CONTEXTO DA PEDE DIRETO:
- Plataforma portuguesa de ligação directa entre consumidores e negócios locais
- Plano de entrada: 9,90€/mês
- Sem contratos, sem comissões, cancela quando quiser
- Perfil verificado com avaliações reais
- Clientes com intenção de compra activa (não branding passivo)
`;

    const resultados: any[] = [];
    const erros: string[] = [];

    for (const tipo of TIPOS) {
      try {
        const prompt = `${contexto}\n\nTAREFA:\n${tipo.instrucao}\n\nResponde APENAS com o texto da resposta, sem introdução, sem aspas, sem formatação extra.`;
        const resposta = await callGemini(prompt);

        if (resposta) {
          const { error: upsertErr } = await supabase
            .from("benchmarking_responses")
            .upsert(
              {
                category,
                subcategory,
                tipo: tipo.tipo,
                chave: tipo.chave,
                resposta_curta: resposta.slice(0, 500),
                resposta_longa: resposta.length > 500 ? resposta : null,
                model_used: "gemini-2.0-flash",
                generation_prompt: prompt.slice(0, 1000),
                generated_at: new Date().toISOString(),
                approved: false,
              },
              { onConflict: "category,subcategory,tipo" }
            );

          if (upsertErr) {
            erros.push(`${tipo.tipo}: ${upsertErr.message}`);
          } else {
            resultados.push({ tipo: tipo.tipo, ok: true });
          }
        }
      } catch (e: any) {
        erros.push(`${tipo.tipo}: ${e.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        category,
        subcategory,
        gerados: resultados.length,
        erros: erros.length > 0 ? erros : undefined,
        detalhes: resultados,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
