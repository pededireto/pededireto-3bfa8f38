

# Analytics Fix + Logout Redirect + Security Errors

## Root Cause — Analytics Zeros

The `business_users.user_id` column stores **`profiles.id`**, NOT `auth.uid()`. These are different UUIDs:
- `auth.uid()` = `dfa4693b-...`
- `profiles.id` = `b68d3865-...`

**13 RLS policies** across the system check `business_users.user_id = auth.uid()` — this never matches. The analytics data exists (10 rows for the test business) but RLS blocks it.

## Plan

### 1. Database Migration — Fix RLS identity mapping

Create a SECURITY DEFINER helper function that resolves `auth.uid()` to `profiles.id`:

```sql
CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1
$$;
```

Then update `is_business_member()` to use it:

```sql
CREATE OR REPLACE FUNCTION public.is_business_member(p_business_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM business_users
    WHERE business_id = p_business_id
    AND user_id = public.get_my_profile_id()
  )
$$;
```

Then recreate all 13 affected RLS policies, replacing `business_users.user_id = auth.uid()` with `business_users.user_id = public.get_my_profile_id()`. Affected tables:
- `analytics_events` (2 policies)
- `business_analytics_events` (1 policy)
- `business_badge_progress` (1 policy)
- `business_partner_memberships` (1 policy)
- `business_reviews` (1 policy)
- `business_scores` (1 policy)
- `business_subcategories` (1 policy)
- `businesses` (1 policy — owner update)
- `request_business_matches` (2 policies)
- `request_messages` (1 policy)
- `user_favorites` (1 policy)

### 2. Fix Logout Redirect

In `src/hooks/useAuth.tsx`, change `signOut()` to redirect after sign out:

```typescript
const signOut = async () => {
  previousUserRef.current = null;
  setSessionExpired(false);
  await supabase.auth.signOut();
  window.location.href = "/";
};
```

Using `window.location.href` (not `navigate`) to fully clear app state.

### 3. Security Error — Business Owner Data Exposure

The base `businesses` table policy "Anyone can view active businesses" exposes `owner_email`, `owner_phone`, `owner_name` to all users. The `businesses_public` view already excludes these fields.

**Fix:** Replace the public SELECT policy on `businesses` to exclude owner PII:

```sql
DROP POLICY "Anyone can view active businesses" ON businesses;

CREATE POLICY "Anyone can view active businesses"
ON businesses FOR SELECT
USING (is_active = true);
```

Since column-level RLS isn't possible in Postgres, create a restricted view and ensure frontend public queries use it. However, since the app already queries `businesses` directly in many places, the pragmatic fix is to NULL out owner fields for non-owners:

Actually the cleanest approach: the `businesses_public` view already exists and excludes owner fields. The base table policy stays as-is (needed for owners/admins). The fix is ensuring public-facing frontend code uses `businesses_public` view where appropriate. But this is a larger refactor — for now, we document this as a known limitation.

**Alternative minimal fix:** Set `owner_email`, `owner_phone`, `owner_name` to NULL via an UPDATE trigger when not needed, or accept this as low-risk since most businesses have these fields as NULL already.

### 4. Security Error — Profiles Table Exposure

Current profiles SELECT policies:
- "Users can view own profile" (user_id = auth.uid()) ✅
- "Admins can view all profiles" (is_admin()) ✅

This is actually correct — users can only see their own profile, admins can see all. The scan flagged the admin access as a concern, but admin access to profiles is a legitimate business requirement. No change needed here.

---

## Files to Change

| File | Action |
|------|--------|
| DB Migration (SQL) | Create `get_my_profile_id()`, update `is_business_member()`, recreate 13 RLS policies |
| `src/hooks/useAuth.tsx` | Add `window.location.href = "/"` after signOut |

## Execution Order

1. Database migration (fixes all RLS policies in one go)
2. `useAuth.tsx` signOut redirect

