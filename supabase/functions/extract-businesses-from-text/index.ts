import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─────────────────────────────────────────────
// ✅ NORMALIZAÇÃO DE CAMPOS
// Aceita qualquer nome de campo que a AI possa devolver
// e converte valores inválidos/vazios para null
// ─────────────────────────────────────────────
const INVALID_VALUES = new Set([
  "",
  "-",
  "−",
  "--",
  "n/a",
  "N/A",
  "na",
  "NA",
  "não disponível",
  "nao disponivel",
  "Não disponível",
  "Nao disponivel",
  "NÃO DISPONÍVEL",
  "NAO DISPONIVEL",
  "indisponível",
  "indisponivel",
  "sem info",
  "sem informação",
  "sem informacao",
  "desconhecido",
  "unknown",
  "none",
  "null",
  "undefined",
]);

function pickVal(...values: any[]): string | null {
  for (const val of values) {
    if (val === null || val === undefined) continue;
    if (typeof val !== "string") continue;
    const s = val.trim();
    if (s === "") continue;
    if (INVALID_VALUES.has(s)) continue;
    // Rejeita strings que só têm underscores (ex: "__website__")
    if (/^_+$/.test(s)) continue;
    if (/^__.*__$/.test(s)) continue;
    return s;
  }
  return null;
}

