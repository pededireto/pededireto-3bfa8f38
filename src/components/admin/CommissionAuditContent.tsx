import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Loader2, History } from "lucide-react";

const CommissionAuditContent = () => {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["commission-audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commission_audit_logs" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as any[];
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Auditoria de Comissões</h1>
        <p className="text-muted-foreground">Histórico de alterações em comissões</p>
      </div>

      <div className="bg-card rounded-xl shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium text-muted-foreground">Data</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Estado Anterior</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Novo Estado</th>
              <th className="text-right p-4 font-medium text-muted-foreground">Valor Anterior</th>
              <th className="text-right p-4 font-medium text-muted-foreground">Novo Valor</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Motivo</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log: any) => (
              <tr key={log.id} className="border-t border-border">
                <td className="p-4 text-muted-foreground">{new Date(log.created_at).toLocaleString("pt-PT")}</td>
                <td className="p-4">
                  {log.old_status && <Badge variant="outline">{log.old_status}</Badge>}
                </td>
                <td className="p-4">
                  {log.new_status && (
                    <Badge variant="secondary" className={
                      log.new_status === "reversed" ? "bg-destructive/10 text-destructive" :
                      log.new_status === "paid" ? "bg-success/10 text-success" :
                      ""
                    }>
                      {log.new_status}
                    </Badge>
                  )}
                </td>
                <td className="p-4 text-right">{log.old_amount != null ? `${Number(log.old_amount).toFixed(2)}€` : "-"}</td>
                <td className="p-4 text-right">{log.new_amount != null ? `${Number(log.new_amount).toFixed(2)}€` : "-"}</td>
                <td className="p-4 text-muted-foreground max-w-xs truncate">{log.reason || "-"}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">
                <History className="h-8 w-8 mx-auto mb-2 opacity-30" />
                Sem registos de auditoria.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CommissionAuditContent;
