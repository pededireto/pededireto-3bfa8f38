
# Corrigir Fluxo de Claim: Registo Inline vs Formulario Completo

## Problema Atual

Quando um utilizador sem conta seleciona um negocio existente para reclamar, e redirecionado para `/register/business` (formulario completo com todos os dados do negocio). Isto nao faz sentido porque o negocio ja existe — so precisa de criar conta.

## Logica Correta

### Cenario 1: Reclamar negocio existente (sem conta)
- Utilizador pesquisa e seleciona um negocio na pagina `/claim-business`
- Como nao tem conta, aparece um **mini formulario inline** com:
  - Nome do Responsavel
  - Telefone do Responsavel
  - Email do Responsavel (sera o email de login)
  - Password (campo seguro, nunca visivel para a Pede Direto)
- Ao submeter: cria conta via `supabase.auth.signUp` + executa o claim automaticamente
- Redireciona para `/business-dashboard`

### Cenario 2: Reclamar negocio existente (com conta)
- Comportamento atual mantido — clica "Reclamar" e executa o claim via RPC

### Cenario 3: Criar negocio novo (sem conta)
- Clica "Nao encontro o meu negocio — Criar novo"
- E redirecionado para `/register/business` onde preenche o formulario completo (RegisterBusiness.tsx)
- Este formulario ja tem todos os campos necessarios (dados do negocio + dados do responsavel)

## Alteracoes Tecnicas

### 1. Corrigir build error — `RegisterBusiness.tsx`
O ficheiro parece estar truncado num estado anterior. Garantir que esta completo e funcional (o ficheiro atual tem 299 linhas e esta correto, mas vamos verificar e garantir).

### 2. Modificar `ClaimBusiness.tsx`
Quando o utilizador seleciona um negocio existente e **nao tem conta**:
- Em vez de redirecionar para `/register/business`, mostrar um formulario inline com:
  - Nome do Responsavel (input text)
  - Telefone do Responsavel (input text)
  - Email (input email) — sera o email de acesso
  - Password (input password)
- Botao "Criar Conta e Reclamar"
- Ao submeter:
  1. `supabase.auth.signUp({ email, password, metadata: { full_name, phone } })`
  2. Aguardar sessao ativa
  3. Executar `claim_business` RPC
  4. Redirecionar para `/business-dashboard`
  5. Toast: "Conta criada e negocio reclamado com sucesso!"

### 3. Atualizar "Criar novo" para redirecionar corretamente
Quando o utilizador clica "Nao encontro o meu negocio — Criar novo" e **nao tem conta**:
- Redirecionar para `/register/business` (formulario completo existente)
- Guardar `postLoginRedirect` em localStorage

### 4. Adicionar Password ao RegisterBusiness.tsx
O formulario completo de registo de negocio novo tambem precisa de campos de criacao de conta (email + password) se o utilizador nao estiver autenticado.

## Ficheiros Modificados

| Ficheiro | Alteracao |
|----------|-----------|
| `src/pages/ClaimBusiness.tsx` | Adicionar formulario inline de registo rapido com email+password quando utilizador sem conta seleciona negocio existente |
| `src/pages/RegisterBusiness.tsx` | Adicionar campos de criacao de conta (password) para utilizadores nao autenticados; garantir ficheiro completo sem erros de build |

## Fluxo Visual

```text
/register (RegisterChoice)
    |
    |-- "Quero encontrar servicos" --> /registar/consumidor
    |
    |-- "Quero promover o meu negocio" --> /claim-business
            |
            |-- Pesquisa negocio --> Encontra --> Seleciona
            |       |
            |       |-- Com conta: Botao "Reclamar" (RPC direto)
            |       |-- Sem conta: Mini formulario inline
            |               (Nome, Telefone, Email, Password)
            |               --> Cria conta + Claim automatico
            |
            |-- "Nao encontro" --> /register/business
                    (Formulario completo com dados negocio
                     + dados responsavel + password)
```

## Seguranca
- Password nunca e armazenada no frontend
- Utilizacao de `supabase.auth.signUp` standard
- Claim executado via RPC SECURITY DEFINER apos autenticacao
- Email de confirmacao enviado normalmente
