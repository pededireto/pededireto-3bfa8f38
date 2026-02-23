
# Diagnostico e Plano de Correcao - Perfil do Consumidor e Pedidos

## Diagnostico Tecnico

### O que foi encontrado

**1. Tabelas de perfil (duplicacao)**
- `profiles` - tabela principal, ligada a `auth.users` via `user_id`. Campos: `id`, `user_id`, `email`, `full_name`, `phone`, `address`, `status`. **NAO tem campo `city`.**
- `user_profiles` - tabela secundaria com `score`, `requests_count`, `last_request_at`, `avatar_url`, `bio`. Usada apenas para scoring.

**2. Foreign Key confirmada**
- `service_requests.user_id` -> `profiles.user_id` (FK existe e funciona)
- O join `profiles:user_id (full_name, email, phone)` no hook `useBusinessRequests` esta sintaticamente correto

**3. Dados reais na base de dados - O PROBLEMA REAL**
Os utilizadores que fizeram pedidos tem os campos de perfil VAZIOS:
```
user_id: 83d5faa9... -> full_name: "", phone: null, email: tresgate@gmail.com
user_id: 9c24017b... -> full_name: null, phone: null, email: null
```
O negocio ve os dados corretos do pedido (descricao, categoria, cidade) mas NAO ve dados de contacto porque o perfil nunca foi preenchido.

**4. Dashboard do consumidor**
- NAO tem link para editar perfil
- NAO valida perfil antes de permitir criar pedidos
- A pagina `/perfil` (ProfilePage.tsx) EXISTE e funciona, mas nao esta acessivel a partir do dashboard

**5. Formulario de pedido (`/pedir-servico`)**
- Nenhuma validacao de perfil completo antes de submeter
- Aceita pedidos de utilizadores sem nome nem telefone

**6. Trigger de scoring**
- `trg_update_consumer_score` EXISTE e esta ativo na tabela `service_requests`
- Funcao `update_consumer_score_on_request()` atualiza `user_profiles` (tabela secundaria)
- Trigger funcional - nenhuma correcao necessaria

---

## Lista de Falhas Estruturais

| # | Falha | Impacto |
|---|-------|---------|
| 1 | Perfil do consumidor sem campo `city` na tabela `profiles` | Impossivel associar cidade ao consumidor |
| 2 | Nenhuma validacao de perfil antes de criar pedido | Negocios recebem pedidos sem contacto |
| 3 | Dashboard do consumidor sem acesso a edicao de perfil | Utilizador nao sabe onde preencher dados |
| 4 | Formulario de pedido nao exige nome e telefone | Dados criticos em falta |

---

## Plano de Implementacao

### PASSO 1 - Adicionar campo `city` a tabela `profiles`

Migracao SQL para adicionar coluna `city` (texto, nullable):
```sql
ALTER TABLE profiles ADD COLUMN city text;
```

Sem impacto em dados existentes. Todas as queries continuam a funcionar.

### PASSO 2 - Card de Perfil no Dashboard do Consumidor

Modificar `src/pages/UserDashboard.tsx`:
- Adicionar card de perfil entre o CTA "Pedir Servico" e as tabs
- Mostrar: nome, email, telefone, cidade
- Botao "Editar Perfil" que leva a `/perfil`
- Alerta visual se perfil incompleto (nome ou telefone em falta)

O card vai buscar dados via query a `profiles` com `user_id = auth.uid()`.

### PASSO 3 - Adicionar campo `city` ao ProfilePage

Modificar `src/pages/ProfilePage.tsx`:
- Adicionar campo "Cidade" ao formulario (entre Telefone e Morada)
- Guardar na nova coluna `city` da tabela `profiles`
- Manter todos os campos existentes intactos

### PASSO 4 - Validacao de perfil antes de criar pedido

Modificar `src/pages/RequestServicePage.tsx`:
- Antes de mostrar o formulario, verificar se `profiles` tem `full_name` e `phone` preenchidos
- Se perfil incompleto: mostrar alerta com link para `/perfil` e bloquear submissao
- Se perfil completo: mostrar formulario normalmente

### PASSO 5 - Verificar e ajustar query do BusinessRequestsContent

A query no `useBusinessRequests` (em `useBusinessDashboard.ts`) ja faz o join correto:
```
profiles:user_id (full_name, email, phone)
```
O problema nao e a query - e que os dados estao vazios no perfil. Apos os passos 2-4, os novos pedidos terao sempre dados de contacto.

Adicionalmente, vou incluir `city` no join para o negocio ver a cidade do consumidor.

---

## Fluxo Ideal Resultante

```text
1. Login
2. Dashboard -> Ve card de perfil
3. Se incompleto -> Alerta "Complete o seu perfil"
4. Clica "Editar Perfil" -> /perfil
5. Preenche nome, telefone, cidade
6. Volta ao dashboard -> Perfil completo
7. Clica "Pedir Servico" -> /pedir-servico
8. Formulario valida perfil -> Permite submissao
9. Negocio recebe pedido COM dados de contacto
10. Negocio contacta consumidor diretamente
```

---

## Ficheiros a alterar

| Ficheiro | Acao | Descricao |
|----------|------|-----------|
| Migracao SQL | Criar | Adicionar coluna `city` a `profiles` |
| `src/pages/UserDashboard.tsx` | Alterar | Adicionar card de perfil com alerta |
| `src/pages/ProfilePage.tsx` | Alterar | Adicionar campo cidade |
| `src/pages/RequestServicePage.tsx` | Alterar | Validacao de perfil completo |
| `src/hooks/useBusinessDashboard.ts` | Alterar | Incluir `city` no join de profiles |

## O que NAO sera alterado
- Estrutura da tabela `service_requests`
- Tabela `user_profiles` (scoring)
- Trigger `trg_update_consumer_score`
- `BusinessRequestsContent.tsx` (ja funcional)
- Estilos globais
- Logica existente de matching
