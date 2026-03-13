
# Plan: Multi-Cidade para Negócios

## Status: ✅ IMPLEMENTADO

### O que foi feito

1. **Migration SQL** — Criada `business_cities` junction table com RLS, trigger `sync_primary_city` e backfill de todos os negócios existentes (incluindo split dos 6 com separadores)
2. **Hook `useBusinessCities`** — CRUD para multi-cidade com `useBusinessCityNames` e `useSyncBusinessCities`
3. **Componente `MultiCityInput`** — Pills removíveis com estrela para cidade primária, input com split automático por vírgula/pipe
4. **BusinessOwnerEditForm** — Substituído campo cidade por MultiCityInput, sync com junction table ao guardar
5. **BusinessFileCard (admin)** — Idem
6. **useBusinesses** — Query agora consulta `business_cities` para filtros de cidade
7. **useTopRanking** — Rankings consideram todas as cidades de cada negócio
8. **SubcategoryCityPage** — Consulta junction table para incluir negócios multi-cidade
9. **BusinessPage + BusinessCard** — Mostram "Atende em Lisboa, Porto, ..." em vez de mega-string
10. **Sitemap** — Gera URLs SEO para cada cidade individual de cada negócio

### Backward compatibility
- `businesses.city` mantém-se sincronizado via trigger (= cidade primária)
- Todas as views, RPCs e funções existentes continuam a funcionar
