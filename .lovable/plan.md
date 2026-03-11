

## Analysis of Current State

### What exists:
1. **Affiliate Portal** (`AffiliatePortalContent.tsx`) — only accessible inside the Commercial dashboard (`/comercial` → tab "affiliates")
2. **AddLeadModal** — simple form with 6 fields (business_name, phone, email, website, city, notes). **Not connected** to the existing business creation flow (`RegisterBusiness.tsx` / `BusinessOwnerEditForm.tsx`)
3. **Header** — no reference to the affiliate program anywhere
4. **Consumer Dashboard** (`/dashboard`) — no affiliate tab
5. **Business Dashboard** (`/business-dashboard`) — no affiliate tab
6. **No public landing page** for the affiliate program

### What's missing (per user request):
- **Public landing page** promoting the affiliate program with active campaign display and CTA to register
- **Affiliate tab** in Consumer Dashboard
- **Affiliate tab** in Business Dashboard
- **Back-to-profile button** from affiliate portal
- **Lead creation connected to business creation flow** — the "Nova Lead" should use the full "Ficha de Cliente" form (Identidade, Presença Pública, Horários, Presença Digital with plan rules, Dados Legais with mandatory Nome do Responsável + Telefone)

---

## Implementation Plan

### 1. Public Affiliate Landing Page (`/afiliados`)

New file: `src/pages/AffiliateLandingPage.tsx`

- Hero section with program explanation and benefits
- Active campaign banner (reuse `ActiveCampaignBanner`, or show "no campaign" state)
- How it works (3 steps: Regista-te → Indica negócios → Ganha comissões)
- CTA buttons: "Criar conta como Consumidor" → `/registar/consumidor`, "Registar Negócio" → `/register/business`
- If user already logged in: CTA changes to "Aceder ao Portal de Afiliados" → `/dashboard` (or `/business-dashboard`)
- Add route in `App.tsx`

### 2. Header Update

`src/components/Header.tsx` — add "Afiliados" link in desktop and mobile nav, positioned before "Registar Negócio"

### 3. Consumer Dashboard — Affiliate Tab

`src/pages/UserDashboard.tsx`:
- Add new tab "Afiliados" (with Handshake icon) to the existing `TabsList`
- Tab content renders `AffiliatePortalContent`
- Add "Voltar ao Perfil" button inside AffiliatePortalContent when rendered from dashboards

### 4. Business Dashboard — Affiliate Tab

`src/pages/BusinessDashboard.tsx` + `src/components/business/BusinessSidebar.tsx`:
- Add "Afiliados" to the sidebar items (new `BusinessTab` value: `"affiliates"`)
- Render `AffiliatePortalContent` when active

### 5. Back-to-Profile Navigation

`src/components/affiliate/AffiliatePortalContent.tsx`:
- Accept optional prop `showBackButton?: boolean` and `backTo?: string`
- Render a "← Voltar ao meu perfil" link at the top when `showBackButton` is true

### 6. Lead Creation → Full Business Form (Major Change)

This is the biggest piece. Currently `AddLeadModal` is a simple 6-field form. The user wants it to match the "Ficha de Cliente" structure from `BusinessOwnerEditForm.tsx`.

**Approach**: Replace `AddLeadModal` with a new `AddLeadFullModal` that uses a multi-section form mirroring the existing business form structure:

- **Identidade do Negócio** (required): Nome, Categoria, Subcategorias, Cidade, Telefone
- **Presença Pública** (Free/START fields): Morada, descrição curta, logo
- **Horários** (Free/START fields): Horário semana/fim-de-semana
- **Presença Digital** (PRO fields — visible but locked if lead has no paid plan): Website, Instagram, Facebook, vídeo — follows plan rules (can fill but only Free-tier content is shown publicly until plan activation)
- **Dados Legais e Administrativos**: Nome do Responsável (mandatory), Telefone do Responsável (mandatory), Email, NIF — rest optional

**Flow**:
1. Affiliate fills the form
2. Duplicate check runs (phone/email/website)
3. If no duplicate → create the business via `register_business_with_owner` RPC or a new simplified RPC (since the affiliate is NOT the owner — the business is created as inactive lead)
4. The `affiliate_leads` record is created with `business_id` pointing to the new business
5. Business is created with `status = 'inactive'` and `source = 'affiliate'`

**Important**: The affiliate is NOT the owner. The business is created as an inactive listing (lead) that can later be claimed or activated when the real owner subscribes.

**New file**: `src/components/affiliate/AddLeadFullModal.tsx` — large dialog/sheet with collapsible sections matching the Ficha de Cliente layout.

**Modified**: `src/hooks/useAffiliateLeads.ts` — update `useCreateAffiliateLead` to also create the business record and link `business_id`.

### 7. Route Registration

`src/App.tsx`: Add `/afiliados` route (public, no auth required)

### Files Summary

| File | Action |
|---|---|
| `src/pages/AffiliateLandingPage.tsx` | **New** — public landing page |
| `src/components/Header.tsx` | Add "Afiliados" nav link |
| `src/pages/UserDashboard.tsx` | Add Afiliados tab |
| `src/pages/BusinessDashboard.tsx` | Add affiliates to renderContent |
| `src/components/business/BusinessSidebar.tsx` | Add "Afiliados" sidebar item |
| `src/components/affiliate/AffiliatePortalContent.tsx` | Add back-button prop |
| `src/components/affiliate/AddLeadFullModal.tsx` | **New** — full business form for lead creation |
| `src/hooks/useAffiliateLeads.ts` | Update create lead to also create business |
| `src/App.tsx` | Add `/afiliados` route |

### Complexity: Medium-High
The landing page, dashboard tabs, and navigation are straightforward. The full business form for lead creation is the complex part — it needs to mirror `BusinessOwnerEditForm` sections while creating an inactive business + affiliate lead atomically.

