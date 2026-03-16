
# Plan: Gerador de Imagem via Base de Dados

## Status: ✅ IMPLEMENTADO

### O que foi feito

1. **Tabela `image_prompts_library`** — Já existia com 95 templates activos cobrindo 24 categorias × 4 estilos
2. **Hook `useImageLookup`** — Query directa à BD com filtro progressivo (categoria+estilo+proporcao → relaxação), substituição de placeholders `{{nome}}` etc., incremento de `usage_count`
3. **`StudioImagePage.tsx`** — Substituída chamada ao Gemini por lookup à BD, adicionado selector de categoria, botão "Usar no Reel", badge do template usado
4. **`StudioTopbar.tsx`** — Badge condicional: "📚 Biblioteca Curada" em `/app/image`, "IA · Gemini Pro" em `/app/reel`

### Não tocado
- `studio-generate` Edge Function
- `StudioReelPage.tsx`
- `useStudioGenerate.ts`
