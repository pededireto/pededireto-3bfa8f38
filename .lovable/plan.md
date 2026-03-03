
# Partilha, SEO e Pesquisa Inteligente

## Tema 1 -- ShareButton + Partilha

### 1A. Criar `src/components/ShareButton.tsx`
Componente reutilizavel com Popover (shadcn) que mostra opcoes de partilha:
- WhatsApp, Facebook, X/Twitter, LinkedIn, Email, Copiar Link
- Props: `{ url, title, description?, imageUrl?, variant? }`
- Mensagem WhatsApp formatada: nome do negocio + categoria + cidade + URL
- "Copiar Link" com feedback visual temporario ("Copiado!") via useState + setTimeout
- Usa icones Lucide (Share2, MessageCircle, Facebook nao existe -- usar texto/emoji, Link, Mail)
- Mobile: usa Sheet (drawer), Desktop: usa Popover

### 1B. Adicionar ShareButton na BusinessPage.tsx
- Junto ao FavoriteButton na zona do hero (linha ~517, ao lado do botao de favoritos)
- Props: url=pageUrl, title=business.name, description=pageDescription, imageUrl=pageImage

### 1C. Adicionar ShareButton nos cards da SearchPage.tsx
- Pequeno botao de partilha em cada SearchResultCard
- URL: `https://pededireto.pt/negocio/${business.slug}`

### 1D. Botao "Partilhar pesquisa" na SearchPage
- Botao no topo dos resultados para partilhar o URL completo `/pesquisa?q=...&cidade=...`

### 1E. OG meta tags na BusinessPage
Ja existem (linhas 408-421) -- verificado. Alterar `og:type` de `website` para `business.business` para melhor semantica.

---

## Tema 2 -- Sitemap + SEO

### 2A. Edge Function `sitemap`
Criar `supabase/functions/sitemap/index.ts`:
- Query `businesses` activos (slug, updated_at)
- Query `categories` (slug, updated_at)
- Query `institutional_pages` activas (slug)
- Gerar XML valido com prioridades: homepage 1.0/daily, negocios 0.8/weekly, categorias 0.7/weekly, paginas 0.5/monthly, pesquisa 0.3/monthly
- Content-Type: `application/xml`
- Registar em config.toml com `verify_jwt = false`

### 2B. Actualizar `public/robots.txt`
Adicionar:
```
Disallow: /admin
Disallow: /dashboard
Disallow: /perfil
Disallow: /profile
Disallow: /comercial
Disallow: /onboarding
Disallow: /cs
Sitemap: https://pededireto.pt/sitemap.xml
```

### 2C. SEO meta tags
- **Homepage (Index.tsx)**: Adicionar `<Helmet>` com title, description, canonical e keywords
- **SearchPage.tsx**: Adicionar `<Helmet>` com title dinamico baseado no `?q=`, `noindex, follow` para evitar indexacao de pesquisas
- **BusinessPage.tsx**: Ja tem -- apenas mudar og:type para `business.business`

### 2D. JSON-LD na BusinessPage
Ja existe (linhas 351-367) com schema LocalBusiness -- verificado e correcto.

---

## Tema 3 -- Corrigir Pesquisa Inteligente

### 3A. Limitar resultados a 5 iniciais + "Ver mais"
No SearchPage.tsx, em cada grupo de businessGroups:
- Mostrar apenas os primeiros 5 negocios
- Botao "Ver mais profissionais" que expande para mostrar todos
- Estado local `expandedGroups` com Set de labels expandidos

### 3B. Cidade no URL e filtro visivel para anonimos
O filtro de cidade ja existe no SearchPage mas nao se reflecte no URL. Alterar:
- Sincronizar `cityFilter` com param `cidade` no URL: `/pesquisa?q=canalizador&cidade=lisboa`
- Ler `cidade` dos searchParams ao carregar
- Mostrar o selector de cidade sempre visivel (nao escondido atras de botao toggle)

### 3C. CTA de registo para utilizadores nao autenticados
No SearchResultCard, abaixo do card:
- Se `!user`: mostrar texto subtil com link para registo
- "Quer pedir orcamento directamente? Registe-se gratuitamente"
- Link para `/registar/consumidor?redirect=/pesquisa?q=...`

### 3D. Seccao "Tambem pode precisar de" melhorada
Apos os resultados no SearchPage:
- Se `complementaryServices` tem items: mostrar chips clicaveis (ja funciona via SmartSearchBanner)
- Se `complementaryServices` esta vazio E ha resultados: mostrar categorias populares como fallback
- Mover esta seccao para depois dos resultados (nao dentro do banner)

### 3E. Corrigir falsos positivos nos sinonimos
No useSmartSearch.ts, a CAMADA 2 (sinonimos):
- O strip de intent prefixes ja existe e funciona (linhas 51-118)
- O match ja e exacto (linha 417: `normalize(s.termo) === normalize(candidate)`)
- Problema potencial: palavras como "fazer", "quero" sao stripped mas se o termo resultante for muito curto (< 3 chars), pode dar match errado
- Adicionar guard: se `strippedTerm.length < 3`, nao procurar sinonimos por stripped term
- Na CAMADA 1 (patterns), o threshold de score >= 3 (linha 325) ja previne matches fracos -- manter

---

## Ficheiros a criar/alterar

| Ficheiro | Accao |
|----------|-------|
| `src/components/ShareButton.tsx` | Criar |
| `src/pages/BusinessPage.tsx` | Alterar: ShareButton + og:type |
| `src/pages/SearchPage.tsx` | Alterar: limite 5, cidade no URL, CTA registo, partilha |
| `src/pages/Index.tsx` | Alterar: Helmet SEO |
| `public/robots.txt` | Alterar: Disallow + Sitemap |
| `supabase/functions/sitemap/index.ts` | Criar |
| `src/hooks/useSmartSearch.ts` | Alterar: guard contra termos curtos |

## Ordem de execucao

1. ShareButton.tsx (componente novo)
2. BusinessPage.tsx (ShareButton + og:type)
3. SearchPage.tsx (todas as melhorias: limite, cidade URL, CTA, partilha)
4. useSmartSearch.ts (guard termos curtos)
5. Index.tsx (Helmet SEO)
6. robots.txt (actualizar)
7. Edge Function sitemap (criar + config.toml)
