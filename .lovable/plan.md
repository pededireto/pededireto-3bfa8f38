
# Corrigir Acesso de Donos de Negocio ao Business Dashboard

## Problema Identificado
A query do hook `useBusinessMembership` faz um JOIN com a tabela `businesses`, mas a politica RLS de `businesses` so permite SELECT de negocios com `is_active = true`. O negocio "Delivery Masters" tem `is_active = false` (estado pendente), o que causa um erro 500 no PostgREST e impede o redirect para `/business-dashboard`.

## Causa Raiz
- Tabela `businesses`: politica SELECT para utilizadores normais = `is_active = true`
- Negocio em estado pendente tem `is_active = false`
- O JOIN `businesses(id, name, slug)` no hook retorna erro 500
- Sem dados de membership, o utilizador fica preso no `/dashboard`

## Solucao

### 1. Adicionar politica RLS em `businesses` para membros do negocio
Criar uma nova politica SELECT que permita utilizadores com registo em `business_users` verem o seu proprio negocio, independentemente do estado `is_active`.

```sql
CREATE POLICY "Business members can view their own business"
ON businesses FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM business_users
    WHERE business_users.business_id = businesses.id
    AND business_users.user_id = auth.uid()
  )
);
```

### 2. Tornar o hook mais resiliente (fallback sem JOIN)
Alterar `useBusinessMembership` para que, caso a query com JOIN falhe, tente uma query simples sem o JOIN. Isto garante que o redirect funcione mesmo que haja problemas com RLS.

```text
useBusinessMembership.ts:
  - Tentar query com JOIN (comportamento atual)
  - Se falhar (catch), fazer query simples: business_id, role apenas
  - O redirect so precisa de business_id, nao precisa do nome/slug
```

## Ficheiros a Modificar

| Ficheiro | Alteracao |
|----------|-----------|
| Nova migracao SQL | Adicionar politica RLS para membros do negocio verem o seu negocio |
| `src/hooks/useBusinessMembership.ts` | Adicionar fallback sem JOIN em caso de erro |

## Impacto
- Donos com negocios pendentes/inativos conseguem aceder ao `/business-dashboard`
- Sem impacto em utilizadores normais (a politica `is_active = true` continua a funcionar)
- A nova politica RLS e segura: so permite ver negocios onde o utilizador esta na tabela `business_users`
