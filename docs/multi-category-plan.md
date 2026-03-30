# Multi-Category Plan — Pede Direto

> Deferred from Marketing AI Studio sprint. To be implemented in a dedicated sprint.

## Current Schema

```sql
businesses.category_id UUID REFERENCES categories(id) -- single category
```

The `business_subcategories` junction table already supports multiple subcategories within ONE category.

## Proposed Schema

```sql
CREATE TABLE public.business_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, category_id)
);

-- Backfill existing data
INSERT INTO public.business_categories (business_id, category_id, is_primary)
SELECT id, category_id, true FROM businesses WHERE category_id IS NOT NULL;

-- RLS: same as businesses table
ALTER TABLE public.business_categories ENABLE ROW LEVEL SECURITY;
```

## Backward Compatibility

- Keep `businesses.category_id` as "primary category" for backward compat
- Add trigger: when `is_primary = true` is set in junction table, update `businesses.category_id`
- Max 3 categories per business (enforced via trigger)

## Files Affected (~24+)

### Frontend
- `src/pages/RegisterBusiness.tsx` — multi-category selector (max 3)
- `src/components/business/BusinessOwnerEditForm.tsx` — multi-category editor
- `src/hooks/useBusinessSubcategories.ts` — add `useBusinessCategories` hook

### Database Views & Functions
- Multiple views reference `businesses.category_id` in JOINs
- Search RPC functions filter by category_id
- Analytics aggregations group by category_id

### Admin
- `src/components/admin/BusinessesContent.tsx` — category filter
- Category analytics dashboards

## Risk Assessment

**HIGH** — This change touches search, analytics, SEO pages, admin panels, views, and ranking logic.
Should be implemented as a separate initiative with thorough testing.

## Recommended Approach

1. Create junction table with backfill migration
2. Add sync trigger (junction → businesses.category_id for primary)
3. Update RegisterBusiness form (max 3 categories)
4. Update BusinessOwnerEditForm
5. Update views one by one (test each)
6. Update search functions
7. Full regression test
