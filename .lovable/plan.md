

# Correcção de 4 Bugs Independentes

## Bug 1 — Banner "É o proprietário" aparece em negócios reclamados

**Causa raiz:** A `BusinessPage.tsx` usa `usePublicBusiness` que lê da view `businesses_public`. Esta view **não inclui** as colunas `is_claimed` nem `claim_status`. Logo, `(business as any).is_claimed` é sempre `undefined` (falsy) e `(business as any).claim_status` nunca é `"verified"`, fazendo o banner aparecer sempre.

**Correcção:**
1. Alterar a view `businesses_public` via migração SQL para incluir `claim_status` (sem expor PII)
2. Actualizar a condição no `BusinessPage.tsx` (linha 494) para: `(business as any).claim_status !== 'verified'`
3. Actualizar o tipo `PublicBusiness` em `usePublicBusinesses.ts` para incluir `claim_status`

---

## Bug 2 — Pesquisa autocomplete: relevância invertida

**Causa raiz:** Em `useSearch.ts` linha 33, a ordenação `(a, b) => a.relevance - b.relevance` é ascendente. A RPC `search_businesses_and_subcategories` usa relevância 1 = melhor match, então a ordenação ascendente está **correcta**. No entanto, o limite `slice(0, 10)` pode cortar resultados legítimos. O autocomplete parece funcional — a questão pode ser que os dados não estão na DB ou o RPC não devolve resultados por causa de RLS na tabela `businesses` que bloqueia `anon` SELECT.

**Investigação adicional:** A migration anterior bloqueou `anon` SELECT na tabela `businesses` com `USING (false)`. O RPC `search_businesses_and_subcategories` é `SECURITY INVOKER` por defeito, logo quando executado por utilizadores anónimos, a query interna `FROM businesses b WHERE b.is_active = true` devolve **zero linhas** porque o RLS bloqueia.

**Correcção:** Recriar a função `search_businesses_and_subcategories` com `SECURITY DEFINER` para que possa ler a tabela `businesses` internamente, mantendo a segurança (a função só devolve nome, slug e categoria — sem PII).

---

## Bug 3 — Negócios desaparecem no mobile (e possivelmente desktop)

**Causa raiz:** Mesmo problema do Bug 2. A view `businesses_public` e os hooks `usePublicBusinesses` fazem queries à view que internamente acede à tabela `businesses`. Se o RLS da tabela base bloqueia `anon` SELECT com `USING (false)`, a view (que tem `security_invoker=on`) também devolve zero linhas para utilizadores não autenticados.

**Correcção:** Na mesma migração, garantir que a política RLS da tabela `businesses` permite SELECT via view `businesses_public`. Opções:
- Adicionar uma policy que permita SELECT para `anon` apenas das colunas expostas na view (não é possível por coluna em RLS)
- **Melhor opção:** Remover a policy `USING (false)` e substituir por uma que permita SELECT de linhas `is_active = true` (a view já filtra isso). A PII continua protegida porque a view não expõe essas colunas, e o acesso directo à tabela por API está bloqueado pela view ser o ponto de entrada.

Nota: o scan de segurança anterior adicionou `USING (false)` para proteger PII, mas isso quebrou o acesso público legítimo. A solução correcta é permitir SELECT público com `is_active = true` e confiar na view para esconder PII.

---

## Bug 4 — Templates de mensagem: "Erro ao criar template"

**Causa raiz:** A tabela `message_templates` **não existe** na base de dados. O código tenta inserir nela e falha.

**Correcção:** Criar migração SQL com a tabela `message_templates`:
- Colunas: `id` (uuid PK), `name` (text NOT NULL), `message_type` (text NOT NULL), `subcategory` (text), `content` (text NOT NULL), `created_at`, `updated_at`
- RLS habilitado com policies para admin/staff

---

## Resumo de Alterações

| Bug | Ficheiro(s) | Tipo |
|-----|-------------|------|
| 1 | Migração SQL + `BusinessPage.tsx` + `usePublicBusinesses.ts` | View + condição |
| 2 | Migração SQL (recriar RPC como SECURITY DEFINER) | RLS/RPC fix |
| 3 | Migração SQL (policy businesses SELECT) | RLS fix |
| 4 | Migração SQL (criar tabela message_templates) | Tabela nova |

Todos os fixes na mesma migração SQL. Código frontend alterado em 2 ficheiros apenas.

