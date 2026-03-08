

## Plano: Remover secção de cidades da CategoryPage

Mudança simples — remover da `CategoryPage.tsx`:

1. **Apagar** o hook `useCitiesForCategory` (linhas 24-50) — já não é usado
2. **Apagar** a chamada `const { data: cities = [] } = useCitiesForCategory(category?.id)` 
3. **Apagar** a secção "City Chips" no JSX (linhas 181-202)
4. **Remover** imports não utilizados: `Badge`, `useQuery`, `supabase`, `slugify`

Resultado: A página de categoria mostra apenas o header + grelha de subcategorias + navegação, sem chips de cidade (que agora só existem ao nível correcto — subcategoria).

