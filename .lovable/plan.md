

# Sistema de Expiracao Automatica e Alertas Comerciais

## Resumo

Melhorar a edge function existente de verificacao de subscricoes, criar uma nova tabela para registar desativacoes automaticas, adicionar uma nova seccao "Alertas Comerciais" ao backoffice, e criar uma edge function para envio de emails diarios de resumo.

---

## PARTE 1 -- Logica de Expiracao Melhorada

### Base de dados
- Criar tabela `expiration_logs` para registar cada desativacao automatica:
  - `id` (uuid, PK)
  - `business_id` (uuid, FK)
  - `plan_name` (text) -- nome do plano na altura da expiracao
  - `plan_price` (numeric)
  - `expired_at` (date)
  - `deactivated_at` (timestamptz, default now())
  - `contact_status` (text, default 'nao_contactado') -- nao_contactado | contactado | renovado | perdido
  - `contacted_at` (timestamptz, nullable)
  - `notes` (text, nullable)
- RLS: admins full access

### Edge Function (`check-subscriptions`)
- Atualizar a funcao existente para:
  - Excluir negocios com `plan_id` nulo ou plano gratuito (preco = 0) da verificacao
  - Ao desativar, registar na tabela `expiration_logs` com dados do plano
  - Adicionar periodo de graca opcional (3 dias) -- comparar com `subscription_end_date + 3 dias`
  - Retornar lista de negocios expirados no response para uso pelo email

### Cron Job
- Configurar via SQL (pg_cron + pg_net) para executar `check-subscriptions` diariamente a meia-noite

---

## PARTE 2 -- Email Automatico de Alerta

### Nova Edge Function (`send-expiry-alerts`)
- Executada diariamente (ex: 9h00 via cron)
- Consulta `expiration_logs` das ultimas 24h com `contact_status = 'nao_contactado'`
- Junta dados de contacto do negocio (WhatsApp, telefone, email)
- Envia email formatado em HTML para `geral.pededireto@gmail.com` usando Resend ou o servico de email do projeto
- Template conforme especificado no pedido

### Nota sobre envio de email
- Sera necessario configurar um servico de email (Resend API key como secret)
- Alternativa: registar tudo na tabela e o admin consulta no dashboard (sem email externo)

---

## PARTE 3 -- Dashboard de Alertas Comerciais

### Nova aba no sidebar
- Adicionar "Alertas" entre "Subscricoes" e "Sugestoes" no `AdminSidebar.tsx`
- Icone: `Bell` (sino) do lucide-react
- Badge vermelho dinamico com contagem de negocios nao contactados

### Componente `AlertsContent.tsx`
- **Filtros no topo:**
  - Periodo: Hoje / 7 dias / 30 dias / Todos
  - Plano anterior (dropdown dinamico dos planos comerciais)
  - Estado de contacto: Nao contactado / Contactado / Renovado / Perdido

- **Estatisticas resumidas:**
  - Total expirados nao contactados
  - Taxa de recuperacao (renovados / total nos ultimos 30 dias)
  - Receita em risco (soma dos precos dos planos expirados nao contactados)

- **Tabela de negocios expirados:**
  - Colunas: Negocio, Plano Anterior, Expirou em, Dias desde expiracao, Contacto, Acoes
  - Acoes por linha:
    - WhatsApp (abre conversa pre-formatada com template)
    - Email (abre mailto com template)
    - Marcar como contactado (atualiza `contact_status`)

### Hook `useExpirationLogs.ts`
- Query `expiration_logs` com join a `businesses` para dados de contacto
- Mutacoes para atualizar `contact_status` e `notes`

---

## PARTE 4 -- Templates de Comunicacao

- Template WhatsApp integrado no botao de acao (URL `wa.me` com texto pre-formatado)
- Template Email integrado no botao `mailto:` com subject e body pre-formatados
- Ambos usando dados dinamicos do negocio (nome, plano, data de expiracao)

---

## Detalhes Tecnicos

### Ficheiros a criar
| Ficheiro | Descricao |
|---|---|
| `supabase/migrations/..._create_expiration_logs.sql` | Tabela + RLS |
| `src/hooks/useExpirationLogs.ts` | Hook para queries e mutacoes |
| `src/components/admin/AlertsContent.tsx` | Dashboard de alertas |
| `supabase/functions/send-expiry-alerts/index.ts` | Edge function de email |

### Ficheiros a editar
| Ficheiro | Alteracao |
|---|---|
| `supabase/functions/check-subscriptions/index.ts` | Excluir gratuitos, registar em expiration_logs, periodo de graca |
| `src/components/admin/AdminSidebar.tsx` | Adicionar tab "alerts" com badge |
| `src/pages/AdminPage.tsx` | Renderizar AlertsContent |
| `supabase/config.toml` | Registar nova edge function |

### Dependencias
- Secret `RESEND_API_KEY` necessaria para envio de emails (sera pedida ao utilizador)
- Extensoes `pg_cron` e `pg_net` para cron jobs

