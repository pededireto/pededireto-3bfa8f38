import { useState } from "react";
import {
  usePerformanceRanking,
  usePerformanceTimeSeries,
  useCommercialCommissions,
  useMarkCommissionPaid,
  useValidateCommission,
  useReverseCommission,
  useCommercialAssignments,
  useDeactivateAssignment,
  useCommercialUsers,
  useCreateAssignment,
} from "@/hooks/useCommercialPerformance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TrendingUp, Users, DollarSign, Download, CheckCircle, RotateCcw, ShieldCheck } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const PerformanceContent = () => {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  const { data: ranking = [], isLoading: rankingLoading } = usePerformanceRanking();
  const { data: timeSeries = [] } = usePerformanceTimeSeries(startDate, endDate);
  const { data: allCommissions = [] } = useCommercialCommissions();
  const { data: allAssignments = [] } = useCommercialAssignments();
  const { data: commercialUsers = [] } = useCommercialUsers();
  const markPaid = useMarkCommissionPaid();
  const validateCommission = useValidateCommission();
  const reverseCommission = useReverseCommission();
  const deactivateAssignment = useDeactivateAssignment();
  const createAssignment = useCreateAssignment();

  const [reverseDialogOpen, setReverseDialogOpen] = useState(false);
  const [reverseTarget, setReverseTarget] = useState<string | null>(null);
  const [reverseReason, setReverseReason] = useState("");

  const [assignBusinessId, setAssignBusinessId] = useState("");
  const [assignCommercialId, setAssignCommercialId] = useState("");
  const [assignRole, setAssignRole] = useState("sales");

  const handleExportCSV = () => {
    const headers = "Mês,Conversões,Receita,Comissão\n";
    const rows = timeSeries.map((r: any) => `${r.month},${r.conversions},${r.revenue},${r.commission}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `performance_${startDate}_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await markPaid.mutateAsync(id);
      toast({ title: "Comissão marcada como paga" });
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm("Desativar esta atribuição?")) return;
    try {
      await deactivateAssignment.mutateAsync(id);
      toast({ title: "Atribuição desativada" });
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  const handleAssign = async () => {
    if (!assignBusinessId || !assignCommercialId) return;
    try {
      await createAssignment.mutateAsync({
        business_id: assignBusinessId,
        commercial_id: assignCommercialId,
        role: assignRole,
      });
      toast({ title: "Atribuição criada" });
      setAssignBusinessId("");
      setAssignCommercialId("");
    } catch {
      toast({ title: "Erro ao criar atribuição", variant: "destructive" });
    }
  };

  if (rankingLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalConversions = ranking.reduce((s, r) => s + r.conversions, 0);
  const totalRevenue = ranking.reduce((s, r) => s + r.revenue, 0);
  const totalCommission = ranking.reduce((s, r) => s + r.commissionGenerated, 0);
  const totalPaid = ranking.reduce((s, r) => s + r.commissionPaid, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">🤝 Performance Comercial</h1>
        <p className="text-muted-foreground">Ranking, comissões e gestão de atribuições</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Conversões", value: totalConversions, icon: Users },
          { label: "Receita Gerada", value: `${totalRevenue.toFixed(2)}€`, icon: TrendingUp },
          { label: "Comissão Gerada", value: `${totalCommission.toFixed(2)}€`, icon: DollarSign },
          { label: "Comissão Paga", value: `${totalPaid.toFixed(2)}€`, icon: CheckCircle },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-card rounded-xl p-5 shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">{kpi.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Ranking Table */}
      <div className="bg-card rounded-xl p-6 shadow-card">
        <h2 className="text-lg font-semibold mb-4">Ranking Comercial</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium text-muted-foreground">#</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Comercial</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Conversões</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Receita</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Comissão Gerada</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Comissão Paga</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r, i) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3 font-bold text-muted-foreground">{i + 1}</td>
                  <td className="p-3">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.email}</div>
                  </td>
                  <td className="p-3 text-right">{r.conversions}</td>
                  <td className="p-3 text-right font-medium">{r.revenue.toFixed(2)}€</td>
                  <td className="p-3 text-right">{r.commissionGenerated.toFixed(2)}€</td>
                  <td className="p-3 text-right">{r.commissionPaid.toFixed(2)}€</td>
                </tr>
              ))}
              {ranking.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Sem dados de conversão.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="bg-card rounded-xl p-6 shadow-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold">Evolução Mensal</h2>
          <div className="flex gap-2 items-center flex-wrap">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
          </div>
        </div>

        {timeSeries.length > 0 ? (
          <div className="space-y-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name="Receita (€)" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="commission" name="Comissão (€)" stroke="hsl(var(--accent))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="conversions" name="Conversões" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">Sem dados para o período selecionado.</p>
        )}
      </div>

      {/* Commissions Management */}
      <div className="bg-card rounded-xl p-6 shadow-card">
        <h2 className="text-lg font-semibold mb-4">Comissões</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium text-muted-foreground">Comercial</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Negócio</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Mês Ref.</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Valor</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Estado</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {allCommissions.map((c: any) => {
                const isNegative = Number(c.amount) < 0;
                const statusLabel: Record<string, string> = {
                  generated: "Gerada", validated: "Validada", paid: "Paga", reversed: "Revertida", cancelled: "Cancelada",
                };
                const statusClass: Record<string, string> = {
                  generated: "bg-warning/10 text-warning",
                  validated: "bg-blue-500/10 text-blue-600",
                  paid: "bg-success/10 text-success",
                  reversed: "bg-destructive/10 text-destructive",
                  cancelled: "bg-muted text-muted-foreground",
                };
                return (
                  <tr key={c.id} className={`border-t border-border ${isNegative ? "bg-destructive/5" : ""}`}>
                    <td className="p-3 text-sm">{c.profiles?.full_name || c.profiles?.email || "-"}</td>
                    <td className="p-3 text-sm">{c.businesses?.name || "-"}</td>
                    <td className="p-3 text-sm">{c.reference_month}</td>
                    <td className={`p-3 text-sm text-right font-medium ${isNegative ? "text-destructive" : ""}`}>
                      {Number(c.amount).toFixed(2)}€
                      {c.adjustment_type && <span className="text-xs text-muted-foreground ml-1">({c.adjustment_type})</span>}
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary" className={statusClass[c.status] || ""}>
                        {statusLabel[c.status] || c.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      {c.status === "generated" && !c.adjustment_type && (
                        <Button size="sm" variant="outline" onClick={async () => {
                          try { await validateCommission.mutateAsync(c.id); toast({ title: "Comissão validada" }); }
                          catch { toast({ title: "Erro", variant: "destructive" }); }
                        }}>
                          <ShieldCheck className="h-3 w-3 mr-1" /> Validar
                        </Button>
                      )}
                      {c.status === "validated" && (
                        <Button size="sm" variant="outline" onClick={() => handleMarkPaid(c.id)}>
                          <CheckCircle className="h-3 w-3 mr-1" /> Pagar
                        </Button>
                      )}
                      {(c.status === "paid" || c.status === "validated") && !c.adjustment_type && (
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => {
                          setReverseTarget(c.id);
                          setReverseReason("");
                          setReverseDialogOpen(true);
                        }}>
                          <RotateCcw className="h-3 w-3 mr-1" /> Reverter
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {allCommissions.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Sem comissões registadas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignments Management */}
      <div className="bg-card rounded-xl p-6 shadow-card">
        <h2 className="text-lg font-semibold mb-4">Atribuições Comerciais</h2>

        {/* Create assignment */}
        <div className="flex gap-2 flex-wrap mb-4 p-4 bg-muted/30 rounded-lg">
          <Input placeholder="ID do negócio" value={assignBusinessId} onChange={(e) => setAssignBusinessId(e.target.value)} className="w-64" />
          <Select value={assignCommercialId} onValueChange={setAssignCommercialId}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Comercial" /></SelectTrigger>
            <SelectContent>
              {commercialUsers.map((u: any) => (
                <SelectItem key={u.user_id} value={u.user_id}>{u.full_name || u.email}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={assignRole} onValueChange={setAssignRole}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sales">Vendas</SelectItem>
              <SelectItem value="account_manager">Gestor de Conta</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAssign} disabled={!assignBusinessId || !assignCommercialId}>Atribuir</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium text-muted-foreground">Comercial</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Função</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Atribuído em</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Estado</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {allAssignments.map((a: any) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="p-3 text-sm">{a.profiles?.full_name || a.profiles?.email || "-"}</td>
                  <td className="p-3 text-sm">
                    <Badge variant="outline">{a.role === "sales" ? "Vendas" : "Gestor de Conta"}</Badge>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {new Date(a.assigned_at).toLocaleDateString("pt-PT")}
                  </td>
                  <td className="p-3">
                    <Badge variant="secondary" className={a.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}>
                      {a.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    {a.is_active && (
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeactivate(a.id)}>
                        Desativar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {allAssignments.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Sem atribuições registadas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reverse Dialog */}
      <Dialog open={reverseDialogOpen} onOpenChange={setReverseDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reverter Comissão</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Textarea placeholder="Motivo da reversão (obrigatório)" value={reverseReason} onChange={(e) => setReverseReason(e.target.value)} rows={3} />
            <Button className="w-full" disabled={!reverseReason.trim() || reverseCommission.isPending} onClick={async () => {
              if (!reverseTarget || !reverseReason.trim()) return;
              try {
                await reverseCommission.mutateAsync({ id: reverseTarget, reason: reverseReason.trim() });
                toast({ title: "Comissão revertida com sucesso" });
                setReverseDialogOpen(false);
              } catch { toast({ title: "Erro ao reverter", variant: "destructive" }); }
            }}>
              {reverseCommission.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar Reversão
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PerformanceContent;
