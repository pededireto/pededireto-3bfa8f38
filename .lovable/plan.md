

## Plano: Landing Page "Pede Direto Business"

### Abordagem

Seguir exactamente o mesmo padrão da `ConsumersLandingPage.tsx`: criar um componente React dedicado `BusinessLandingPage.tsx` e detectar o slug `pedebusinesspaginaprincipal` no `InstitutionalPage.tsx`.

### Secções do componente (baseadas no HTML fornecido)

1. **Hero** — Título, subtítulo, CTA "Registar o meu negócio" (→ `/registar-negocio`), trust badges
2. **O Problema** — 3 cards (clientes que não chegam, publicidade cara, intermediários)
3. **Perfil Profissional** — 9 feature cards (contacto direto, visibilidade, galeria/vídeo, avaliações, ranking, badges, URL curta, gestão equipa, local/regional/nacional). Badges "Novo" onde indicado
4. **Pedidos de Orçamento** — 3 cards (matching automático, chat directo, tempo de resposta visível)
5. **Analytics & Inteligência** — 4 cards (Analytics PRO, Intelligence Center, exportação CSV, relatório semanal)
6. **Stats Bar** — 3 métricas (36%+ CTR, 3× mais contactos, 0€ comissões)
7. **Como Funciona** — 4 steps stepper (Reclama → Preenche → Aparece → Recebes contactos)
8. **Planos e Preços** — Resumo com link para `/pricing`
9. **FAQ** — 7 perguntas com Accordion
10. **CTA Final** — Bloco de conversão com checklist e dois botões

### Ficheiros a criar/editar

| Ficheiro | Acção |
|---|---|
| `src/components/BusinessLandingPage.tsx` | Criar — componente completo |
| `src/pages/InstitutionalPage.tsx` | Editar — adicionar detecção do slug `pedebusinesspaginaprincipal` |

### Detalhes técnicos

- Reutiliza os mesmos componentes UI (Card, Badge, Accordion, Button)
- Usa as CSS vars existentes (`--primary`, `--cta`, `section-hero`, dark mode automático)
- CTAs apontam para `/registar-negocio` e `/pricing`
- Mobile-first, 2 colunas mobile → 3 desktop nos grids
- SEO mantido via Helmet com dados da BD

