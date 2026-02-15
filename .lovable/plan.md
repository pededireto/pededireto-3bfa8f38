

# Fix Analytics Architecture

## Summary

The analytics system is broken due to event type mismatches in the database RPC, missing RLS policies for business owners, and an unused empty table. This fix will make business owners see their real stats.

## What Will Change

### For Business Owners
- The dashboard overview will show real **Views** and **Contacts** counts from the last 30 days
- The Insights page (paid plans) will show correct trend charts with real data instead of zeros

### For Admins
- No changes needed -- admin analytics already work via the existing `is_admin()` RLS policy

---

## Technical Changes

### 1. Database Migration

**Fix the `get_business_intelligence` RPC** to use correct event types:
- `impression` changed to `view`
- `click` changed to `event_type LIKE 'click_%'`
- `search` changed to query from `search_logs` table (which has the actual search data)

**Add RLS policy on `analytics_events`** for business owners:
```
Policy: "Business owners can view own analytics"
ON analytics_events FOR SELECT TO authenticated
USING (
  business_id IN (
    SELECT business_id FROM business_users
    WHERE user_id = auth.uid()
  )
)
```

**Drop the empty `business_analytics_events` table** (0 rows, unused).

### 2. New Hook: `useBusinessAnalytics`

A lightweight hook that queries `analytics_events` directly (RLS filters automatically) to return:
- Total views (last 30 days)
- Total contacts (all click types combined)
- Breakdown by click type (WhatsApp, phone, website, email)

This works for ALL verified owners regardless of plan (basic visibility).

### 3. Update `BusinessDashboardOverview.tsx`

Add two new cards to the overview grid:
- **Visualizacoes** -- total page views in last 30 days
- **Contactos** -- total clicks (phone + WhatsApp + website + email) in last 30 days

The grid changes from 4 columns to 6 (or wraps on mobile).

### 4. Update `BusinessInsightsContent.tsx`

The "basic access" section (free plan) will show real numbers from the new hook instead of dashes, giving free-plan owners actual basic stats while keeping the Pro analytics (trends, CTR, position) behind the paywall.

---

## Files Changed

| File | Action |
|------|--------|
| `supabase/migrations/...` | New migration: fix RPC, add RLS, drop unused table |
| `src/hooks/useBusinessAnalytics.ts` | **New file**: lightweight analytics hook |
| `src/components/business/BusinessDashboardOverview.tsx` | Add Views + Contacts cards |
| `src/components/business/BusinessInsightsContent.tsx` | Show real basic stats for free plans |

## Data Flow After Fix

```text
BusinessPage visit -> INSERT analytics_events (event_type='view')
Contact click      -> INSERT analytics_events (event_type='click_phone', etc.)
                              |
               +--------------+--------------+
               |                             |
         Admin Dashboard              Business Dashboard
         RLS: is_admin()              RLS: business_id IN (my businesses)
         Sees ALL events              Sees OWN events only
```

