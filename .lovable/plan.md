Ficha: Implementação Completa — Fase 6 + Fase 7 + Motor de Leads (Com Ajustes Críticos)

Objetivo

Implementar e concluir FASE 6 (Reversões), FASE 7 (Dashboards por Role) e o MOTOR DE PEDIDOS (Leads) com lógica comercial integrada, incluindo as correções arquiteturais requisitadas (teams, enums, workflow de comissões, idempotência, audit logs e segurança). A execução deve ser faseada e testada; as migrações devem ter rollback e scripts de validação.

Requisitos técnicos obrigatórios (não negociáveis)

1) Estados de comissão

- Workflow de status da tabela commercial_commissions deve suportar:

  - generated

  - validated

  - paid

  - reversed

  - cancelled

- Transições autorizadas e regras de autorização:

  - generated -> validated (admin)

  - validated -> paid (admin/finance)

  - any -> reversed (admin, com reason obrigatório)

- Todas as transições devem gerar registo em commission_audit_logs.

2) Teams (nova entidade)

- Criar tabelas:

  - teams (id, name, created_at)

  - team_members (id, team_id, profile_id, role, created_at)

- Permitir que commission_rules tenha coluna applies_to_team (UUID nullable).

3) Enum para event_type

- Criar enum `revenue_event_type` com valores:

  sale, upsell, churn_recovery, reactivation, downgrade, refund, bonus, manual_adjustment

- Alterar coluna revenue_events.event_type para usar este enum.

4) Idempotência lógica

- Criar índice/constraint único lógico para evitar duplicação de revenue_events:

  exemplo de expressão a validar/implementar:

  UNIQUE (

    business_id,

    event_type,

    plan_id,

    date_trunc('month', event_date)  -- Implementar como index expression conforme Postgres

  )

- Documentar exactamente a expressão implementada e razão.

5) create_revenue_event()

- Substituir versão actual por função com assinatura:

  create_revenue_event(

    p_business_id uuid,

    p_event_type revenue_event_type,

    p_plan_id uuid,

    p_amount numeric,

    p_assigned_user_id uuid,

    p_triggered_by uuid

  ) RETURNS uuid -- retorna revenue_event_id

- Regras:

  - NÃO usar auth.uid() internamente

  - Validar existence: business, assigned_user ([profiles.id](http://profiles.id)), plan (se fornecido)

  - Determinar commission_model ativo; se não existir -> RAISE EXCEPTION com mensagem clara (ex: 'No active commission model found')

  - Buscar commission_rule com prioridade:

      1. applies_to_user (commission_rule.applies_to_user = p_assigned_user_id)

      2. applies_to_team (commission_rule.applies_to_team in teams of p_assigned_user_id)

      3. applies_to_role (commission_rule.applies_to_role = role)

      4. applies_to_event_type (commission_rule.applies_to_event_type = p_event_type)

      5. plan_id specific then rule with plan_id null (global)

  - Se nenhuma regra encontrada -> RAISE EXCEPTION

  - Calcular valores e criar revenue_event

  - Inserir commercial_commissions conforme duration_months (recorrência), com status = 'generated'

  - Tudo dentro de transação com tratamento de erros; função devolve revenue_event_id no final

  - Validar e documentar idempotência: se tentativa de criar revenue_event duplicado -> RAISE EXCEPTION 'Duplicate revenue event'

6) FK e referência de utilizadores

- Padronizar FK para `profiles.id` (não profiles.user_id)

- Atualizar todas as foreign keys e RLS que apontem para user_id para apontar para [profiles.id](http://profiles.id), ou justificar inconsciência se necessário.

7) commission_audit_logs

- Garantir que qualquer alteração relevante em commercial_commissions (status/amount/original_commission_id) grava um registo na tabela commission_audit_logs com: commission_id, action, performed_by, role, old_status, new_status, old_amount, new_amount, reason, created_at.

8) useReverseCommission()

- Implementar hook/endpoint em src/hooks/useCommercialPerformance.ts:

  - Recebe commission_id e reason

  - Verifica permissão (has_permission('manage_commissions') ou is admin)

  - Cria uma nova commercial_commissions com amount negativo, adjustment_type='reversal', original_commission_id apontando ao original

  - Atualiza original.status -> 'reversed'

  - Grava audit log

  - Tudo atómico

