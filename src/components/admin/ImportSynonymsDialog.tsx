import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { useBulkCreateSearchSynonyms, SearchSynonym } from "@/hooks/useSearchSynonyms";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, Info, ChevronDown, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";

interface ParsedRow {
  termo: string;
  equivalente: string;
  tipo: string;
  status: "ok" | "error" | "duplicate";
  errors: string[];
}

const VALID_TYPES = ["word", "phrase"];

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingSynonyms: SearchSynonym[];
}

type Step = "upload" | "preview" | "result";

const ImportSynonymsDialog = ({ open, onOpenChange, existingSynonyms }: Props) => {
  const { toast } = useToast();
  const bulkCreate = useBulkCreateSearchSynonyms();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [result, setResult] = useState<{ inserted: number; skipped: number; errors: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const errorRowRef = useRef<HTMLTableRowElement>(null);

  const existingPairs = new Set(existingSynonyms.map(s => `${normalize(s.termo)}::${normalize(s.equivalente)}`));

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
      const termo = String(r.termo ?? "").trim();
      const equivalente = String(r.equivalente ?? "").trim();
      let tipo = String(r.tipo ?? r.type ?? "word").trim().toLowerCase();
      const errors: string[] = [];

      if (!termo) errors.push("Termo em falta");
      if (!equivalente) errors.push("Equivalente em falta");

      // Map PT labels to values
      if (tipo === "palavra") tipo = "word";
      if (tipo === "frase") tipo = "phrase";
      if (!VALID_TYPES.includes(tipo)) {
        tipo = "word"; // default
      }

      let isDuplicate = false;
      if (errors.length === 0) {
        const pairKey = `${normalize(termo)}::${normalize(equivalente)}`;
        if (existingPairs.has(pairKey) || seenPairs.has(pairKey)) {
          isDuplicate = true;
        }
        seenPairs.add(pairKey);
      }

      const status: ParsedRow["status"] = errors.length > 0 ? "error" : isDuplicate ? "duplicate" : "ok";
      return { termo, equivalente, tipo, status, errors };
    });
    return parsed;
  }, [existingPairs]);

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
      termo: r.termo,
      equivalente: r.equivalente,
      type: r.tipo,
    }));
    try {
      const res = await bulkCreate.mutateAsync(toInsert);
      setResult({ inserted: res.inserted, skipped: res.skipped, errors: errorRows.length });
      setStep("result");
      setTimeout(() => onOpenChange(false), 5000);
    } catch (e: any) {
      toast({ title: "Erro ao importar", description: e.message, variant: "destructive" });
    }
  };

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
          <DialogTitle>Importar Sinónimos via CSV/Excel</DialogTitle>
          <DialogDescription>Importe sinónimos de pesquisa em massa.</DialogDescription>
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
              Formato esperado: <code className="bg-muted px-1 rounded">termo, equivalente, tipo</code> (tipo: word ou phrase)
            </p>

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
                <p>3. Preencha os sinónimos na aba "Template"</p>
                <p>4. Exporte como CSV (Ficheiro → Transferir → CSV)</p>
                <p>5. Importe aqui</p>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === "preview" && (
          <div className="flex flex-col gap-3 min-h-0 flex-1">
            <div className="flex gap-3 flex-wrap">
              <Badge variant="outline" className="gap-1 text-green-700 border-green-300 bg-green-50 dark:bg-green-950/30">
                <CheckCircle2 className="h-3.5 w-3.5" /> {validRows.length} válidos
              </Badge>
              <Badge variant="outline" className="gap-1 text-red-700 border-red-300 bg-red-50 dark:bg-red-950/30">
                <XCircle className="h-3.5 w-3.5" /> {errorRows.length} erros
              </Badge>
              <Badge variant="outline" className="gap-1 text-amber-700 border-amber-300 bg-amber-50 dark:bg-amber-950/30">
                <AlertTriangle className="h-3.5 w-3.5" /> {duplicateRows.length} duplicados
              </Badge>
            </div>

            <div className="overflow-auto border rounded-lg max-h-[45vh]">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">#</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Termo</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Equivalente</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Tipo</th>
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
                      <td className="px-3 py-2 font-medium">{row.termo}</td>
                      <td className="px-3 py-2">{row.equivalente}</td>
                      <td className="px-3 py-2 capitalize">{row.tipo === "phrase" ? "Frase" : "Palavra"}</td>
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

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setStep("upload")}>Voltar</Button>
              <Button
                onClick={handleImport}
                disabled={validRows.length === 0 || bulkCreate.isPending}
              >
                {bulkCreate.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Importar apenas os válidos ({validRows.length})
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
              <p className="text-sm text-green-700">✅ {result.inserted} sinónimos importados com sucesso</p>
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

export default ImportSynonymsDialog;
