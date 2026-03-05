

# Blog / Guias & Dicas — Implementation Plan

## Overview

Create a full blog system with public pages, admin CMS, and seed content. This involves a database migration, 4 new files, and edits to 5 existing files.

## 1. Database Migration

Create `blog_posts` table with all specified columns, indexes, RLS policies (public read for published, admin full access), the `increment_blog_views` RPC function, and INSERT the 3 seed articles provided in the prompt.

## 2. New Files

### `src/hooks/useBlogPosts.ts`
- `useBlogPosts(category?)` — fetch published posts, optional category filter, ordered by `published_at DESC`, staleTime 10min
- `useBlogPost(slug)` — fetch single post by slug (include `?preview=true` support for admins via `is_admin` check)
- `useFeaturedBlogPosts(limit=3)` — fetch latest published posts for homepage block
- `useAdminBlogPosts()` — fetch ALL posts (published + drafts) for admin panel
- CRUD mutations: `useCreateBlogPost`, `useUpdateBlogPost`, `useDeleteBlogPost`

### `src/pages/BlogPage.tsx`
- SEO helmet, Header, Footer
- Hero section with title "Guias & Dicas"
- Category filter tabs: Todos | Serviços | Obras | Negócios | Dicas
- Responsive grid of article cards (cover image, category badge, title, excerpt, author, date, read time)
- Simple pagination (10 per page)

### `src/pages/BlogPostPage.tsx`
- Helmet with full SEO meta tags + JSON-LD Article schema
- Breadcrumb navigation
- Cover image, H1 title, author/date/read time/views meta
- Content rendered with basic markdown support (headings, bold, lists, links — no new dependency, use simple regex-based rendering)
- Share buttons (WhatsApp, Facebook, copy link)
- Related articles sidebar (desktop) — same category
- Previous/next article navigation
- View count increment via RPC on mount

### `src/components/admin/BlogContent.tsx`
- Posts table with columns: title, category badge, status badge, published date, views, featured star, actions
- "Novo Artigo" button
- Create/Edit dialog with all form fields organized in sections (Content, Media, Organization, Author, SEO, Publication)
- Auto-generated slug from title with manual override
- Slug uniqueness check before save
- Publish/unpublish toggle, delete with confirmation
- Preview button opens `/blog/:slug?preview=true` in new tab

## 3. Modified Files

### `src/components/admin/AdminSidebar.tsx`
- Add `"blog"` to `AdminTab` type
- Add `{ id: "blog", label: "Blog", icon: BookOpen }` to group 6 (Conteúdo), after "Homepage"
- Note: `BookOpen` is already imported

### `src/pages/AdminPage.tsx`
- Import `BlogContent`
- Add `if (activeTab === "blog") return <BlogContent />;` to `renderContent()`

### `src/components/Header.tsx`
- Add "Blog" link (`/blog`) in desktop and mobile nav, before "Registar Negócio"

### `src/components/Footer.tsx`
- Add "Guias & Dicas" link (`/blog`) in the Navegação list

### `src/App.tsx`
- Import `BlogPage` and `BlogPostPage`
- Add routes: `/blog` and `/blog/:slug` in public section

## 4. Homepage Blog Section

Create `src/components/LatestBlogPosts.tsx` — shows 3 latest published posts in horizontal cards with "Ver todos os artigos" CTA. Only renders if posts exist.

Add to `Index.tsx` after the existing content blocks (before Footer).

## Technical Notes

- No new npm dependencies — markdown rendering uses a simple custom renderer (regex for `##`, `**`, `-`, links)
- Category badge colors: servicos=blue, obras=orange, negocios=green, dicas=purple, outros=gray
- Dates formatted with `toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" })`
- All queries use `staleTime: 10 * 60 * 1000`

