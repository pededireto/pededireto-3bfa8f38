

## Analysis of the Smart Search Engine

The search engine has 4 layers:
1. **Pattern Detection** - matches keywords against `pattern_keywords` table (needs score >= 3)
2. **Synonyms** - matches against `search_synonyms` table
3. **Direct Fallback** - searches subcategories, categories, business names/descriptions
4. **Urgency Detection** - flags urgent queries

### The Problem with "Tive um furo"

When a user types "tive um furo", the current flow:
1. Normalizes to `"tive um furo"`
2. Pattern Detection: probably no pattern configured for this, so skipped
3. Synonyms layer:
   - `stripIntent("tive um furo")` → **"tive um furo"** (unchanged, because "tive um" is NOT in the intent prefixes list)
   - `extractKeywords()` → `["tive", "furo"]` (removes "um" as stop word)
   - Builds candidates: `["tive um furo", "tive um furo", "tive furo", "tive", "furo"]`
   - Compares each candidate with **exact match** (`normalize(s.termo) === normalize(candidate)`)
   - Only matches if there's a synonym with termo = "furo" or termo = "tive um furo" exactly

**Two core problems:**
1. "tive um/uma" is missing from intent prefixes, so the phrase isn't stripped down to "furo"
2. Synonym matching is **exact only** — no partial/fuzzy matching for multi-word expressions
3. No way to map contextual phrases (like "tive um furo") to business categories in the admin

### Proposed Solution

#### 1. Expand Intent Prefixes
Add conversational prefixes to `INTENT_PREFIXES` in `useSmartSearch.ts`:
- "tive um", "tive uma", "tenho um", "tenho uma"
- "o meu ... não funciona" patterns
- "parti", "avariou", "estragou" style prefixes

This way "tive um furo" → strips to "furo", which can then match a synonym `furo → oficina`.

#### 2. Upgrade Synonym Matching to Partial/Contains
Change the synonym lookup from exact match to **contains** matching — if any synonym `termo` appears inside the query, it triggers. This handles phrases like "pneu furado" matching a synonym with termo "furo" or "furado".

```text
Current:  normalize(s.termo) === normalize(candidate)  // exact
Proposed: normalize(candidate).includes(normalize(s.termo)) || normalize(s.termo) === normalize(candidate)
```

With a priority for longer matches first (sort synonyms by `termo` length descending).

#### 3. Add "Expression Phrases" Support to Synonyms
Extend the `search_synonyms` table with an optional `type` column (`word` | `phrase`) so admins can create:
- **Word synonyms**: `furo → oficina`, `furado → oficina`
- **Phrase synonyms**: `tive um furo → oficina`, `pneu furado → oficina`

Phrase synonyms are checked against the full raw query before keyword extraction.

#### 4. Enhance Admin Synonyms Panel
Update `SynonymsContent.tsx` to:
- Add a "Type" selector (Word / Phrase) when creating synonyms
- Show type badge in the list
- Add bulk-add support for common expressions (e.g., add "furo", "furado", "pneu furado" all mapping to "oficina" at once)
- Add a "Test" input field where the admin can type a phrase and see which synonyms would match in real-time

#### 5. Pre-populate Common Expressions
Insert default synonym mappings for common Portuguese colloquial expressions:
- "furo" → "oficina"
- "furado" → "oficina"  
- "cano rebentou" → "canalizador"
- "fechadura partida" → "serralheiro"
- "curto circuito" → "eletricista"

### Files to Change

| File | Change |
|------|--------|
| `src/hooks/useSmartSearch.ts` | Add intent prefixes; upgrade synonym matching to partial + phrase-aware |
| `src/components/admin/SynonymsContent.tsx` | Add type selector, test field, bulk-add |
| Migration SQL | Add `type` column to `search_synonyms` (default: `'word'`) |

### Summary

The core fix is simple: add "tive um/uma" to intent prefixes so "tive um furo" strips to "furo", and upgrade synonym matching from exact to contains. The admin enhancements give you control to map any colloquial expression to the right business category.

