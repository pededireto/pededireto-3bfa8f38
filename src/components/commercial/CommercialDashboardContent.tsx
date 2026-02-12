import { useMyCommissions, useMyAssignments } from "@/hooks/useCommercialPerformance";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Users, DollarSign, CheckCircle } from "lucide-react";

const CommercialDashboardContent = () => {
  const { data: commissions = [], isLoading: cLoading } = useMyCommissions();
  const { data: assignments = [], isLoading: aLoading } = useMyAssignments();

  if (cLoading || aLoading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const totalConversions = assignments.length;
  const totalRevenue = assignments.reduce((s: number, a: any) => s + (Number(a.businesses?.subscription_price) || 0), 0);
  const totalCommission = commissions.reduce((s: number, c: any) => s + Number(c.amount), 0);
  const totalPaid = commissions.filter((c: any) => c.status === "paid").reduce((s: number, c: any) => s + Number(c.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">📊 Dashboard</h1>
        <p className="text-muted-foreground">Resumo da sua performance comercial</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Negócios Atribuídos", value: totalConversions, icon: Users },
          { label: "Receita Gerada", value: `${totalRevenue.toFixed(2)}€`, icon: TrendingUp },
          { label: "Comissão Total", value: `${totalCommission.toFixed(2)}€`, icon: DollarSign },
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
    </div>
  );
};

export default CommercialDashboardContent;
