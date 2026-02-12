

## Evolucao Estrutural - Monetizacao, Homepage Modular e Regras por Plano

Este plano implementa as 3 partes (A, B, C) de forma incremental sem alterar tabelas ou funcionalidades existentes.

---

### Parte A - Consolidar Monetizacao (Destaques)

**Base de Dados (Migracao SQL)**

Criar tabela `business_highlights`:

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| business_id | uuid FK businesses(id) ON DELETE CASCADE | |
| level | TEXT NOT NULL | 'super', 'category', 'subcategory' |
| category_id | uuid NULL | obrigatorio se level=category |
| subcategory_id | uuid NULL | obrigatorio se level=subcategory |
| is_active | BOOLEAN DEFAULT true | |
| start_date | TIMESTAMPTZ NULL | destaque temporario |
| end_date | TIMESTAMPTZ NULL | destaque temporario |
| display_order | INTEGER DEFAULT 0 | |
| created_at | TIMESTAMPTZ DEFAULT now() | |
| updated_at | TIMESTAMPTZ DEFAULT now() | |

Constraints CHECK:
- level IN ('super', 'category', 'subcategory')
- level='super' implica category_id IS NULL AND subcategory_id IS NULL
- level='category' implica category_id IS NOT NULL
- level='subcategory' implica subcategory_id IS NOT NULL

Indices: (business_id), (level), (category_id), (subcategory_id), (is_active)

RLS: SELECT publico onde is_active=true; ALL para admins

Trigger: updated_at automatico

**Nota importante sobre retrocompatibilidade:**
A tabela `business_highlights` funciona em paralelo com os campos `is_premium`/`premium_level` da tabela `businesses`. Os hooks existentes (`useSuperHighlights`, `useFeaturedBusinesses`) continuam a funcionar. Novos hooks serao criados para ler de `business_highlights`, e a migracaoo dos dados sera feita numa fase futura.

**Configuracoes Admin (SettingsContent.tsx)**

Adicionar nova seccao "Configuracao de Destaques Avancada" com:
- Limite Super Destaques (site_settings key: `highlights_super_limit`, default 6)
- Limite por Categoria (key: `highlights_category_limit`, default 3)
- Limite por Subcategoria (key: `highlights_subcategory_limit`, default 3)
- Metodo de ordenacao (key: `highlights_sort_method`, valores: manual / recentes / aleatorio)
- Switch: Filtrar por data ativa (key: `highlights_filter_by_date`, default false)

Estes campos usam o sistema `site_settings` ja existente - sao apenas novos registos.

**Novos Hooks**

Novo ficheiro: `src/hooks/useBusinessHighlights.ts`
- `useBusinessHighlights(level, categoryId?, subcategoryId?)` - query a business_highlights com join businesses
- `useCreateHighlight`, `useUpdateHighlight`, `useDeleteHighlight` - mutations CRUD
- Respeita limites de site_settings e filtro de datas

**Admin - Gestao de Destaques**

Atualizar `src/components/admin/FeaturedContent.tsx`:
- Adicionar seccao para gerir destaques via `business_highlights`
- Permitir criar destaque (escolher negocio, nivel, categoria/subcategoria, datas)
- Listar destaques agrupados por nivel
- Toggle ativo/inativo
- Editar ordem e datas
- Manter logica existente de `is_premium`/`is_featured` intacta (coexistencia)

---

### Parte B - Homepage Modular

**Base de Dados (Migracao SQL)**

Criar tabela `homepage_blocks`:

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| type | TEXT NOT NULL | hero, categorias, super_destaques, destaques, negocios_premium, banner, texto, personalizado |
| title | TEXT NULL | titulo opcional do bloco |
| config | JSONB NULL | configuracao especifica por tipo |
| is_active | BOOLEAN DEFAULT true | |
| order_index | INTEGER DEFAULT 0 | |
| start_date | TIMESTAMPTZ NULL | bloco temporario |
| end_date | TIMESTAMPTZ NULL | bloco temporario |
| created_at | TIMESTAMPTZ DEFAULT now() | |
| updated_at | TIMESTAMPTZ DEFAULT now() | |

