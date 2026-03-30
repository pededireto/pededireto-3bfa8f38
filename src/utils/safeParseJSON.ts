/**
 * Parser robusto de JSON — percorre caracter a caracter para
 * escapar newlines literais dentro de strings JSON,
 * markdown code blocks e outros artefactos de LLMs.
 */
export function safeParseJSON(raw: string): any {
  // Remove markdown fences
  let s = raw
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();

  // Extract JSON object
  const i0 = s.indexOf("{");
  const i1 = s.lastIndexOf("}");
  if (i0 === -1 || i1 === -1) throw new Error("Sem JSON na resposta");
  s = s.slice(i0, i1 + 1);

  // Fix unescaped newlines, tabs and carriage returns inside JSON string values
  // Character-by-character scanner — the only reliable approach for long LLM output
  let result = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < s.length; i++) {
    const char = s[i];

    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      result += char;
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }

    if (inString) {
      if (char === "\n") { result += "\\n"; continue; }
      if (char === "\r") { result += "\\r"; continue; }
      if (char === "\t") { result += "\\t"; continue; }
    }

    result += char;
  }

  return JSON.parse(result);
}
