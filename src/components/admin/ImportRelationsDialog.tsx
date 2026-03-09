import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { useBulkCreateSubcategoryRelations, SubcategoryRelation } from "@/hooks/useSubcategoryRelations";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, Info, ChevronDown, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";

interface SubInfo {
  id: string;
  name: string;
  slug: string;
  categoryName: string;
}

interface ParsedRow {
  origin: string;
  target: string;
  type: string;
  priority: number | null;
  // Resolved
  originId: string | null;
  targetId: string | null;
  status: "ok" | "error" | "duplicate";
  errors: string[];
  suggestion?: string;
  targetSuggestion?: string;
}

const VALID_TYPES = ["suggestion", "complement", "alternative"];

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function levenshtein(a: string, b: string): number {
  const an = a.length, bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix: number[][] = [];
  for (let i = 0; i <= an; i++) { matrix[i] = [i]; }
  for (let j = 0; j <= bn; j++) { matrix[0][j] = j; }
  for (let i = 1; i <= an; i++) {
    for (let j = 1; j <= bn; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return matrix[an][bn];
}

function findBestMatch(name: string, subs: SubInfo[]): string | undefined {
  const norm = normalize(name);
  let best: SubInfo | undefined;
  let bestDist = Infinity;
  for (const s of subs) {
    const d = levenshtein(norm, normalize(s.name));
    if (d < bestDist) { bestDist = d; best = s; }
  }
  if (best && bestDist <= Math.max(3, Math.floor(name.length * 0.4))) {
    return best.name;
  }
  return undefined;
}

function matchSub(name: string, subs: SubInfo[], normMap: Map<string, SubInfo>): SubInfo | null {
  // Exact (case-insensitive)
  const exact = subs.find(s => s.name.toLowerCase().trim() === name.toLowerCase().trim());
  if (exact) return exact;
  // Normalized
  const norm = normalize(name);
  const found = normMap.get(norm);
  if (found) return found;
  return null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allSubs: SubInfo[];
  existingRelations: SubcategoryRelation[];
}

type Step = "upload" | "preview" | "result";

const ImportRelationsDialog = ({ open, onOpenChange, allSubs, existingRelations }: Props) => {
  const { toast } = useToast();
  const bulkCreate = useBulkCreateSubcategoryRelations();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [result, setResult] = useState<{ inserted: number; skipped: number; errors: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const errorRowRef = useRef<HTMLTableRowElement>(null);

  // Build normalized map
  const normMap = new Map<string, SubInfo>();
  allSubs.forEach(s => normMap.set(normalize(s.name), s));

  // Existing pairs set
  const existingPairs = new Set(existingRelations.map(r => `${r.subcategory_id}::${r.related_subcategory_id}`));

  const resetState = () => {
    setStep("upload");
    setFileName("");
    setRows([]);
    setResult(null);
  };

  useEffect(() => {
    if (!open) resetState();
  }, [open]);

  const validateRows = useCallback((rawRows: any[]) => {
    const seenPairs = new Set<string>();
    const parsed: ParsedRow[] = rawRows.map(r => {
      const origin = String(r.subcategoria_origem ?? r["subcategoria_origem"] ?? "").trim();
      const target = String(r.subcategoria_sugerida ?? r["subcategoria_sugerida"] ?? "").trim();
      const type = String(r.tipo ?? r["tipo"] ?? "").trim().toLowerCase();
      const prioRaw = r.prioridade ?? r["prioridade"];
      const priority = Number(prioRaw);
      const errors: string[] = [];
      let suggestion: string | undefined;
      let targetSuggestion: string | undefined;

      if (!origin) { errors.push("Origem em falta"); }
      if (!target) { errors.push("Sugerida em falta"); }

      const originSub = origin ? matchSub(origin, allSubs, normMap) : null;
      const targetSub = target ? matchSub(target, allSubs, normMap) : null;

      if (origin && !originSub) {
        suggestion = findBestMatch(origin, allSubs);
        errors.push(suggestion ? `Origem não encontrada → '${suggestion}'?` : "Origem não encontrada");
      }
      if (target && !targetSub) {
        targetSuggestion = findBestMatch(target, allSubs);
        errors.push(targetSuggestion ? `Sugerida não encontrada → '${targetSuggestion}'?` : "Sugerida não encontrada");
      }

      if (!VALID_TYPES.includes(type)) {
        errors.push(`Tipo inválido: '${type}'`);
      }
      if (isNaN(priority) || priority < 1 || priority > 10 || !Number.isInteger(priority)) {
        errors.push("Prioridade deve ser 1-10");
      }

      if (originSub && targetSub && originSub.id === targetSub.id) {
        errors.push("Origem e sugerida são iguais");
      }

      // Check duplicates
      let isDuplicate = false;
      if (originSub && targetSub && errors.length === 0) {
        const pairKey = `${originSub.id}::${targetSub.id}`;
        if (existingPairs.has(pairKey) || seenPairs.has(pairKey)) {
          isDuplicate = true;
        }
        seenPairs.add(pairKey);
      }

      const status: ParsedRow["status"] = errors.length > 0 ? "error" : isDuplicate ? "duplicate" : "ok";

      return {
        origin, target, type, priority: isNaN(priority) ? null : priority,
        originId: originSub?.id ?? null, targetId: targetSub?.id ?? null,
        status, errors, suggestion, targetSuggestion,
      };
    });
    return parsed;
  }, [allSubs, normMap, existingPairs]);

  const processFile = useCallback((file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Ficheiro demasiado grande (máx 5MB)", variant: "destructive" });
      return;
    }
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        if (json.length === 0) {
          toast({ title: "Ficheiro vazio ou sem dados", variant: "destructive" });
          return;
        }
        const validated = validateRows(json);
        setRows(validated);
        setStep("preview");
      } catch {
        toast({ title: "Erro ao ler ficheiro", variant: "destructive" });
      }
    };
    reader.readAsArrayBuffer(file);
  }, [validateRows, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const validRows = rows.filter(r => r.status === "ok");
  const errorRows = rows.filter(r => r.status === "error");
  const duplicateRows = rows.filter(r => r.status === "duplicate");

  const handleImport = async () => {
    const toInsert = validRows.map(r => ({
      subcategory_id: r.originId!,
      related_subcategory_id: r.targetId!,
      relation_type: r.type,
      priority: r.priority!,
    }));
    try {
      const res = await bulkCreate.mutateAsync(toInsert);
      setResult({ inserted: res.inserted, skipped: res.skipped, errors: errorRows.length });
      setStep("result");
      // Auto-close after 5s
      setTimeout(() => onOpenChange(false), 5000);
    } catch (e: any) {
      toast({ title: "Erro ao importar", description: e.message, variant: "destructive" });
    }
  };

  // Scroll to first error
  useEffect(() => {
    if (step === "preview" && errorRowRef.current) {
      errorRowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [step]);

  const rowBg = (status: ParsedRow["status"]) => {
    if (status === "ok") return "bg-green-50 dark:bg-green-950/20";
    if (status === "error") return "bg-red-50 dark:bg-red-950/20";
    return "bg-amber-50 dark:bg-amber-950/20";
  };

  const statusIcon = (status: ParsedRow["status"]) => {
    if (status === "ok") return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (status === "error") return <XCircle className="h-4 w-4 text-destructive" />;
    return <AlertTriangle className="h-4 w-4 text-amber-600" />;
  };

  let firstErrorIdx = -1;
  if (step === "preview") {
    firstErrorIdx = rows.findIndex(r => r.status === "error");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Relações via CSV/Excel</DialogTitle>
          <DialogDescription>Importe relações entre subcategorias em massa.</DialogDescription>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium text-foreground">Arraste o ficheiro aqui ou clique para seleccionar</p>
              <p className="text-sm text-muted-foreground mt-1">Formatos: .csv, .xlsx — Máximo 5MB</p>
              {fileName && (
                <div className="mt-3 flex items-center justify-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">{fileName}</span>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
            <p className="text-xs text-muted-foreground">
              Formato esperado: <code className="bg-muted px-1 rounded">subcategoria_origem, subcategoria_sugerida, tipo, prioridade</code>
            </p>

            {/* Google Sheets instructions */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground gap-2">
                  <Info className="h-4 w-4" />
                  💡 Como usar com Google Sheets
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="bg-muted/50 rounded-lg p-4 mt-2 text-sm space-y-1">
                <p>1. Descarregue o template (botão "Descarregar Template")</p>
                <p>2. Abra no Google Sheets (Ficheiro → Importar → Upload)</p>
                <p>3. Preencha as relações usando os nomes exactos da aba "Subcategorias"</p>
                <p>4. Exporte como CSV (Ficheiro → Transferir → CSV)</p>
                <p>5. Importe aqui</p>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === "preview" && (
          <div className="flex flex-col gap-3 min-h-0 flex-1">
            {/* Counters */}
            <div className="flex gap-3 flex-wrap">
              <Badge variant="outline" className="gap-1 text-green-700 border-green-300 bg-green-50 dark:bg-green-950/30">
                <CheckCircle2 className="h-3.5 w-3.5" /> {validRows.length} válidas
              </Badge>
              <Badge variant="outline" className="gap-1 text-red-700 border-red-300 bg-red-50 dark:bg-red-950/30">
                <XCircle className="h-3.5 w-3.5" /> {errorRows.length} erros
              </Badge>
              <Badge variant="outline" className="gap-1 text-amber-700 border-amber-300 bg-amber-50 dark:bg-amber-950/30">
                <AlertTriangle className="h-3.5 w-3.5" /> {duplicateRows.length} duplicados
              </Badge>
            </div>

            {/* Table */}
            <div className="overflow-auto border rounded-lg max-h-[45vh]">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">#</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Origem</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Sugerida</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Tipo</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Prio</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={i}
                      ref={i === firstErrorIdx ? errorRowRef : undefined}
                      className={`border-t ${rowBg(row.status)}`}
                    >
                      <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-2">{row.origin}</td>
                      <td className="px-3 py-2">{row.target}</td>
                      <td className="px-3 py-2 capitalize">{row.type}</td>
                      <td className="px-3 py-2">{row.priority ?? "—"}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-start gap-1.5">
                          {statusIcon(row.status)}
                          <div className="text-xs">
                            {row.status === "ok" && "OK"}
                            {row.status === "duplicate" && "Duplicado"}
                            {row.status === "error" && row.errors.map((e, j) => (
                              <p key={j} className="text-destructive">{e}</p>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setStep("upload")}>Voltar</Button>
              <Button
                onClick={handleImport}
                disabled={validRows.length === 0 || bulkCreate.isPending}
              >
                {bulkCreate.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Importar apenas as válidas ({validRows.length})
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Result */}
        {step === "result" && result && (
          <div className="space-y-4 text-center py-4">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
            <div className="space-y-1">
              <p className="text-lg font-semibold text-foreground">Importação concluída</p>
              <p className="text-sm text-green-700">✅ {result.inserted} relações importadas com sucesso</p>
              {result.skipped > 0 && <p className="text-sm text-amber-700">⚠️ {result.skipped} duplicados ignorados pelo sistema</p>}
              {result.errors > 0 && <p className="text-sm text-destructive">❌ {result.errors} linhas ignoradas por erro</p>}
            </div>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImportRelationsDialog;
