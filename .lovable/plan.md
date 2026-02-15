
# Fix: Claim Approval Errors and Business Dashboard Access

## Problems Found

1. **Duplicate database functions**: `admin_approve_claim` and `admin_revoke_claim` each have TWO versions in the database with different parameters. PostgreSQL treats these as overloaded functions, and the older versions insert into `admin_notifications` with types like `claim_approved` -- causing the "Invalid notification type: claim_approved" error shown in the screenshot.

2. **Parameter mismatch on reject**: The `admin_reject_claim` function expects `p_notes` but the frontend sends `p_admin_notes`, causing the reject action to fail.

3. **Super admin redirect blocks dashboard access**: `useSmartRedirect` always sends super_admins to `/admin`, making it impossible for `tresgate@gmail.com` (super_admin) to access `/business-dashboard` for debugging.

---

## Fix Plan

### 1. Database: Clean up duplicate RPCs

Drop the old versions (single-parameter) of `admin_approve_claim` and `admin_revoke_claim` that insert into `admin_notifications`. Keep only the newer versions that use `claim_audit_log` and `business_notifications`.

Also recreate `admin_reject_claim` with the correct parameter name (`p_admin_notes` instead of `p_notes`) and add audit logging + business notifications, matching the pattern of the approve function.

Similarly recreate `admin_revoke_claim` to be consistent.

### 2. Frontend: Fix `useSmartRedirect` for super_admin

Allow super_admins to access any dashboard (not just `/admin`). Only redirect if they're on a login page, not if they're already on a valid dashboard route.

### 3. Frontend: Fix `useClaimRequests` parameter names

Ensure `useRejectClaim` sends `p_admin_notes` (matching the updated RPC).

---

## Technical Details

| Component | Issue | Fix |
|-----------|-------|-----|
| DB: `admin_approve_claim(uuid)` | Old duplicate, inserts bad notification type | Drop this overload |
| DB: `admin_revoke_claim(uuid)` | Old duplicate, inserts bad notification type | Drop this overload |
| DB: `admin_reject_claim` | Parameter `p_notes` vs frontend `p_admin_notes` | Recreate with `p_admin_notes` |
| `useSmartRedirect.ts` | Super admin always forced to `/admin` | Allow navigation to other dashboards |
| `useClaimRequests.ts` | `useRejectClaim` sends wrong param name | Update to match new RPC |

### SQL Migration Summary

```text
-- Drop old overloads
DROP FUNCTION IF EXISTS public.admin_approve_claim(uuid);
DROP FUNCTION IF EXISTS public.admin_revoke_claim(uuid);

-- Recreate admin_reject_claim with correct param name + audit log
DROP FUNCTION IF EXISTS public.admin_reject_claim(uuid, text);
CREATE OR REPLACE FUNCTION public.admin_reject_claim(
  p_business_id uuid, p_admin_notes text
) RETURNS jsonb ...

-- Recreate admin_revoke_claim (clean single version)
DROP FUNCTION IF EXISTS public.admin_revoke_claim(uuid, text);
CREATE OR REPLACE FUNCTION public.admin_revoke_claim(
  p_business_id uuid, p_admin_notes text DEFAULT NULL
) RETURNS jsonb ...
```

### Frontend Changes

**`useSmartRedirect.ts`**: Super admins only redirect to `/admin` from login pages, not when already on valid routes like `/business-dashboard`.

**`useClaimRequests.ts`**: No changes needed -- it already sends `p_admin_notes` correctly. The reject hook sends `p_admin_notes` which will match after the RPC is fixed.