9) RLS e Security

- Revenue_events: enum-based type; RLS:

  - admin/super_admin: full access

  - commercial/cs/onboarding: SELECT/UPDATE onde assigned_user_id = [profiles.id](http://profiles.id) OR triggered_by = [profiles.id](http://profiles.id)

  - request_business_matches RLS: negócios veem apenas matches do seu negócio; comerciais veem matches dos negócios a que estão atribuídos via business_commercial_assignments

- Todas as funções definidoras devem ser SECURITY DEFINER com owner = admin-role DB user; garantir que o definer tem permissões necessárias.

10) Backoffice

- /backoffice **ACESSO EXCLUSIVO** apenas para admin | super_admin. NÃO permitir qualquer role não-admin.

- Outros roles têm portais próprios (/comercial, /cs, /onboarding).

11) Perfil

- Implementar /perfil para todos os tipos de utilizadores com edição de dados e alteração de password via Supabase Auth.

12) Testes & migrações

- Entregar migrations SQL com:

  - Up e Down (rollback)

  - Script de validação pós-migração (checks)

  - Plano de migração de dados (se necessário)

- Implementar testes:

  - Unit tests para create_revenue_event e match_request_to_businesses

  - Integration tests para fluxo: criar pedido -> auto-match -> business responde -> conversão -> comissão -> reversão

Fase 6 — Implementação (detalhada)

- Implementar useReverseCommission(), UI de reversão no PerformanceContent, badges e estilos de comissões negativas.

- Garantir validações de autorização.

Fase 7 — Dashboards por role (detalhada)

- Implementar hooks em src/hooks/useRoleDashboard.ts com KPIs por role

- Componentes para Admin, Commercial, CS, Onboarding com RLS

Motor de Leads — Implementação (detalhada)

- Expandir service_requests com location_city, location_postal_code, urgency

- Expandir request_business_matches com viewed_at e RLS adequada

- Implementar função SQL match_request_to_businesses(p_request_id uuid) SECURITY DEFINER:

  - Seleciona negócios com subscription_status = 'active'

  - Filtra por category_id, city (quando fornecido)

  - Ordena por premium_level (premium first) e por subscription_plan priority

  - Limite 3

  - Inserir em request_business_matches e criar business_notifications

- Hook useLeadsDashboard.ts com KPIs e time-series

- Admin LeadsDashboardContent, ServiceRequestsContent com Auto-match

- Frontend RequestServicePage (/pedir-servico) com autenticação; ao submeter executa match_request_to_businesses

Sequência de implementação e rollout

1) Migrations (enum, teams, columns novas, constraints, indices)

2) Atualizar create_revenue_event() com a nova assinatura + testes unitários

3) Atualizar commercial_commissions estados + audit logs

4) RLS revisado

5) Implementar useReverseCommission() + UI

6) role_permissions + has_permission()

7) Proteção Backoffice + /perfil

8) Motor de Leads (migrations + match function + UI)

9) Dashboards por role

10) Testes de integração + deploy em staging + validação manual

11) Deploy em produção com feature flags, monitorização e rollback plan

Critérios de aceitação (QA)

- create_revenue_event() deve devolver event_id e ser idempotente

- Para um teste end-to-end: criar pedido -> match automático -> business recebe notificação -> business responde -> admin marca conversão -> commission gerada (generated) -> admin valida -> comissão marcada paid -> admin reverte (reversal) -> audit log criado e valor negativo gerado

- RLS efetivo em staging testado com múltiplos users

- Backoffice inacessível para roles não-admin

- /perfil funcional para todos

Entregar

- SQL migrations (up/down)

- Funções SQL com documentação inline

- Hooks React + componentes + rotas

- Test suites (unit + integration)

- Documentação técnica (README de migração + runbook de rollback)

Observações finais

- Não avançar com botão 24h até cobertura mínima por região e validação de resposta

- Implementar AI-matching futuramente (após ter histórico e dados)

- Entregar changelog e instruções de rollout

FIM DA PROMPT

&nbsp;