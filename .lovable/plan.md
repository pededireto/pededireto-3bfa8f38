

# Plan: Logo + Consumer Dashboard Review Feedback

## Task 1 — Add PedeDireto Logo Image Everywhere

Copy the uploaded logo to `src/assets/pede-direto-logo.png`, then replace all text-only "Pede Direto" brand references with the logo image.

### Files to modify (logo replacement):

**All locations use the same pattern**: replace the text `<span/h1>Pede Direto</span/h1>` with `<img src={logo} alt="Pede Direto" className="h-8" />` (size varies by context).

| File | Location | Logo size |
|------|----------|-----------|
| `src/components/Header.tsx` | Line 33-35 (desktop brand link) | h-8 |
| `src/components/Footer.tsx` | Line 65-67 (footer brand) | h-8 |
| `src/components/admin/AdminSidebar.tsx` | Line 233-234 (sidebar brand) | h-8 |
| `src/components/business/BusinessSidebar.tsx` | Line 115-116 (sidebar brand) | h-8 |
| `src/components/commercial/CommercialSidebar.tsx` | Line 41-42 (sidebar brand) | h-8 |
| `src/pages/AdminPage.tsx` | Line 118 (mobile header) | h-7 |
| `src/pages/BusinessDashboard.tsx` | Line 79 (mobile header) | h-7 |
| `src/pages/CommercialPage.tsx` | Line 54 (mobile header) | h-7 |
| `src/pages/CustomerSuccessPage.tsx` | CS header area | h-8 |
| `src/pages/UserLogin.tsx` | Line 94-95 (login form) | h-10 |
| `src/pages/AdminLogin.tsx` | Line 87-88 | h-10 |
| `src/pages/UserRegister.tsx` | Line 98-99 | h-10 |
| `src/pages/AdminRegister.tsx` | Line 81-82 | h-10 |
| `src/pages/RegisterChoice.tsx` | Line 12-13 | h-10 |
| `src/pages/ForgotPassword.tsx` | Line 48-49 | h-10 |
| `src/pages/ResetPassword.tsx` | Line 80-81 | h-10 |
| `src/pages/ClaimBusiness.tsx` | Line 201-202 | h-10 |

Each file will import the logo: `import logo from "@/assets/pede-direto-logo.png";`

---

## Task 2 — Review Feedback on Consumer Dashboard Requests

### Data model understanding
- `business_reviews` links via `business_id` + `user_id` (no `request_id`)
- `request_business_matches` links `request_id` to `business_id`
- So for each request, we find matched businesses, then check if the consumer left a review for any of those businesses

### New hook: `useConsumerRequestReviews`

In `src/hooks/useServiceRequests.ts`, add a new hook that:
1. Takes the list of request IDs
2. For each request, gets the matched business IDs from `request_business_matches`
3. Fetches the user's reviews from `business_reviews` where `user_id = auth.uid()`
4. Returns a map: `Record<requestId, { rating: number, businessResponse: string | null, businessResponseAt: string | null, businessName: string }[]>`

Implementation approach — a single query that:
```typescript
// 1. Get all matches for the user's requests
const { data: matches } = await supabase
  .from("request_business_matches")
  .select("request_id, business_id, businesses(name)")
  .in("request_id", requestIds);

// 2. Get all reviews by this user
const { data: reviews } = await supabase
  .from("business_reviews")
  .select("business_id, rating, business_response, business_response_at")
  .eq("user_id", userId);

// 3. Cross-reference: for each match, find if there's a review
```

### UI changes in `src/pages/UserDashboard.tsx`

In the request card (lines 281-346), after the status Badge, add:

1. **If user reviewed a matched business**: Show a gold badge `★ X.X Avaliado`
2. **If business responded**: Show a small notification line below with the business response text (collapsible), similar to how it appears in the business dashboard screenshot (green "A sua resposta:" block)

Visual design:
- Badge: `<Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">★ {rating} Avaliado</Badge>`
- Response block: A small card with "O negócio respondeu à sua avaliação" header and the response text below, styled like the business dashboard review cards

