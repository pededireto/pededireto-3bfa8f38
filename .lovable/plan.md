

## Análise: Página "Para Consumidores" - Redesign

### Estado Actual

A página `/pagina/pedediretoconsumidores` é servida pelo sistema genérico de páginas institucionais (`InstitutionalPage.tsx`), que suporta dois modos:
- **Simples**: HTML cru renderizado com DOMPurify
- **Avançada**: Blocos estruturados (text, image, gallery, columns, icon-list, cta-button, contacts, video, separator)

O HTML proposto tem secções complexas (hero com stats, grid de features com badges "Novo", stepper "Como funciona", FAQ accordion, CTAs duplos) que **não são representáveis** com os tipos de bloco existentes. Meter tudo em HTML simples perderia dark mode, responsividade consistente e interactividade (accordion FAQ).

### Abordagem Proposta

Criar um componente React dedicado `ConsumersLandingPage.tsx` que renderiza a landing page completa usando o design system existente (Tailwind vars, componentes UI, dark mode). No `InstitutionalPage.tsx`, quando o slug é `pedediretoconsumidores`, renderizar este componente em vez do sistema genérico.

Isto mantém o conteúdo editável via backoffice (meta title, meta description, active/inactive) mas a apresentação visual usa componentes React nativos.

### Secções do componente

1. **Hero** - Título, subtítulo, CTA "Criar conta gratuita", trust badges (grátis, sem cartão, 30s)
2. **Stats Bar** - 3 métricas (negócios, cidades, categorias) - dados hardcoded inicialmente, podem vir da BD depois
3. **Categorias** - Grid de chips/tags com emojis
4. **Features Grid** - 14 cards com ícone, título, descrição, badge "Novo" onde aplicável. Layout 2 colunas mobile, 3 desktop
5. **Como Funciona** - 4 steps com stepper visual numerado
6. **Porquê Criar Conta** - 4 cards com ícone + texto
7. **FAQ** - Accordion com 5 perguntas usando `@radix-ui/react-accordion` existente
8. **CTA Final** - Bloco de conversão com checklist e botão

### Implementação técnica

- Componente: `src/components/ConsumersLandingPage.tsx`
- Detecção no `InstitutionalPage.tsx`: `if (slug === 'pedediretoconsumidores') return <ConsumersLandingPage page={page} />`
- Usa `section-hero`, `card-business`, cores `--primary`, `--accent`/`--cta`, dark mode automático via CSS vars
- Links CTA apontam para `/registar/consumidor`
- FAQ usa componente `Accordion` existente
- SEO mantido via Helmet com dados da BD (meta_title, meta_description)
- Totalmente responsivo mobile-first

### Ficheiros a criar/editar

| Ficheiro | Acção |
|---|---|
| `src/components/ConsumersLandingPage.tsx` | Criar - componente completo da landing |
| `src/pages/InstitutionalPage.tsx` | Editar - detectar slug e renderizar componente dedicado |

