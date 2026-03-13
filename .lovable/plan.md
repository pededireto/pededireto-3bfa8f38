

## Plan: Marketing AI Studio — Fix 0 + Fix A + Melhoria C + Melhoria B

### Overview
Four changes in order: migrate to Gemini API direct, fix image compression, rebuild Image generator with full creative freedom, rebuild Reel generator without blocking steps.

### Pre-requisite: GEMINI_API_KEY Secret
Before deploying, you need to add the `GEMINI_API_KEY` secret. Get your API key from https://aistudio.google.com/apikey (requires Google Cloud billing — real cost under 10 euros/month). I'll prompt you to add it.

---

### Fix 0 — Migrate to Gemini API Direct

**File**: `supabase/functions/studio-generate/index.ts` (complete rewrite)

- Remove all references to `LOVABLE_API_KEY`, `ai.gateway.lovable.dev`, OpenAI-compatible format
- Add `callGemini()` function using native Gemini API (`generativelanguage.googleapis.com/v1beta`)
- Model: `gemini-2.5-flash` (fast, cheap, multimodal)
- Image sent as `inline_data` with `mime_type` + pure base64 (strip data URL prefix)
- Extract prompt builders into separate functions: `buildReelPrompt()`, `buildImagePrompt()`, `EXTRACT_PROFILE_PROMPT`
- Keep: `safeParseJSON`, CORS headers, JWT validation via `getClaims()`

### Fix A — Image Compression + Undefined Fixes

**File**: `src/pages/studio/StudioReelPage.tsx`

- Add `compressImage(file, maxWidth=1024, quality=0.8)` using canvas — reduces 5MB images to ~200KB JPEG
- All fields in edge function prompts get `|| 'não especificado'` fallbacks (no more "undefined" strings)
- Add logging: `console.log([studio-generate] action=..., imageSize=... chars)`

### Melhoria C — Image Generator: Total Creative Freedom

**File**: `src/pages/studio/StudioImagePage.tsx` (complete rewrite)

- `canGenerate = !generating` — zero required fields, always active
- New objective pills: Negócio, Produto, Evento, Pessoa/Equipa, Espaço, Outro
- New fields: `personagens`, `ambiente`, `proporcao` (9:16 / 1:1 / 16:9)
- All fields optional with helpful placeholders
- New `buildImagePrompt()` in edge function with creative mode when no context provided

### Melhoria B — Reel Generator: No Blocking

**File**: `src/pages/studio/StudioReelPage.tsx` (complete rewrite)

- Remove `stepsUnlocked`, `stepsDone` — no more locked steps
- **Step 1 (always visible)**: Objective pills (required) + description (optional) + image upload (required)
- **Step 2 (collapsible, closed by default)**: Business context — AI extraction OR manual fields, all optional
- **Step 3 (collapsible, closed by default)**: Tone & style with smart defaults per objective
- `canGenerate = imageBase64 && objectivo && !generating`
- Smart defaults: changing objective auto-updates toms and estilo (unless user manually changed them)
- New payload format with individual `tomExt1`...`tomExt5` fields + `objectivo` + `objectivoDescricao`

### Melhoria D — Multi-Category: DEFERRED

Create `docs/multi-category-plan.md` with the technical plan for future implementation.

---

### Files Changed

| File | Action |
|---|---|
| `supabase/functions/studio-generate/index.ts` | Complete rewrite — Gemini direct + new prompt builders |
| `src/pages/studio/StudioReelPage.tsx` | Complete rewrite — 3-step unblocked flow + compression |
| `src/pages/studio/StudioImagePage.tsx` | Complete rewrite — all optional + new fields |
| `docs/multi-category-plan.md` | New — deferred multi-category plan |

### Implementation Order
1. Add GEMINI_API_KEY secret
2. Rewrite edge function (Fix 0 + Fix A server-side)
3. Rewrite StudioImagePage (Melhoria C)
4. Rewrite StudioReelPage (Melhoria B + Fix A client-side)
5. Create multi-category plan doc

