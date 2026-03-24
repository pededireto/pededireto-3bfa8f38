import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const INVALID_VALUES = new Set([
  "",
  "-",
  "−",
  "—",
  "--",
  "n/a",
  "na",
  "não disponível",
  "nao disponivel",
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

function isInvalid(val: unknown): boolean {
  if (val === null || val === undefined) return true;
  if (typeof val !== "string") return true;
  const s = val.trim();
  if (s === "") return true;
  if (INVALID_VALUES.has(s.toLowerCase())) return true;
  if (/^_+$/.test(s)) return true;
  return false;
}

function clean(val: unknown): string | null {
  if (isInvalid(val)) return null;
  return (val as string).trim();
}

const COLUMN_MAP: Record<string, string> = {
  nome: "name",
  name: "name",
  negocio: "name",
  negócio: "name",
  business: "name",
  empresa: "name",
  descricao: "description",
  descrição: "description",
  description: "description",
  sobre: "description",
  about: "description",
  cidade: "city",
  city: "city",
  localidade: "city",
  morada: "address",
  address: "address",
  endereco: "address",
  endereço: "address",
  cta_phone: "cta_phone",
  phone: "cta_phone",
  telefone: "cta_phone",
  tel: "cta_phone",
  telephone: "cta_phone",
  cta_whatsapp: "cta_whatsapp",
  whatsapp: "cta_whatsapp",
  wp: "cta_whatsapp",
  wpp: "cta_whatsapp",
  cta_email: "cta_email",
  email: "cta_email",
  "email negocio": "cta_email",
  email_negocio: "cta_email",
  cta_website: "cta_website",
  website: "cta_website",
  site: "cta_website",
  url: "cta_website",
  web: "cta_website",
  owner_name: "owner_name",
  responsavel: "owner_name",
  responsável: "owner_name",
  proprietario: "owner_name",
  proprietário: "owner_name",
  contact_name: "owner_name",
  owner_email: "owner_email",
  email_responsavel: "owner_email",
  email_responsável: "owner_email",
  "email responsavel": "owner_email",
  "email owner": "owner_email",
  owner_phone: "owner_phone",
  "telefone owner": "owner_phone",
  "telefone responsavel": "owner_phone",
  nif: "nif",
  contribuinte: "nif",
  "n contribuinte": "nif",
  instagram: "instagram_url",
  instagram_url: "instagram_url",
  facebook: "facebook_url",
  facebook_url: "facebook_url",
  other_social_url: "other_social_url",
  outra_rede: "other_social_url",
  logo_url: "logo_url",
  logo: "logo_url",
  logotipo: "logo_url",
  opening_hours: "opening_hours",
  horarios: "opening_hours",
  horários: "opening_hours",
  cta_booking_url: "cta_booking_url",
  reservas: "cta_booking_url",
  cta_order_url: "cta_order_url",
  pedidos: "cta_order_url",
  category_id: "category_id",
  subcategory_id: "subcategory_id",
  category: "category",
  categoria: "category",
  subcategory: "subcategory",
  subcategoria: "subcategory",
};

function mapColumnName(raw: string): string | null {
  const key = raw
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, " ")
    .trim()
    .replace(/ /g, "_");
  if (COLUMN_MAP[key]) return COLUMN_MAP[key];
  const noUnderscore = key.replace(/_/g, "");
  for (const [k, v] of Object.entries(COLUMN_MAP)) {
    if (k.replace(/[_\s]/g, "") === noUnderscore) return v;
  }
  return null;
}

function detectTabularFormat(text: string): {
  isTabular: boolean;
  delimiter: string;
  headerLine: string;
  dataLines: string[];
} {
  const lines = text
    .split("\n")
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { isTabular: false, delimiter: "", headerLine: "", dataLines: [] };

  const firstLine = lines[0];
  let delimiter = "\t";
  let parts = firstLine.split(delimiter);
  if (parts.length < 3) {
    delimiter = ";";
    parts = firstLine.split(delimiter);
  }
  if (parts.length < 3) {
    delimiter = "    ";
    parts = firstLine.split(/\s{4,}/);
  }
  if (parts.length < 3) return { isTabular: false, delimiter: "", headerLine: "", dataLines: [] };

  let matches = 0;
  for (const part of parts) {
    if (mapColumnName(part) !== null) matches++;
  }

  if (matches >= 3) return { isTabular: true, delimiter, headerLine: firstLine, dataLines: lines.slice(1) };
  return { isTabular: false, delimiter: "", headerLine: "", dataLines: [] };
}

function parseTabular(headerLine: string, dataLines: string[], delimiter: string): any[] {
  const isMultiSpace = delimiter === "    ";
  const headers = isMultiSpace
    ? headerLine.split(/\s{4,}/).map((h) => h.trim())
    : headerLine.split(delimiter).map((h) => h.trim());

  const columnMapping: (string | null)[] = headers.map((h) => mapColumnName(h));
  const businesses: any[] = [];

  for (const line of dataLines) {
    if (!line.trim()) continue;
    const values = isMultiSpace
      ? line.split(/\s{4,}/).map((v) => v.trim())
      : line.split(delimiter).map((v) => v.trim());

    const entry: Record<string, string | null> = {};
    let hasName = false;

    for (let i = 0; i < columnMapping.length && i < values.length; i++) {
      const field = columnMapping[i];
      if (!field) continue;
      const val = clean(values[i]);
      entry[field] = val;
      if (field === "name" && val) hasName = true;
    }

    if (hasName) businesses.push(entry);
  }

  return businesses;
}

function extractInstagram(val: string | null): string | null {
  if (!val) return null;
  if (val.includes("instagram.com/")) return val.startsWith("http") ? val : "https://" + val;
  if (/^@?[a-zA-Z0-9._]{1,30}$/.test(val) && !val.includes(".")) {
    return `https://instagram.com/${val.replace(/^@/, "")}`;
  }
  return null;
}

function extractFacebook(val: string | null): string | null {
  if (!val) return null;
  if (val.includes("facebook.com/") || val.includes("fb.com/")) return val.startsWith("http") ? val : "https://" + val;
  return null;
}

function normalizeBusiness(raw: any): any {
  function pickVal(...keys: string[]): string | null {
    for (const k of keys) {
      const v = raw[k];
      if (!isInvalid(v)) return (v as string).trim();
    }
    return null;
  }

  const allPhoneRaw = [
    raw.cta_phone,
    raw.phone,
    raw.telefone,
    raw.tel,
    raw.cta_whatsapp,
    raw.whatsapp,
    raw.wp,
    raw.owner_phone,
  ]
    .map((v) => (v && typeof v === "string" ? v.trim() : null))
    .filter((v): v is string => !isInvalid(v));
  const uniquePhones = [...new Set(allPhoneRaw)];

  let cta_phone: string | null = null;
  let cta_whatsapp: string | null = null;
  let owner_phone: string | null = null;

  if (uniquePhones.length === 1) {
    cta_phone = uniquePhones[0];
    cta_whatsapp = uniquePhones[0];
    owner_phone = uniquePhones[0];
  } else if (uniquePhones.length === 2) {
    cta_phone = uniquePhones[0];
    owner_phone = uniquePhones[0];
    cta_whatsapp = uniquePhones[1];
  } else if (uniquePhones.length >= 3) {
    cta_phone = uniquePhones[0];
    cta_whatsapp = uniquePhones[1];
    owner_phone = uniquePhones[2];
  }

  const allEmails = [raw.cta_email, raw.email, raw.owner_email, raw.email_negocio, raw.email_responsavel]
    .map((v) => (v && typeof v === "string" ? v.trim().toLowerCase() : null))
    .filter((v): v is string => !isInvalid(v) && v!.includes("@"))
    .filter((v, i, arr) => arr.indexOf(v) === i);

  let cta_email: string | null = null;
  let owner_email: string | null = null;

  if (allEmails.length === 1) {
    cta_email = allEmails[0];
    owner_email = allEmails[0];
  } else if (allEmails.length >= 2) {
    cta_email = allEmails[0];
    owner_email = allEmails[1];
  }

  const rawWebsite = pickVal("cta_website", "website", "site", "url", "web");
  let website: string | null = null;
  if (rawWebsite) {
    const stripped = rawWebsite.replace(/^_+/, "").replace(/_+$/, "").trim();
    if (stripped && stripped.includes(".")) {
      website = stripped.startsWith("http") ? stripped : "https://" + stripped;
    }
  }

  const instagram = pickVal("instagram_url", "instagram");
  const facebook = pickVal("facebook_url", "facebook");

  // opening_hours — aceita objeto ou string JSON
  let opening_hours: Record<string, string> | null = null;
  const rawHours = raw.opening_hours ?? raw.horarios ?? raw.horários ?? null;
  if (rawHours) {
    if (typeof rawHours === "object") opening_hours = rawHours;
    else if (typeof rawHours === "string") {
      try {
        opening_hours = JSON.parse(rawHours);
      } catch {
        opening_hours = null;
      }
    }
  }

  return {
    name: pickVal("name", "nome", "negocio", "business"),
    description: pickVal("description", "descricao", "descrição", "sobre", "about"),
    address: pickVal("address", "morada", "endereco", "endereço"),
    city: pickVal("city", "cidade", "localidade"),
    cta_phone,
    cta_whatsapp,
    owner_phone,
    cta_email,
    owner_email,
    cta_website: website,
    owner_name: pickVal("owner_name", "responsavel", "responsável", "proprietario", "contact_name"),
    nif: pickVal("nif", "contribuinte"),
    instagram_url: extractInstagram(instagram),
    facebook_url: extractFacebook(facebook),
    // ── 5 campos novos ──
    other_social_url: pickVal("other_social_url", "outra_rede") || null,
    logo_url: pickVal("logo_url", "logo", "logotipo") || null,
    opening_hours,
    cta_booking_url: pickVal("cta_booking_url", "reservas") || null,
    cta_order_url: pickVal("cta_order_url", "pedidos") || null,
    // categorização
    category: pickVal("category", "categoria"),
    subcategory: pickVal("subcategory", "subcategoria"),
    category_id: raw.category_id ?? null,
    subcategory_id: raw.subcategory_id ?? null,
  };
}

async function extractWithAI(
  text: string,
  safeLimit: number,
  categoryId: string | null,
  subcategoryId: string | null,
): Promise<any[]> {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableKey) throw new Error("LOVABLE_API_KEY não configurado");

  const categoryInstruction = categoryId
    ? `- NÃO extraias categoria nem subcategoria — já foram escolhidas pelo utilizador.`
    : `- Tenta extrair a categoria e subcategoria se mencionadas. Se não encontrares, usa null.`;

  const prompt = `Recebes um texto colado com uma lista de negócios. Extrai TODOS os negócios.

REGRAS CRÍTICAS:
- Campo "name" é OBRIGATÓRIO
- Nunca inventes dados — extrai apenas o que está no texto
- Campos sem informação → null (NUNCA "Não disponível", "-", "N/A")
- Strings "__xxx__" (underscores) são websites: extrai "xxx"
- Se houver 2 telefones seguidos: primeiro = phone, segundo = whatsapp
- Se houver 2 emails: primeiro = email (negócio), segundo = owner_email
- Se só há 1 email, coloca em "email"
- Se só há 1 telefone, coloca em "phone"
- Telefones: mantém formato exato do texto
- URLs com ".pt", ".com", ".eu" etc = website
- URLs com "instagram.com" = instagram
- URLs com "facebook.com" ou "fb.com" = facebook
- Se encontrares NIF/contribuinte (9 dígitos PT), coloca em "nif"
- Se encontrares descrição/sobre do negócio, coloca em "description"
- Ignora palavras como "Ativo", "Inativo", "Gratuito", "Premium", "Não Contactado", datas
${categoryInstruction}
- Máximo ${safeLimit} negócios

TEXTO:
${text.substring(0, 30000)}`;

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
            "Extrais dados estruturados de texto. Respondes APENAS via tool calling com JSON válido. NUNCA uses placeholders como 'Não disponível' — usa null.",
        },
        { role: "user", content: prompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_businesses",
            description: "Lista de negócios extraídos do texto",
            parameters: {
              type: "object",
              properties: {
                businesses: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "Nome do negócio" },
                      description: { type: "string", nullable: true },
                      address: { type: "string", nullable: true },
                      city: { type: "string", nullable: true },
                      phone: { type: "string", nullable: true },
                      whatsapp: { type: "string", nullable: true },
                      email: { type: "string", nullable: true },
                      owner_email: { type: "string", nullable: true },
                      owner_name: { type: "string", nullable: true },
                      owner_phone: { type: "string", nullable: true },
                      website: { type: "string", nullable: true },
                      nif: { type: "string", nullable: true },
                      instagram: { type: "string", nullable: true },
                      facebook: { type: "string", nullable: true },
                      other_social_url: { type: "string", nullable: true },
                      logo_url: { type: "string", nullable: true },
                      opening_hours: { type: "object", nullable: true },
                      cta_booking_url: { type: "string", nullable: true },
                      cta_order_url: { type: "string", nullable: true },
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
    if (aiResponse.status === 429) throw new Error("RATE_LIMIT");
    if (aiResponse.status === 402) throw new Error("PAYMENT_REQUIRED");
    const errText = await aiResponse.text();
    console.error("AI error:", aiResponse.status, errText);
    throw new Error("AI_ERROR");
  }

  const aiData = await aiResponse.json();
  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) return [];

  const parsed = JSON.parse(toolCall.function.arguments);
  return parsed.businesses || [];
}

