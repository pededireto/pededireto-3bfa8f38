

# Plano: Proteger /pedir-servico + Imagem de fundo no Hero

## 1. Proteger a rota /pedir-servico (apenas utilizadores autenticados)

**Problema**: A rota está acessível a qualquer visitante.

**Solução**: Em `src/App.tsx`, envolver `<RequestServicePage />` com `<ProtectedRoute>` (sem flags de role — apenas `user` obrigatório). Contudo, o `ProtectedRoute` actual redireciona para `/admin/login` quando não há sessão, o que não faz sentido para consumidores.

**Alterações**:
- **`src/components/ProtectedRoute.tsx`**: Adicionar prop opcional `redirectTo` (default: `/admin/login` para manter retrocompatibilidade). Quando `!user`, redireciona para o valor de `redirectTo`.
- **`src/App.tsx`**: Alterar a rota `/pedir-servico` para:
  ```
  <ProtectedRoute redirectTo="/login">
    <RequestServicePage />
  </ProtectedRoute>
  ```
  Isto garante que visitantes não autenticados são enviados para `/login` (a página de login de consumidores) em vez de `/admin/login`, e o `state.from` preserva o caminho para redirecionamento pós-login.

## 2. Opção "Imagem de fundo" no bloco Hero

**Problema**: Actualmente o Hero só suporta imagem ao lado (coluna direita) ou vídeo. O utilizador quer uma terceira opção: imagem de fundo full-width com texto e pesquisa sobrepostos.

**Alterações**:

### `src/components/admin/homepage-blocks/HeroBlockForm.tsx`
- Adicionar nova opção no Select de `media_type`:
  - `"background_image"` — "Imagem de fundo (texto sobreposto)"
- Quando `media_type === "background_image"`, mostrar campo URL da imagem + campo opcional de opacidade do overlay (slider 0–90%, default 50%).

### `src/components/HeroSection.tsx`
- Actualizar `HeroConfig` interface: adicionar `"background_image"` ao tipo `media_type` e campo `overlay_opacity?: number`.
- Quando `mediaType === "background_image"`:
  - A section usa a imagem como `background-image` com `background-size: cover` e `background-position: center`.
  - Adiciona overlay escuro semi-transparente (opacidade configurável) para garantir legibilidade.
  - O layout muda de `grid-cols-2` para coluna única centrada (sem painel direito).
  - O texto, badges, barra de pesquisa e CTAs ficam todos sobrepostos, centrados.
  - Cores do texto ajustadas para branco/claro sobre fundo escuro.

### Detalhes técnicos do layout "background_image"
```text
┌──────────────────────────────────────────────────┐
│  [background-image: cover]                       │
│  [overlay div: bg-black/50]                      │
│                                                  │
│        [badge]                                   │
│        [título - branco]                         │
│        [subtítulo - branco/80]                   │
│        [barra de pesquisa - centralizada]        │
│        [trust badges]                            │
│        [CTAs]                                    │
│                                                  │
└──────────────────────────────────────────────────┘
```

## Ficheiros a alterar
1. `src/components/ProtectedRoute.tsx` — prop `redirectTo`
2. `src/App.tsx` — envolver `/pedir-servico` com `ProtectedRoute`
3. `src/components/admin/homepage-blocks/HeroBlockForm.tsx` — nova opção `background_image`
4. `src/components/HeroSection.tsx` — renderização condicional para imagem de fundo

## Impacto
- Nenhuma migração de DB necessária
- Nenhuma alteração nos outros blocos
- Retrocompatível: blocos Hero existentes continuam a funcionar sem mudanças

