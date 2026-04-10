

# Plano: Formulários Visuais por Tipo de Bloco no Editor da Homepage

## Resumo

Substituir o textarea JSON manual no modal de edição de blocos (`HomepageContent.tsx`) por formulários visuais específicos para cada tipo de bloco. O JSON continua a ser gerado automaticamente por baixo. O textarea JSON fica disponível como acordeão colapsável para debug.

## Contexto Actual

O modal actual (`HomepageContent.tsx`, ~387 linhas) tem:
- Select de tipo, título, ordem, toggle ativo, datas
- Inputs de imagem/vídeo condicionais para alguns tipos
- Textarea JSON cru para `banner`, `negocios_premium`, `texto`, `personalizado`, `dual_cta`, `servicos_rapidos`, `social_proof`
- Todos os outros tipos (hero, categorias, how_it_works, platform_stats, etc.) não têm nenhum campo de configuração

## Arquitectura da Solução

### Ficheiros a criar

1. **`src/components/admin/homepage-blocks/BlockFormRenderer.tsx`** — componente que recebe `type` e `config` e renderiza o formulário correcto
2. **`src/components/admin/homepage-blocks/HeroBlockForm.tsx`**
3. **`src/components/admin/homepage-blocks/PlatformStatsBlockForm.tsx`**
4. **`src/components/admin/homepage-blocks/CategoriasBlockForm.tsx`** — usa `useCategories` para lista de checkboxes
5. **`src/components/admin/homepage-blocks/HowItWorksBlockForm.tsx`** — lista dinâmica de passos (max 5)
6. **`src/components/admin/homepage-blocks/DualCtaBlockForm.tsx`** — duas colunas
7. **`src/components/admin/homepage-blocks/ServicosRapidosBlockForm.tsx`** — lista dinâmica de items (max 8)
8. **`src/components/admin/homepage-blocks/SocialProofBlockForm.tsx`**
9. **`src/components/admin/homepage-blocks/BannerBlockForm.tsx`**
10. **`src/components/admin/homepage-blocks/NovosNegociosBlockForm.tsx`**
11. **`src/components/admin/homepage-blocks/GenericBlockForm.tsx`** — para `negocios_premium`, `destaques`, `featured_categories`, `super_destaques`, `categorias_accordion`
12. **`src/components/admin/homepage-blocks/TextoBlockForm.tsx`**
13. **`src/components/admin/homepage-blocks/BlockInfoBanner.tsx`** — nota informativa por tipo

### Ficheiro a modificar

- **`src/components/admin/HomepageContent.tsx`** — substituir a secção de campos condicionais (linhas 324-378) pelo `BlockFormRenderer`. Aumentar `max-w-lg` para `max-w-2xl` no dialog. Adicionar acordeão "Ver JSON gerado" colapsável.

## Detalhes por Formulário

Cada componente recebe `{ config, onChange }` onde `config` é `Record<string, any>` e `onChange` actualiza o objecto config (que depois é serializado como JSON no `handleSave`).

### Padrão comum
- O estado `configJson` existente passa a ser derivado do objecto `config` no formulário
- Quando o utilizador edita campos visuais → actualiza `config` → `configJson` é recalculado automaticamente
- Quando o utilizador edita JSON directamente (acordeão avançado) → faz parse → actualiza `config`
- Acordeão `<Collapsible>` com trigger "⚙️ Ver JSON gerado" no fundo de cada formulário (excepto `personalizado` que mantém o textarea como principal)

### Formulários específicos

**HeroBlockForm**: título, subtítulo, badge, 3 trust badges, toggle pesquisa, tamanho barra (Select), CTA primário (texto+link), CTA secundário (texto+link), tipo media (Select), URL condicional.

**PlatformStatsBlockForm**: Array de até 4 métricas, cada com toggle + label + valor + sufixo. Select cor de fundo.

**CategoriasBlockForm**: Título, subtítulo, modo apresentação (Select 3 opções), nº categorias (Input number), toggle "Ver mais", texto botão, colunas mobile/desktop (Selects). Lista de categorias com checkboxes (via `useCategories`).

**HowItWorksBlockForm**: Título, lista dinâmica de 1-5 passos (ícone emoji + título + descrição), botões adicionar/remover, toggle setas.

**DualCtaBlockForm**: Layout em duas colunas — cada coluna com badge, título, bullets dinâmicos (max 4), CTAs. Usa os mesmos nomes de campo que `DualCTASection` já consome (`left_title`, `left_bullets`, etc.).

**ServicosRapidosBlockForm**: Título, toggle "Ver todos", texto/link botão, lista de 1-8 items (emoji + label + link + cor Select).

**SocialProofBlockForm**: Título, subtítulo, max logos (Input number), modo (Select), lista condicional de URLs.

**BannerBlockForm**: Título, descrição, URL link, cor fundo (Select), URL imagem + preview, URL vídeo, posição imagem (Select), CTA texto.

**NovosNegociosBlockForm**: Título, nº negócios (Input number), toggle "Ver mais", ordenação (Select).

**GenericBlockForm**: Título, max a mostrar (Input number), toggle badge destaque. Usado para `negocios_premium`, `destaques`, `featured_categories`, `super_destaques`.

**TextoBlockForm**: Título, textarea conteúdo, alinhamento (Select).

**BlockInfoBanner**: Componente simples que recebe `type` e retorna `<div>` com fundo azul claro + ícone ℹ️ + texto descritivo do bloco.

## Alterações no HomepageContent.tsx

1. Substituir linhas 324-378 (campos condicionais + textarea JSON) por `<BlockFormRenderer>`
2. O `configJson` passa a ser sincronizado bidireccionalmente com o estado `config` do formulário
3. Dialog `max-w-lg` → `max-w-2xl` (para acomodar formulários mais largos como dual_cta)
4. Adicionar `ScrollArea` no conteúdo do dialog para formulários longos
5. Manter o `handleSave` inalterado — continua a fazer `JSON.parse(configJson)` como payload

## Notas de ajuda por tipo

Cada formulário mostra no topo um `BlockInfoBanner` com texto contextual (ex: "O bloco principal da homepage..." para hero). Junto ao acordeão JSON, texto: "O JSON deve ser um objecto válido. Começa e termina com { }."

## Impacto

- Nenhuma alteração nos componentes de renderização da homepage (HeroSection, DualCTASection, etc.)
- Nenhuma alteração na lógica de guardar/actualizar blocos
- Nenhuma alteração no layout da lista de blocos nem no comportamento de ordenação
- Nenhuma migração de DB necessária

