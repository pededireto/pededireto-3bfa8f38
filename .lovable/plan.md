

# Fix: Business Owner Redirect After Claim Approval

## Root Cause

The user `tabernadoborges@gmail.com` was approved as owner of "Sanipol Canalizacao" but **has no row in `business_users`**. The database confirms:

- `businesses.claim_status = 'verified'` (approved)
- `businesses.claim_requested_by` is set
- `business_users` table: **EMPTY** for this user/business combo

This means the claim was approved but the `admin_approve_claim` function did an `UPDATE` on a `business_users` row that didn't exist (0 rows matched). The `claim_business` RPC does insert a `pending_owner` row, but if the claim was submitted before that RPC existed, or the insert failed silently, the row is missing -- and the approve function silently updates nothing.

## Why the User Lands on /dashboard

The `get_user_context` RPC checks `business_users` to find the user's business. No row = no business = consumer = `/dashboard`.

## Fix Plan

### 1. Database: Make `admin_approve_claim` resilient (INSERT if UPDATE matches 0 rows)

After the `UPDATE business_users SET role = 'owner'`, check if the row was actually updated. If not, INSERT a new row as `owner` directly. This prevents this problem from ever happening again.

```text
UPDATE business_users SET role = 'owner'
WHERE business_id = p_business_id 
  AND user_id = v_claim_user 
  AND role = 'pending_owner';

-- If no pending_owner row existed, create the owner row
IF NOT FOUND THEN
  INSERT INTO business_users (business_id, user_id, role)
  VALUES (p_business_id, v_claim_user, 'owner')
  ON CONFLICT (business_id, user_id) DO UPDATE SET role = 'owner';
END IF;
```

### 2. Database: Fix the existing data for Sanipol

Insert the missing `business_users` row for `tabernadoborges@gmail.com` as `owner` of "Sanipol Canalizacao".

### 3. Frontend: Make UserDashboard redirect more robust

The `UserDashboard` page already has a redirect to `/business-dashboard` if `membership?.business_id` exists. This will work once the database row is fixed. No frontend changes needed.

## Technical Summary

| Item | Action |
|------|--------|
| Migration: Fix `admin_approve_claim` | Add INSERT fallback when UPDATE matches 0 rows |
| Data fix: Sanipol | Insert `business_users` row (user `18a487de...`, business `5adab599...`, role `owner`) |
| Frontend | No changes needed -- redirect logic already correct |

## Expected Result

After the fix:
- `tabernadoborges@gmail.com` logs in
- `get_user_context` finds the `business_users` row, returns `business_id`
- `useSmartRedirect` sends user to `/business-dashboard`
- Future claim approvals will always create the `business_users` row, even if the pending_owner row was missing

