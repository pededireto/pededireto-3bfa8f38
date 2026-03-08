

# Cadences Multi-Step com Condições — Plano de Implementação

## Estado Actual (Análise Completa)

### Tabelas existentes

```text
email_cadences
├── id, name, description, category, is_active
├── created_by, created_at, updated_at
└── Sem campos de métricas

email_cadence_steps
├── id, cadence_id (FK), template_id (FK)
├── step_order, delay_days, delay_hours
└── SEM: condition_type, condition_ref_step_id, channel

email_cadence_enrollments
├── id, cadence_id (FK), business_id (FK), user_id
├── recipient_email, current_step, status
├── enrolled_at, enrolled_by, completed_at, cancelled_at
├── pause_on_reply, pause_on_click
└── SEM: converted_at, paused_reason, paused_at
```

### Edge Function `process-cadences` — o que faz hoje

1. Busca enrollments `active` com cadences `is_active = true`
2. Se `pause_on_reply` e existir `replied_at` em email_logs → pausa
3. Calcula delay cumulativo desde `enrolled_at` para determinar quando enviar
4. Verifica se já enviou esse step (via email_logs + metadata)
5. Envia via Resend com `from: geral@pededireto.pt`
6. Regista em `email_logs` com metadata da cadence
7. Avança `current_step`; marca `completed` se último step

### Webhook `email-webhook` — o que faz hoje

Recebe eventos Resend (`delivered`, `opened`, `clicked`, `bounced`) e actualiza `email_logs` com `opened_at`, `clicked_at`, `bounced`. Cria notificação para o remetente. **Funciona** mas precisa de estar configurado no Resend dashboard.

### O que FALTA

| Funcionalidade | Existe? | Detalhe |
|---|---|---|
| Steps com delay_days | ✅ | Funcional |
| condition_type por step | ❌ | Não existe coluna |
| condition_ref_step_id | ❌ | Não existe coluna |
| channel por step | ❌ | Tudo é email |
| Tracking opened/clicked | ✅ Parcial | email_logs tem campos, webhook actualiza, mas process-cadences NÃO verifica |
| Status converted | ❌ | Enrollment só tem active/paused/completed |
| converted_at / paused_reason | ❌ | Não existem |
| pause_on_click lógica | ❌ | Campo existe mas ignorado no processamento |
| Dashboard por step | ❌ | Sem views SQL |
| Trigger auto-conversão | ❌ | Não existe |

---

## Plano de Implementação — 3 Fases

### FASE 1 — Steps com Condições (DB + Edge Function + UI)

**Migration SQL:**
```sql
-- Adicionar campos de condição aos steps
ALTER TABLE email_cadence_steps
  ADD COLUMN condition_type TEXT DEFAULT 'always',
  ADD COLUMN condition_ref_step INTEGER;

-- Adicionar campos de conversão aos enrollments  
ALTER TABLE email_cadence_enrollments
  ADD COLUMN converted_at TIMESTAMPTZ,
  ADD COLUMN paused_at TIMESTAMPTZ,
  ADD COLUMN paused_reason TEXT;
```

**Edge Function `process-cadences` — actualizar lógica:**
- Antes de enviar cada step, verificar `condition_type`:
  - `always` → enviar sempre (comportamento actual)
  - `if_opened` → verificar se `email_logs` do step referenciado tem `opened_at IS NOT NULL`
  - `if_not_opened` → verificar `opened_at IS NULL`
  - `if_clicked` / `if_not_clicked` → mesma lógica com `clicked_at`
- Se condição não satisfeita → marcar step como `skipped` e avançar
- Implementar `pause_on_click` (já ignorado)

**UI — Steps Dialog melhorado:**
Cada step passa a mostrar:
- Template selector (já existe)
- Delay days/hours (já existe)
- **Novo:** Select "Condição" com opções: Sempre / Se abriu step X / Se NÃO abriu step X / Se clicou step X / Se NÃO clicou step X
- **Novo:** Select "Step de referência" (lista dos steps anteriores)

### FASE 2 — Pausa Automática por Conversão