Constraint CHECK: type IN ('hero','categorias','super_destaques','destaques','negocios_premium','banner','texto','personalizado','featured_categories')

RLS: SELECT publico (is_active=true); ALL para admins

Trigger: updated_at automatico

Seed inicial com blocos correspondentes ao layout atual:
1. type=hero, order_index=0
2. type=super_destaques, order_index=1
3. type=featured_categories, order_index=2
4. type=categorias, order_index=3
5. type=destaques, order_index=4

Isto garante que a homepage renderiza exatamente como antes sem necessidade de configuracao.

**Novos Hooks**

Novo ficheiro: `src/hooks/useHomepageBlocks.ts`
- `useHomepageBlocks()` - lista blocos ativos, ordenados, filtrados por data
- `useAllHomepageBlocks()` - admin, todos os blocos
- CRUD mutations

**Admin - Nova aba "Homepage"**

Ficheiro: `src/components/admin/AdminSidebar.tsx`
- Adicionar `"homepage"` ao tipo AdminTab
- Novo item: icone `LayoutDashboard` (ou `Home`), label "Homepage"

Ficheiro: `src/pages/AdminPage.tsx`
- Importar e renderizar HomepageContent

Novo ficheiro: `src/components/admin/HomepageContent.tsx`
- Lista de blocos com drag-like reordenacao (order_index numerico)
- Para cada bloco: tipo, titulo, ativo/inativo, datas, config
- Criar novo bloco com tipo
- Editar config conforme tipo:
  - banner: titulo, descricao, link, imagem_url
  - negocios_premium: limite, ordenacao
  - texto: conteudo HTML simples
  - hero/categorias/super_destaques/destaques: sem config extra (usam site_settings)
- Eliminar bloco (com confirmacao)

**Homepage Publica - Renderizacao Dinamica**

Ficheiro: `src/pages/Index.tsx`
- Carregar blocos via `useHomepageBlocks()`
- Iterar blocos ordenados e renderizar componente conforme type
- Fallback: se nao existirem blocos na BD, manter layout atual hardcoded (seguranca)
- Componentes existentes (HeroSection, SuperHighlightsSection, etc.) continuam a ser usados

Novo ficheiro: `src/components/HomepageBlockRenderer.tsx`
- Switch por tipo de bloco
- Renderiza componentes existentes ou novos (BannerBlock, TextBlock, PremiumBusinessBlock)

Novos componentes simples:
- `src/components/BannerBlock.tsx` - renderiza banner a partir do config JSON
- `src/components/TextBlock.tsx` - renderiza texto/HTML sanitizado
- `src/components/PremiumBusinessBlock.tsx` - lista de negocios premium com limite do config

---

### Parte C - Sistema de Regras por Plano

**Base de Dados (Migracao SQL)**

Criar tabela `plan_rules`:

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| plan_id | uuid FK commercial_plans(id) ON DELETE CASCADE | UNIQUE |
| max_gallery_images | INTEGER NULL | null = sem limite |
| max_modules | INTEGER NULL | null = sem limite |
| allow_video | BOOLEAN DEFAULT false | |
| allow_category_highlight | BOOLEAN DEFAULT false | |
| allow_super_highlight | BOOLEAN DEFAULT false | |
| allow_premium_block | BOOLEAN DEFAULT false | |
| created_at | TIMESTAMPTZ DEFAULT now() | |
| updated_at | TIMESTAMPTZ DEFAULT now() | |

Constraint: UNIQUE(plan_id)

RLS: SELECT publico; ALL para admins

Trigger: updated_at automatico

**Novos Hooks**

Novo ficheiro: `src/hooks/usePlanRules.ts`
- `usePlanRules()` - listar todas as regras
- `usePlanRuleByPlanId(planId)` - regra de um plano especifico
- `useUpsertPlanRule` - criar/atualizar

**Admin - Regras na aba Planos**

