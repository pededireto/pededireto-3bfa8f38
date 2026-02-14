
# Redirecionar Utilizadores Business para o Painel Correto

## Problema
O `UserDashboard.tsx` (rota `/dashboard`) so verifica se o utilizador e admin para redirecionar. Nao verifica se o utilizador tem um negocio associado na tabela `business_users`. Resultado: utilizadores business como o Telmo aterram no painel de consumidor em vez do `/business-dashboard`.

## Causa Raiz
Duas falhas complementares:
1. **UserDashboard.tsx** nao tem logica para detetar utilizadores business e redirecioná-los
2. **Race condition no login** — a cache do membership pode nao estar atualizada quando o redirect e decidido (ja parcialmente corrigido com `invalidateQueries`, mas insuficiente)

## Solucao

### 1. Adicionar redirect em `UserDashboard.tsx`
Integrar o hook `useBusinessMembership` na pagina `/dashboard`. Se o utilizador tiver `business_id` associado, redirecionar automaticamente para `/business-dashboard`.

```text
UserDashboard.tsx
  - Importar useBusinessMembership
  - No useEffect existente, adicionar verificacao:
    se membership?.business_id → navigate("/business-dashboard")
  - Aguardar membershipLoading antes de decidir
```

### 2. Reforcar redirect no login (`UserLogin.tsx`)
Garantir que apos `invalidateQueries`, o sistema aguarda efetivamente a resolucao da query antes de tomar a decisao de redirect. Adicionar `refetchType: 'active'` na invalidacao para forcar refetch sincrono.

## Ficheiros Modificados

| Ficheiro | Alteracao |
|----------|-----------|
| `src/pages/UserDashboard.tsx` | Adicionar verificacao de membership e redirect para `/business-dashboard` |
| `src/pages/UserLogin.tsx` | Melhorar invalidacao de cache com refetch ativo |

## Seguranca
Sem impacto — apenas logica de navegacao no frontend. O acesso aos dados continua protegido por RLS.
