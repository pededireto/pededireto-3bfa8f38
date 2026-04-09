

# Correcção de 5 Bugs Independentes

## Bug 1 — Variáveis de Ambiente (.env)

**Problema:** O `.env` tem variáveis `VITE_*` a apontar para o projecto errado `pnrqahgvhddhcucmccjp`.

**Correcção:** O `.env` é auto-gerado pelo Lovable Cloud e não pode ser editado manualmente. Contudo, as variáveis `VITE_*` são as que o `client.ts` usa (também auto-gerado). O projecto correcto do utilizador é `mpnizkjntkutpxevqzxx` (nas variáveis `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY`). Como ambos os ficheiros são geridos automaticamente pelo sistema, a correcção requer apenas garantir que não há referências hardcoded ao projecto errado no código-fonte. A pesquisa confirma que `pnrqahgvhddhcucmccjp` só aparece no `.env` — nenhum ficheiro `.ts/.tsx` tem hardcode. O `.env` e `client.ts` são regenerados automaticamente pelo Lovable Cloud e não devem ser editados.

**Acção:** Nenhuma alteração de código necessária. As variáveis são geridas pelo sistema.

---

## Bug 2 — Homepage Blocks: Tipo "Serviços Rápidos" com value errado

**Problema:** No admin, o tipo "Serviços Rápidos" tem `value: "quick_services"` mas o renderer usa `case "quick_services"`. Estes batem certo. O verdadeiro problema é que o campo de configuração JSON pode estar a mostrar código JSX como placeholder em vez de JSON puro, e o JSON parse silencioso (`catch { /* ignore */ }`) faz com que configurações inválidas passem como `{}`.

**Correcção em `HomepageContent.tsx`:**
- Validar JSON antes de guardar e mostrar erro claro se inválido (em vez de ignorar silenciosamente)
- Garantir que o `configJson` inicial ao criar é sempre `"{}"` (já está correcto no `openCreate`)

---

## Bug 3 — Pedidos: Enum `match_status` com valores errados

**Problema:** O enum `match_status` na DB aceita: `enviado`, `visualizado`, `em_conversa`, `orcamento_enviado`, `aceite`, `recusado`, `expirado`, `sem_resposta`. O código em `BusinessRequestsContent.tsx` já usa `"aceite"` e `"recusado"` correctamente (linhas 310, 433, 449). O erro na screenshot ("invalid input value for enum match_status: 'rejected'") sugere que havia um bug anterior que já foi corrigido no código actual.

**Acção:** Pesquisar todo o codebase por usos de `"rejected"`, `"accepted"`, `"expired"`, `"no_response"` em contexto de match_status para garantir que não restam usos em inglês.

**Ficheiros a verificar:** Hooks, componentes admin, edge functions.

---

## Bug 4 — Orçamentos: Tabelas não existem na DB

**Problema:** As tabelas `business_quotes`, `business_quote_items` e a função `generate_quote_number` não existem na base de dados. O código tenta inserir nelas e falha.

**Correcção:** Criar migração SQL com:
1. Tabela `business_quotes` (id, business_id, number, client_name, client_email, client_phone, notes, validity_days, iva_rate, subtotal, iva_amount, total, status, created_at, updated_at)
2. Tabela `business_quote_items` (id, quote_id FK, description, quantity, unit_price, total, sort_order)
3. Função `generate_quote_number(p_business_id uuid)` que gera números sequenciais (#001, #002, etc.)
4. RLS policies para permitir que business owners/managers possam CRUD nos seus orçamentos
5. Enable RLS em ambas as tabelas

---

## Bug 5 — Chave API: "Selecciona um negócio" mesmo com negócio seleccionado

**Problema:** Em `StudioSettingsPage.tsx`, o `selectedBusiness` vem do `useStudioContext()`. No `StudioLayout.tsx`, quando há apenas 1 negócio, `effectiveId` é atribuído automaticamente (`businesses[0].id`), mas `selectedId` permanece `""`. O `selectedBusiness` é derivado correctamente de `effectiveId`, por isso deveria funcionar.

O problema real é que `selectedBusiness` pode ser `null` se o utilizador tem múltiplos negócios e não seleccionou nenhum explicitamente. A validação em `handleVerifyAndSave` (linha 95) está correcta — verifica `selectedBusiness?.id`.

**Correcção:** No modal de onboarding (step 2), se `selectedBusiness` é null, mostrar um aviso inline a pedir para seleccionar o negócio no topo, em vez de só falhar ao clicar "Verificar e guardar". Também garantir que a chave fica persistida na tabela `business_api_keys` (que já existe na DB) e que após guardar com sucesso, ao reabrir o Studio Settings, a chave guardada é detectada e mostrada (isto já funciona via `useBusinessApiKey`).

---

## Resumo de Alterações

| # | Ficheiros | Tipo |
|---|-----------|------|
| 1 | Nenhum (sistema gerido) | — |
| 2 | `HomepageContent.tsx` | Fix validação JSON |
| 3 | Pesquisa global + correcções pontuais | Fix enum values |
| 4 | Nova migração SQL | Criar tabelas de orçamentos |
| 5 | `StudioSettingsPage.tsx` | Fix UX selecção de negócio |

