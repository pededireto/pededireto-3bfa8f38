import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatSupabaseError } from "@/utils/supabaseError";

interface LookupParams {
  categoria: string;
  estilo: string;
  proporcao: string;
  objectivo?: string;
  nome?: string;
  sector?: string;
  descricao?: string;
  personagens?: string;
  ambiente?: string;
  textoSobreposto?: string;
}

interface LookupResult {
  prompt_principal: string;
  variante_a: string;
  variante_b: string;
  titulo: string;
  instrucoes: string;
}

/**
 * Substitui placeholders básicos no template
 */
function replacePlaceholders(text: string | null, params: LookupParams): string {
  if (!text) return "";
  return text
    .replace(/\{\{nome\}\}/gi, params.nome || "the business")
    .replace(/\{\{sector\}\}/gi, params.sector || "")
    .replace(/\{\{descricao\}\}/gi, params.descricao || "")
    .replace(/\{\{personagens\}\}/gi, params.personagens || "")
    .replace(/\{\{ambiente\}\}/gi, params.ambiente || "")
    .replace(/\{\{textoSobreposto\}\}/gi, params.textoSobreposto || "");
}

/**
 * 🎯 Enriquece o prompt base com inputs do utilizador
 */
function enrichPromptWithUserInputs(basePrompt: string, params: LookupParams): string {
  let enriched = basePrompt;

  // 1. Se tem DESCRIÇÃO específica → injeta
  if (params.descricao && params.descricao.trim()) {
    enriched = enriched.replace(/professional .+ in .+ setting/i, params.descricao);
    if (!enriched.includes(params.descricao)) {
      enriched = `${params.descricao}, ${enriched}`;
    }
  }

  // 2. Se tem PERSONAGENS específicos → injeta
  if (params.personagens && params.personagens.trim()) {
    enriched = enriched.replace(
      /(professional|worker|specialist|technician|person)[^,]*/i,
      params.personagens
    );
    if (!enriched.includes(params.personagens)) {
      enriched = enriched.replace(/,\s*/, `, ${params.personagens}, `);
    }
  }

  // 3. Se tem AMBIENTE específico → injeta
  if (params.ambiente && params.ambiente.trim()) {
    enriched = enriched.replace(
      /(modern|traditional|clean|warm|bright)\s+(salon|office|shop|restaurant|space|interior|setting)[^,]*/gi,
      params.ambiente
    );
    if (!enriched.includes(params.ambiente)) {
      enriched = enriched.replace(
        /(,?\s*9:16 aspect ratio)/i,
        `, ${params.ambiente}, 9:16 aspect ratio`
      );
    }
  }

  // 4. Se tem NOME → garante que aparece
  if (params.nome && params.nome.trim()) {
    if (!enriched.toLowerCase().includes(params.nome.toLowerCase())) {
      enriched = enriched.replace(/(Portuguese|Portugal)/i, `${params.nome} $1`);
    }
  }

  // 5. Limpa duplicações
  enriched = enriched.replace(/,\s*,/g, ",").replace(/\s{2,}/g, " ").trim();

  return enriched;
}

/**
 * 🎨 NOVA: Cria VARIANTE A com foco diferente (ângulo/composição)
 */
function createVariantA(basePrompt: string, params: LookupParams): string {
  let variant = basePrompt;

  // Modificadores de ÂNGULO para Variante A
  const angleModifiers = [
    "close-up hands applying",
    "over-the-shoulder perspective",
    "wide angle showing full space",
    "detail shot focusing on",
    "bird's eye view of",
  ];

  // Adiciona modificador de ângulo no início
  const randomAngle = angleModifiers[Math.floor(Math.random() * angleModifiers.length)];
  
  // Se não tem já um close-up ou ângulo específico, adiciona
  if (!variant.match(/close-up|wide angle|overhead|perspective/i)) {
    variant = `${randomAngle} ${variant}`;
  }

  // Adiciona variação na iluminação
  if (!variant.includes("lighting")) {
    variant = variant.replace(
      /(9:16 aspect ratio)/i,
      "soft natural lighting, $1"
    );
  }

  return variant;
}

/**
 * 🌅 NOVA: Cria VARIANTE B com iluminação/atmosfera diferente
 */
function createVariantB(basePrompt: string, params: LookupParams): string {
  let variant = basePrompt;

  // Modificadores de ILUMINAÇÃO para Variante B
  const lightingStyles = [
    "golden hour warm lighting",
    "soft window light from side",
    "dramatic side lighting with shadows",
    "bright even professional lighting",
    "ambient candlelight atmosphere",
  ];

  const randomLighting = lightingStyles[Math.floor(Math.random() * lightingStyles.length)];

  // Adiciona iluminação específica
  variant = variant.replace(
    /(9:16 aspect ratio)/i,
    `${randomLighting}, $1`
  );

  // Adiciona detalhe atmosférico extra
  const atmosphereDetails = [
    "happy client reflection in mirror",
    "before after transformation split",
    "satisfied customer smiling",
    "peaceful zen atmosphere",
    "energetic vibrant mood",
  ];

  const randomAtmosphere = atmosphereDetails[Math.floor(Math.random() * atmosphereDetails.length)];
  
  if (!variant.includes("atmosphere") && !variant.includes("reflection")) {
    variant = variant.replace(
      /(photorealistic)/i,
      `${randomAtmosphere}, $1`
    );
  }

  return variant;
}

