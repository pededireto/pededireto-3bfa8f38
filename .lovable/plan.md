

## Implementação: Import/Export em massa de relações entre subcategorias

### Ficheiros a criar/modificar

**1. `src/hooks/useSubcategoryRelations.ts`** — Adicionar `useBulkCreateSubcategoryRelations`
- Usa `.upsert(rows, { onConflict: 'subcategory_id,related_subcategory_id', ignoreDuplicates: true })`
- Retorna `{ inserted, skipped }` comparando count antes/depois
- Invalida query `subcategory-relations` no sucesso

**2. `src/components/admin/ImportRelationsDialog.tsx`** — NOVO
- Modal 3 passos: Upload → Preview com validação → Resultado
- Upload: drag-and-drop ou file picker, .csv/.xlsx, limite 5MB, mostra nome do ficheiro
- Preview: tabela com scroll, cores por estado (verde/vermelho/amarelo), coluna "Sugestão" para nomes não encontrados, contadores no topo, scroll automático ao primeiro erro
- Matching de nomes: normalização (lowercase, sem acentos, trim), sugestão do mais parecido via distância de Levenshtein simplificada
- Validação: tipo in `['suggestion','complement','alternative']`, prioridade 1-10, duplicados internos + contra BD
- Resultado: summary com auto-close 3s ou botão Fechar, invalidação automática da query
- Info box colapsável com instruções Google Sheets

**3. `src/components/admin/SubcategoryRelationsContent.tsx`** — Modificar
- 3 botões novos no header: "Descarregar Template", "Importar CSV/Excel", "Exportar CSV"
- Template XLSX: Sheet 1 com headers + 3 exemplos, Sheet 2 com todas subcategorias (Nome, Categoria, Slug) ordenadas por Categoria ASC, Nome ASC
- Export: ficheiro `pededireto-relacoes-subcategorias-YYYY-MM-DD.xlsx` com relações actuais
- Usa biblioteca `xlsx` já instalada no projecto

### Dependências
- `xlsx` — já instalada, sem adições necessárias

