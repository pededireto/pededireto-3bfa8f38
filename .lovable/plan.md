

## Analysis Report

### PART 1 — BLOG

#### 1.1 — Current State

**Critical Bug Found**: The `/blog` route (listing page) is broken. `BlogPage.tsx` does NOT contain a listing — it's an exact copy of `BlogPostPage.tsx` (single-post view). Both files export `BlogPostPage`, both use `useParams<{ slug: string }>()`. When `/blog` loads, `slug` is `undefined`, so `useBlogPost(undefined)` is disabled, returns no data, and the page shows "Artigo não encontrado". **This is why the listing is blank** (as visible in the screenshot).

Files involved:
- `src/pages/BlogPage.tsx` — **BROKEN** (should be listing, is single-post copy)
- `src/pages/BlogPostPage.tsx` — Single post view (works correctly)
- `src/hooks/useBlogPosts.ts` — Hooks are correct (`is_published = true`, ordered by `published_at DESC`)
- `src/components/LatestBlogPosts.tsx` — Homepage widget (works, uses `useFeaturedBlogPosts`)

The `useBlogPosts` hook (listing) and `useBlogPost` (single) queries are correct. `increment_blog_views` RPC exists in types. Views increment on every page load (no deduplication — increments on reload).

#### 1.2 — Images

**BlogPostPage.tsx (line 129-131)**: Uses `object-cover` inside a fixed `h-64 md:h-80` container — this **crops** images.

**BlogPage.tsx**: Same issue (it's a copy). But since this file needs to be completely rewritten as a listing page, image treatment will be part of the new listing cards.

**LatestBlogPosts.tsx (line 40-47)**: Uses `aspect-video` with `object-cover` — also crops.

`cover_image_url` is a text field — likely external URLs or storage URLs. No standard format enforced.

#### 1.3 — Navigation (prev/next)

**Code exists but is NOT rendered**. Lines 70-72 in both files calculate `prevPost` and `nextPost`, and `relatedPosts` (line 73). But **zero JSX** renders them. The imports `ArrowLeft`, `ArrowRight` are imported but unused.

#### 1.4 — Additional

- **WhatsApp share**: Not implemented. Only "Copiar link" exists. `MessageCircle` is imported but unused.
- **JSON-LD**: Not implemented. Only basic OG meta tags exist.
- **Views**: Increments on every load without deduplication (no session/localStorage check).

---

### PART 2 — DASHBOARD NAVIGATION

#### 2.1 — Current State

Routes confirmed:
| Dashboard | Route | Access |
|---|---|---|
| Admin | `/admin` | `requireAdmin` (admin, super_admin) |
| CS | `/cs` | `requireCs` (cs, admin, super_admin) |
| Commercial | `/comercial` | `requireCommercial` (commercial, admin, super_admin) |
| Onboarding | `/onboarding` | `requireOnboarding` (onboarding, admin, super_admin) |

`ProtectedRoute` grants admin/super_admin access to ALL dashboards (lines 40, 52, 60, 68 check `isSuperAdmin` as fallback).

**AdminSidebar.tsx has NO links to CS, Commercial, or Onboarding.** The footer only has "Ver site público" and "Sair".

**CommercialSidebar.tsx has NO link back to Admin.**

Admin/SuperAdmin CAN access all dashboards by typing the URL — access control works. There's simply no navigation.

#### 2.2 — Recommendation

**Option A (Sidebar)** is the most consistent. The AdminSidebar already uses collapsible groups. Adding a "Dashboards Internos" group at the bottom (before the footer) with 3 external links (using `<Link>` with `<ExternalLink>` icon) is minimal code and follows the existing pattern. The other sidebars (CS, Commercial, Onboarding) should get a "Voltar ao Admin" link in their footer.

---

## Proposed Implementation Plan

### Blog Fix (3 files)

**1. Rewrite `BlogPage.tsx`** — Create a proper listing page:
- Hero section with title "Guias & Dicas"
- Category filter tabs (Todos, Serviços, Obras, Negócios, Dicas)
- Grid of post cards with: fixed 200px image container, `object-contain` on `bg-muted`, category badge, title, excerpt, read time
- Uses `useBlogPosts(category)` with state for selected category
- Helmet with SEO meta for `/blog`

**2. Fix `BlogPostPage.tsx`** — Add missing features:
- Image: change to `max-h-[400px]` container with `object-contain` and `bg-muted`
- Add prev/next navigation after the share section (the logic already exists, just needs JSX)
- Add WhatsApp share button
- Add JSON-LD `<script>` in Helmet
- Add related posts section (3 cards) below navigation
- Optional: deduplicate view increment with `sessionStorage`

**3. Fix `LatestBlogPosts.tsx`** — Change image from `object-cover` to `object-contain` with `bg-muted` background for consistency.

### Dashboard Navigation (4 files)

**4. `AdminSidebar.tsx`** — Add a "Dashboards Internos" group at the end of the sidebar nav (before footer) with 3 `<Link>` items to `/cs`, `/comercial`, `/onboarding`. Only visible for admin/super_admin (already available via `useAuth`).

**5-7. `CommercialSidebar.tsx`, CS sidebar, Onboarding sidebar** — Add "← Área Admin" link in footer section for users with admin/super_admin role.

### Complexity Estimate

| Task | Effort |
|---|---|
| Rewrite BlogPage.tsx (listing) | Medium — new component |
| Fix BlogPostPage.tsx (images, nav, share, JSON-LD) | Small-Medium |
| Fix LatestBlogPosts.tsx images | Trivial |
| AdminSidebar dashboard links | Small |
| Back-to-admin links in 3 sidebars | Small |

