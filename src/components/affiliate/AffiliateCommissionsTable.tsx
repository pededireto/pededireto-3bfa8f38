import { Badge } from "@/components/ui/badge";

interface Commission {
  id: string;
  commission_type: string;
  commission_amount: number;
  commission_rate: number;
  plan_price: number;
  status: string;
  payment_method: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" },
  approved: { label: "Aprovada", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  paid: { label: "Paga ✓", className: "bg-green-500/10 text-green-600 dark:text-green-400" },
  cancelled: { label: "Cancelada", className: "bg-destructive/10 text-destructive" },
};

const AffiliateCommissionsTable = ({ commissions }: { commissions: Commission[] }) => {
  if (commissions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">Sem comissões</p>
        <p className="text-sm">As comissões são geradas automaticamente quando as tuas leads convertem.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-3 font-medium text-muted-foreground">Tipo</th>
            <th className="text-right p-3 font-medium text-muted-foreground">Preço Plano</th>
            <th className="text-right p-3 font-medium text-muted-foreground">Taxa</th>
            <th className="text-right p-3 font-medium text-muted-foreground">Valor</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Estado</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Pagamento</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Data</th>
          </tr>
        </thead>
        <tbody>
          {commissions.map((c) => {
            const cfg = statusConfig[c.status] || statusConfig.pending;
            return (
              <tr key={c.id} className="border-t border-border">
                <td className="p-3">
                  <Badge variant="outline">
                    {c.commission_type === "first" ? "1ª Conversão" : "Renovação"}
                  </Badge>
                </td>
                <td className="p-3 text-right text-muted-foreground">{Number(c.plan_price).toFixed(2)}€</td>
                <td className="p-3 text-right text-muted-foreground">{Number(c.commission_rate).toFixed(1)}%</td>
                <td className="p-3 text-right font-semibold">{Number(c.commission_amount).toFixed(2)}€</td>
                <td className="p-3">
                  <Badge variant="secondary" className={cfg.className}>{cfg.label}</Badge>
                </td>
                <td className="p-3 text-muted-foreground">
                  {c.payment_method === "bank_transfer"
                    ? "💳 Transferência"
                    : c.payment_method === "platform_credits"
                    ? "🪙 Créditos"
                    : "-"}
                </td>
                <td className="p-3 text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString("pt-PT")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AffiliateCommissionsTable;
