## Plano: Gerador de Imagem via Base de Dados (sem IA externa)

**Problema** O `/app/image` depende da Edge Function `studio-generate` + Gemini, causando erros 500, truncagem de JSON e limites de quota. O `/app/reel` funciona e não será tocado.

**Fase 1 — Criar tabela** `image_prompts_library` Migration SQL:

sql

```sql
CREATE TABLE public.image_prompts_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria TEXT NOT NULL,
  estilo TEXT NOT NULL,
  proporcao TEXT NOT NULL DEFAULT '9:16',
  objectivo TEXT,
  titulo TEXT NOT NULL,
  prompt_principal TEXT NOT NULL,
  variante_a TEXT,
  variante_b TEXT,
  instrucoes TEXT,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.image_prompts_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active prompts" ON public.image_prompts_library FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage prompts" ON public.image_prompts_library FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);
```

**Fase 2 — Criar** `src/hooks/useImageLookup.ts` Hook que:

- Recebe os campos do formulário (categoria/estilo/proporcao/objectivo + dados do user)
- Query directa a `image_prompts_library` com filtro progressivo: categoria+estilo+proporcao → categoria+estilo → categoria → qualquer activo
- Personaliza prompts substituindo placeholders (`{{nome}}`, `{{sector}}`, `{{descricao}}`, `{{personagens}}`, `{{ambiente}}`, `{{textoSobreposto}}`) pelos valores do user
- Incrementa `usage_count` via RPC ou update directo
- Retorna `{ prompt_principal, variante_a, variante_b, titulo, instrucoes }`

**Fase 3 — Actualizar** `StudioImagePage.tsx`

- Remover import de `useStudioGenerate`
- Importar `useImageLookup`
- `handleGenerate`: chamar `lookupPrompt(...)` em vez de `generate("generate_image_prompt", ...)`
- Remover secção de referência visual (upload de imagem) — não faz sentido sem IA
- Mostrar `result.titulo` no output (nome do template usado)
- Adicionar botão "Usar no Reel" que navega para `/app/reel`

**Fase 4 — Actualizar** `StudioTopbar.tsx`

- Linha 48-50: Mudar badge de `IA · Gemini Pro` para mostrar `Biblioteca Curada` quando rota é `/app/image`, manter `IA · Gemini Pro` para `/app/reel`

**Fase 5 — Popular tabela com 10+ templates** Inserir via insert tool templates cobrindo combinações de:

- restauracao/local, restauracao/moderno
- beleza/local, beleza/limpo
- saude/limpo
- obras/limpo, obras/urgencia
- profissionais/limpo, profissionais/moderno
- eventos/urgencia

Todos com prompts cinematográficos em inglês, formato 9:16, com placeholders `{{nome}}` etc.

**Ficheiros a criar/editar**


| Ficheiro                                 | Acção                                |
| ---------------------------------------- | ------------------------------------ |
| Migration SQL                            | Criar tabela `image_prompts_library` |
| `src/hooks/useImageLookup.ts`            | Novo hook de lookup + personalização |
| `src/pages/studio/StudioImagePage.tsx`   | Substituir Gemini por lookup DB      |
| `src/components/studio/StudioTopbar.tsx` | Badge condicional por rota           |
| Insert data                              | 10+ templates de exemplo             |


**Não tocado**

- `studio-generate` Edge Function
- `StudioReelPage.tsx`
- `useStudioGenerate.ts`