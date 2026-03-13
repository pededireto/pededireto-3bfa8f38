

## Analysis Report: Highlights System + Image Issues

### Current State

**Highlights admin (FeaturedContent.tsx)** uses fields directly on the `businesses` table (`is_premium`, `premium_level`, `is_featured`, `display_order`) — it does NOT use the `business_highlights` table at all. This means:

1. Admin can toggle Super/Categoria/Subcategoria levels and reorder — this works
2. Admin can toggle "Destaques Gerais" — this works
3. The "Adicionar aos Destaques" section shows the **first 10 non-featured, non-premium active businesses** — arbitrary order, no ranking, no search, limited to 10

**Meanwhile**, the `business_highlights` table exists with proper `level`, `category_id`, `subcategory_id`, date ranges, etc. — but it's only used by `useBusinessHighlights.ts` hook which is NOT consumed by FeaturedContent.

### Problems Identified

1. **"Adicionar aos Destaques" shows arbitrary businesses** — just `.slice(0, 10)` of non-featured. Should show top-ranked businesses by `ranking_score` as suggestions, independent of category.

2. **No search in "Adicionar aos Destaques"** — admin can't find a specific business to promote.

3. **Image inconsistency in "Novos na Plataforma"** — uses `h-48 object-cover` which crops images. All other sections (BusinessCard, SuperHighlights) use `aspect-[4/3] bg-muted object-contain p-2` which preserves the full image with neutral background fill.

### Plan

#### 1. Fix "Novos na Plataforma" image display
**File**: `src/components/NewBusinessesBlock.tsx`
- Change the image container from `h-48 object-cover` to `aspect-[4/3] bg-muted object-contain p-2` — matching the pattern used in BusinessCard and SuperHighlightsSection.

#### 2. Improve "Adicionar aos Destaques" section
**File**: `src/components/admin/FeaturedContent.tsx`
- Replace the arbitrary `.slice(0, 10)` with businesses sorted by `ranking_score` descending (best first)
- Show more businesses (up to 20)
- Add a search input to filter by name
- Show the `ranking_score` next to each suggestion so admin sees why it's suggested
- Label the section as "Sugestões — Melhores da Plataforma" instead of "Adicionar aos Destaques"

#### Files changed: 2
- `src/components/NewBusinessesBlock.tsx` — image display fix
- `src/components/admin/FeaturedContent.tsx` — ranking-based suggestions + search

