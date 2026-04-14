

# Plano: Mostrar negócios activos e inactivos não reclamados no /claim-business

## Diagnóstico

A RPC `search_businesses_for_claim` já **não filtra por `is_active`** — ou seja, já devolve negócios activos e inactivos com `claim_status IN ('unclaimed', 'none', 'rejected')`. Existem ~1916 inactivos e ~510 activos não reclamados.

O que falta é **mostrar visualmente** ao utilizador se o negócio está activo ou inactivo nos resultados, para facilitar a identificação e evitar duplicações.

## Alterações

### 1. Actualizar a RPC `search_businesses_for_claim`
- Adicionar `is_active boolean` ao `RETURNS TABLE` para que o frontend saiba o estado de cada resultado.

### 2. Actualizar `useClaimSearch.ts`
- Adicionar `is_active: boolean` à interface `ClaimResult`.

### 3. Actualizar `ClaimBusiness.tsx`
- Nos resultados da pesquisa, mostrar um badge discreto junto a cada negócio:
  - **Activo** → badge verde
  - **Inactivo** → badge cinzento "Inactivo"
- Isto ajuda o utilizador a perceber que o negócio já existe (mesmo inactivo) e evita que crie um duplicado.

## Ficheiros a alterar
1. **Migration SQL** — `CREATE OR REPLACE FUNCTION search_businesses_for_claim` com `is_active`
2. `src/hooks/useClaimSearch.ts` — interface `ClaimResult`
3. `src/pages/ClaimBusiness.tsx` — badge de estado nos resultados

## Impacto
- Sem alteração na pesquisa inteligente do site (barra de pesquisa global)
- Retrocompatível — apenas adiciona um campo ao retorno da RPC

