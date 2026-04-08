

# Redesign Completo da Homepage — Design Fresco e Moderno

## Objetivo
Transformar a homepage para o design da imagem de referência, mantendo o sistema de blocos admin (`homepage_blocks`) funcional para edição contínua no painel.

## Estrutura Visual (baseada na imagem)

```text
┌─────────────────────────────────────────────────┐
│ HEADER (manter atual)                           │
├─────────────────────────────────────────────────┤
│ HERO — fundo branco/gradiente suave             │
│  Esq: badge + título + subtítulo                │
│       + barra pesquisa (com cidade + botão)      │
│       + trust badges (✓ ✓ ✓)                    │
│       + 2 CTAs: "Pedir Orçamento" + "Sou Prof." │
│  Dir: collage de fotos profissionais (externas)  │
├─────────────────────────────────────────────────┤
│ STATS BAR — fundo verde, 3 métricas inline      │
├─────────────────────────────────────────────────┤
│ "Funciona assim:" — 3 passos horizontais        │
├─────────────────────────────────────────────────┤
│ "O que precisas resolver hoje?" — 6 cards ícone │
├─────────────────────────────────────────────────┤
│ DUAL CTA BANNER — consumidor + empresa (2 cols) │
├─────────────────────────────────────────────────┤
│ SOCIAL PROOF — logos de negócios na plataforma  │
├─────────────────────────────────────────────────┤
│ CTA FINAL — "Resolve o que precisas agora"      │
├─────────────────────────────────────────────────┤
│ FOOTER (manter atual)                           │
└─────────────────────────────────────────────────┘
```

## Novos Tipos de Bloco no Admin

Adicionar ao `BLOCK_TYPES` e ao `HomepageBlockRenderer`:

| Tipo | Componente | Descrição |
|------|-----------|-----------|
| `dual_cta` | `DualCTASection` | Dois cards lado a lado (consumidor + empresa) com imagem externa |
| `social_proof` | `SocialProofSection` | Logos de negócios + frase de prova social |
| `quick_services` | `QuickServicesSection` | 6 cards de serviços rápidos com ícone/emoji |

## CTAs e Routing

| Botão | Destino |
|-------|---------|
| "Pedir Orçamento Gratuito" | Se autenticado → `/pedir-servico`, senão → `/register` |
| "Encontrar serviço" / "Encontrar Serviço" | `/top` |
| "Sou profissional" | `/claim-business` |
| "Criar perfil grátis" | `/register` |
| "Encontrar o meu negócio" | `/claim-business` |

## Ficheiros a Modificar/Criar

### Modificar
1. **`src/components/HeroSection.tsx`** — Redesign completo:
   - Badge topo "A plataforma nº1 para encontrar serviços"
   - Título em 2 linhas com "Resolve já." em verde
   - Barra de pesquisa redesenhada (input + cidade + botão verde "Encontrar agora")
   - Trust badges inline com checkmarks verdes
   - 2 CTAs: "Pedir Orçamento Gratuito →" (verde) + "Sou profissional" (outline com ícone)
   - Lado direito: collage de imagens (URLs do config JSONB, zero Storage)

2. **`src/components/PlatformStats.tsx`** — Redesign: barra verde horizontal com 3 métricas (800+ Serviços, Novos pedidos, Profissionais verificados) usando ícones circulares

3. **`src/components/HowItWorks.tsx`** — Redesign: layout horizontal com setas entre passos, números em círculos verdes, ícones maiores

4. **`src/components/BusinessCTA.tsx`** — Redesign: fundo verde escuro, 2 botões lado a lado ("Encontrar serviço" + "Publicar pedido grátis →")

5. **`src/components/HomepageBlockRenderer.tsx`** — Adicionar cases para `dual_cta`, `social_proof`, `quick_services`

6. **`src/components/admin/HomepageContent.tsx`** — Adicionar novos tipos ao `BLOCK_TYPES`

### Criar
7. **`src/components/home/DualCTASection.tsx`** — Dois cards: "Para quem procura" (fundo verde) + "Para empresas" (fundo branco/laranja), cada um com bullet points e CTAs, suportando imagem por URL externo no config

8. **`src/components/home/SocialProofSection.tsx`** — Puxa automaticamente logos dos negócios mais bem classificados (campo `logo_url` da tabela `businesses`) + frase configurável

9. **`src/components/home/QuickServicesSection.tsx`** — Grid de 6 cards rápidos ("Tenho uma fuga de água", "Preciso de eletricista urgente", etc.) configuráveis via JSONB — cada card linka para pesquisa ou categoria

## Config JSONB dos Novos Blocos

```json
// dual_cta
{
  "left_title": "Encontra rapidamente quem resolve",
  "left_bullets": ["Profissionais perto de ti", "Contacto direto", "Sem complicações"],
  "left_cta_text": "Encontrar serviço →",
  "left_cta_link": "/top",
  "left_image_url": "https://...",
  "right_title": "Estão à tua procura. Vais aparecer?",
  "right_subtitle": "Clientes entram todos os dias...",
  "right_bullets": ["Mais visibilidade", "Mais contactos", "Mais clientes"],
  "right_cta1_text": "Encontrar o meu negócio",
  "right_cta1_link": "/claim-business",
  "right_cta2_text": "Criar perfil grátis",
  "right_cta2_link": "/register",
  "right_image_url": "https://..."
}

// quick_services
{
  "title": "O que precisas resolver hoje?",
  "items": [
    { "icon": "💧", "label": "Tenho uma fuga de água", "link": "/pesquisa?q=canalizador" },
    { "icon": "⚡", "label": "Preciso de eletricista urgente", "link": "/pesquisa?q=eletricista" }
  ]
}

// social_proof
{
  "title": "Negócios já presentes na plataforma",
  "subtitle": "Junta-te a centenas de profissionais...",
  "max_logos": 6
}
```

## Regras
- Zero imagens do Supabase Storage na homepage
- Todas as imagens via URL externo no config JSONB
- Dark mode suportado em todos os novos componentes
- Mobile-first: hero em coluna única, cards empilhados
- Todos os textos editáveis via admin (config JSONB ou site_settings)
- Lógica de autenticação no CTA "Pedir Orçamento": verifica `useAuth().user` para decidir rota

## Detalhe Técnico

- Os novos blocos são registados no `HomepageBlockRenderer` como cases normais
- No admin, ao criar um bloco `dual_cta` ou `quick_services`, o editor mostra campos visuais (não só JSON raw) para facilitar a configuração
- O `HeroSection` lê config do bloco `hero` via props passadas pelo renderer (campo `config` com `collage_images`, `badge_text`, etc.)
- Para a barra de pesquisa no hero: manter a lógica existente de search + cidade, apenas redesenhar visualmente

