
# Corrigir Recursao Infinita nas Politicas RLS

## Problema
A politica RLS adicionada na ultima alteracao criou um ciclo de recursao infinita:
- `businesses` tem uma politica que consulta `business_users`
- `business_users` tem uma politica ("Owner can manage team") que faz uma sub-consulta na propria tabela `business_users`
- O PostgREST avalia as politicas em cadeia e deteta recursao infinita (erro 42P17)
- **Resultado**: TODAS as queries a `businesses` falham com erro 500, tornando o site sem negocios visiveis

## Causa Raiz
A politica `"Business members can view their own business"` em `businesses` faz `EXISTS (SELECT 1 FROM business_users WHERE ...)`. Quando o Postgres avalia esta sub-consulta, precisa tambem verificar as politicas RLS de `business_users`, que por sua vez referencia `business_users` novamente (politica "Owner can manage team"), criando o loop.

## Solucao

### 1. Remover a politica problematica
Eliminar a politica `"Business members can view their own business"` que causa a recursao.

### 2. Criar funcao SECURITY DEFINER
Criar uma funcao `is_business_member(business_id uuid)` com `SECURITY DEFINER` que ignora RLS ao consultar `business_users`. Isto quebra o ciclo de recursao.

```sql
CREATE OR REPLACE FUNCTION public.is_business_member(p_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM business_users
    WHERE business_id = p_business_id
    AND user_id = auth.uid()
  )
$$;
```

### 3. Recriar a politica usando a funcao
```sql
CREATE POLICY "Business members can view their own business"
ON businesses FOR SELECT TO authenticated
USING (public.is_business_member(id));
```

A funcao `SECURITY DEFINER` executa com permissoes do criador (superuser), ignorando as politicas RLS de `business_users` e eliminando a recursao.

## Ficheiros a Modificar

| Ficheiro | Alteracao |
|----------|-----------|
| Nova migracao SQL | Drop politica antiga, criar funcao SECURITY DEFINER, recriar politica |

Nenhum ficheiro de codigo precisa de ser alterado -- o hook `useBusinessMembership.ts` com fallback ja esta correto.

## Impacto
- Corrige imediatamente o erro 500 em todas as queries de negocios
- Restaura a visibilidade publica de todos os negocios ativos
- Mantem o acesso de donos a negocios inativos/pendentes
- Sem risco de seguranca: a funcao apenas verifica se o utilizador esta associado ao negocio
