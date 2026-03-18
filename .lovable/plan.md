## Plano: Benchmarking Sectorial Z.AI + Bug Fixes

### Resumo dos Itens


| Item                                                  | Tipo    | Complexidade |
| ----------------------------------------------------- | ------- | ------------ |
| BUG 1a — Ícones na categoria do Image Generator       | Bug     | Baixa        |
| BUG 1b — Pré-preencher nome/sector no Image Generator | Bug     | Baixa        |
| BUG 2 — Notificações admin para novos registos        | Bug     | Média        |
| Benchmarking Sectorial com Z.AI + Cache               | Feature | Alta         |


---

### BUG 1a — Remover ícones da categoria no Image Generator

**Ficheiro:** `src/pages/studio/StudioImagePage.tsx` (linhas 156-161)

O `SelectItem` renderiza `cat.icon` ao lado do nome. Remover o span do ícone para mostrar apenas texto.

---

### BUG 1b — Pré-preencher nome e sector com negócio activo

**Ficheiro:** `src/pages/studio/StudioImagePage.tsx`

O `StudioReelPage` já faz isto via `useStudioContext()`. Aplicar o mesmo padrão:

- Importar `useStudioContext` de `StudioLayout`
- Adicionar `useEffect` que, quando `selectedBusiness` muda, preenche `nome` com `selectedBusiness.name` e `sector` com o nome da categoria (obtido de `categories` via `selectedBusiness.category_id`)
- Valores editáveis pelo utilizador (são defaults, não bloqueados)

---

### BUG 2 — Notificações admin para novos utilizadores

**Problema:** Não existe trigger na tabela `profiles` para criar notificações admin.

**Solução:** Criar trigger SQL na tabela `profiles` (AFTER INSERT) que insere na `internal_notifications`:

- `type`: `'new_user'`
- `target_role`: `'admin'`
- `title`: `'Novo utilizador registado'`
- `message`: nome + email do perfil criado

A tabela `internal_notifications` já existe com as colunas necessárias. O `NotificationBell` já lê desta tabela e tem Realtime configurado para `internal_notifications` (para roles admin).

Adicionalmente, precisamos de verificar se o Realtime está habilitado para `internal_notifications` — se não, adicionamos via `ALTER PUBLICATION`.

---

### Benchmarking Sectorial Z.AI — Implementação Completa

#### Fase 1 — Criar tabela `benchmarking_cache`

Migration SQL com as colunas especificadas: `id`, `category`, `subcategory`, `data` (jsonb), `created_at`, `expires_at`, `hit_count`, `last_hit_at`, `renewed_by`. RLS: leitura pública para cache activo, escrita via service_role (Edge Functions).

#### Fase 2 — Edge Function `get-benchmarking`

Nova Edge Function em `supabase/functions/get-benchmarking/index.ts`:

1. Recebe `{ category, subcategory, business_id }`
2. Verifica cache: `SELECT * FROM benchmarking_cache WHERE category = X AND subcategory = Y AND expires_at > NOW()`
3. Se encontrar: incrementa `hit_count`, actualiza `last_hit_at`, devolve `data`
4. Se não: chama Z.AI API (`https://open.bigmodel.cn/api/paas/v4/chat/completions`) com modelo `glm-4-flash` e o prompt sectorial especificado
5. Guarda resposta na tabela com `renewed_by = 'lazy'`
6. Fallback: devolve `{ error: "unavailable" }` se API falhar

**Secret:** `ZHIPU_API_KEY` já está configurada.

#### Fase 3 — Hook `useBusinessBenchmarkSector`

Novo hook em `src/hooks/useBusinessBenchmarkSector.ts`:

- Recebe `businessId`
- Lê `category` e `subcategory` do negócio (via join com `categories` e `subcategories`)
- Invoca `supabase.functions.invoke("get-benchmarking", { body: { category, subcategory, business_id } })`
- Retorna dados tipados com interface `SectorBenchmarkData`  
  
comparação do perfil actual com as médias do sector : ""O teu perfil tem website ✅ — estás acima da média do sector" "Ainda não tens WhatsApp ❌ — 73% do sector já tem"

#### Fase 4 — Componente UI `SectorBenchmarkPanel`

Novo componente em `src/components/intelligence/SectorBenchmarkPanel.tsx`:

- 5 blocos conforme especificado (Métricas do Mercado, Posicionamento, Presença Digital, Keywords, Dica de Ouro)
- Comparação da presença digital com o perfil actual do negócio (website, whatsapp, redes sociais)
- Skeleton loading states
- Fallback "Dados temporariamente indisponíveis" se erro

#### Fase 5 — Integrar no Dashboard de Insights

**Ficheiro:** `src/components/business/BusinessInsightsContent.tsx`

- Importar `SectorBenchmarkPanel`
- Adicionar abaixo do benchmarking existente, visível apenas se `hasProAccess`
- Passar `businessId` e dados do negócio

#### Fase 6 — Cron Job de renovação

**Edge Function:** `supabase/functions/renew-benchmarking-cache/index.ts`

- Identifica categorias com `hit_count >= 10` e `expires_at < NOW() + 5 dias`
- Renova proactivamente via Z.AI API
- Verifica caches expiradas há >5 dias sem renovação → cria notificação admin
- Configurar pg_cron para executar diariamente às 03:00

#### Fase 7 — Pré-carregamento inicial

Na mesma Edge Function do cron, se `benchmarking_cache` estiver vazia, pré-carregar as 10 combinações especificadas com `renewed_by = 'preload'`.

---

### Ficheiros a criar/editar


| Ficheiro                                               | Acção                                                             |
| ------------------------------------------------------ | ----------------------------------------------------------------- |
| Migration SQL                                          | Criar `benchmarking_cache` + trigger `profiles` para notificações |
| `supabase/functions/get-benchmarking/index.ts`         | Nova Edge Function                                                |
| `supabase/functions/renew-benchmarking-cache/index.ts` | Nova Edge Function (cron)                                         |
| `supabase/config.toml`                                 | Adicionar configs das novas functions                             |
| `src/hooks/useBusinessBenchmarkSector.ts`              | Novo hook                                                         |
| `src/components/intelligence/SectorBenchmarkPanel.tsx` | Novo componente UI                                                |
| `src/components/business/BusinessInsightsContent.tsx`  | Integrar panel                                                    |
| `src/pages/studio/StudioImagePage.tsx`                 | Fix ícones + pré-preenchimento                                    |