function normalizeBusiness(raw: any): any {
  // Recolhe todos os emails distintos encontrados em qualquer campo
  const allEmails = [raw.email, raw.cta_email, raw.owner_email, raw.email_negocio, raw.email_responsavel]
    .map((v) => (v && typeof v === "string" ? v.trim().toLowerCase() : null))
    .filter((v): v is string => {
      if (!v) return false;
      if (INVALID_VALUES.has(v)) return false;
      return v.includes("@");
    })
    .filter((v, i, arr) => arr.indexOf(v) === i); // dedup

  const cta_email = allEmails[0] ?? null;
  const owner_email = allEmails[1] ?? allEmails[0] ?? null;

  // Website: trata formato "__dominio.pt__" → "https://dominio.pt"
  const rawWebsite = [raw.website, raw.cta_website, raw.site, raw.url, raw.web].find(
    (v) => v && typeof v === "string" && v.trim().length > 0,
  );
  let website: string | null = null;
  if (rawWebsite) {
    // Remove underscores no início e fim (ex: "__picheleirocerto.pt__" → "picheleirocerto.pt")
    const stripped = rawWebsite.trim().replace(/^_+/, "").replace(/_+$/, "").trim();
    if (stripped && !INVALID_VALUES.has(stripped) && stripped.includes(".")) {
      website = stripped.startsWith("http") ? stripped : "https://" + stripped;
    }
  }

  return {
    name: pickVal(raw.name, raw.nome, raw.negocio, raw.business),
    address: pickVal(raw.address, raw.morada, raw.endereco, raw.endereço, raw.addr),
    city: pickVal(raw.city, raw.cidade, raw.localidade),
    cta_phone: pickVal(raw.cta_phone, raw.phone, raw.telefone, raw.tel, raw.telephone),
    cta_whatsapp: pickVal(raw.cta_whatsapp, raw.whatsapp, raw.wp, raw.wpp),
    cta_website: website,
    owner_name: pickVal(raw.owner_name, raw.responsavel, raw.responsável, raw.proprietario, raw.contact_name),
    cta_email,
    owner_email,
    category: pickVal(raw.category, raw.categoria),
    subcategory: pickVal(raw.subcategory, raw.subcategoria),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autorizado");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Apenas administradores" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      text,
      limit = 100,
      categoryId,
      subcategoryId,
      saveToDatabase = false,
      businesses: preSelectedBusinesses,
    } = await req.json();

    // ─────────────────────────────────────────────
    // ✅ MODO GRAVAÇÃO (passo 3 → BD)
    // Usa os businesses já normalizados enviados pelo frontend.
    // Não re-extrai do texto.
    // ─────────────────────────────────────────────
    if (saveToDatabase && preSelectedBusinesses?.length > 0) {
      const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

      const results = {
        inserted: 0,
        updated: 0,
        errors: [] as string[],
      };

      for (const b of preSelectedBusinesses) {
        // Re-normaliza cada business antes de gravar
        // (garante que valores inválidos não entram na BD mesmo se vieram do frontend)
        const safe = normalizeBusiness(b);

        if (!safe.name) {
          results.errors.push(`(sem nome): ignorado`);
          continue;
        }

        try {
          const { data, error } = await adminClient.rpc("upsert_business_from_import", {
            p_name: safe.name,
            p_city: safe.city ?? null,
            p_address: safe.address ?? null,
            p_cta_email: safe.cta_email ?? null,
            p_owner_email: safe.owner_email ?? null,
            p_cta_phone: safe.cta_phone ?? null,
            p_cta_whatsapp: safe.cta_whatsapp ?? null,
            p_cta_website: safe.cta_website ?? null,
            p_owner_name: safe.owner_name ?? null,
            p_category_id: categoryId ?? b.category_id ?? null,
            p_subcategory_id: subcategoryId && subcategoryId !== "none" ? subcategoryId : (b.subcategory_id ?? null),
            p_registration_source: "import_text",
          });

          if (error) {
            console.error(`Upsert error for "${safe.name}":`, error);
            results.errors.push(`${safe.name}: ${error.message}`);
          } else {
            const action = (data as any)?.action;
            if (action === "inserted") results.inserted++;
            if (action === "updated") results.updated++;
          }
        } catch (e: any) {
          results.errors.push(`${safe.name}: ${e.message}`);
        }
      }

      console.log(
        `Upsert complete: ${results.inserted} inserted, ` +
          `${results.updated} updated, ${results.errors.length} errors`,
      );

      return new Response(JSON.stringify({ businesses: preSelectedBusinesses, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─────────────────────────────────────────────
    // ✅ MODO EXTRAÇÃO (passo 2 → pré-visualização)
    // Extrai do texto via AI e devolve businesses normalizados
    // ─────────────────────────────────────────────
    if (!text || text.trim().length < 20) {
      return new Response(JSON.stringify({ error: "Texto demasiado curto para extração" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safeLimit = Math.min(Math.max(1, Number(limit) || 100), 200);

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const categoryInstruction = categoryId
      ? `- NÃO extraias categoria nem subcategoria do texto — já foram escolhidas manualmente pelo utilizador.`
      : `- Tenta extrair a categoria e subcategoria do negócio se estiverem mencionadas no texto. Se não encontrares, deixa null.`;

    const extractionPrompt = `Recebes um texto colado por um administrador com uma lista de negócios.
A tua tarefa é extrair UMA LISTA COMPLETA de todos os negócios presentes no texto.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMATO ESPECIAL — TEXTO CONCATENADO SEM SEPARADORES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
O texto pode estar numa única linha ou em poucas linhas, onde todos os campos de VÁRIOS negócios aparecem colados uns aos outros. Neste caso, cada negócio segue SEMPRE esta sequência fixa de campos:

  [Nome] [Categoria] [Subcategoria] [Cidade] [Telefone] [WhatsApp] [Email] [Website] [TelefoneOwner] [NomeOwner] [EmailOwner] [Morada]

EXEMPLOS DESTE FORMATO:
  "Picheleiro CertoServiços de Reparações & ObrasCanalizadoresPorto+351 918 246 298+351 918 246 298geral@picheleirocerto.pt__picheleirocerto.pt__+351 918 246 298Não disponívelgeral@picheleirocerto.ptR. Sra. do Porto 856, 4250-453 PortoZé Picheleiro PortoServiços de Reparações..."

  Neste exemplo há 2 negócios: "Picheleiro Certo" e "Zé Picheleiro Porto".
  Identifica cada negócio pelo seu nome e extrai os campos que se seguem até ao próximo nome de negócio.

COMO IDENTIFICAR O INÍCIO DE CADA NEGÓCIO:
  - Começa por um nome próprio de empresa/negócio (ex: "Picheleiro Certo", "SAT 24", "Manuel Oliveira")
  - Após o nome vem sempre: Categoria > Subcategoria > Cidade > contactos...
  - Strings como "Serviços de Reparações & Obras", "Canalizadores", "Porto", "Lisboa" são campos, não nomes de negócios
  - Um novo negócio começa quando reconheces um novo nome de empresa após uma morada completa ou após uma sequência completa de campos

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTROS FORMATOS POSSÍVEIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Linhas separadas (um campo por linha)
- Tabela copiada do Excel (tabs ou espaços múltiplos entre colunas)
- Lista de texto com cabeçalhos de cidade

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRAS DE EXTRAÇÃO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Extrai TODOS os negócios que encontrares — não pares no primeiro
- O campo "name" é OBRIGATÓRIO; ignora entradas sem nome claro
- Nunca inventes dados; extrai apenas o que está no texto
- Campos sem informação → null (NUNCA escrevas "Não disponível", "-", "N/A" — usa null)
- Valores como "Não disponível", "-", "N/A", "n/a", "—" no texto → null
- Strings "__xxx__" (com underscores) são websites com formatação errada: extrai "xxx" como website
- O texto pode ter DOIS telefones seguidos: o primeiro é "phone", o segundo é "whatsapp"
- Se encontrares 2 emails distintos: o do negócio vai para "email", o do responsável para "owner_email"
- Se só há 1 email, coloca-o em "email" (o sistema trata o resto)
- Telefones: mantém exatamente como no texto (ex: "+351 918 246 298")
- URLs: se tiver ".pt", ".com", ".eu" é website — remove os underscores se necessário
- Palavras a IGNORAR completamente: "Ativo", "Inativo", "Gratuito", "Premium", "Não Contactado", datas
${categoryInstruction}
- Retorna no MÁXIMO ${safeLimit} negócios

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEXTO A PROCESSAR:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${text.substring(0, 30000)}`;

    console.log(
      `Extracting businesses (${text.length} chars), ` +
        `categoryId=${categoryId || "none"}, subcategoryId=${subcategoryId || "none"}`,
    );

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "Extrais dados estruturados de texto colado por administradores. " +
              "Respondes APENAS com JSON válido via tool calling. " +
              "NUNCA uses strings como 'Não disponível', 'N/A', '-' — usa sempre null para campos sem informação.",
          },
          { role: "user", content: extractionPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_businesses",
              description: "Extrai lista de negócios do texto colado",
              parameters: {
                type: "object",
                properties: {
                  businesses: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Nome do negócio (obrigatório)" },
                        address: { type: "string", nullable: true, description: "Morada completa ou null" },
                        city: { type: "string", nullable: true, description: "Cidade ou null" },
                        phone: {
                          type: "string",
                          nullable: true,
                          description: "Telefone ou null (nunca 'Não disponível')",
                        },
                        whatsapp: {
                          type: "string",
                          nullable: true,
                          description: "WhatsApp ou null (nunca 'Não disponível')",
                        },
                        email: { type: "string", nullable: true, description: "Email do negócio ou null" },
                        owner_email: { type: "string", nullable: true, description: "Email do responsável ou null" },
                        owner_name: { type: "string", nullable: true, description: "Nome do responsável ou null" },
                        website: {
                          type: "string",
                          nullable: true,
                          description: "URL do website ou null (nunca 'Não disponível')",
                        },
                        category: { type: "string", nullable: true },
                        subcategory: { type: "string", nullable: true },
                      },
                      required: ["name"],
                    },
                  },
                },
                required: ["businesses"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_businesses" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit excedido, tente novamente mais tarde" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos AI insuficientes" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "Erro na extração de dados" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let businesses: any[] = [];

    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        const parsed = JSON.parse(toolCall.function.arguments);
        businesses = parsed.businesses || [];
      }
    } catch (parseErr) {
      console.error("Parse error:", parseErr);
      return new Response(JSON.stringify({ error: "Erro ao processar dados extraídos", businesses: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ✅ Normaliza + aplica categoria do dropdown + sanitiza todos os valores inválidos
    businesses = businesses
      .slice(0, safeLimit)
      .filter((b: any) => b.name && b.name.trim())
      .map((b: any) => {
        const normalized = normalizeBusiness(b);
        return {
          ...normalized,
          category_id: categoryId ?? null,
          subcategory_id: subcategoryId && subcategoryId !== "none" ? subcategoryId : null,
          // Só mostra categoria/subcategoria textual se não foi escolhida no dropdown
          category: categoryId ? null : normalized.category,
          subcategory: subcategoryId ? null : normalized.subcategory,
        };
      });

    console.log(`Extracted and normalized ${businesses.length} businesses.`);

    return new Response(JSON.stringify({ businesses }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-businesses-from-text error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
