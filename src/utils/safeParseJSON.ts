/**
 * Parser robusto de JSON — trata newlines literais dentro de strings,
 * markdown code blocks e outros artefactos de LLMs.
 */
export function safeParseJSON(raw: string): any {
  let s = raw
    .replace(/```json[\s\S]*?```/g, (m) => m.replace(/```json|```/g, ""))
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ""))
    .trim();

  const i0 = s.indexOf("{");
  const i1 = s.lastIndexOf("}");
  if (i0 === -1 || i1 === -1) throw new Error("Sem JSON na resposta");

  s = s.slice(i0, i1 + 1);

  // Fix literal newlines inside JSON string values
  s = s.replace(/"((?:[^"\\]|\\.)*)"/g, (_match, inner) => {
    const fixed = inner
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t");
    return '"' + fixed + '"';
  });

  return JSON.parse(s);
}