export function useImageLookup() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const lookupPrompt = async (params: LookupParams): Promise<LookupResult | null> => {
    setIsLoading(true);
    try {
      const { categoria, estilo, proporcao } = params;

      // 🔍 Progressive filtering
      const filters = [
        { categoria, estilo, proporcao },
        { categoria, estilo },
        { categoria },
        {},
      ];

      let row: any = null;
      for (const filter of filters) {
        let query = supabase
          .from("image_prompts_library")
          .select("*")
          .eq("is_active", true);

        if (filter.categoria) query = query.eq("categoria", filter.categoria);
        if (filter.estilo) query = query.eq("estilo", filter.estilo);
        if (filter.proporcao) query = query.eq("proporcao", filter.proporcao);

        const { data, error } = await query.limit(1).maybeSingle();

        if (error) {
          console.error("[useImageLookup] query error:", error);
          throw error;
        }

        if (data) {
          row = data;
          console.log(`✅ Template: ${data.titulo} (${Object.keys(filter).join(", ")})`);
          break;
        }
      }

      if (!row) {
        toast({
          title: "Sem templates disponíveis",
          description: "Ainda não existem templates para esta combinação.",
          variant: "destructive",
        });
        return null;
      }

      // 📊 Increment usage
      supabase
        .from("image_prompts_library")
        .update({ usage_count: (row.usage_count || 0) + 1 })
        .eq("id", row.id)
        .then();

      // 🎨 PROCESSAMENTO DAS 3 PROMPTS DE FORMA DIFERENTE

      // 1️⃣ PROMPT PRINCIPAL: Base + User Inputs
      let promptPrincipal = replacePlaceholders(row.prompt_principal, params);
      promptPrincipal = enrichPromptWithUserInputs(promptPrincipal, params);

      // 2️⃣ VARIANTE A: Se existe na BD, usa; senão cria com foco em ÂNGULO
      let varianteA = row.variante_a 
        ? replacePlaceholders(row.variante_a, params)
        : promptPrincipal;
      
      varianteA = enrichPromptWithUserInputs(varianteA, params);
      varianteA = createVariantA(varianteA, params);

      // 3️⃣ VARIANTE B: Se existe na BD, usa; senão cria com foco em ILUMINAÇÃO
      let varianteB = row.variante_b
        ? replacePlaceholders(row.variante_b, params)
        : promptPrincipal;
      
      varianteB = enrichPromptWithUserInputs(varianteB, params);
      varianteB = createVariantB(varianteB, params);

      console.log("🎯 Principal:", promptPrincipal.substring(0, 80) + "...");
      console.log("🔄 Variante A:", varianteA.substring(0, 80) + "...");
      console.log("🌅 Variante B:", varianteB.substring(0, 80) + "...");

      return {
        prompt_principal: promptPrincipal,
        variante_a: varianteA,
        variante_b: varianteB,
        titulo: row.titulo || "Template",
        instrucoes: replacePlaceholders(row.instrucoes, params),
      };
    } catch (err: any) {
      const detail = formatSupabaseError(err, "Erro ao procurar template");
      toast({
        title: "Erro — Biblioteca de Imagem",
        description: detail,
        variant: "destructive",
      });
      console.error("[useImageLookup] error:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { lookupPrompt, isLoading };
}
```

---

## **🎯 O QUE MUDOU:**

### **Antes:**
- ❌ As 3 prompts recebiam o mesmo tratamento
- ❌ Variantes A e B eram quase idênticas

### **Agora:**
- ✅ **Prompt Principal**: Base da BD + inputs do user
- ✅ **Variante A**: Adiciona **modificadores de ÂNGULO** (close-up, wide angle, overhead, etc.)
- ✅ **Variante B**: Adiciona **modificadores de ILUMINAÇÃO** (golden hour, dramatic side light, etc.)

---

## **📸 EXEMPLO DE RESULTADO (Flor de Lótus):**

**Prompt Principal:**
```
Profissional de estética a aplicar extensões de pestanas em cliente relaxada, Técnica de estética profissional, cliente feminina relaxada na maca de tratamento, ambiente sereno de salão com decoração inspirada em lótus, produtos de beleza holísticos visíveis, atmosfera zen e acolhedora, Interior de salão de beleza moderno e sereno em Vila Franca de Xira, decoração com elementos naturais e flor de lótus, iluminação suave e ambiente holístico, Flor de Lótus, 9:16 aspect ratio, photorealistic
```

**Variante A — Ângulo diferente:**
```
close-up hands applying Profissional de estética a aplicar extensões de pestanas em cliente relaxada, Técnica de estética profissional, cliente feminina relaxada na maca de tratamento, ambiente sereno de salão com decoração inspirada em lótus, produtos de beleza holísticos visíveis, atmosfera zen e acolhedora, Interior de salão de beleza moderno e sereno em Vila Franca de Xira, decoração com elementos naturais e flor de lótus, iluminação suave e ambiente holístico, Flor de Lótus, soft natural lighting, 9:16 aspect ratio, photorealistic
```

**Variante B — Iluminação diferente:**
```
Profissional de estética a aplicar extensões de pestanas em cliente relaxada, Técnica de estética profissional, cliente feminina relaxada na maca de tratamento, ambiente sereno de salão com decoração inspirada em lótus, produtos de beleza holísticos visíveis, atmosfera zen e acolhedora, Interior de salão de beleza moderno e sereno em Vila Franca de Xira, decoração com elementos naturais e flor de lótus, iluminação suave e ambiente holístico, Flor de Lótus, golden hour warm lighting, happy client reflection in mirror, 9:16 aspect ratio, photorealistic