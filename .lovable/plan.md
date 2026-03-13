

## Relatório: Eventos de Click NÃO Rastreados

### Problema Identificado

Existem **4 tipos de interação** na página do negócio que **NÃO estão a ser rastreados** como eventos analíticos:

| Botão | Evento Registado? | Tipo Actual |
|---|---|---|
| Reservar Agora | **Parcial** — regista como `click_website` | Deveria ser `click_reservation` |
| Pedir Online | **Parcial** — regista como `click_website` | Deveria ser `click_order` |
| Ver Instagram | **NÃO** | Deveria ser `click_instagram` |
| Ver Facebook | **NÃO** | Deveria ser `click_facebook` |
| WhatsApp | Sim | `click_whatsapp` |
| Ligar Agora | Sim | `click_phone` |
| Enviar Email | Sim | `click_email` |
| Ver Website | Sim | `click_website` |

### Impacto Actual

1. **Instagram e Facebook** — cliques são completamente invisíveis em toda a plataforma
2. **Reservar e Pedir Online** — estão mascarados como `click_website`, inflacionando essa métrica e escondendo a real utilização desses CTAs
3. **Ranking Score** — a função `calculate_business_score` só conta `click_phone`, `click_whatsapp`, `click_email`, `click_website`. Os novos tipos não influenciam o ranking
4. **Benchmark/Intelligence** — RPCs `get_business_benchmark_v2` e `get_business_intelligence` usam `LIKE 'click%'` para totais, logo os novos tipos **já seriam contados nos totais**, mas não aparecem no breakdown individual
5. **Dashboard Admin/CS** — `useAnalytics.ts` filtra apenas os 5 tipos originais, os novos seriam ignorados
6. **Bot simulador** — `simulate-bot-activity` só gera os 4 tipos originais
7. **Weekly digest** — usa `startsWith("click_")` logo já apanharia os novos tipos

### Plano de Implementação

#### 1. Adicionar 4 novos event types ao frontend

**Ficheiro: `src/hooks/useAnalytics.ts`**
- Expandir `EventType` para incluir `click_instagram`, `click_facebook`, `click_reservation`, `click_order`
- Adicionar os 4 novos tipos a todos os arrays `.in("event_type", [...])` nas queries
- Adicionar ao `clicksBreakdown`: `instagram`, `facebook`, `reservation`, `order`

#### 2. Rastrear os novos eventos na página do negócio

**Ficheiro: `src/pages/BusinessPage.tsx`**
- Expandir a assinatura de `handleCtaClick` para aceitar os novos tipos
- Instagram: adicionar `handleCtaClick("instagram")` ao onClick
- Facebook: adicionar `handleCtaClick("facebook")` ao onClick
- Reservar Agora: mudar de `handleCtaClick("website")` para `handleCtaClick("reservation")`
- Pedir Online: mudar de `handleCtaClick("website")` para `handleCtaClick("order")`

#### 3. Adicionar ao BusinessCard (se tiver CTAs inline)

**Ficheiro: `src/components/BusinessCard.tsx`**
- Expandir tipos aceites no `handleCtaClick`

#### 4. Actualizar o hook de analytics do negócio

**Ficheiro: `src/hooks/useBusinessAnalytics.ts`**
- Adicionar contagem de `click_instagram`, `click_facebook`, `click_reservation`, `click_order` ao breakdown

#### 5. Actualizar o hook de intelligence

**Ficheiro: `src/hooks/useBusinessIntelligence.ts`**
- Adicionar `click_instagram`, `click_facebook`, `click_reservation`, `click_order` ao `ContactBreakdown`

#### 6. Actualizar o ranking score (SQL migration)

**Função: `calculate_business_score`**
- Adicionar contagem dos 4 novos tipos com pesos adequados:
  - `click_reservation` e `click_order`: peso 3 (alta intenção, como whatsapp/phone)
  - `click_instagram` e `click_facebook`: peso 1 (baixa intenção, redes sociais)

#### 7. Actualizar o Intelligence RPC (SQL migration)

**Função: `get_business_intelligence`**
- Adicionar os novos tipos ao `contacts` array retornado

#### 8. Actualizar o simulador de bot

**Ficheiro: `supabase/functions/simulate-bot-activity/index.ts`**
- Adicionar os 4 novos tipos ao array `CLICK_TYPES`

#### 9. Actualizar painéis Admin e CS

**Ficheiro: `src/components/admin/AnalyticsContent.tsx`** (se mostrar breakdown)
- Mostrar as novas métricas no dashboard

### Resumo de Ficheiros a Editar

| Ficheiro | Alteração |
|---|---|
| `src/hooks/useAnalytics.ts` | EventType + queries + breakdown |
| `src/pages/BusinessPage.tsx` | 4 onClick handlers |
| `src/components/BusinessCard.tsx` | Expandir tipos |
| `src/hooks/useBusinessAnalytics.ts` | Breakdown expandido |
| `src/hooks/useBusinessIntelligence.ts` | ContactBreakdown expandido |
| `supabase/functions/simulate-bot-activity/index.ts` | CLICK_TYPES |
| SQL Migration | `calculate_business_score` + `get_business_intelligence` |

### Nota Importante
Não é necessária migration para a tabela `analytics_events` — o campo `event_type` é `text`, aceita qualquer valor. As RPCs que usam `LIKE 'click%'` já apanham os novos tipos nos totais automaticamente.

