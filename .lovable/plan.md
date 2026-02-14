

# Correcao: Redirecionamento pos-registo para Claim Business

## Problema Identificado

O fluxo atual tem uma falha critica na cadeia de redirecionamento:

```text
1. Utilizador escolhe "Promover negocio" em /registar
2. Vai para /claim-business
3. Como nao tem conta, ve botoes "Criar Conta" / "Entrar"
4. Regista-se em /registar/consumidor
5. Confirma email → link redireciona para "/" (raiz do site)
6. Faz login → smart redirect envia para /dashboard (nao tem roles nem business_users)
7. NUNCA chega a /claim-business
```

O sistema perde a "intencao" do utilizador entre o registo e o login.

## Solucao

Guardar a intencao de destino em `localStorage` e usa-la apos login.

### Passo 1 — ClaimBusiness.tsx guarda intencao antes de redirecionar para registo

Quando o utilizador nao autenticado clica "Criar Conta" ou "Entrar" na pagina /claim-business, guardar `localStorage.setItem("postLoginRedirect", "/claim-business")` antes de navegar.

### Passo 2 — RegisterChoice.tsx guarda intencao no caminho "empresa"

Quando o utilizador clica "Quero promover o meu negocio", guardar `localStorage.setItem("postLoginRedirect", "/claim-business")` antes de navegar para /claim-business.

### Passo 3 — UserLogin.tsx respeita a intencao guardada

No `useEffect` de smart redirect, antes do fallback para /dashboard, verificar se existe `postLoginRedirect` em localStorage:

```text
1. Ler valor de localStorage("postLoginRedirect")
2. Se existir, limpar localStorage e navegar para esse caminho
3. Se nao existir, aplicar logica atual (admin/comercial/business/dashboard)
```

### Passo 4 — UserRegister.tsx passa emailRedirectTo com destino

Alterar o `emailRedirectTo` no signUp para incluir o redirect guardado como query param:

```text
emailRedirectTo: window.location.origin + "/login?redirect=/claim-business"
```

Assim, apos confirmar email, o utilizador aterra na pagina de login com o redirect pre-definido.

### Passo 5 — UserLogin.tsx le query param redirect

No mount, verificar se existe `?redirect=` na URL. Se sim, guardar em localStorage como `postLoginRedirect` para uso no smart redirect.

## Ficheiros Alterados

| Ficheiro | Alteracao |
|----------|-----------|
| `src/pages/ClaimBusiness.tsx` | Guardar intencao em localStorage nos links "Criar Conta" e "Entrar" |
| `src/pages/RegisterChoice.tsx` | Guardar intencao no botao "Promover negocio" |
| `src/pages/UserRegister.tsx` | Ler intencao de localStorage e incluir no emailRedirectTo |
| `src/pages/UserLogin.tsx` | Ler `?redirect=` da URL + verificar localStorage antes do fallback |

## Seguranca

- O valor de `postLoginRedirect` e validado para aceitar apenas caminhos internos (comeca com "/", sem "//")
- Limpar localStorage apos uso para evitar loops
- Nao expor dados sensiveis no redirect

