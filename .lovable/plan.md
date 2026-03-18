
# Plan: Benchmarking Sectorial Z.AI + Bug Fixes

## Status: ✅ IMPLEMENTADO

### O que foi feito

1. **BUG 1a — Ícones removidos** — `StudioImagePage.tsx` SelectItem agora mostra apenas texto
2. **BUG 1b — Pré-preenchimento** — `useStudioContext()` preenche nome e sector quando negócio seleccionado muda
3. **BUG 2 — Notificações admin** — Trigger SQL `trg_notify_admin_new_user` na tabela `profiles` cria notificação em `internal_notifications` para admins. Realtime activado.
4. **Tabela `benchmarking_cache`** — category+subcategory unique, RLS para leitura pública, escrita via service_role
5. **Edge Function `get-benchmarking`** — Cache-first, fallback Z.AI API (glm-4-flash), upsert com renewed_by='lazy'
6. **Edge Function `renew-benchmarking-cache`** — Cron diário 03:00, renova populares (hit_count≥10), preload top 10 categorias se vazio, notifica admin de caches expiradas
7. **Hook `useBusinessBenchmarkSector`** — Lê category/subcategory do negócio, invoca edge function, retorna dados tipados + perfil digital
8. **Componente `SectorBenchmarkPanel`** — 5 blocos (Métricas, Posicionamento, Presença Digital, Keywords, Dica de Ouro) com skeleton + fallback
9. **Integração** — Panel adicionado ao `BusinessInsightsContent.tsx` para utilizadores PRO
