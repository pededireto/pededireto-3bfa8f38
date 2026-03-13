

## Plano: Multi-Cidade para Negócios

### Problema
O campo `businesses.city` é texto livre. Negócios que operam em várias cidades (ex: "Lisboa | Porto | Alentejo | Algarve | Açores | Madeira") criam "mega-cidades" falsas que geram URLs de SEO inválidas como `/top/babysitting/lisboa-porto-alentejo-algarve-acores-madeira`.

**6 negócios** na base de dados já têm este problema.

### Abordagem — Junction Table `business_cities`

Mesma estratégia da multi-categoria: manter `businesses.city` como cidade primária (backward compatible) + nova junction table.

### Passo 1 — Migration SQL

```sql
CREATE TABLE public.business_cities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  city_name   TEXT NOT NULL,
  is_primary  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, city_name)
);
-- RLS: leitura pública, escrita owner/admin
-- Trigger: sync is_primary → businesses.city
-- Backfill: para cada negócio, split city por "|" ou "," e inserir cada cidade
-- Os 6 negócios problemáticos: cidade primária = primeira da lista
```

O trigger `sync_primary_city` actualiza `businesses.city` com apenas a cidade primária sempre que `is_primary = true` é definido, mantendo backward compatibility com todas as views, RPCs, sitemap e SEO pages.

### Passo 2 — Backfill + limpeza dos 6 negócios

Na mesma migration:
1. Inserir uma entrada por negócio existente (os que têm cidade simples)
2. Para os 6 com separadores: split, trim, inserir cada cidade, marcar a primeira como primária
3. Actualizar `businesses.city` dos 6 para conter apenas a cidade primária

### Passo 3 — Consumo nos filtros de cidade

Alterar os hooks que filtram por cidade (`useBusinesses`, `useTopRanking`, `SubcategoryCityPage`, `sitemap`) para também consultar `business_cities`:
- Um negócio aparece numa cidade se `business_cities.city_name ilike '%cidade%'` OU `businesses.city ilike '%cidade%'` OU `alcance = 'nacional'`
- Isto garante que "Baby Sisters" aparece nos rankings de Lisboa, Porto, Alentejo, etc. separadamente

### Passo 4 — UI na página pública

Em `BusinessPage.tsx`, se o negócio tem múltiplas cidades em `business_cities`, mostrar "Atende em Lisboa, Porto, Alentejo, ..." em vez da mega-string actual.

### Passo 5 — UI no Admin (BusinessFileCard) e Owner (BusinessOwnerEditForm)

Componente `MultiCityInput`:
- Campo de texto onde se escreve cidades separadas por vírgula ou `|`
- Ao perder o foco ou ao guardar: split automático, cada cidade vira uma pill removível
- Primeira cidade = primária (pode ser reordenada)
- Ao guardar: sync para `business_cities`

### Passo 6 — Sitemap e SEO pages

O sitemap já usa `slugify(biz.city)` — com a junction table, cada cidade gera uma entrada separada no sitemap em vez de uma mega-slug.

### Ficheiros a criar/alterar

| Ficheiro | Acção |
|---|---|
| `supabase/migrations/...` | Junction table + trigger + backfill |
| `src/hooks/useBusinessCities.ts` | Novo — CRUD multi-cidade |
| `src/components/business/MultiCityInput.tsx` | Novo — UI pills de cidades |
| `src/pages/BusinessPage.tsx` | Mostrar cidades separadas |
| `src/components/BusinessCard.tsx` | Mostrar cidades separadas |
| `src/components/admin/BusinessFileCard.tsx` | Multi-city input |
| `src/components/business/BusinessOwnerEditForm.tsx` | Multi-city input |
| `src/hooks/useTopRanking.ts` | Consultar junction table |
| `src/pages/SubcategoryCityPage.tsx` | Consultar junction table |
| `src/hooks/useBusinesses.ts` | Consultar junction table |
| `supabase/functions/sitemap/index.ts` | Gerar URLs por cidade |

### Riscos

- **Nulo**: `businesses.city` mantém-se, todas as views/RPCs continuam a funcionar
- **Baixo**: O sitemap pode gerar mais URLs (positivo para SEO)
- **Backfill**: Apenas 6 negócios afectados, migração simples

