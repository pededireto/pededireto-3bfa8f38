

Perfeito. Aqui tens o plano reescrito exatamente no mesmo formato dele, já com os ajustes técnicos de escalabilidade e consistência incluídos, pronto para copiares e colares:

Evolucao do Pede Direto - Infraestrutura SaaS
Este plano implementa as 7 partes do pedido de forma incremental e retrocompativel, incluindo os ajustes estrategicos solicitados e melhorias de escalabilidade e consistencia futura.

Migracao de Base de Dados (SQL unico)

Expandir tabela profiles:

phone TEXT NULL
address TEXT NULL
status TEXT NOT NULL DEFAULT 'active'
last_activity_at TIMESTAMPTZ NULL

Adicionar plan_type a commercial_plans:

plan_type TEXT NOT NULL DEFAULT 'business' (valores: business, consumer)
Planos existentes recebem automaticamente 'business'

Criar tabela consumer_subscriptions:

id (uuid PK), user_id (uuid NOT NULL, referencia profiles.user_id), plan_id (uuid, referencia commercial_plans.id), status TEXT DEFAULT 'inactive', start_date DATE, end_date DATE, auto_renew BOOLEAN DEFAULT true, created_at, updated_at

Criar tabela service_requests:

id (uuid PK), user_id (uuid NOT NULL, referencia profiles.user_id), category_id (uuid), subcategory_id (uuid NULL), description TEXT, address TEXT, status TEXT DEFAULT 'novo', assigned_to_admin UUID NULL, created_at, updated_at, closed_at TIMESTAMPTZ NULL

Status possiveis: novo, em_contacto, encaminhado, concluido, cancelado

Adicionar constraint CHECK em service_requests.status garantindo apenas valores validos:
('novo','em_contacto','encaminhado','concluido','cancelado')

Criar tabela request_business_matches:

id (uuid PK), request_id (uuid FK service_requests), business_id (uuid FK businesses), sent_at TIMESTAMPTZ DEFAULT now(), status TEXT DEFAULT 'enviado', responded_at TIMESTAMPTZ NULL, price_quote TEXT NULL

Status possiveis: enviado, aceite, recusado, sem_resposta

Adicionar constraint CHECK em request_business_matches.status garantindo apenas valores validos:
('enviado','aceite','recusado','sem_resposta')

Atualizar trigger handle_new_user():

Copiar phone do raw_user_meta_data para profiles.phone

Garantir atualizacao automatica de profiles.last_activity_at em:

login

criacao de pedido (service_requests)

atualizacao de perfil

RLS em todas as novas tabelas:

profiles: admins veem todos; users veem/editam o seu
consumer_subscriptions: users veem as suas; admins gerem tudo
service_requests: users criam e veem os seus; admins gerem tudo
request_business_matches: admins gerem tudo

Indices para performance:

service_requests(user_id)
service_requests(category_id)
service_requests(status)
request_business_matches(request_id)
request_business_matches(business_id)
request_business_matches(request_id, status)
consumer_subscriptions(user_id)

Registo de Consumidores

Ficheiro: src/pages/UserRegister.tsx

Adicionar campos: Nome (obrigatorio), Telefone (obrigatorio)
Morada permanece opcional
Atualizar schema Zod com validacao
Passar full_name e phone como user_metadata no signUp

Ficheiro: src/hooks/useAuth.tsx

Alterar assinatura de signUp para aceitar metadata opcional { full_name, phone }
Passar dados no options.data do supabase.auth.signUp

Backoffice - Nova aba "Utilizadores"

Ficheiro: src/components/admin/AdminSidebar.tsx

Adicionar "users" ao tipo AdminTab
Novo item no menu: icone Users, label "Utilizadores" (posicionado apos "Negócios")

Ficheiro: src/pages/AdminPage.tsx

Importar e renderizar UsersContent

Novo ficheiro: src/hooks/useUsers.ts

Query para listar profiles com contagem de service_requests (via count)
Mutation para atualizar status do utilizador

Novo ficheiro: src/components/admin/UsersContent.tsx

Tabela com: Nome, Email, Telefone, Data Registo, Plano, Estado, Nr Pedidos, Ultima Atividade
Filtros: por estado (ativo/suspenso), por atividade recente, por plano, por subscricao ativa/inativa
Acao: suspender/ativar utilizador (toggle status)

Backoffice - Nova aba "Pedidos"

