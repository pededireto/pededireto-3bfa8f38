/**
 * Extracts a human-readable error message from Supabase/PostgrestError objects.
 * Prioritises: details → hint → message → fallback.
 */
export function formatSupabaseError(error: any, fallback = "Erro desconhecido"): string {
  const detail =
    error?.details || error?.hint || error?.message || fallback;
  const code = error?.code ? ` (${error.code})` : "";
  return `${detail}${code}`;
}
