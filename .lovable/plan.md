

## Plano: Vídeos sempre em embed (nunca abrir nova janela por defeito)

### Problema identificado

Existem **dois sistemas separados** de rendering de vídeo na plataforma:

1. **`VideoPlayer.tsx`** (usado em BusinessPage e EmergencyLandingPage) — suporta YouTube, Vimeo, Facebook e ficheiros directos, mas faz fallback para **link externo** (abre nova janela) para URLs não reconhecidas ou Instagram.

2. **`BlockRenderer.tsx`** (usado nas páginas institucionais genéricas) — tem a sua própria função `getEmbedUrl()` que só suporta YouTube e Vimeo, e mostra "URL inválida" para tudo o resto.

O problema: URLs de vídeo válidas (ex: Facebook, ficheiros .mp4, ou até YouTube em formatos não cobertos) acabam a abrir em nova janela ou a falhar, em vez de serem embebidas inline.

### Solução

**Unificar todo o rendering de vídeo no componente `VideoPlayer`**, eliminando código duplicado:

| Ficheiro | Acção |
|---|---|
| `src/components/business/VideoPlayer.tsx` | Alterar o fallback "external": em vez de mostrar apenas um link, tentar primeiro um `<video>` tag genérico como último recurso antes do link externo. O link externo só aparece quando há erro real de carregamento. |
| `src/components/BlockRenderer.tsx` | Substituir o case `"video"` e a função `getEmbedUrl()` por uso directo do `VideoPlayer`, eliminando duplicação. |

### Detalhe das alterações

**VideoPlayer.tsx** — Melhorar fallback:
- Para URLs "external" (não reconhecidas), tentar renderizar com `<video>` tag primeiro
- Só mostrar link externo se o `<video>` falhar (onError)
- Instagram mantém link externo (não suporta embed de todo)

**BlockRenderer.tsx** — Unificar:
- Importar `VideoPlayer` de `@/components/business/VideoPlayer`
- No case `"video"`, renderizar `<VideoPlayer url={d.url} />` em vez de iframe manual
- Remover a função `getEmbedUrl()` (código morto)

### Resultado
- Vídeos ficam sempre embedded na página (YouTube, Vimeo, Facebook, MP4, WebM)
- Link externo só aparece como último recurso após falha real
- Um único componente para toda a plataforma — manutenção simplificada