async function handleSaveMode(
  businesses: any[],
  categoryId: string | null,
  subcategoryId: string | null,
): Promise<{ inserted: number; updated: number; errors: string[] }> {
  const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const results = { inserted: 0, updated: 0, errors: [] as string[] };

  for (const b of businesses) {
    const safe = normalizeBusiness(b);
    if (!safe.name) {
      results.errors.push("(sem nome): ignorado");
      continue;
    }

    const slug = safe.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    try {
      const { data, error } = await adminClient.rpc("upsert_business_from_import", {
        p_name: safe.name,
        p_slug: slug,
        p_city: safe.city,
        p_address: safe.address,
        p_cta_email: safe.cta_email,
        p_owner_email: safe.owner_email,
        p_cta_phone: safe.cta_phone,
        p_cta_whatsapp: safe.cta_whatsapp,
        p_cta_website: safe.cta_website,
        p_owner_name: safe.owner_name,
        p_owner_phone: safe.owner_phone,
        p_nif: safe.nif,
        p_description: safe.description,
        p_instagram_url: safe.instagram_url,
        p_facebook_url: safe.facebook_url,
        p_other_social_url: safe.other_social_url,
        p_logo_url: safe.logo_url,
        p_opening_hours: safe.opening_hours,
        p_cta_booking_url: safe.cta_booking_url,
        p_cta_order_url: safe.cta_order_url,
        p_category_id: categoryId ?? safe.category_id,
        p_subcategory_id: subcategoryId && subcategoryId !== "none" ? subcategoryId : (safe.subcategory_id ?? null),
        p_registration_source: "import_text",
      });

      if (error) {
        console.error(`Upsert error for "${safe.name}":`, error);
        results.errors.push(`${safe.name}: ${error.message}`);
      } else {
        const action = (data as any)?.action;
        if (action === "inserted") results.inserted++;
        else results.updated++;
      }
    } catch (e: any) {
      results.errors.push(`${safe.name}: ${e.message}`);
    }
  }

  return results;
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

    if (saveToDatabase && preSelectedBusinesses?.length > 0) {
      const results = await handleSaveMode(preSelectedBusinesses, categoryId, subcategoryId);
      return new Response(JSON.stringify({ businesses: preSelectedBusinesses, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!text || text.trim().length < 10) {
      return new Response(JSON.stringify({ error: "Texto demasiado curto" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safeLimit = Math.min(Math.max(1, Number(limit) || 100), 200);
    let rawBusinesses: any[];

    const tabular = detectTabularFormat(text);
    if (tabular.isTabular) {
      console.log("Detected tabular format — parsing without AI");
      rawBusinesses = parseTabular(tabular.headerLine, tabular.dataLines, tabular.delimiter);
    } else {
      console.log(`AI extraction (${text.length} chars)`);
      try {
        rawBusinesses = await extractWithAI(text, safeLimit, categoryId, subcategoryId);
      } catch (e: any) {
        if (e.message === "RATE_LIMIT") {
          return new Response(JSON.stringify({ error: "Rate limit excedido, tente novamente mais tarde" }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (e.message === "PAYMENT_REQUIRED") {
          return new Response(JSON.stringify({ error: "Créditos AI insuficientes" }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        console.error("Extraction error:", e);
        return new Response(JSON.stringify({ error: "Erro na extração de dados" }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const businesses = rawBusinesses
      .slice(0, safeLimit)
      .map((b) => normalizeBusiness(b))
      .filter((b) => b.name)
      .map((b) => ({
        ...b,
        category_id: categoryId ?? b.category_id ?? null,
        subcategory_id: subcategoryId && subcategoryId !== "none" ? subcategoryId : (b.subcategory_id ?? null),
        category: categoryId ? null : b.category,
        subcategory: subcategoryId ? null : b.subcategory,
        source: "manual_text_import",
      }));

    return new Response(JSON.stringify({ businesses }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Edge function error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message || "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
