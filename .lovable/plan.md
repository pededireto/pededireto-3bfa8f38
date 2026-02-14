Estamos a evoluir a PEDE DIRETO para modelo SaaS Marketplace Enterprise.

Já existe:

- businesses
- business_users
- plan_rules
- BusinessDashboard
- AdminPage
- CommercialPage
- claim_business RPC

Queremos transformar o sistema de Claim num fluxo validado, auditável e monetizável, com permissões reais no backend.

---

# FASE 1 — BASE DE DADOS (REFINADA)

## 1.1 Atualizar businesses

Garantir que existem os seguintes campos:

- claim_status text DEFAULT 'unclaimed'
- claim_requested_by uuid
- claim_requested_at timestamptz
- verified_by uuid
- verified_at timestamptz
- claim_review_notes text

Valores permitidos para claim_status:

- 'unclaimed'
- 'pending'
- 'verified'
- 'rejected'
- 'revoked'

---

## 1.2 Atualizar business_role enum

Adicionar valor:

- 'pending_owner'
- 'revoked'

Não usar DELETE para remover associações.  
Sempre manter histórico.

---

# FASE 2 — CLAIM FLOW

## 2.1 Atualizar RPC claim_business

Alterar comportamento:

Quando utilizador faz claim:

- claim_status = 'pending'
- claim_requested_by = auth.uid()
- claim_requested_at = now()
- inserir em business_users com role = 'pending_owner'

Não marcar como owner definitivo.

Criar notificação interna.

Retornar sucesso com mensagem:

"Pedido de claim submetido. Aguarde validação."

---

# FASE 3 — RPCs ADMIN SEGURAS (SECURITY DEFINER)

Criar 3 funções:

---

## admin_approve_claim(p_business_id uuid)

- Verificar is_admin()
- Atualizar businesses:
  - claim_status = 'verified'
  - verified_by = auth.uid()
  - verified_at = now()
- Atualizar business_users:
  - role de 'pending_owner' → 'owner'
- Criar notificação interna

---

## admin_reject_claim(p_business_id uuid, p_notes text)

- Verificar is_admin()
- Atualizar businesses:
  - claim_status = 'rejected'
  - claim_review_notes = p_notes
- Atualizar business_users:
  - role = 'revoked'
- NÃO apagar registos
- Criar notificação

---

## admin_revoke_claim(p_business_id uuid, p_notes text)

- Verificar is_admin()
- Atualizar businesses:
  - claim_status = 'revoked'
  - claim_review_notes = p_notes
- Atualizar business_users:
  - role = 'revoked'
- Negócio permanece intacto

---

# FASE 4 — BACKEND PROTEÇÃO DE CAMPOS

IMPORTANTE:

Desativar updates diretos à tabela businesses via client.

Criar duas RPC:

## update_business_limited(p_business_id, telefone, website, descricao)

Permitir apenas se:

- claim_status = 'pending'  
OU
- claim_status = 'verified'

E apenas atualizar:

- telefone
- website
- descricao

---

## update_business_full(...)

Permitir apenas se:

- claim_status = 'verified'
- role = 'owner'
- plano != free (se for campo avançado)

---

Bloquear completamente updates diretos via RLS.

Frontend apenas chama RPC.

---

# FASE 5 — HOOK CENTRAL DE PERMISSÕES

Criar:

src/hooks/useBusinessClaimPermissions.ts

Retorna:

- isPending
- isVerified
- isFreePlan
- isPaidPlan
- canEditBasicFields
- canEditAdvancedFields
- canViewBasicAnalytics
- canViewProAnalytics
- canViewLeads
- bannerMessage

Lógica:

PENDING:

- editar apenas telefone/website/descricao
- não ver analytics
- banner amarelo

VERIFIED + FREE:

- editar básicos + redes sociais + horário
- ver analytics básico (views, clicks telefone, clicks website)
- não ver analytics pro
- mostrar upsell

VERIFIED + PAGO:

- acesso total

---

# FASE 6 — BUSINESS DASHBOARD

## 6.1 Banner de Estado

Criar componente ClaimStatusBanner.tsx

Mostrar conforme claim_status:

pending → amarelo  
rejected → vermelho  
revoked → cinza

---

## 6.2 Sidebar Condicional

pending:

- Overview
- Notificações

verified free:

- tudo visível
- Insights com badge upgrade

verified pago:

- tudo desbloqueado

---

## 6.3 Analytics Gating

Se claim_status != verified:

- bloquear completamente insights

Se verified + free:

- mostrar MiniAnalytics
- blur nos cards Pro
- botão Upgrade

Se verified + pago:

- mostrar tudo

---

# FASE 7 — ADMIN & COMERCIAL

## Nova Tab: Claim Requests

Mostrar:

- Nome negócio
- Cidade
- Quem reclamou
- Data
- Estado
- Notas internas
- Botões:
  - Aprovar
  - Rejeitar (com campo notas obrigatório)
  - Revogar (com notas)

Comercial:

- Apenas visualiza pending
- Não pode aprovar

Admin:

- Pode executar RPC

---

# FASE 8 — NOTIFICAÇÕES INTERNAS

Criar tabela:

admin_notifications:

- id
- type ('claim_request', 'claim_approved', 'claim_rejected')
- business_id
- created_at
- resolved_at

Criar notificação automática quando claim_status = pending.

---

# FASE 9 — SEGURANÇA FINAL

- Nenhum utilizador pode alterar claim_status via client
- Todas alterações críticas via RPC SECURITY DEFINER
- Nunca apagar businesses ao rejeitar
- Nunca apagar business_users (usar role = revoked)
- Validar permissões no backend sempre

---

# RESULTADO ESPERADO

- Claim torna-se pedido validado
- Admin controla aprovações
- Zé da Esquina não consegue tomar posse indevida
- Free tem acesso limitado
- Pago desbloqueia Analytics Pro
- Plataforma fica blindada e escalável

---

# PRIORIDADE DE IMPLEMENTAÇÃO

1. DB + RPCs
2. Proteção backend de update
3. Hook permissões
4. Dashboard gating
5. Admin Claim Requests
6. Comercial visualização

---

# IMPORTANTE

Não quebrar estrutura atual.  
Reutilizar componentes existentes.  
Não duplicar estado.  
Evitar lógica distribuída — centralizar permissões no hook.