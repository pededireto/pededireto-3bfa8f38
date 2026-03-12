

## Plan: Fix JSON Parser + Add-on Management + Role-Based Access for Marketing AI Studio

### Problem Analysis

1. **JSON Parse Error**: The `safeParseJSON` regex-based approach fails on long prompts (>3000 chars) with literal newlines inside string values. The regex `/"((?:[^"\\]|\\.)*)"/g` can't handle all edge cases. Need a character-by-character parser.

2. **Hardcoded Categories/Subcategories**: The Studio uses a hardcoded `CATEGORIES` object instead of reading from the database (`categories` + `subcategories` tables).

3. **No Access Control**: Currently any authenticated user can access `/app/*`. Need role-based access:
   - **Admin**: Can see ALL businesses, select any to generate content for
   - **Business owners/affiliates**: Can only see/use their own businesses

4. **No Add-on Subscription Management**: No `business_addons` table exists. Admin needs to assign the "Marketing AI" add-on to businesses with activation date, duration, trial periods, and expiry alerts.

5. **Sidebar pill is static**: Shows "Trial 30 dias" hardcoded instead of reading actual subscription status.

---

### Implementation

#### Part 1 — Fix `safeParseJSON` (character-by-character parser)

Replace the regex approach in `src/utils/safeParseJSON.ts` with a char-by-char scanner that properly tracks `inString` and `escaped` states. This is the only reliable way to fix literal newlines inside long JSON string values.

#### Part 2 — Database: Create `business_addons` table

Migration to create:
```sql
CREATE TABLE public.business_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  addon_type text NOT NULL DEFAULT 'marketing_ai',
  activated_at date NOT NULL DEFAULT CURRENT_DATE,
  duration_months integer NOT NULL DEFAULT 1,
  expires_at date GENERATED ALWAYS AS (activated_at + (duration_months || ' months')::interval) STORED,
  is_trial boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
-- RLS: admin full access, business owners read own
```

#### Part 3 — Admin Panel: Add-on Manager

New component in admin sidebar (or inside BusinessModulesContent area) where admin can:
- Select a business from a searchable list
- Set activation date (calendar picker)
- Set duration in months (shows calculated end date)
- Toggle trial (15 days) vs paid subscription
- See list of all active add-ons with expiry status

#### Part 4 — Read Categories/Subcategories from DB

Replace the hardcoded `CATEGORIES` object in `StudioReelPage.tsx` with data from `useCategories()` and `useSubcategories(categoryId)` hooks that already exist.

#### Part 5 — Role-Based Business Selection in Studio

- Create `useStudioAccess` hook that:
  - Checks user roles (`useUserRoles`)
  - If admin → fetch ALL businesses
  - If business_owner → fetch only their businesses via `useBusinessMembership`
- Add a business selector dropdown at the top of the Studio (above the tools)
- When a business is selected, auto-populate Step 1 fields with business data (name, description, city, category, etc.)
- Check if selected business has active `business_addons` record for `marketing_ai`

#### Part 6 — Subscription Status in Sidebar

Replace the static "Trial 30 dias" pill with dynamic status reading from `business_addons`:
- Active trial: "⚡ Trial · X dias restantes"
- Active paid: "⚡ ADD-ON Activo · Expira DD/MM/YYYY"
- Near expiry (<7 days): Orange warning banner
- Expired: Red banner "Subscrição expirada — contactar Pede Direto"

---

### Files to Change

| File | Action |
|---|---|
| `src/utils/safeParseJSON.ts` | Replace with char-by-char parser |
| New migration SQL | Create `business_addons` table + RLS |
| `src/hooks/useBusinessAddons.ts` | New hook for CRUD on addons |
| `src/components/admin/BusinessAddonsManager.tsx` | New admin panel component |
| `src/pages/AdminPage.tsx` | Add addons tab to admin sidebar |
| `src/pages/studio/StudioReelPage.tsx` | Read categories from DB, add business selector |
| `src/pages/studio/StudioImagePage.tsx` | Similar business selector |
| `src/pages/studio/StudioLayout.tsx` | Add access check + business context |
| `src/components/studio/StudioSidebar.tsx` | Dynamic addon status pill |
| `src/hooks/useStudioAccess.ts` | New hook for role-based business access |

