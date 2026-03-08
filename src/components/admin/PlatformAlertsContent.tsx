import { useState } from "react";
import { AlertTriangle, CheckCircle, ExternalLink, Info, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePlatformAlerts, usePlatformAlertsCounts, useResolveAlert, type PlatformAlert } from "@/hooks/usePlatformAlerts";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type SeverityFilter = "all" | "critical" | "important" | "info";

interface PlatformAlertsContentProps {
  /** Filter alerts to specific categories (for CS view) */
  categoryFilter?: string[];
}

const SEVERITY_CONFIG: Record<string, { icon: string; label: string; border: string; bg: string }> = {
  critical: { icon: "🔴", label: "Crítico", border: "border-red-200 dark:border-red-900", bg: "bg-red-50 dark:bg-red-950/30" },
  important: { icon: "🟡", label: "Importante", border: "border-amber-200 dark:border-amber-900", bg: "bg-amber-50 dark:bg-amber-950/30" },
  info: { icon: "🟢", label: "Info", border: "border-blue-200 dark:border-blue-900", bg: "bg-blue-50 dark:bg-blue-950/30" },
};

const PlatformAlertsContent = ({ categoryFilter }: PlatformAlertsContentProps) => {
  const [filter, setFilter] = useState<SeverityFilter>("all");
  const { data: alerts = [], isPending } = usePlatformAlerts();
  const { data: counts } = usePlatformAlertsCounts();
  const resolveAlert = useResolveAlert();
  const navigate = useNavigate();

  // Apply category filter for CS
  const filteredByCategory = categoryFilter
    ? alerts.filter((a) => categoryFilter.includes(a.category || ""))
    : alerts;

  // Apply severity filter
  const filteredAlerts = filter === "all"
    ? filteredByCategory
    : filteredByCategory.filter((a) => a.severity === filter);

  // Sort: critical → important → info
  const severityOrder: Record<string, number> = { critical: 0, important: 1, info: 2 };
  const sortedAlerts = [...filteredAlerts].sort(
    (a, b) => (severityOrder[a.severity || "info"] ?? 2) - (severityOrder[b.severity || "info"] ?? 2)
  );

  const handleResolve = (id: string) => {
    resolveAlert.mutate(id, {
      onSuccess: () => toast.success("Alerta resolvido"),
      onError: () => toast.error("Erro ao resolver alerta"),
    });
  };

  const handleNavigate = (alert: PlatformAlert) => {
    if (alert.action_url) {
      // Handle query params like /admin?tab=reviews
      if (alert.action_url.includes("?")) {
        const [path, query] = alert.action_url.split("?");
        const params = new URLSearchParams(query);
        navigate(path + "?" + params.toString());
      } else {
        navigate(alert.action_url);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-6 w-6 text-destructive" />
          <h2 className="text-2xl font-bold">Centro de Alertas</h2>
          {counts && counts.total > 0 && (
            <Badge variant="destructive" className="text-sm">{counts.total} activos</Badge>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(["all", "critical", "important", "info"] as SeverityFilter[]).map((sev) => {
          const count = sev === "all" ? counts?.total : counts?.[sev];
          const labels: Record<SeverityFilter, string> = { all: "Todos", critical: "🔴 Críticos", important: "🟡 Importantes", info: "🟢 Info" };
          return (
            <Button
              key={sev}
              variant={filter === sev ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(sev)}
            >
              {labels[sev]} {count != null && count > 0 ? `(${count})` : ""}
            </Button>
          );
        })}
      </div>

      {/* Alerts List */}
      {isPending ? (
        <div className="text-center py-12 text-muted-foreground">A carregar alertas...</div>
      ) : sortedAlerts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-lg font-medium">Tudo limpo!</p>
            <p className="text-muted-foreground">Sem alertas activos neste momento.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sortedAlerts.map((alert) => {
            const config = SEVERITY_CONFIG[alert.severity || "info"] || SEVERITY_CONFIG.info;
            return (
              <Card key={alert.id} className={`${config.border} ${config.bg} border`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5 flex-shrink-0">{config.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{alert.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {alert.created_at
                          ? formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: pt })
                          : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {alert.action_url && (
                        <Button variant="outline" size="sm" onClick={() => handleNavigate(alert)} className="h-8 text-xs">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResolve(alert.id)}
                        className="h-8 text-xs text-green-700 hover:text-green-800 hover:bg-green-100"
                        disabled={resolveAlert.isPending}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Resolver
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlatformAlertsContent;
