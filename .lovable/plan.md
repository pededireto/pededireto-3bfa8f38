

# Seccao de Categorias em Destaque

## Resumo

Criar uma nova tabela `featured_categories` para gerir quais categorias aparecem em destaque na homepage, com imagem de capa personalizada e ordem de exibicao. Adicionar uma seccao visual no frontoffice e uma interface de gestao no backoffice.

---

## Base de Dados

### Nova tabela: `featured_categories`
- `id` (uuid, PK)
- `category_id` (uuid, FK para categories, unique)
- `cover_image_url` (text, not null) -- imagem de capa personalizada
- `display_order` (integer, default 0)
- `is_active` (boolean, default true)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### RLS
- SELECT publico (para o frontoffice)
- INSERT/UPDATE/DELETE restrito a admins via `is_admin()`

### Trigger
- `update_updated_at_column` no UPDATE

---

## Frontoffice

### Novo componente: `FeaturedCategoriesSection.tsx`
- Seccao visual na homepage entre o SuperHighlightsSection e o CategoriesGrid
- Layout em grelha responsiva (2 colunas mobile, 3-4 desktop)
- Cada card mostra:
  - Imagem de capa com overlay escuro gradiente
  - Nome da categoria em texto branco sobre a imagem
  - Link para `/categoria/{slug}`
- Efeito hover suave (scale + sombra)
- Aspeto ratio 16/9 com `object-cover` (imagens de capa sao escolhidas pelo admin, nao fotos de produto)

### Hook: `useFeaturedCategories.ts`
- Query `featured_categories` com join a `categories` para obter nome e slug
- Filtrar por `is_active = true` e `categories.is_active = true`
- Ordenar por `display_order`

### Alteracao: `Index.tsx`
- Inserir `FeaturedCategoriesSection` entre SuperHighlightsSection e CategoriesGrid

---

## Backoffice

### Nova aba/seccao: dentro de `FeaturedContent.tsx` ou nova tab "Categorias em Destaque"
- Abordagem: adicionar uma sub-seccao dentro do ecrã de Destaques existente (`FeaturedContent.tsx`)
- Interface:
  - Lista de categorias em destaque com drag/reorder ou campo de ordem
  - Botao "Adicionar Categoria em Destaque" que abre dialog com:
    - Dropdown de categorias ativas (excluindo as ja em destaque)
    - Campo de URL para imagem de capa
    - Campo de ordem
    - Switch ativo/inativo
  - Acoes por linha: Editar, Remover
  - Pre-visualizacao da imagem de capa no formulario

---

## Ficheiros

### A criar
| Ficheiro | Descricao |
|---|---|
| `supabase/migrations/..._create_featured_categories.sql` | Tabela + RLS + trigger |
| `src/hooks/useFeaturedCategories.ts` | Hook com queries e mutacoes |
| `src/components/FeaturedCategoriesSection.tsx` | Componente frontoffice |

### A editar
| Ficheiro | Alteracao |
|---|---|
| `src/pages/Index.tsx` | Adicionar FeaturedCategoriesSection |
| `src/components/admin/FeaturedContent.tsx` | Adicionar gestao de categorias em destaque |

