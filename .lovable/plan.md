# IMPLEMENTAÇÃO PDIC (PedeDireto Intelligence Center)

## Objetivo

Implementar módulo SaaS completo de Analytics Profissional com:

- Admin Global Intelligence
- Business Premium Insights
- Monetização via add-on
- Dashboard estilo Stripe
- Gráficos reais (Recharts)
- Filtros 7d / 30d / 90d
- Revenue Intelligence avançado

Não redesenhar arquitetura. Apenas implementar conforme especificação abaixo.

---

# 1️⃣ BACKEND (SQL)

### 1.1 Feature Flag

Adicionar coluna:

```
ALTER TABLE plan_rules 
ADD COLUMN IF NOT EXISTS allow_analytics_pro BOOLEAN NOT NULL DEFAULT false;

```

---

### 1.2 Índices obrigatórios

```
CREATE INDEX IF NOT EXISTS idx_sil_created_at ON search_intelligence_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_ae_business_id ON analytics_events (business_id);
CREATE INDEX IF NOT EXISTS idx_ae_created_at ON analytics_events (created_at);
CREATE INDEX IF NOT EXISTS idx_sr_created_at ON service_requests (created_at);

```

---

### 1.3 Função Admin Global

Criar função:

```
get_admin_intelligence(p_days integer default 30)
returns json

```

Retornar JSON com estrutura:

{  
executive: {  
total_users,  
total_businesses,  
active_businesses,  
total_requests,  
total_searches,  
revenue_this_month,  
mrr_estimate  
},  
revenue: {  
monthly_revenue[],  
conversions_by_plan[],  
revenue_by_commercial[]  
},  
search: {  
total_searches,  
no_result_percent,  
top_terms[],  
searches_by_city[],  
intent_breakdown[]  
},  
marketplace: {  
request_business_ratio,  
inactive_businesses,  
avg_response_time  
}  
}

Todos dados agregados no servidor com filtro:

WHERE created_at >= NOW() - (p_days || ' days')::interval

SECURITY DEFINER.

---

### 1.4 Função Business Scoped

Criar função:

```
get_business_intelligence(
  p_business_id uuid,
  p_days integer default 30
)
returns json

```

Validar:

- auth.uid() é owner
- allow_analytics_pro = true

Retornar:

{  
impressions,  
clicks,  
ctr,  
searches_in_category,  
searches_in_city,  
trend[],  
position_average  
}

Sem dados de concorrentes.

SECURITY DEFINER.

---

# 2️⃣ TRACKING

analytics_events deve suportar:

- event_type ('impression','click','whatsapp','phone')
- business_id
- search_log_id
- position
- city
- created_at

Impressions devem ser criadas no backend quando resultados são devolvidos.

---

# 3️⃣ FRONTEND

Framework: React + Vite  
Usar Recharts  
Usar React Query

---

## 3.1 Estrutura

```
src/pages/admin/IntelligenceCenter.tsx
src/pages/business/BusinessInsights.tsx

src/hooks/useAdminIntelligence.ts
src/hooks/useBusinessIntelligence.ts

src/components/intelligence/
  ExecutiveCards.tsx
  RevenueChart.tsx
  SearchDemandChart.tsx
  MarketplaceHealth.tsx
  BusinessPerformanceCard.tsx
  DateRangeFilter.tsx
  UpgradeAnalyticsCard.tsx

```

---

## 3.2 Filtro por período

Componente DateRangeFilter:

- 7 dias
- 30 dias
- 90 dias

Hook recebe parâmetro days.

React Query key:

Admin:  
["intelligence","admin",days]

Business:  
["intelligence","business",businessId,days]

staleTime: 5 minutos

---

# 4️⃣ DASHBOARD ADMIN (Layout Premium)

Ordem:

1. Executive Cards (grid 4 ou 6)
2. Revenue Line Chart
3. Revenue by Plan (Bar Chart)
4. Search Demand Chart (Area)
5. Marketplace Health Cards
6. Tabela Top Terms (sortable)
7. Botão Export CSV (admin only)

Design minimalista, estilo Stripe.

---

# 5️⃣ DASHBOARD BUSINESS

Se allow_analytics_pro = false:  
Render UpgradeAnalyticsCard

Se true:

Mostrar:

- Impressões
- Cliques
- CTR
- Tendência 30 dias (AreaChart)
- Comparação média categoria (anonimizada)
- CTA “Melhorar visibilidade”

---

# 6️⃣ MONETIZAÇÃO

O módulo é vendável como:

analytics_pro

Controlado por:  
plan_rules.allow_analytics_pro

Preparado para futura tabela feature_flags.

---

# 7️⃣ NÃO FAZER

- Não criar múltiplas queries no frontend
- Não processar agregações no cliente
- Não expor dados globais a business
- Não criar dashboards duplicados

---

# Resultado esperado

Sistema SaaS completo de Intelligence:

- Admin Global BI
- Business Performance Insights
- Monetizável
- Escalável
- Seguro
- Dashboard premium com Recharts
- Filtros dinâmicos
- Export CSV