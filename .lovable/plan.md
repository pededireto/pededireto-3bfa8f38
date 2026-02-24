
# Correcao do Painel Customer Success (/cs) - 2 Problemas

## Problema 1: Apenas 1000 negocios visíveis (de 1703)

**Causa:** O componente `CsBusinesses` (linha 335) usa o hook `useBusinesses()` que aplica `.eq("is_active", true)` e nao tem paginacao -- fica limitado ao maximo de 1000 linhas por query do Supabase.

**Solucao:** Ja existe um hook `useAllBusinesses()` (linhas 170-197 de `useBusinesses.ts`) que faz paginacao em lotes de 1000 e NAO filtra por `is_active`. Este hook resolve exactamente este problema.

**Alteracao:**
- Em `CsBusinesses.tsx` linha 335, substituir `useBusinesses()` por `useAllBusinesses()`
- Importar `useAllBusinesses` em vez de `useBusinesses`

---

## Problema 2: Botao "Ver analise detalhada nos Insights" nao funciona

**Causa:** Na `BusinessFicha` (linha 178), o callback `onInsightsClick` esta definido como `() => {}` (funcao vazia). Quando o utilizador clica no botao do `BusinessProfileScore`, nada acontece.

**Solucao:** Como a ficha do CS nao tem uma tab de Insights interna, a melhor opcao e abrir a pagina do business dashboard numa nova aba, directamente na seccao de insights. Alternativa: mostrar o componente `BusinessInsightsContent` dentro da propria ficha.

A abordagem mais simples e segura: abrir o dashboard do negocio em nova aba via `/negocio/{slug}` (ja existe botao "Ver pagina"), e substituir o `onInsightsClick` por navegacao para o dashboard com insights. Como o CS nao tem acesso directo ao `/business-dashboard` do negocio, vou remover o botao de insights e manter apenas o score visível com sugestoes (ja que `canViewPro=true`).

**Alteracao:**
- Em `BusinessFicha`, passar um `onInsightsClick` funcional que faz scroll para a seccao de metricas ja visível na ficha, ou simplesmente remover a dependencia do botao de insights que nao tem destino util no contexto CS.
- A melhor opcao: como o CS ja ve metricas na ficha, mudar o texto do botao para indicar que as metricas estao logo abaixo na ficha, fazendo scroll automatico.

---

## Ficheiros a alterar

| Ficheiro | Alteracao |
|----------|-----------|
| `src/components/cs/CsBusinesses.tsx` | Trocar `useBusinesses()` por `useAllBusinesses()` e implementar `onInsightsClick` funcional |

## Detalhes tecnicos

### Alteracao 1 - Import e hook
```typescript
// ANTES
import { useBusinesses } from "@/hooks/useBusinesses";
// ...
const { data: businesses = [], isLoading } = useBusinesses();

// DEPOIS
import { useAllBusinesses } from "@/hooks/useBusinesses";
// ...
const { data: businesses = [], isLoading } = useAllBusinesses();
```

### Alteracao 2 - onInsightsClick
Adicionar um `useRef` para a seccao de metricas na `BusinessFicha` e fazer scroll quando o utilizador clica "Ver analise detalhada nos Insights":

```typescript
const metricsRef = useRef<HTMLDivElement>(null);
// ...
<BusinessProfileScore
  businessId={business.id}
  canViewPro={true}
  onInsightsClick={() => metricsRef.current?.scrollIntoView({ behavior: "smooth" })}
  onUpgradeClick={() => {}}
/>
// ...
<div ref={metricsRef}> {/* Seccao de metricas */}
```

## Impacto
- Todos os 1703 negocios ficam visíveis no painel CS
- O botao de insights passa a fazer scroll para as metricas na ficha
- Sem alteracoes em outros ficheiros ou tabelas
