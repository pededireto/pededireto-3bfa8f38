
# Plano de Implementacao - 5 Areas

## Resumo das Descobertas

**Tabelas relevantes:**
- `profiles` - tabela principal de perfis (sem campos de scoring)
- `user_profiles` - tabela secundaria com `score`, `requests_count`, `last_request_at`
- `service_requests` - campos: `description`, `urgency`, `location_city`, `location_postal_code`, `address`, `category_id`, `subcategory_id`, `user_id`
- `request_business_matches` - liga pedidos a negocios

**Problemas encontrados:**
- O trigger `trg_update_consumer_score` NAO EXISTE na base de dados (a funcao existe mas o trigger nunca foi criado)
- O `BusinessRequestsContent.tsx` ja faz join a `profiles` mas o join usa `profiles:user_id` que pode nao resolver corretamente
- O dashboard do consumidor nao tem aba de pedidos nem CTA para pedir servico
- O Admin dialog de pedidos nao mostra detalhes do pedido nem negocios sugeridos

---

## AREA 1 - Dashboard do Consumidor (`UserDashboard.tsx`)

### O que sera feito:
1. Adicionar card de destaque no topo com botao "Pedir Servico" que leva a `/pedir-servico`
2. Criar nova aba "Os Meus Pedidos" com listagem dos pedidos do utilizador
3. Criar hook `useConsumerRequests` para buscar pedidos do utilizador autenticado na tabela `service_requests`

### Ficheiros a alterar:
- `src/pages/UserDashboard.tsx` - adicionar CTA + nova tab
- `src/hooks/useServiceRequests.ts` - adicionar hook `useConsumerRequests`

### Detalhes tecnicos:
- Query: `service_requests` filtrada por `user_id = auth.uid()` com join a `categories` e `subcategories`
- Cada pedido mostra: categoria, descricao truncada (120 chars), badge de estado (novo/encaminhado/concluido), data pt-PT
- Card CTA com icone `ClipboardList`, fundo primario, link para `/pedir-servico`

---

## AREA 2 - BusinessRequestsContent.tsx

### O que foi encontrado:
O componente ja foi corrigido na sessao anterior e faz join correto. Porem, o join `profiles:user_id` pode falhar se nao houver FK direta. Vou verificar e garantir que funciona.

### O que sera feito:
- Verificar que a query no hook `useBusinessRequests` resolve corretamente os dados do consumidor
- Se necessario, ajustar a query para usar o formato correto de join
- Garantir que `description` mostra texto completo (nao truncado)

### Ficheiros a verificar/alterar:
- `src/hooks/useBusinessDashboard.ts` - query do `useBusinessRequests`
- `src/components/business/BusinessRequestsContent.tsx` - ja esta correto, pequenos ajustes se necessario

---

## AREA 3 - Sugestao Automatica no Admin

### O que sera feito:
No dialog de "Ver" pedido no `ServiceRequestsContent.tsx`:
1. Mostrar detalhes completos do pedido selecionado (descricao, urgencia, cidade, consumidor)
2. Adicionar seccao "Negocios Sugeridos" que busca negocios da mesma categoria + subcategoria + cidade
3. Ordenar por score usando a funcao `get_business_profile_score` existente
4. Botao "Encaminhar Pedido" que cria um match via `useCreateMatch`

### Ficheiros a alterar:
- `src/components/admin/ServiceRequestsContent.tsx` - expandir dialog
- Usar `useBusinessProfileScore` existente para scoring
- Criar query inline para buscar negocios por categoria/subcategoria/cidade

### Detalhes tecnicos:
- Query de negocios: `businesses` filtrada por `category_id`, `subcategory_id` (opcional), `city` (opcional), `is_active = true`
- Limitar a 5 resultados
- Cada sugestao mostra: nome, cidade, botao "Encaminhar"

---

## AREA 4 - Trigger de Scoring

### ANTES:
```sql
-- Funcao existe mas aponta para user_profiles
-- Trigger NAO EXISTE (nao foi criado)
```

### DEPOIS:
```sql
-- Criar o trigger que falta na tabela service_requests
CREATE TRIGGER trg_update_consumer_score
  AFTER INSERT ON service_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_consumer_score_on_request();
```

O trigger vai usar a funcao existente `update_consumer_score_on_request()` que ja atualiza `user_profiles`. Como a tabela `user_profiles` ja tem os campos corretos (`score`, `requests_count`, `last_request_at`), nao e necessario alterar a funcao -- apenas criar o trigger em falta.

### Migracao SQL:
- Criar trigger `trg_update_consumer_score` na tabela `service_requests`

---

## AREA 5 - CategoryAccordion Homepage

### O que sera feito:
Criar componente `src/components/home/CategoryAccordion.tsx`:
- Layout horizontal flex com paineis que expandem no hover
- Altura: 350px desktop, 220px mobile
- Cada painel: `flex: 1`, no hover `flex: 4`, transicao 0.4s
- Fora do hover: inicial da categoria centrada
- No hover: nome, nr negocios, botao "Ver todos"
- Top 8 categorias por numero de negocios ativos
- Imagens de fundo (ja existem nos dados) com fallback gradiente
- Mobile: scroll horizontal

### Integracao:
- Adicionar ao `HomepageBlockRenderer.tsx` como novo tipo de bloco `categorias_accordion`
- OU usar diretamente no fallback do `Index.tsx` como complemento/substituicao do `CategoriesGrid`

### Dados disponiveis:
As categorias ja tem `image_url` preenchido (confirmado na base de dados). Top 8:
1. Saude (431 negocios)
2. Beleza e Bem-Estar (134)
3. Restaurantes (100)
4. Materiais de Construcao (90)
5. Servicos de Reparacoes (83)
6. Servicos Automovel (30)
7. Educacao (30)
8. Formacao (24)

### Ficheiros a criar/alterar:
- `src/components/home/CategoryAccordion.tsx` (novo)
- `src/hooks/useCategories.ts` - adicionar hook `useCategoriesWithCount` que retorna categorias com contagem de negocios
- `src/components/HomepageBlockRenderer.tsx` - adicionar case para novo tipo
- `src/pages/Index.tsx` - integrar no fallback

---

## Resumo de Ficheiros

| Ficheiro | Acao |
|----------|------|
| `src/pages/UserDashboard.tsx` | Alterar - CTA + aba pedidos |
| `src/hooks/useServiceRequests.ts` | Alterar - novo hook consumidor |
| `src/components/business/BusinessRequestsContent.tsx` | Verificar/ajustar |
| `src/hooks/useBusinessDashboard.ts` | Verificar query |
| `src/components/admin/ServiceRequestsContent.tsx` | Alterar - detalhes + sugestoes |
| `src/components/home/CategoryAccordion.tsx` | Criar novo |
| `src/hooks/useCategories.ts` | Alterar - hook com contagem |
| `src/components/HomepageBlockRenderer.tsx` | Alterar - novo tipo bloco |
| `src/pages/Index.tsx` | Alterar - integrar accordion |
| Migracao SQL | Criar trigger scoring |

## O que NAO sera alterado:
- Estrutura de tabelas existentes
- Estilos globais
- Logica funcional existente
- Ficheiros de configuracao Supabase
