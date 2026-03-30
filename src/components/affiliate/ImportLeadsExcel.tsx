import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCreateAffiliateLead } from "@/hooks/useAffiliateLeads";
import { Download, Upload, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import * as XLSX from "xlsx";

interface ImportResult {
  success: number;
  incomplete: number;
  errors: { line: number; reason: string }[];
}

const TEMPLATE_COLUMNS = [
  "Nome do Negócio",
  "Categoria",
  "Subcategoria",
  "Cidade",
  "Telefone",
  "WhatsApp",
  "Email",
  "Website",
  "Nome do Responsável",
  "Telefone do Responsável",
];

const REQUIRED_FIELDS = ["Nome do Negócio", "Categoria", "Cidade", "Email"];

export const downloadTemplate = () => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    TEMPLATE_COLUMNS,
    ["Exemplo Restaurante", "Restauração", "Pizzaria", "Lisboa", "912345678", "912345678", "exemplo@email.com", "https://exemplo.pt", "João Silva", "912345678"],
  ]);
  // Set column widths
  ws["!cols"] = TEMPLATE_COLUMNS.map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(wb, ws, "Leads");
  XLSX.writeFile(wb, "template-leads-afiliado.xlsx");
};

interface ImportLeadsExcelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ImportLeadsExcel = ({ open, onOpenChange }: ImportLeadsExcelProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const createLead = useCreateAffiliateLead();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setImporting(true);
    setResult(null);

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

      // Skip header row
      const dataRows = rows.slice(1).filter((r) => r.some((c) => c));
      
      const importResult: ImportResult = { success: 0, incomplete: 0, errors: [] };

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const lineNum = i + 2; // 1-indexed + header

        const businessName = String(row[0] || "").trim();
        const categoria = String(row[1] || "").trim();
        const cidade = String(row[3] || "").trim();
        const telefone = String(row[4] || "").trim();
        const email = String(row[6] || "").trim();

        // Check required fields
        if (!businessName || !categoria || !cidade || !email) {
          importResult.errors.push({
            line: lineNum,
            reason: `Campos obrigatórios em falta: ${[
              !businessName && "Nome",
              !categoria && "Categoria",
              !cidade && "Cidade",
              !email && "Email",
            ].filter(Boolean).join(", ")}`,
          });
          continue;
        }

        const nomeResponsavel = String(row[8] || "").trim();
        const telefoneResponsavel = String(row[9] || "").trim();
        const isIncomplete = !nomeResponsavel || !telefoneResponsavel;

        try {
          await createLead.mutateAsync({
            affiliate_id: user.id,
            business_name: businessName,
            contact_phone: telefone || undefined,
            contact_email: email || undefined,
            contact_website: String(row[7] || "").trim() || undefined,
            city: cidade || undefined,
            notes: [
              categoria && `Categoria: ${categoria}`,
              String(row[2] || "").trim() && `Subcategoria: ${row[2]}`,
              String(row[5] || "").trim() && `WhatsApp: ${row[5]}`,
              nomeResponsavel && `Responsável: ${nomeResponsavel}`,
              telefoneResponsavel && `Tel. Responsável: ${telefoneResponsavel}`,
              isIncomplete && "⚠️ Lead incompleta — falta responsável",
            ].filter(Boolean).join(" | "),
            source: "excel_import",
          });

          if (isIncomplete) {
            importResult.incomplete++;
          } else {
            importResult.success++;
          }
        } catch (err: any) {
          importResult.errors.push({
            line: lineNum,
            reason: err?.message || "Erro ao criar lead",
          });
        }
      }

      setResult(importResult);
      
      if (importResult.success > 0 || importResult.incomplete > 0) {
        toast({
          title: `Importação concluída`,
          description: `${importResult.success} completas, ${importResult.incomplete} incompletas, ${importResult.errors.length} erros`,
        });
      }
    } catch (err: any) {
      toast({
        title: "Erro ao ler ficheiro",
        description: err?.message || "Ficheiro inválido",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar Leads via Excel</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
            <p className="font-medium">Campos obrigatórios:</p>
            <div className="flex flex-wrap gap-1.5">
              {REQUIRED_FIELDS.map((f) => (
                <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Leads sem <strong>Nome do Responsável</strong> ou <strong>Telefone do Responsável</strong> ficam como "incompletas" para completar depois.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1.5">
              <Download className="h-4 w-4" /> Descarregar Template
            </Button>
          </div>

          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFile}
            />
            {importing ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">A importar leads...</p>
              </div>
            ) : (
              <Button onClick={() => fileRef.current?.click()} className="gap-2">
                <Upload className="h-4 w-4" /> Selecionar Ficheiro Excel
              </Button>
            )}
          </div>

          {result && (
            <div className="space-y-3">
              <div className="flex gap-3">
                {result.success > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    {result.success} completas
                  </div>
                )}
                {result.incomplete > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-4 w-4" />
                    {result.incomplete} incompletas
                  </div>
                )}
              </div>

              {result.errors.length > 0 && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 space-y-1 max-h-40 overflow-y-auto">
                  <p className="text-xs font-medium text-destructive">Erros ({result.errors.length}):</p>
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      Linha {e.line}: {e.reason}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportLeadsExcel;
