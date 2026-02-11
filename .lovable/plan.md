
## Correcao de contraste do hero em Dark Mode

### Problema
A classe `.section-hero` aplica `var(--gradient-hero)` como fundo, mas este gradiente so tem valores claros (light green). Em Dark Mode, o texto claro fica invisivel sobre fundo claro.

### Solucao
Adicionar um override de `--gradient-hero` dentro do bloco `.dark` no `src/index.css`, usando tons escuros consistentes com o design system existente.

### Alteracao

**Ficheiro:** `src/index.css`

No bloco `.dark` (que ja existe), adicionar:

```css
--gradient-hero: linear-gradient(180deg, hsl(150 20% 8%) 0%, hsl(150 15% 10%) 100%);
```

Isto cria um fundo ligeiramente mais claro que o `--background` do dark mode (`150 20% 6%`), mantendo a distincao visual entre a zona hero e o resto da pagina, sem alterar mais nenhum ficheiro.

### Impacto
- Afeta todas as paginas que usam `section-hero`: Index (HeroSection), CategoryPage, SubcategoryPage
- Nao altera cores de texto, icones, ou qualquer outro componente
- Retrocompativel — Light Mode permanece inalterado
