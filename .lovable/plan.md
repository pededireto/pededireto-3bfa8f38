

## Imagens opcionais para Categorias e Subcategorias

### 1. Base de Dados

- A tabela `categories` ja tem o campo `image_url` -- nao e necessaria alteracao.
- Adicionar `image_url TEXT NULL` a tabela `subcategories` via migracao.

### 2. Backoffice (CategoriesContent.tsx)

**Formulario de Categorias:**
- Adicionar campo `<Input type="url">` com label "Imagem (URL externa)" entre o selector de icone e o campo de ordem.
- O campo ja existe no state (`catForm.image_url`) e na logica de submit -- falta apenas o input no JSX.

**Formulario de Subcategorias:**
- Adicionar `image_url` ao state `subForm`.
- Adicionar campo `<Input type="url">` no formulario de subcategorias.
- Incluir `image_url` na logica de submit (`handleSubSubmit`).

### 3. Hooks (useSubcategories.ts)

- Adicionar `image_url: string | null` a interface `Subcategory`.

### 4. Frontend Publico

**CategoriesGrid.tsx:**
- Para cada categoria, verificar se `category.image_url` existe.
- Se sim: renderizar `<img>` com grayscale + overlay escuro + texto por cima.
- Se nao: manter icone atual (comportamento identico ao de hoje).
- Adicionar `onError` no `<img>` para fallback automatico ao icone caso a imagem falhe.

**SubcategoriesGrid.tsx:**
- Mesma logica: se `sub.image_url` existir, mostrar imagem com grayscale; senao, manter layout atual.
- Fallback via `onError`.

### 5. Estilo Visual

Aplicar via classes Tailwind inline (sem CSS externo adicional):
- Grayscale por defeito: `filter grayscale`
- Hover com cores: `group-hover:grayscale-0`
- Transicao suave: `transition-all duration-300`
- Overlay escuro semi-transparente sobre a imagem para legibilidade do texto
- `object-cover` e `rounded-xl` para manter proporcoes
- Cards com imagem mantem o mesmo tamanho dos cards sem imagem

### 6. Ficheiros a alterar

| Ficheiro | Tipo de alteracao |
|---|---|
| Migracao SQL | Adicionar `image_url` a `subcategories` |
| `src/hooks/useSubcategories.ts` | Adicionar campo a interface |
| `src/components/admin/CategoriesContent.tsx` | Inputs de URL nos dois formularios |
| `src/components/CategoriesGrid.tsx` | Renderizacao condicional imagem/icone |
| `src/components/SubcategoriesGrid.tsx` | Renderizacao condicional imagem/icone |

### 7. O que NAO muda

- Sistema de icones permanece intacto
- Filtros, ordenacao, SEO -- sem alteracoes
- Categorias/subcategorias sem imagem continuam a funcionar exatamente como antes
- Retrocompatibilidade total

