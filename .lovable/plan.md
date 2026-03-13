

## Plano: Página "Top Negócios" + Fix CTA BusinessLandingPage

### Tarefa 1 — Criar página `/top` (Top Negócios)

Actualmente só existem rotas `/top/:subcategorySlug` e `/top/:subcategorySlug/:citySlug`. Não existe uma página índice `/top` que liste todas as categorias e subcategorias disponíveis.

**Novo ficheiro: `src/pages/TopIndexPage.tsx`**

Página com:
- Header + Footer (padrão do site)
- H1: "Top Negócios em Portugal"
- Descrição: "Descubra os melhores profissionais e negócios por categoria"
- Campo de pesquisa/filtro para filtrar categorias e subcategorias em tempo real
- Lista de categorias (accordion ou secções), cada uma com as suas subcategorias como links para `/top/:subcategorySlug`
- Usa `useCategories()` + `useAllSubcategories()` para obter os dados
- SEO: meta tags, JSON-LD BreadcrumbList
- Visual limpo, consistente com o resto do site

**Actualizar `src/App.tsx`:**
- Adicionar `Route path="/top" element={<TopIndexPage />}` (antes das rotas `/top/:subcategorySlug`)

**Actualizar `src/components/Header.tsx`:**
- Adicionar link "🏆 Top Negócios" no menu desktop e mobile, a apontar para `/top`
- Posicionar antes do "📢 Registar Negócio"

### Tarefa 2 — Fix CTA na BusinessLandingPage

**Ficheiro: `src/components/BusinessLandingPage.tsx`**

Existem 2 CTAs "Registar o meu negócio" (linhas 326 e 560) que apontam para `/registar-negocio`. Ambos devem ser alterados para `/claim-business`.

Alterações:
- Linha 326: `to="/registar-negocio"` → `to="/claim-business"`
- Linha 560: `to="/registar-negocio"` → `to="/claim-business"`

### Ficheiros a criar/alterar

| Ficheiro | Acção |
|---|---|
| `src/pages/TopIndexPage.tsx` | Novo — página índice com categorias + subcategorias + pesquisa |
| `src/App.tsx` | Adicionar rota `/top` |
| `src/components/Header.tsx` | Adicionar link "Top Negócios" no menu |
| `src/components/BusinessLandingPage.tsx` | Fix 2 CTAs: `/registar-negocio` → `/claim-business` |

