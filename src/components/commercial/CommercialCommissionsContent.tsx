import { useState } from "react";
import { useMyCommissions } from "@/hooks/useCommercialPerformance";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download, DollarSign } from "lucide-react";

const CommercialCommissionsContent = () => {
  const { data: commissions = [], isLoading } = useMyCommissions();
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");

  const filtered = commissions.filter((c: any) => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (filterStart && c.reference_month < filterStart) return false;
    if (filterEnd && c.reference_month > filterEnd) return false;
    return true;
  });

  const handleExportCSV = () => {
    const headers = "Mês,Negócio,Plano,Valor,Estado\n";
    const rows = filtered.map((c: any) =>
      `${c.reference_month},${c.businesses?.name || "-"},${c.businesses?.commercial_plans?.name || "-"},${c.amount},${c.status}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "minhas_comissoes.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const totalGenerated = filtered.reduce((s: number, c: any) => s + Number(c.amount), 0);
  const totalPaid = filtered.filter((c: any) => c.status === "paid").reduce((s: number, c: any) => s + Number(c.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">💰 Minhas Comissões</h1>
          <p className="text-muted-foreground">Histórico de comissões geradas e pagas</p>
        </div>
        <Button variant="outline" onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-1" /> CSV
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Total Gerado</span>
          </div>
          <p className="text-2xl font-bold">{totalGenerated.toFixed(2)}€</p>
        </div>
        <div className="bg-card rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-success" />
            <span className="text-sm text-muted-foreground">Total Pago</span>
          </div>
          <p className="text-2xl font-bold text-success">{totalPaid.toFixed(2)}€</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Input type="date" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} className="w-40" placeholder="Data início" />
        <Input type="date" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} className="w-40" placeholder="Data fim" />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="generated">Geradas</SelectItem>
            <SelectItem value="paid">Pagas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">Mês</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Negócio</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Plano</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Valor</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: any) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="p-4 text-sm">{c.reference_month}</td>
                  <td className="p-4 text-sm font-medium">{c.businesses?.name || "-"}</td>
                  <td className="p-4 text-sm text-muted-foreground">{c.businesses?.commercial_plans?.name || "-"}</td>
                  <td className="p-4 text-sm text-right font-medium">{Number(c.amount).toFixed(2)}€</td>
                  <td className="p-4">
                    <Badge variant="secondary" className={c.status === "paid" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}>
                      {c.status === "paid" ? "Paga" : "Gerada"}
                    </Badge>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Sem comissões.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CommercialCommissionsContent;