Ficheiro: src/components/admin/AdminSidebar.tsx

Adicionar "service-requests" ao tipo AdminTab
Novo item: icone Inbox, label "Pedidos"

Ficheiro: src/pages/AdminPage.tsx

Importar e renderizar ServiceRequestsContent

Novo ficheiro: src/hooks/useServiceRequests.ts

Queries para listar service_requests com joins (user, category, subcategory)
Query para listar matches de um request
Mutations: alterar estado, criar match com negocio

Novo ficheiro: src/components/admin/ServiceRequestsContent.tsx

Tabela com: Utilizador, Categoria, Descricao, Morada, Estado, Data, Nr Negocios Associados
Filtros por estado e categoria
Dialogo para associar negocios (selecionar negocio, criar match)
Dialogo de detalhes com lista de matches e seus estados
Campo para atribuir admin responsavel (assigned_to_admin)

Dashboard - Metricas expandidas

Ficheiro: src/components/admin/DashboardContent.tsx

Adicionar StatCards: Total Utilizadores, Novos este mes, Total Pedidos, Pedidos este mes
Usar queries a profiles (count) e service_requests (count com filtro de data)
Manter todos os cards existentes intactos

Ficheiro: src/components/admin/AnalyticsContent.tsx

Nova seccao "Utilizadores": total, novos mes, ativos 30 dias, subscricoes ativas consumer
Nova seccao "Pedidos": total, este mes, por categoria (top 5), taxa encaminhamento, taxa conclusao (usando closed_at para calculos de tempo medio de resolucao)
Nova seccao "Negocios - Leads": top 5 por leads recebidas, top 5 por taxa de resposta

Manter todas as seccoes existentes

Ficheiro: src/hooks/useAnalytics.ts

Adicionar queries para profiles count, service_requests aggregations, request_business_matches stats
Adicionar funcao trackGtagEvent(eventName, params) para enviar eventos ao Google Analytics

Garantir fallback seguro:
Verificar se window.gtag existe antes de executar qualquer evento

Planos - Campo plan_type

Ficheiro: src/hooks/useCommercialPlans.ts

Adicionar plan_type: 'business' | 'consumer' a interface CommercialPlan

Ficheiro: src/components/admin/PlansContent.tsx

Adicionar Select "Tipo de Plano" (Negocio / Consumidor) no formulario de criacao/edicao
Mostrar badge com tipo na lista/cards de planos
Incluir plan_type no emptyPlan default ('business')

Google Analytics

Ficheiro: index.html

Adicionar script gtag.js com ID G-W3LKHZQ0GF no <head> (antes do </head>)

Ficheiro: src/App.tsx

Criar componente interno RouteTracker que usa useLocation dentro do BrowserRouter
Enviar page_view ao gtag em cada mudanca de rota

Ficheiro: src/hooks/useAnalytics.ts

Adicionar helper trackGtagEvent que chama window.gtag('event', ...) com fallback seguro
Integrar nos cliques existentes (whatsapp, phone, email) e nos novos eventos (create_request, request_sent_to_business)

Resumo de ficheiros

Ficheiro Acao
Migracao SQL Novas tabelas, campos, indices, constraints, RLS, trigger update
src/hooks/useAuth.tsx Metadata no signUp
src/pages/UserRegister.tsx Campos nome e telefone
src/hooks/useUsers.ts Novo - hook para profiles
src/components/admin/UsersContent.tsx Novo - gestao utilizadores
src/hooks/useServiceRequests.ts Novo - hook para pedidos
src/components/admin/ServiceRequestsContent.tsx Novo - gestao pedidos
src/components/admin/AdminSidebar.tsx 2 novas abas
src/pages/AdminPage.tsx Renderizar novos componentes
src/hooks/useCommercialPlans.ts Campo plan_type
src/components/admin/PlansContent.tsx Select tipo plano
src/components/admin/DashboardContent.tsx Metricas expandidas
src/components/admin/AnalyticsContent.tsx 3 seccoes novas
src/hooks/useAnalytics.ts Queries novas + gtag helper
index.html Script Google Analytics
src/App.tsx SPA route tracking

O que NAO muda

Layout publico existente
Sistema de categorias, negocios, restaurantes
Autenticacao existente (user_roles permanece separado)
SEO e meta tags
Footer e header publico
Logica de filtros e ordenacao
Utilizadores existentes continuam a funcionar (campos novos sao nullable)