**Migration SQL:**
```sql
-- Trigger: quando subscription é criada/activada, pausar cadences do negócio
CREATE OR REPLACE FUNCTION pause_cadence_on_subscription()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE email_cadence_enrollments
  SET status = 'converted',
      converted_at = NOW(),
      paused_reason = 'Subscreveu plano'
  WHERE business_id = NEW.business_id
    AND status = 'active';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pause_on_subscription
AFTER INSERT OR UPDATE OF status ON subscriptions
FOR EACH ROW
WHEN (NEW.status = 'active')
EXECUTE FUNCTION pause_cadence_on_subscription();
```

**Edge Function `email-webhook` — melhorar:**
- Quando recebe `email.replied` → buscar enrollment via metadata → marcar como `paused` com reason "Respondeu ao email"

### FASE 3 — Dashboard de Performance

**View SQL:**
```sql
CREATE VIEW cadence_step_performance AS
SELECT
  cs.cadence_id,
  cs.step_order,
  cs.id as step_id,
  et.name as template_name,
  COUNT(el.id) as sent,
  COUNT(el.opened_at) as opened,
  COUNT(el.clicked_at) as clicked,
  ROUND(COUNT(el.opened_at)::numeric / NULLIF(COUNT(el.id), 0) * 100, 1) as open_rate,
  ROUND(COUNT(el.clicked_at)::numeric / NULLIF(COUNT(el.id), 0) * 100, 1) as click_rate
FROM email_cadence_steps cs
LEFT JOIN email_templates et ON et.id = cs.template_id
LEFT JOIN email_logs el ON el.template_id = cs.template_id
  AND el.metadata->>'cadence_id' = cs.cadence_id::text
  AND (el.metadata->>'step_order')::int = cs.step_order
GROUP BY cs.cadence_id, cs.step_order, cs.id, et.name
ORDER BY cs.cadence_id, cs.step_order;
```

**UI — Painel de performance por cadence:**
- Tabela com colunas: Step / Template / Enviados / Abertos / % Open / Clicados / % Click
- Cards resumo: Total enrolled / Activos / Convertidos / Completados
- Badge por cadence com taxa de conversão

---

## Quick Wins (na mesma sessão)

1. **Campanhas — filtros visuais**: Substituir textarea JSON por selects (cidade, categoria, plano) usando os mesmos componentes das Cadences
2. **Cadences — categorias dinâmicas**: Substituir array `CATEGORIES` hardcoded por `useCategories()` (hook já existe)
3. **Sugestões — estados**: Migration para adicionar `status` ('nova'|'em_análise'|'processada') com default 'nova'; UI com badge colorido e dropdown inline

---

## Sobre CallMeBot

Recomendação: **deixar cair**. CallMeBot só funciona para um número fixo — não serve para comunicação com múltiplos negócios. Quando quiserem WhatsApp a sério, a opção correcta é a **WhatsApp Business API** (via Twilio ou 360dialog). Isso é um projecto separado e mais caro. O sistema de condições que vamos construir já prepara a coluna `channel` para quando isso existir.

---

## Ficheiros a modificar/criar

| Ficheiro | Acção |
|---|---|
| Migration SQL | ALTER steps + enrollments + view + trigger |
| `supabase/functions/process-cadences/index.ts` | Adicionar lógica de condições |
| `supabase/functions/email-webhook/index.ts` | Pausa por reply |
| `src/components/email/EmailCadencesContent.tsx` | Steps com condições + dashboard + categorias dinâmicas |
| `src/components/email/EmailCampaignsContent.tsx` | Filtros visuais |
| `src/components/admin/SuggestionsContent.tsx` | Estados + badges |
| `src/hooks/useSuggestions.ts` | Update status mutation |
| `src/hooks/useEmailMarketing.ts` | Hook cadence performance |

## Estimativa de complexidade

- **Fase 1**: Média-alta (migration + edge function + UI)
- **Fase 2**: Baixa (trigger SQL + pequena alteração no webhook)
- **Fase 3**: Média (view SQL + componente UI novo)
- **Quick wins**: Baixa (3 alterações isoladas)

Tudo construído sobre o existente — sem redesign.

