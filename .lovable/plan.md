

## Plan: Ranking View in Admin & CS Business Tabs

### What exists now

- **Admin BusinessesContent.tsx** (717 lines): Table with columns Negócio, Categoria, Subcategoria, Cidade, Estado, Ações. No ranking_score column. Filters: search, category, status, city. No subcategory filter. No sort by ranking.
- **CS CsBusinesses.tsx** (384 lines): Card list with search and status filter (all/active/inactive/expired). No category/subcategory filters. No ranking info shown.
- Both components already load businesses with `ranking_score` available (from `useAllBusinesses` / the `businesses` prop which uses `SELECT *`).

### Plan

#### 1. Admin BusinessesContent — Add ranking view

**File**: `src/components/admin/BusinessesContent.tsx`

- Add a **toggle** at the top: `[Lista normal]` / `[🏆 Ranking]` — switches between current table and ranking-sorted view
- In ranking mode:
  - Sort businesses by `ranking_score` descending (nulls last)
  - Show position number (#1, #2, #3...) with medal icons for top 3
  - Add `ranking_score` column to the table
  - Add **subcategory filter** dropdown (populated from `allSubcategories`, filtered by selected category)
  - When category or subcategory is selected, positions recalculate within that filter (so #1 in "Canalizadores" is different from #1 overall)
- Keep all existing filters working alongside ranking view

#### 2. CS CsBusinesses — Add ranking + filters

**File**: `src/components/cs/CsBusinesses.tsx`

- Add **category** and **subcategory** filter dropdowns (using `useCategories` + `useAllSubcategories`)
- Add a **ranking toggle** similar to admin: when active, sorts by `ranking_score` desc and shows position badges
- Show `ranking_score` badge on each business card
- Subcategory filter needs to check `business_subcategories` junction table — but since we load all businesses client-side already, we can filter by `category_id` directly and for subcategory we need the junction data

#### 3. Subcategory filtering challenge

The `business_subcategories` junction table links businesses to subcategories, but the current `useAllBusinesses` query doesn't include this data. Two options:

**Option A (simpler, chosen)**: When a subcategory is selected, query `business_subcategories` for matching business IDs, then filter the already-loaded list client-side. Use a small helper hook.

**Option B**: Extend the `BUSINESS_SELECT` query — but this changes a shared constant affecting many components.

I'll go with **Option A**: a lightweight `useBusinessSubcategoryMap()` hook that loads all `business_subcategories` rows and builds a `Map<businessId, subcategoryId[]>`.

#### 4. New shared hook

**File**: `src/hooks/useBusinessSubcategoryMap.ts` (new)

```typescript
// Returns Map<businessId, subcategoryId[]> for client-side filtering
const { data: subMap } = useBusinessSubcategoryMap()
// Filter: subMap.get(business.id)?.includes(selectedSubcatId)
```

### Files changed

| File | Action |
|---|---|
| `src/hooks/useBusinessSubcategoryMap.ts` | New — loads junction data for filtering |
| `src/components/admin/BusinessesContent.tsx` | Add ranking toggle, position column, subcategory filter |
| `src/components/cs/CsBusinesses.tsx` | Add category/subcategory filters, ranking toggle + badges |

### Implementation order
1. Create `useBusinessSubcategoryMap` hook
2. Update Admin BusinessesContent with ranking view + subcategory filter
3. Update CS CsBusinesses with filters + ranking view

