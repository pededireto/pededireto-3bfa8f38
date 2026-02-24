

# Correcao do Erro "Cannot read properties of undefined (reading 'filter')" - Insights Pro

## Problema

O componente `ProfileScoreCard` em `BusinessProWidgets.tsx` (linha 31) chama `data.fields.filter()` sem verificar se `data.fields` existe. Quando a query `useBusinessProfileScore` retorna dados sem o campo `fields` (ou com `fields` undefined), o componente crasheia.

## Causa Raiz

No hook `useBusinessProfileScore` (em `useBusinessDashboardPro.ts`), se a query a `businesses` falhar parcialmente ou devolver dados inesperados, o campo `fields` pode ser `undefined`. O componente `BusinessInsightsContent.tsx` na linha 170 faz `{profileScore && <ProfileScoreCard data={profileScore} />}` - isto verifica que `profileScore` existe, mas nao garante que `profileScore.fields` e um array.

## Correcao

Adicionar validacao defensiva em dois pontos:

### 1. `BusinessProWidgets.tsx` - ProfileScoreCard (linha 31)

Adicionar fallback para `data.fields`:

```typescript
const unfilledFields = (data.fields ?? []).filter((f) => !f.filled);
```

E na linha 89 (iteracao dos campos):

```typescript
{(data.fields ?? []).map((f) => (
```

### 2. `BusinessInsightsContent.tsx` - Renderizacao condicional (linha 170)

Reforcar a condicao:

```typescript
{profileScore?.fields && <ProfileScoreCard data={profileScore} />}
```

## Ficheiros a alterar

| Ficheiro | Alteracao |
|----------|-----------|
| `src/components/business/BusinessProWidgets.tsx` | Fallback `?? []` no `.filter()` (linha 31) e `.map()` (linha 89) |
| `src/components/business/BusinessInsightsContent.tsx` | Verificacao `profileScore?.fields` na linha 170 |

## Impacto

- Zero alteracoes visuais quando os dados estao corretos
- Previne crash quando `fields` e `undefined`
- Corrige o erro que impede o acesso a aba Insights Pro

