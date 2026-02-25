
# Auditoria e Correcao Completa do Fluxo de Pedidos e Chat

## Resumo da Auditoria

Foram identificados **6 problemas criticos** que impedem o funcionamento do sistema de pedidos e mensagens. Abaixo esta o diagnostico completo e o plano de correcao.

---

## Problemas Identificados

### 1. CRITICO: Consumer nao consegue ver os matches (negocios contactados)
**Causa:** Nao existe nenhuma politica RLS de SELECT na tabela `request_business_matches` para consumidores. O consumer nunca ve quais negocios receberam ou aceitaram o seu pedido --- por isso o painel mostra "Ainda nenhum negocio foi contactado" mesmo quando existem matches.

### 2. CRITICO: Mensagens falham com "Erro ao enviar mensagem"
**Causa (Business side):** A politica `business_insert` em `request_messages` verifica `b.owner_id = auth.uid() OR bu.user_id = auth.uid()`. Se o `owner_id` do negocio nao estiver definido E o user nao estiver na tabela `business_users`, o insert e bloqueado pelo RLS. Para o caso do "Delivery Masters" o owner_id esta preenchido, mas o SELECT da `request_business_matches` usa uma join diferente (`profiles.email = b.owner_email`), criando inconsistencias.

**Causa (Consumer side):** A politica `consumer_insert` em `request_messages` parece correta (`sr.user_id = auth.uid()`), mas precisa de validacao end-to-end.

### 3. Nao existe acao de "Aceitar Pedido" no lado do negocio
**Causa:** O componente `BusinessRequestsContent` nao tem botao para o negocio mudar o status do match de `enviado` para `aceite`. O enum `match_status` suporta o valor `aceite`, mas nao ha UI nem logica para o usar.

### 4. Consumer nao ve que negocios aceitaram o pedido
**Causa:** Combinacao do problema 1 (sem SELECT RLS para consumer nos matches) com o facto de o `RequestDetailPage` nao distinguir visualmente entre matches enviados e aceites.

### 5. Sem Supabase Realtime
**Causa:** A tabela `request_messages` nao esta na publicacao `supabase_realtime`. Ambos os lados usam polling a cada 15 segundos em vez de updates em tempo real.

### 6. Contacto do consumer visivel antes da aceitacao
**Causa:** O `BusinessRequestsContent` mostra sempre os dados do consumidor (nome, email, telefone) independentemente do status do match. O campo `contact_unlocked` existe mas nao e usado na UI.

---

## Plano de Correcao

### Fase 1: Correcoes de Base de Dados (Migracoes SQL)

**1.1 - Adicionar RLS para consumer ver matches do seu pedido**
```sql
CREATE POLICY "consumer_sees_own_request_matches"
ON public.request_business_matches
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM service_requests sr
    WHERE sr.id = request_business_matches.request_id
    AND sr.user_id = auth.uid()
  )
);
```

**1.2 - Adicionar RLS para business_users no request_business_matches (SELECT e UPDATE)**
As politicas atuais usam `profiles.email = b.owner_email` que e fragil. Adicionar politicas alternativas via `business_users`:
```sql
CREATE POLICY "business_users_view_matches"
ON public.request_business_matches
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM business_users bu
    WHERE bu.business_id = request_business_matches.business_id
    AND bu.user_id = auth.uid()
    AND bu.role IN ('owner', 'pending_owner')
  )
);

CREATE POLICY "business_users_update_matches"
ON public.request_business_matches
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM business_users bu
    WHERE bu.business_id = request_business_matches.business_id
    AND bu.user_id = auth.uid()
    AND bu.role = 'owner'
  )
);
```

**1.3 - Ativar Realtime para request_messages**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.request_messages;
```

### Fase 2: Correcoes no Frontend - Lado do Negocio

**2.1 - Adicionar botao "Aceitar Pedido" no `BusinessRequestsContent.tsx`**
- Adicionar botao de aceitacao que atualiza o `request_business_matches.status` para `aceite`
- Adicionar botao de recusa que muda para `recusado`
- Apos aceitar, mostrar os dados de contacto do consumidor
- Condicionar a visibilidade dos dados de contacto ao `match.status === 'aceite'` ou `match.contact_unlocked === true`

**2.2 - Substituir polling por Supabase Realtime no RequestChat**
- Adicionar subscription ao canal `request_messages` filtrado por `request_id`
- Manter polling como fallback mas reduzir a frequencia

### Fase 3: Correcoes no Frontend - Lado do Consumidor

**3.1 - Corrigir visibilidade dos matches no `RequestDetailPage.tsx`**
- Com a nova RLS policy, o consumer passara a ver os matches
- Adicionar estados visuais mais claros: "Aguarda resposta", "Aceitou o pedido", "Recusou"
- Mostrar nome do negocio e link para a pagina quando o status e `aceite`

**3.2 - Substituir polling por Supabase Realtime**
- Adicionar subscription para mensagens em tempo real

### Fase 4: Seguranca e Integridade

**4.1 - Contacto do consumidor protegido por status**
- No `BusinessRequestsContent`, so mostrar dados de contacto (email, telefone) quando `match.status === 'aceite'` ou `match.contact_unlocked === true`
- Manter visivel apenas o nome e cidade antes da aceitacao

---

## Ficheiros a Alterar

| Ficheiro | Alteracao |
|----------|-----------|
| **Migracao SQL** | Novas politicas RLS + Realtime |
| `src/components/business/BusinessRequestsContent.tsx` | Botoes aceitar/recusar, contacto condicional, Realtime |
| `src/pages/RequestDetailPage.tsx` | Matches visiveis, estados claros, Realtime |
| `src/hooks/useBusinessDashboard.ts` | Sem alteracoes (query ja esta correta) |

## Compatibilidade

- Todas as alteracoes sao retrocompativeis
- As triggers existentes (`auto_unlock_contact`, `unlock_contact_per_business`, `auto_set_response_time`) ja estao preparadas para os status `aceite` e `recusado`
- O enum `match_status` ja contem todos os valores necessarios
- Nenhuma tabela nova e necessaria
