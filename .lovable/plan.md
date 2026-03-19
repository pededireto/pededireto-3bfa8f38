

## Plano: Selector de Subcategoria no Benchmarking Sectorial + Fix Deploy

### Dois problemas a resolver

| Problema | Causa | Impacto |
|----------|-------|---------|
| Deploy bloqueado | View `profiles_with_confirmation` no LIVE DB referencia `auth.users` — o diff tool da Lovable Cloud crashha antes de aplicar migrações | Crítico |
| Benchmarking mostra só 1 subcategoria | O hook escolhe automaticamente uma subcategoria e não permite trocar | UX |

---

### Fix 1 — Desbloquear Deploy

**Ficheiro:** Nova migration SQL

A migration actual (20260319005135) faz `DROP VIEW + CREATE VIEW` — mas o diff tool crashha ao tentar comparar a versão LIVE (que referencia `auth.users`) ANTES de aplicar a migration.

**Solução:** Alterar a migration para apenas fazer `DROP VIEW IF EXISTS public.profiles_with_confirmation` — sem a recriar. Nenhum ficheiro `.ts/.tsx` do projecto usa esta view. A coluna `email_confirmed_at` no `profiles` pode ficar.

---

### Fix 2 — Selector de Subcategoria no SectorBenchmarkPanel

**Hook `useBusinessBenchmarkSector.ts`:**
- Adicionar parâmetro `selectedSubcategory?: string` (nome da subcategoria)
- Quando definido, usar essa subcategoria em vez da automática
- A query key do segundo `useQuery` passa a incluir a subcategoria seleccionada

**Componente `SectorBenchmarkPanel.tsx`:**
- Adicionar estado local `selectedSub` (string)
- No header, ao lado do badge actual, renderizar um `Select` com todas as subcategorias do `allSubcategories`
- Quando o utilizador muda, actualiza `selectedSub` e o hook re-fetcha dados da nova subcategoria
- Manter a subcategoria automática como default

---

### Ficheiros a alterar

| Ficheiro | Acção |
|----------|-------|
| Migration SQL (nova ou edição da existente) | DROP view sem recriar |
| `src/hooks/useBusinessBenchmarkSector.ts` | Aceitar subcategoria seleccionada |
| `src/components/intelligence/SectorBenchmarkPanel.tsx` | Adicionar Select para trocar subcategoria |

---

### Detalhes técnicos

**Migration SQL:**
```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_confirmed_at timestamptz;
DROP VIEW IF EXISTS public.profiles_with_confirmation;
-- NÃO recria a view
```

**Hook — mudança na assinatura:**
```typescript
export const useBusinessBenchmarkSector = (
  businessId: string | null | undefined,
  selectedSubcategory?: string  // nome da subcategoria
)
```

Quando `selectedSubcategory` é fornecido, encontra a categoria correspondente em `allSubcategories` e usa-a em vez da lógica automática de cache-first.

**Componente — Select no header:**
```text
┌──────────────────────────────────────────────┐
│ 📈 Benchmarking do Sector  [Software & SaaS ▼]  │
│                                              │
│  ┌─ Dropdown ──────────────┐                 │
│  │ Software & SaaS    ✓    │                 │
│  │ Consultoria             │                 │
│  │ Marketing Digital       │                 │
│  └─────────────────────────┘                 │
└──────────────────────────────────────────────┘
```

O Select só aparece se `allSubcategories.length > 1`.

