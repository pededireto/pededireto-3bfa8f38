

# Embed de Vídeo + Fix Subcategorias Admin

## 1. VideoPlayer.tsx — Suporte Facebook/Vimeo/Instagram

**Ficheiro**: `src/components/business/VideoPlayer.tsx`

Substituir conteudo completo com versao melhorada:
- Tipo de retorno de `getEmbedInfo` passa a incluir `"vimeo" | "facebook"`
- Vimeo retorna `type: "vimeo"` (nao `"youtube"`)
- Facebook detecta `facebook.com` e `fb.watch`, usa API oficial `facebook.com/plugins/video.php`
- Instagram detecta e faz fallback para link externo (Instagram bloqueia embeds)
- Render: YouTube/Vimeo partilham iframe, Facebook tem iframe proprio (476px altura), directo usa `<video>`, externo/erro usa link

## 2. BusinessPage.tsx — Remover getYouTubeEmbedUrl

**Ficheiro**: `src/pages/BusinessPage.tsx`

- Remover a funcao `getYouTubeEmbedUrl` (linhas 327-330) — ja nao e usada, o VideoPlayer trata tudo
- Nada mais a alterar — o import de VideoPlayer e a chamada `<VideoPlayer url={v.value} label={mod.label} />` ja existem

## 3. Fix Subcategorias — useSmartSearch.ts

**Ficheiro**: `src/hooks/useSmartSearch.ts` (linhas 355-364)

Substituir a query que usa `.eq("subcategory_id", subId)` na tabela `businesses` por um lookup via junction table:

```typescript
// ANTES:
.from("businesses")
.eq("subcategory_id", subId)

// DEPOIS:
// 1. Buscar business_ids da junction table
const { data: junctionData } = await supabase
  .from("business_subcategories")
  .select("business_id")
  .eq("subcategory_id", subId);

const businessIds = (junctionData || []).map(j => j.business_id);

// 2. Buscar businesses por ids
if (businessIds.length > 0) {
  const { data: biz } = await supabase
    .from("businesses")
    .select("id, name, slug, city, logo_url, subscription_plan, is_premium, categories(name, slug), subcategories(name, slug)")
    .eq("is_active", true)
    .in("id", businessIds)
    .order("is_premium", { ascending: false })
    .limit(30);
}
```

## 4. Fix Subcategorias — ServiceRequestsContent.tsx

**Ficheiro**: `src/components/admin/ServiceRequestsContent.tsx` (linhas 60-68)

Substituir `.eq("subcategory_id", selectedRequest.subcategory_id)` por lookup via junction:

```typescript
// Se ha subcategory_id, buscar business_ids da junction table primeiro
if (selectedRequest.subcategory_id) {
  const { data: jData } = await supabase
    .from("business_subcategories")
    .select("business_id")
    .eq("subcategory_id", selectedRequest.subcategory_id);
  const bIds = (jData || []).map(j => j.business_id);
  if (bIds.length > 0) {
    query = query.in("id", bIds);
  }
}
```

## 5. useBusinessHighlights.ts — Manter como esta

A query em `useBusinessHighlights.ts` filtra a tabela `business_highlights` pelo seu proprio `subcategory_id` — nao e a tabela `businesses`. Nao precisa de correcao.

---

## Ficheiros a alterar

| Ficheiro | Accao |
|----------|-------|
| `src/components/business/VideoPlayer.tsx` | Reescrever com Facebook/Vimeo/Instagram |
| `src/pages/BusinessPage.tsx` | Remover `getYouTubeEmbedUrl` (4 linhas) |
| `src/hooks/useSmartSearch.ts` | Junction table lookup para subcategorias |
| `src/components/admin/ServiceRequestsContent.tsx` | Junction table lookup para subcategorias |

