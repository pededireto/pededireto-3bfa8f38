

## Analysis: Import/Export in Subcategory Relations vs Search Synonyms

### Current State: Subcategory Relations (Complete)

The Relations page has **3 fully working features**:

| Feature | How it works |
|---|---|
| **Descarregar Template** | Generates XLSX with 2 sheets: Sheet 1 = template with 3 example rows (`subcategoria_origem`, `subcategoria_sugerida`, `tipo`, `prioridade`); Sheet 2 = reference list of all active subcategories (Name, Category, Slug) sorted alphabetically |
| **Importar CSV/Excel** | 3-step modal: Upload (drag-drop, 5MB limit, Google Sheets instructions) → Preview (validates names via Levenshtein, checks duplicates, colour-coded rows) → Result (summary with auto-close). Uses `useBulkCreateSubcategoryRelations` with upsert |
| **Exportar CSV** | Exports all existing relations to `pededireto-relacoes-subcategorias-YYYY-MM-DD.xlsx` |

### Current State: Search Synonyms (Missing)

The Synonyms page has **zero import/export functionality**. It only has:
- Manual add (one at a time)
- Hardcoded bulk presets (4 fixed packages)
- Filter + delete

No template download, no CSV/Excel import, no export.

---

### Plan: Add Import/Export to Synonyms

Replicate the same pattern from Relations, adapted for the simpler synonym data structure.

**1. `src/hooks/useSearchSynonyms.ts`** — Add `useBulkCreateSearchSynonyms`
- Uses `.upsert(rows, { onConflict: 'termo,equivalente', ignoreDuplicates: true })`
- Returns `{ inserted, skipped }` via before/after count
- Invalidates `search-synonyms` query

**2. `src/components/admin/ImportSynonymsDialog.tsx`** — New component
- Same 3-step pattern as `ImportRelationsDialog`
- Upload: drag-drop, .csv/.xlsx, 5MB limit, Google Sheets instructions
- Preview: validates columns `termo`, `equivalente`, `tipo` (word/phrase); checks duplicates against existing synonyms; colour-coded rows (green/red/yellow)
- Result: summary with auto-close
- Simpler than Relations (no Levenshtein needed — synonyms are free-text, not matched against a reference list)

**3. `src/components/admin/SynonymsContent.tsx`** — Add 3 buttons
- **Descarregar Template**: XLSX with Sheet 1 = template with example rows (`termo`, `equivalente`, `tipo`); Sheet 2 = existing synonyms for reference
- **Importar CSV/Excel**: Opens `ImportSynonymsDialog`
- **Exportar CSV**: Exports all synonyms to `pededireto-sinonimos-pesquisa-YYYY-MM-DD.xlsx`
- Buttons placed in header area, same layout as Relations page

### Files to create/modify

| File | Action |
|---|---|
| `src/hooks/useSearchSynonyms.ts` | Add `useBulkCreateSearchSynonyms` hook |
| `src/components/admin/ImportSynonymsDialog.tsx` | New — 3-step import modal |
| `src/components/admin/SynonymsContent.tsx` | Add template/import/export buttons + import `xlsx` |

### Validation Rules (Import)

- `termo`: required, non-empty
- `equivalente`: required, non-empty
- `tipo`: must be `word` or `phrase` (default to `word` if missing)
- Duplicate check: against existing DB synonyms + within the file itself
- No name matching needed (unlike Relations, synonyms are arbitrary text)

### Template Format

```text
Sheet 1 "Template":
| termo           | equivalente  | tipo   |
|-----------------|-------------|--------|
| cano rebentou   | canalizador | phrase |
| electricista    | eletricista | word   |
| furo            | oficina     | word   |

Sheet 2 "Sinónimos Existentes":
| termo | equivalente | tipo |
| (all current synonyms for reference) |
```

### Complexity
Small-Medium — mostly adapting the existing Relations import pattern to a simpler data structure.

