

## Arquitetura Multi-Role, Motor de Receita e Backoffice Unificado

Arquitetura Multi-Role Enterprise, Motor de Receita e Backoffice Seguro (Versão Consolidada)

Este plano evolui a plataforma para uma arquitetura enterprise-ready, segura, auditável e escalável, suportando crescimento de equipas, novos roles, reversões financeiras e controlo administrativo rigoroso.

PRINCÍPIOS BASE

revenue_events é a entidade financeira central.

create_revenue_event() é a única fonte oficial de criação de eventos.

O Backoffice é exclusivo para Admin/Super Admin.

Todos os utilizadores (Admin, Team, Comerciais, CS, Onboarding, Utilizadores da plataforma, Negócios) têm acesso à sua ficha de perfil.

Sistema preparado para crescimento de equipa, múltiplas equipas e regras diferenciadas.

Estrutura auditável (nenhuma alteração financeira sem rasto).

ESTADO ATUAL (Base Existente)

app_role enum: admin, user, commercial

revenue_events já existe

commercial_commissions já tem revenue_event_id

commission_rules já existe

create_revenue_event() já existe

handle_business_activation() trigger existe

/admin e /comercial já existem

FASE 1 — Evolução Estrutural da Base de Dados
1.1 Expandir enum app_role

Adicionar:

super_admin

cs

onboarding

Resultado:

admin | super_admin | commercial | cs | onboarding | user

1.2 Criar enum revenue_event_type

Substituir TEXT por ENUM:

sale
upsell
churn_recovery
reactivation
downgrade
refund
bonus
manual_adjustment

Evita validações por trigger.
Garante integridade estrutural.

1.3 Evoluir revenue_events

Adicionar constraint de idempotência lógica:

UNIQUE (
business_id,
event_type,
plan_id,
date_trunc('month', created_at)
)

Evita duplicação acidental.

Garantir que:

amount pode ser negativo (refund, downgrade)

assigned_user_id e triggered_by nunca são NULL

1.4 Criar Estrutura de Teams (Preparação para Escala)

Nova tabela:

teams

id

name

created_at

team_members

id

team_id

user_id

role

created_at

Permite:

Modelos diferentes por equipa

Segmentação futura

Expansão geográfica

1.5 Evoluir commission_rules

Adicionar:

applies_to_role TEXT NULL

applies_to_event_type revenue_event_type NULL

applies_to_team UUID NULL

applies_to_user UUID NULL

Hierarquia de prioridade futura:

applies_to_user

applies_to_team

applies_to_role

global

NULL = aplica a todos.

1.6 Evoluir commercial_commissions

Expandir estados para:

generated
validated
paid
reversed
cancelled

Adicionar:

adjustment_type TEXT NULL (chargeback, reversal, correction)

original_commission_id UUID NULL

Permitir valores negativos.

1.7 Criar commission_audit_logs

Nova tabela:

commission_audit_logs

id

commission_id

changed_by

old_status

new_status

old_amount

new_amount

reason

created_at

Obrigatório para qualquer alteração financeira.

1.8 Atualizar create_revenue_event()

Regras:

Não usar auth.uid()

Recebe explicitamente:

p_business_id

p_event_type

p_plan_id

p_amount

p_assigned_user_id

p_triggered_by

Validar:

Utilizador existe

Modelo ativo existe

Regra existe

Lançar EXCEPTION clara se falhar

Filtrar regras por:

applies_to_user

applies_to_team

applies_to_role

applies_to_event_type

Criar revenue_event

Criar comissões

Status inicial = generated

Garantir atomicidade controlada

FASE 2 — Sistema de Permissões Dinâmico
2.1 role_permissions

Tabela:

role_permissions

id

role

permission

created_at

UNIQUE(role, permission)

2.2 has_permission()

Função:

has_permission(_user_id uuid, _permission text)

SECURITY DEFINER
Ignora RLS recursiva.

FASE 3 — Segurança do Backoffice
3.1 Acesso ao Backoffice

/backoffice deve ser acessível APENAS a:

admin
super_admin

Nunca:

commercial
cs
onboarding
user

Regra:

requireAdminOnly

Os outros roles NÃO entram no Backoffice.

3.2 Portais Separados

Admin → /backoffice

Comerciais → /comercial

CS → /cs

Onboarding → /onboarding

User → Portal normal

Nada de “qualquer role não-user”.

FASE 4 — Perfil de Utilizador (Obrigatório para Todos)

Criar página:

/perfil

Disponível para:

Admin

Team

Comerciais

CS

Onboarding

Users da plataforma

Negócios

Funcionalidades:

Atualizar nome

Atualizar email

Atualizar telefone

Atualizar password

Ver role

Ver equipa

Histórico de atividade básico

Usar Supabase Auth para password reset seguro.

FASE 5 — Backoffice Admin

Sidebar dinâmica baseada em permissões.

Secções:

Geral
Gestão
Financeiro
Configurações
Auditoria

Adicionar nova secção:

Auditoria → Logs de Comissões

FASE 6 — Reversões

Hook useReverseCommission()

Criar comissão negativa

Ligar original_commission_id

Atualizar estado da original para reversed

Criar registo em commission_audit_logs

FASE 7 — Dashboards por Role

Admin:

MRR

Receita total

Comissões geradas

Comissões validadas

Comissões pagas

Reversões

Receita líquida

Commercial:

Minhas comissões

Gerado / Validado / Pago

CS:

Churn recovery

Receita recuperada

Onboarding:

Ativações concluídas

O QUE NÃO MUDA

businesses

sistema de planos

frontend público

homepage modular

SEQUÊNCIA DE IMPLEMENTAÇÃO

Migração estrutural SQL (enum, teams, colunas novas, audit logs)

Atualização create_revenue_event()

Atualização commercial_commissions estados

RLS reforçado

role_permissions + has_permission()

Proteção Backoffice (admin only)

Página /perfil para todos

Evolução dashboards

Sistema de reversões

Exportações

OBJETIVO FINAL

Sistema:

Multi-role

Seguro

Auditável

Escalável

Preparado para múltiplas equipas

Preparado para crescimento 10x

Financeiramente consistente

Backoffice protegido

Utilizadores com autonomia sobre os seus dados