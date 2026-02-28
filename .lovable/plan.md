

# Business Dashboard -- 4 Blocos (Ordem do Documento)

Implementacao dos 4 blocos seguindo a ordem de prioridade do documento fornecido.

---

## Ordem de Execucao

| # | Bloco | Prioridade |
|---|-------|-----------|
| 1 | Caderneta de Badges (Gamificacao) | Maxima |
| 2 | Pedidos Melhorados | Alta |
| 3 | Avaliacoes Melhoradas | Media |
| 4 | Equipa com Roles | Normal |

---

## Bloco 1 -- Caderneta de Badges

### SQL Migration
- Criar tabela `business_badge_progress` (business_id, badge_id, current_value, target_value, updated_at) com PK composta
- RLS: leitura permitida para membros do negocio via `business_users`
- Criar RPC `compute_badge_progress(p_business_id uuid)` que calcula progresso baseado no campo `criteria` JSON de cada badge (types: views, contacts, requests) usando dados de `analytics_events` e `request_business_matches`

### Novos Ficheiros
- `src/hooks/useBadgeProgress.ts` -- chama RPC, query para progress + badges, separa em desbloqueados/em progresso
- `src/components/business/BadgesTab.tsx` -- grid responsivo (2 col mobile, 3 desktop), desbloqueados primeiro com icone colorido e data, bloqueados com barra de progresso e label de plano necessario, seccao "Proximo Objetivo"

### Ficheiros Alterados
- `BusinessSidebar.tsx` -- adicionar tab "badges" (label: "Caderneta", icone: Award/Trophy)
- `BusinessDashboard.tsx` -- adicionar case "badges" no renderContent()

---

## Bloco 2 -- Pedidos Melhorados

### SQL Migration
- Adicionar `archived_at timestamptz DEFAULT NULL` e `archived_by uuid DEFAULT NULL REFERENCES profiles(id)` a `request_business_matches`
- Criar indice `idx_rbm_archived ON request_business_matches (business_id, archived_at)`
- Nota: nao modifica o enum `match_status` -- usa `archived_at IS NOT NULL` para determinar arquivo

### Ficheiros Alterados
- `useBusinessDashboard.ts` -- adicionar parametros de filtro (status, archived, search com ilike server-side), mutacoes `archiveRequest` e `restoreRequest`
- `BusinessRequestsContent.tsx` -- reescrever com:
  - Tabs internas: Ativos | Arquivados | Todos (com contadores em badge)
  - Search debounced 300ms (descricao, nome consumidor, cidade)
  - Filtros: Estado, Urgencia, Periodo (7/30/90 dias)
  - Acoes: Aceitar/Recusar/Arquivar (ativos), Restaurar (arquivados)
  - Empty states especificos por tab
  - Skeleton loaders
  - Manter chat inline existente sem quebrar

---

## Bloco 3 -- Avaliacoes Melhoradas

### SQL
Nenhuma migracao -- todos os campos ja existem.

### Ficheiros Alterados
- `BusinessReviewsPanel.tsx` -- adicionar:
  - Filtro por estrelas (1-5) clicavel na distribuicao
  - Filtro: Todas | Sem resposta | Respondidas
  - Search por conteudo do comentario
  - Filtros aplicados no cliente (volume baixo esperado)
  - Manter resposta in-line existente

---

## Bloco 4 -- Equipa com Roles

### SQL Migration
- Criar RPC `invite_business_member(p_business_id, p_email, p_role)` -- SECURITY DEFINER, verifica permissao (owner/manager), procura email em profiles, insere em business_users com ON CONFLICT
- Criar RPC `remove_business_member(p_business_id, p_user_id)` -- SECURITY DEFINER, owner remove todos, manager remove staff, delete de business_users
- Sem alteracoes de schema -- `business_users` ja tem enum `business_role` com owner/manager/staff

### Ficheiros Alterados
- `TeamSection.tsx` -- reescrever com:
  - Tabela de membros (avatar, nome, email, role badge, estado, acoes)
  - Dialog "Convidar Membro" com campo email + selecao de role (Administrador=manager, Operacional=staff)
  - Editar role inline
  - Remover membro com confirmacao (AlertDialog)
  - Permissoes: owner controla tudo, manager controla staff, staff so ve

---

## Resumo de Ficheiros

### Novos (2):
1. `src/hooks/useBadgeProgress.ts`
2. `src/components/business/BadgesTab.tsx`

### Alterados (6):
3. `src/components/business/BusinessSidebar.tsx`
4. `src/pages/BusinessDashboard.tsx`
5. `src/hooks/useBusinessDashboard.ts`
6. `src/components/business/BusinessRequestsContent.tsx`
7. `src/components/business/BusinessReviewsPanel.tsx`
8. `src/components/business/TeamSection.tsx`

### SQL Migrations (3):
9. `business_badge_progress` + RPC `compute_badge_progress`
10. `archived_at/archived_by` em `request_business_matches` + indice
11. RPCs `invite_business_member` + `remove_business_member`

