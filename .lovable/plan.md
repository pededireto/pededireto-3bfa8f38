

## Plano: Patch cirúrgico ao BusinessFileCard.tsx — Multi-Categoria

6 alterações cirúrgicas ao ficheiro, sem criar novos ficheiros.

### Patch 1 — Imports (linha 23)
Adicionar `MultiCategorySelector` e hooks `useBusinessCategoryIds`/`useSyncBusinessCategories` após o import de `useBusinessSubcategories`.

### Patch 2 — Estado do form (linha 443)
Adicionar `category_ids: [] as string[]` e `primary_category_id: ""` ao `useState` inicial, após `category_id`.

### Patch 3 — useEffect para carregar categorias existentes (após linha 544)
Chamar `useBusinessCategoryIds(business?.id)` e `useSyncBusinessCategories()`. Novo `useEffect` que popula `category_ids`, `primary_category_id` e `category_id` a partir da junction table.

### Patch 4 — handleSubmit: sync categorias (após linha 769)
Após `syncSubcategories.mutateAsync`, adicionar chamada a `syncCategories.mutateAsync` com `categoryIds` e `primaryCategoryId`. Aplicar nos dois blocos de save (create ~769 e update ~792).

### Patch 5 — UI: substituir Select por MultiCategorySelector (linhas 867-884)
Trocar o `<Select>` de categoria única pelo `MultiCategorySelector`, passando `selectedCategoryIds`, `primaryCategoryId` e `onChange` que actualiza `category_ids`, `primary_category_id`, `category_id` e limpa `subcategory_ids`.

### Patch 6 — filteredSubcategories (linha 568)
Usar `form.category_ids` (com fallback para `form.category_id`) para filtrar subcategorias por todas as categorias seleccionadas.