Ficheiro: `src/components/admin/PlansContent.tsx`
- Adicionar seccao no dialogo de edicao de plano: "Regras e Permissoes"
- Campos: max_gallery_images, max_modules, allow_video, allow_category_highlight, allow_super_highlight, allow_premium_block
- Ao guardar plano, fazer upsert em plan_rules

**Validacao Progressiva**

Ficheiro: `src/components/admin/BusinessFileCard.tsx`
- Ao carregar, verificar plan_id do negocio e carregar regras
- Na seccao de modulos dinamicos:
  - Se max_modules definido, limitar numero de campos visiveis/editaveis
  - Se allow_video=false, desabilitar campos tipo video
  - Se max_gallery_images definido, limitar numero de imagens em galleries
- Mostrar aviso visual quando funcionalidade bloqueada por plano
- NAO bloquear gravacao - apenas avisar (fase progressiva)

Ficheiro: `src/components/admin/FeaturedContent.tsx`
- Ao tentar adicionar negocio como Super Destaque, verificar allow_super_highlight
- Ao tentar adicionar como Destaque Categoria, verificar allow_category_highlight
- Mostrar aviso se plano nao permite

---

### Resumo de Ficheiros

| Ficheiro | Acao |
|---|---|
| Migracao SQL | 3 tabelas (business_highlights, homepage_blocks, plan_rules), indices, RLS, triggers, seed homepage |
| `src/hooks/useBusinessHighlights.ts` | **Novo** - CRUD destaques |
| `src/hooks/useHomepageBlocks.ts` | **Novo** - CRUD blocos homepage |
| `src/hooks/usePlanRules.ts` | **Novo** - regras por plano |
| `src/components/admin/HomepageContent.tsx` | **Novo** - gestao homepage |
| `src/components/HomepageBlockRenderer.tsx` | **Novo** - renderer dinamico |
| `src/components/BannerBlock.tsx` | **Novo** - bloco banner |
| `src/components/TextBlock.tsx` | **Novo** - bloco texto |
| `src/components/PremiumBusinessBlock.tsx` | **Novo** - bloco negocios premium |
| `src/components/admin/AdminSidebar.tsx` | Nova aba "homepage" |
| `src/pages/AdminPage.tsx` | Renderizar HomepageContent |
| `src/pages/Index.tsx` | Renderizacao dinamica de blocos |
| `src/components/admin/SettingsContent.tsx` | Seccao configuracao destaques avancada |
| `src/components/admin/FeaturedContent.tsx` | Gestao via business_highlights + validacao plano |
| `src/components/admin/PlansContent.tsx` | Seccao regras no dialogo |
| `src/components/admin/BusinessFileCard.tsx` | Validacao progressiva por regras |

### O que NAO muda

- Tabela businesses (zero alteracoes)
- Campos is_premium, is_featured, premium_level continuam a funcionar
- Hooks existentes (useSuperHighlights, useFeaturedBusinesses) permanecem intactos
- Layout publico continua identico (seed garante blocos iguais ao atual)
- Sistema de categorias, subcategorias, subscricoes
- Autenticacao, SEO, footer, header
- Sistema de modulos dinamicos (business_modules)
- Sistema de pedidos (service_requests)

Parte D - Backoffice do Negócio (Portal Comercial)
Objetivo

Criar área autenticada para cada negócio (role: commercial_user) onde pode:

Editar a sua ficha (mesmos campos já existentes)

Gerir módulos dinâmicos

Consultar plano atual

Fazer upgrade de plano

Receber notificações (pedidos, alertas, sistema)

Consultar pedidos de orçamento recebidos

No futuro: gerir faturação e histórico de destaques

Implementação incremental e compatível com estrutura existente.

Arquitetura Geral

Nova área:

/business-dashboard

Separada do Admin.

Acesso apenas a utilizadores com negócio associado.

Base de Dados (sem alterar businesses)

Não alterar tabela businesses.

Aproveitar:

businesses

business_modules

business_module_values

service_requests

commercial_plans

plan_rules

business_highlights

Criar tabela adicional para notificações internas:

business_notifications

