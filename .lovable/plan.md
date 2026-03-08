

# Plan: SEO, Social Proof, Newsletter & Sticky Search

## 1. Ratings on Business Cards

### Data layer
Add `business_review_stats(average_rating, total_reviews)` to the select queries.

**`src/hooks/useBusinesses.ts`**: Update `BUSINESS_SELECT` and `BusinessWithCategory` interface to include `business_review_stats`.

**`src/hooks/usePublicBusinesses.ts`**: Update `PUBLIC_SELECT` and `PublicBusinessWithCategory` interface similarly.

**`src/components/BusinessCard.tsx`**: After the location row (before CTAs), render star rating when `total_reviews > 0`. Five stars filled proportionally to `average_rating`, rating value, and count in parentheses. Yellow (#f59e0b) filled stars using `Star` from lucide-react with `fill` prop.

---

## 2. Newsletter in Footer

### Database migration
Create `newsletter_subscribers` table with `id`, `email` (unique), `source`, `created_at`, `is_active`. RLS: anyone can insert, admins can select via `has_role()`.

**`src/components/Footer.tsx`**: Add newsletter section before the copyright row. Email input + "Subscrever" button. On submit, insert with `onConflict: 'email'` to handle duplicates silently. Show success message after submit.

---

## 3. Sticky Search Bar

**New file: `src/components/StickySearch.tsx`**: Compact search bar that appears fixed at top when `window.scrollY > 300`. Uses `useSearch` hook, navigates to `/pesquisa?q=...` on submit. Slide-in animation via Tailwind. Only rendered on Index page.

**`src/pages/Index.tsx`**: Import and render `<StickySearch />`.

---

## 4. Sitemap Fix (404)

The edge function already exists and generates valid XML. The 404 happens because there's no redirect from `/sitemap.xml` to the edge function.

**Solution**: Create `public/_redirects` with:
```
/sitemap.xml  https://mpnizkjntkutpxevqzxx.supabase.co/functions/v1/sitemap  200
```

Also update the edge function to add blog posts query (`blog_posts` where `is_published = true`) and add `/blog` as a static page.

**`public/robots.txt`**: Already correct, no changes needed.

---

## Implementation order
1. Ratings (data join + card UI)
2. Newsletter (migration + footer)
3. Sticky search (frontend only)
4. Sitemap (redirect file + edge function update)

