import { useMyAssignments, useTransferToAccountManager } from "@/hooks/useCommercialPerformance";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, ArrowRight } from "lucide-react";

const CommercialMyBusinessesContent = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: assignments = [], isLoading } = useMyAssignments();
  const transfer = useTransferToAccountManager();

  const handleTransfer = async (businessId: string) => {
    if (!user?.id) return;
    if (!confirm("Passar este negócio ao Gestor de Conta?")) return;
    try {
      await transfer.mutateAsync({ business_id: businessId, commercial_id: user.id });
      toast({ title: "Negócio transferido para Gestor de Conta" });
    } catch {
      toast({ title: "Erro ao transferir", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">🏢 Meus Negócios</h1>
        <p className="text-muted-foreground">Negócios atribuídos a si</p>
      </div>

      <div className="bg-card rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">Negócio</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Plano</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Estado</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Função</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Receita</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a: any) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-primary/50" />
                      <span className="font-medium">{a.businesses?.name || "-"}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{a.businesses?.commercial_plans?.name || "Sem plano"}</td>
                  <td className="p-4">
                    <Badge variant="secondary" className={
                      a.businesses?.subscription_status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    }>
                      {a.businesses?.subscription_status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Badge variant="outline">{a.role === "sales" ? "Vendas" : "Gestor de Conta"}</Badge>
                  </td>
                  <td className="p-4 text-right font-medium">{Number(a.businesses?.subscription_price || 0).toFixed(2)}€</td>
                  <td className="p-4 text-right">
                    {a.role === "sales" && (
                      <Button size="sm" variant="outline" onClick={() => handleTransfer(a.businesses?.id)} disabled={transfer.isPending}>
                        <ArrowRight className="h-3 w-3 mr-1" /> Passar a Gestor
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {assignments.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Sem negócios atribuídos.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CommercialMyBusinessesContent;