Campo | Tipo | Notas
id | uuid PK | gen_random_uuid()
business_id | uuid FK businesses(id) ON DELETE CASCADE
type | TEXT NOT NULL | 'request', 'system', 'plan', 'highlight'
title | TEXT NOT NULL
message | TEXT NOT NULL
is_read | BOOLEAN DEFAULT false
created_at | TIMESTAMPTZ DEFAULT now()

Indices:
(business_id)
(is_read)

RLS:
SELECT apenas se business_id pertence ao utilizador autenticado
INSERT sistema/admin
UPDATE apenas para marcar como lida

Estrutura Frontend

Nova pasta:

src/pages/business-dashboard/

Criar página principal:

BusinessDashboard.tsx

Layout próprio:

src/components/business/BusinessSidebar.tsx
src/components/business/BusinessLayout.tsx

Abas do Backoffice do Negócio
1️⃣ Dashboard

Resumo com:

Plano atual

Status do plano (ativo/inativo)

Número de pedidos recebidos

Destaques ativos

Alertas importantes

Botão Upgrade Plano

Hook:
useBusinessDashboardData()

2️⃣ A Minha Ficha

Reutilizar BusinessFileCard.tsx

Mas:

Apenas editar o próprio negócio

Aplicar validações por plan_rules

Mostrar avisos quando funcionalidade bloqueada

Sem alterar lógica existente.

3️⃣ O Meu Plano

Mostrar:

Plano atual

Regras associadas (max_gallery_images, allow_video, etc.)

Benefícios do plano atual

Lista de planos disponíveis

Hook:
useCommercialPlans()

Botão:
“Fazer Upgrade”

Fase inicial:
Redirecionamento para contacto/admin (sem gateway pagamento ainda).

4️⃣ Pedidos Recebidos

Usar tabela service_requests.

Criar:

src/components/business/BusinessRequestsContent.tsx

Listar:

Nome cliente

Serviço pedido

Data

Estado (novo / respondido / fechado)

Botão visualizar detalhe

Marcar pedido como lido gera business_notification automática.

5️⃣ Notificações

Listar business_notifications.

Permitir:

Marcar como lida

Filtrar por tipo

Badge no sidebar com número de não lidas.

Integração com Monetização
Ao ativar destaque:

Criar business_notification tipo 'highlight'

Ao receber pedido:

Criar business_notification tipo 'request'

Ao plano expirar:

Criar business_notification tipo 'plan'

Sistema de Permissões

Atualizar middleware/auth:

Admin → acesso total

Commercial User → acesso apenas ao seu negócio

Consumer → sem acesso

Verificação obrigatória de business_id associado ao user_id.

Hooks Necessários

Novo ficheiro:

src/hooks/useBusinessDashboard.ts
src/hooks/useBusinessNotifications.ts

Funções:

useBusinessByUser()
useBusinessRequests()
useBusinessNotifications()
useMarkNotificationAsRead()

Fase Inicial (Importante)

Não integrar pagamentos ainda.

Plano upgrade apenas altera plan_id manualmente via admin (fase 1).

Gateway pagamento entra em fase posterior.

Resumo de Ficheiros Adicionados

Ficheiro | Ação
src/pages/business-dashboard/BusinessDashboard.tsx | Novo
src/components/business/BusinessSidebar.tsx | Novo
src/components/business/BusinessLayout.tsx | Novo
src/components/business/BusinessRequestsContent.tsx | Novo
src/hooks/useBusinessDashboard.ts | Novo
src/hooks/useBusinessNotifications.ts | Novo
Migracao SQL | business_notifications

O que NÃO muda

Tabela businesses
Sistema atual de pedidos
Sistema de modulos dinamicos
Sistema de destaques
Sistema de planos
Admin Backoffice

Resultado Estratégico

Após implementação:

Cada negócio passa a ter área própria

Monetização deixa de ser invisível

Plataforma ganha estrutura SaaS real

Base pronta para:

Pagamentos online

Renovação automática

Venda de destaques

Upsell automático

Estatísticas futuras