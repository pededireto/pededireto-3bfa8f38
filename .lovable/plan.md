

# Plano: Preview Mode para Claims + Dashboard com Teasing

## Resumo

Implementar um novo estado `preview` no ciclo de vida do claim que permite ao utilizador ver o dashboard imediatamente apos reclamar um negocio, com cards de Contactos e Pedidos bloqueados (blur + cadeado) para incentivar upgrade.

## Peca 1 -- SQL (2 migrations)

### 1A: Alterar `claim_business()` RPC
- Mudar `claim_status` de `'pending'` para `'preview'`
- Manter tudo o resto igual (business_users, notificacao)

### 1B: Alterar `search_businesses_for_claim()` RPC
- Mudar filtro de `claimed = false` para `claim_status IN ('unclaimed', 'none', 'rejected')`
- Isto permite que os ~2020 negocios scrappados aparecam na pesquisa de claim

### 1C: Atualizar queries no hook e admin
- `useClaimRequests` atualmente filtra por `["pending", "verified", "rejected", "revoked"]` -- adicionar `"preview"` a lista
- `usePendingClaimsCount` filtra por `eq("claim_status", "pending")` -- mudar para `.in("claim_status", ["pending", "preview"])` para contar ambos como pendentes no badge do admin

## Peca 2 -- useBusinessClaimPermissions.ts

Adicionar `isPreview` ao interface e logica:

- `isPreview = claimStatus === "preview"`
- `canEditBasicFields`: `isPending || isPreview || isVerified`
- `canViewBasicAnalytics`: `(isPreview || isVerified) && allowAnalyticsBasic`
- `canViewRequests`: `isVerified && isPaidPlan` (bloqueado em preview)
- `canViewInsights`: `isVerified && isPaidPlan` (bloqueado em preview)
- Banner para preview: "O teu negocio esta em verificacao. Podes explorar o painel -- para receber pedidos ativa um plano pago."

## Peca 3 -- BusinessDashboardOverview.tsx

Redesenhar os 4 KPI cards com logica de bloqueio:

| Card | Preview/Free | Verified+Paid |
|------|-------------|---------------|
| Visualizacoes | Visivel com numero real | Visivel |
| Contactos | Blur + cadeado + CTA | Visivel |
| Pedidos | Blur + cadeado + CTA | Visivel |
| Notificacoes | Visivel | Visivel |

Adicionar:
- Componente `LockedCard` com blur CSS + overlay com icone Lock + texto + botao "Desbloquear"
- Componente `UpgradeBanner` no topo com mensagem contextual (preview vs free) + CTA para planos
- Card "O teu Potencial" no fundo para preview/free mostrando quantas pessoas viram o perfil

## Peca 4 -- Admin: statusBadge em ClaimRequestsContent.tsx e CommercialClaimRequestsContent.tsx

- Adicionar case `"preview"` ao `statusBadge()` com badge azul "Preview"
- Admin ClaimRequestsContent: adicionar `"preview"` as condicoes de acoes (aprovar/rejeitar disponivel tanto para "pending" como "preview")
- Admin badge counter: contar `preview` + `pending` como pendentes
- Commercial: filtrar `pendingClaims` por `["pending", "preview"]`

## Detalhes Tecnicos

### Ficheiros a alterar:
1. **SQL migration** -- `claim_business()` e `search_businesses_for_claim()` RPCs
2. **`src/hooks/useClaimRequests.ts`** -- adicionar "preview" aos filtros de query
3. **`src/hooks/useBusinessClaimPermissions.ts`** -- adicionar `isPreview` e ajustar permissoes
4. **`src/components/business/BusinessDashboardOverview.tsx`** -- LockedCard, UpgradeBanner, logica de bloqueio
5. **`src/components/admin/ClaimRequestsContent.tsx`** -- statusBadge + acoes para preview
6. **`src/components/commercial/CommercialClaimRequestsContent.tsx`** -- statusBadge + filtro

### Ordem de execucao:
1. SQL migration (base)
2. useClaimRequests (queries)
3. useBusinessClaimPermissions (permissoes)
4. BusinessDashboardOverview (UI principal)
5. ClaimRequestsContent + CommercialClaimRequestsContent (admin)
