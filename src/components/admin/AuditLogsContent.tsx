import { useAuditLogs } from "@/hooks/useAuditLogs";
import { Badge } from "@/components/ui/badge";
import { Loader2, History } from "lucide-react";

const actionLabels: Record<string, string> = {
  update_business: "Editou negócio",
  change_commercial_status: "Alterou estado comercial",
  activate_subscription: "Ativou subscrição",
};

const AuditLogsContent = () => {
  const { data: logs = [], isLoading } = useAuditLogs();

  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Auditoria</h1>
        <p className="text-muted-foreground">Histórico de ações realizadas pela equipa comercial</p>
      </div>

      {logs.length === 0 ? (
        <div className="bg-card rounded-xl shadow-card p-8 text-center">
          <History className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Sem registos de auditoria.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">Utilizador</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Ação</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Alvo</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Alterações</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Data</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t border-border">
                    <td className="p-4 text-sm">{log.user_email || "—"}</td>
                    <td className="p-4">
                      <Badge variant="secondary">{actionLabels[log.action] || log.action}</Badge>
                    </td>
                    <td className="p-4 text-sm font-medium">{log.target_name || "-"}</td>
                    <td className="p-4 text-xs text-muted-foreground max-w-xs">
                      {log.changes ? (
                        <div className="space-y-1">
                          {Object.entries(log.changes).map(([key, val]: [string, any]) => (
                            <div key={key}>
                              <span className="font-medium">{key}:</span>{" "}
                              <span className="line-through text-destructive/70">{String(val?.old ?? "—")}</span>
                              {" → "}
                              <span className="text-success">{String(val?.new ?? "—")}</span>
                            </div>
                          ))}
                        </div>
                      ) : "-"}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(log.created_at).toLocaleDateString("pt-PT", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogsContent;
