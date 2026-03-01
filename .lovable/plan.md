# Feature 1: Stripe em Producao + Feature 2: Sistema de Trial 15 Dias

## Resumo

Duas features independentes a implementar em simultaneo: (1) badges visuais de ambiente Stripe no admin e garantia de uso de chaves de producao, e (2) sistema completo de Trial de 15 dias com gestao no admin, banner no dashboard e logica de ocultacao do banner "Nao reclamado".

---

## Feature 1 -- Stripe em Producao

### 1A. Chave secreta (STRIPE_SECRET_KEY)

A chave `STRIPE_SECRET_KEY` **nao esta configurada** nos secrets do projeto. As Edge Functions (`create-checkout-session`, `stripe-webhook`, `create-stripe-plans`, `stripe-cleanup`) ja a referenciam via `Deno.env.get("STRIPE_SECRET_KEY")`.

**Accao:** Usar a ferramenta `add_secret` para pedir ao utilizador que introduza a chave secreta de producao do Stripe (`sk_live_...`). Sem esta chave, nenhum pagamento funciona.

### 1B. Chave publicavel (frontend)

Atualmente o frontend **nao usa** nenhuma chave publishable do Stripe (nao ha `loadStripe` nem `VITE_STRIPE_PUBLISHABLE_KEY`). O checkout e feito via Edge Function que devolve um URL -- nao e necessario Stripe.js no frontend. Logo, **nenhuma alteracao e necessaria** neste ponto.

### 1C. Badges de ambiente no PlansContent.tsx

Alterar a seccao "Ligacao Stripe" no dialog de edicao (linhas 393-436) para mostrar badges condicionais:

- **Badge verde "Producao"** -- se `stripe_price_id` comecar por `price_` e NAO contiver `_test_`
- **Badge amarelo "Modo Teste"** -- se `stripe_price_id` contiver `_test_`
- **Badge vermelho "Nao configurado"** -- se `stripe_price_id` estiver vazio

Substituir o indicador simples existente (`"Stripe ID configurado"`) por estes badges com cores e icones distintos.

Tambem actualizar o badge na listagem de planos (linhas 229-241) com a mesma logica.

**Ficheiro:** `src/components/admin/PlansContent.tsx`

---

## Feature 2 -- Sistema de Trial 15 Dias

### 2.1 SQL Migration

Adicionar 4 colunas a tabela `businesses`:

```sql
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS is_claimed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz DEFAULT null,
  ADD COLUMN IF NOT EXISTS trial_activated_at timestamptz DEFAULT null,
  ADD COLUMN IF NOT EXISTS trial_activated_by uuid REFERENCES auth.users(id);
```

Nota: sem RLS adicional necessaria -- a tabela `businesses` ja tem politicas existentes que permitem leitura publica e escrita via RPCs.

### 2.2 Hook useBusinessPlan.ts

Criar novo ficheiro `src/hooks/useBusinessPlan.ts` com a logica exacta fornecida pelo utilizador:

- Recebe `subscription_plan`, `subscription_status`, `trial_ends_at`
- Calcula `isPro`, `isStart`, `isFree`, `isOnTrial`, `trialDaysLeft`
- Trial activo concede acesso PRO

### 2.3 BusinessFileCard.tsx -- Seccao Trial & Claim

Adicionar nova `Section` no formulario admin (entre a seccao 6 "Estado Comercial" e a seccao 7 "Subscricao"), visivel apenas para admin (`!isOwner`):

- **Toggle `is_claimed**` com label "Negocio Reclamado"
- **Badge de estado do trial:**
  - Verde "Trial Activo -- X dias restantes" se `trial_ends_at > now()`
  - Cinzento "Sem Trial" se `trial_ends_at` e null ou passado
- **Botao "Activar Trial 15 dias"** que faz update directo via supabase (nao via mutation do form):
  - `trial_ends_at = now() + 15 dias`
  - `trial_activated_at = now()`
  - `trial_activated_by = auth.uid()`
  - `is_claimed = true`
  - Invalida query `["businesses"]`
  - Toast de sucesso
- **Botao "Cancelar Trial"** (so visivel se trial activo):
  - `trial_ends_at = null`
  - Toast "Trial cancelado"
  - Invalida query `["businesses"]`

Os valores `is_claimed` e `trial_ends_at` sao lidos do objecto `business` passado por props (ja carregado).

### 2.4 UnclaimedBusinessBanner.tsx + BusinessPage.tsx

**UnclaimedBusinessBanner.tsx:** Adicionar prop `isClaimed` e retornar `null` se `isClaimed === true`.

**BusinessPage.tsx (linha 448):** Alterar a condicao de renderizacao:

- Antes: `!(business.claim_status === "verified" && userIsOwner)`
- Depois: `!business.is_claimed && !(business.claim_status === "verified" && userIsOwner)`

Passar `isClaimed={(business as any).is_claimed}` ao componente.

### 2.5 Banner Trial no Dashboard

Em `BusinessDashboardOverview.tsx`, adicionar banner condicional entre o titulo e o `UpgradeBanner` existente:

- Usar `useBusinessPlan` com dados do `business`
- Se `isOnTrial && trialDaysLeft > 3`: banner amber com icone Clock, texto "Estas em modo Trial PRO -- X dias restantes", botao "Escolher Plano"
- Se `isOnTrial && trialDaysLeft <= 3`: banner red/destructive com icone AlertTriangle, texto "O teu Trial termina em X dias!", botao "Manter acesso PRO"
- Botao navega para tab "plan" via `onNavigate?.("plan")`  
  
Quando o Trial tiver quase a expirar, o `useBusinessPlan` volta automaticamente ao plano gratuito pela leitura dos campos — Deverá nessa altura  enviar um **email automático** via Supabase Edge Function que avisa 3 dias antes do trial expirar. 

---

## Ficheiros a criar/alterar


| Ficheiro                                                | Accao                            |
| ------------------------------------------------------- | -------------------------------- |
| SQL Migration                                           | Criar: 4 colunas em `businesses` |
| `src/hooks/useBusinessPlan.ts`                          | Criar                            |
| `src/components/admin/PlansContent.tsx`                 | Alterar: badges Stripe           |
| `src/components/admin/BusinessFileCard.tsx`             | Alterar: seccao Trial & Claim    |
| `src/components/business/UnclaimedBusinessBanner.tsx`   | Alterar: prop `isClaimed`        |
| `src/pages/BusinessPage.tsx`                            | Alterar: condicao de banner      |
| `src/components/business/BusinessDashboardOverview.tsx` | Alterar: banner trial            |


## Ordem de execucao

1. Pedir secret `STRIPE_SECRET_KEY` ao utilizador
2. SQL migration (4 colunas)
3. Criar `useBusinessPlan.ts`
4. Alterar `BusinessFileCard.tsx` (seccao Trial & Claim)
5. Alterar `UnclaimedBusinessBanner.tsx` + `BusinessPage.tsx`
6. Alterar `BusinessDashboardOverview.tsx` (banner trial)
7. Alterar `PlansContent.tsx` (badges Stripe)