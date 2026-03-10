

## Analysis

The current `get_business_benchmark` RPC aggregates data across **all** subcategories of the business simultaneously (via `EXISTS ... IN (SELECT bs2.subcategory_id FROM business_subcategories bs2 WHERE bs2.business_id = b.id)`). Line 84 confirms it picks the **first** subcategory name by `created_at ASC LIMIT 1` for display. There's no way to filter by a single subcategory.

## Implementation Plan

### 1. New DB function: `get_business_benchmark_v2` (migration)

Create a new RPC with an additional optional parameter `p_subcategory_id uuid DEFAULT NULL`:
- When `p_subcategory_id IS NOT NULL`: all subcategory-related filtering uses only that single subcategory ID instead of all business subcategories
- When `NULL`: falls back to current behavior (all subcategories)
- The `subcategory_stats.name` returns the name of the selected subcategory
- Ranking comparisons scope to businesses that share that specific subcategory

This is a copy of `get_business_benchmark` with the CASE logic changed: when `p_subcategory_id` is provided, replace `EXISTS (... bs1.business_id = p_business_id AND bs1.subcategory_id IN (...))` with `EXISTS (SELECT 1 FROM business_subcategories bs2 WHERE bs2.business_id = b.id AND bs2.subcategory_id = p_subcategory_id)`.

### 2. Update `useBusinessBenchmark.ts`

Add optional `subcategoryId` parameter to the hook and pass it to the new RPC. Include it in the query key for proper caching per subcategory.

### 3. Modify `BusinessBenchmarkCard.tsx`

- Import `useBusinessSubcategoryIds` and `useAllSubcategories` to get the business's subcategory names
- Add `selectedSubcategoryId` state, defaulting to the first subcategory
- Render a `<Select>` dropdown at the top (only when business has 2+ subcategories)
- Pass `selectedSubcategoryId` to the benchmark hook
- All data (rankings, compare bars, suggestions) automatically re-render on change

### 4. Modify `BusinessInsightsContent.tsx`

Pass the selected subcategory down to `BenchmarkInsightsPanel` as well (it receives `benchmarkData` which will already be scoped by the hook).

### Files to modify

| File | Action |
|---|---|
| Migration SQL | New `get_business_benchmark_v2` function |
| `src/hooks/useBusinessBenchmark.ts` | Add `subcategoryId` param |
| `src/components/intelligence/BusinessBenchmarkCard.tsx` | Add subcategory dropdown + state |
| `src/components/business/BusinessInsightsContent.tsx` | Minor: pass subcategoryId to benchmark hook |

### UI Behavior

- **1 subcategory**: No dropdown shown, behaves exactly as today
- **2+ subcategories**: Dropdown appears below the "Benchmarking" header showing `{name}` for each
- Changing selection re-fetches benchmark data for that specific subcategory
- All insights, rankings, and compare bars update accordingly

