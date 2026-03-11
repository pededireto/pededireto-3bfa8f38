

## Bug Analysis

### Issue 1: "column `status` of relation `businesses` does not exist"

The RPC `create_affiliate_lead_with_business` tries to INSERT into columns that **don't exist** in the `businesses` table:
- `status` → should be `is_active` (boolean, use `false` instead of `'inactive'`)
- `source` → should be `registration_source`
- `is_verified` → column doesn't exist at all (remove it)

**Fix**: New migration to recreate the RPC with correct column names.

### Issue 2: Affiliate referral persistence & account creation

Currently `sessionStorage` loses the ref code when the tab closes. The user wants persistence until:
- The visitor closes the browser/session
- The visitor creates a business account or claims a business

**Changes needed**:
- Move from `sessionStorage` to `localStorage` for `affiliate_ref` (survives tab closes)
- When a business is registered (`RegisterBusiness.tsx`) or claimed (`ClaimBusiness.tsx`), read the stored `affiliate_ref` code, resolve it to an `affiliate_id`, and create an `affiliate_leads` record linking the affiliate to the new business
- Clear `affiliate_ref` from localStorage after consumption
- For **claims** specifically: instead of auto-creating a lead, send an alert to the admin (insert into `platform_alerts` or a notifications table) flagging the claim as potentially affiliate-sourced, for manual review

### Issue 3: Auto-create consumer account for the lead's business owner

The user wants the RPC to also create an auth account (email + password `123456789p`) and assign `business_owner` role. This is complex and has security implications — Supabase auth account creation from an RPC requires `supabase_admin` role or an Edge Function using the service role key.

**Approach**: Skip auto-account creation in the RPC (it can't create auth users). Instead, the lead form's success screen will show the share link. The business owner will self-register when they visit the link. The affiliate tracking via `localStorage` will ensure attribution.

---

## Implementation Plan

### Part 1: Fix the RPC (Database Migration)

New migration to `DROP` and recreate `create_affiliate_lead_with_business` with correct column mapping:

```sql
INSERT INTO businesses (
  name, slug, city, cta_phone, cta_email, cta_website,
  category_id, subcategory_id, description, public_address,
  schedule_weekdays, schedule_weekend, instagram_url, facebook_url,
  other_social_url, owner_name, owner_phone, owner_email, nif,
  is_active, registration_source, logo_url
) VALUES (
  ..., false, 'affiliate', p_logo_url
)
```

### Part 2: Upgrade referral persistence

**`src/App.tsx`** — Change `sessionStorage` to `localStorage` in `ReferralTracker`.

**`src/pages/RegisterBusiness.tsx`** — After successful business registration:
1. Read `affiliate_ref` from `localStorage`
2. If present, call an RPC `link_affiliate_referral` that resolves the code to an affiliate, creates the `affiliate_leads` record, and inserts fingerprints
3. Clear `localStorage` item

**`src/pages/ClaimBusiness.tsx`** — After successful claim:
1. Read `affiliate_ref` from `localStorage`
2. If present, insert a `platform_alerts` record (or use existing notifications) flagging: "Claim via affiliate referral PD-XXXX — review needed"
3. Clear `localStorage` item

### Part 3: New RPC `link_affiliate_referral`

Database function that:
- Takes `p_ref_code text`, `p_business_id uuid`
- Looks up `affiliate_codes` to find the `affiliate_id`
- Creates an `affiliate_leads` record with `source = 'referral_link'`
- Creates fingerprints if applicable

### Part 4: Claim alert for admin

Database function or direct insert into `platform_alerts`:
- `alert_type = 'affiliate_claim_review'`
- Contains the affiliate code, business name, claimant info
- Admin can review and manually approve/reject the affiliate commission

---

## Files to Change

| File | Action |
|---|---|
| New migration SQL | Fix RPC + create `link_affiliate_referral` |
| `src/App.tsx` | `sessionStorage` → `localStorage` |
| `src/pages/RegisterBusiness.tsx` | Call `link_affiliate_referral` after registration |
| `src/pages/ClaimBusiness.tsx` | Create admin alert on claim with affiliate ref |

