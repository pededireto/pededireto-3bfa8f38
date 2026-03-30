import { useState, useMemo } from "react";
import { AlertTriangle, CheckCircle, ExternalLink, ShieldAlert, Trash2, Square, CheckSquare, MinusSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { usePlatformAlerts, usePlatformAlertsCounts, useResolveAlert, type PlatformAlert } from "@/hooks/usePlatformAlerts";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

type SeverityFilter = "all" | "critical" | "important" | "info";

interface PlatformAlertsContentProps {
  categoryFilter?: string[];
}

const SEVERITY_CONFIG: Record<string, { icon: string; label: string; border: string; bg: string }> = {
  critical: { icon: "🔴", label: "Crítico", border: "border-red-200 dark:border-red-900", bg: "bg-red-50 dark:bg-red-950/30" },
  important: { icon: "🟡", label: "Importante", border: "border-amber-200 dark:border-amber-900", bg: "bg-amber-50 dark:bg-amber-950/30" },
  info: { icon: "🟢", label: "Info", border: "border-blue-200 dark:border-blue-900", bg: "bg-blue-50 dark:bg-blue-950/30" },
};

const PlatformAlertsContent = ({ categoryFilter }: PlatformAlertsContentProps) => {
  const [filter, setFilter] = useState<SeverityFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { data: alerts = [], isPending } = usePlatformAlerts();
  const { data: counts } = usePlatformAlertsCounts();
  const resolveAlert = useResolveAlert();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const filteredByCategory = categoryFilter
    ? alerts.filter((a) => categoryFilter.includes(a.category || ""))
    : alerts;

  const filteredAlerts = filter === "all"
    ? filteredByCategory
    : filteredByCategory.filter((a) => a.severity === filter);

  const severityOrder: Record<string, number> = { critical: 0, important: 1, info: 2 };
  const sortedAlerts = [...filteredAlerts].sort(
    (a, b) => (severityOrder[a.severity || "info"] ?? 2) - (severityOrder[b.severity || "info"] ?? 2)
  );

  const allVisibleSelected = sortedAlerts.length > 0 && sortedAlerts.every((a) => selectedIds.has(a.id));
  const someSelected = sortedAlerts.some((a) => selectedIds.has(a.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedAlerts.map((a) => a.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleResolve = (id: string) => {
    resolveAlert.mutate(id, {
      onSuccess: () => toast.success("Alerta resolvido"),
      onError: () => toast.error("Erro ao resolver alerta"),
    });
  };

  const handleBulkResolve = async () => {
    const ids = Array.from(selectedIds);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase as any)
      .from("admin_alerts")
      .update({ resolved_at: new Date().toISOString(), resolved_by: user?.id, is_read: true })
      .in("id", ids);
    if (error) {
      toast.error("Erro ao resolver alertas");
    } else {
      toast.success(`${ids.length} alertas resolvidos`);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["platform-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["platform-alerts-count"] });
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    const { error } = await (supabase as any)
      .from("admin_alerts")
      .delete()
      .in("id", ids);
    if (error) {
      toast.error("Erro ao apagar alertas");
    } else {
      toast.success(`${ids.length} alertas apagados`);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["platform-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["platform-alerts-count"] });
    }
    setDeleteConfirmOpen(false);
  };

  const handleNavigate = (alert: PlatformAlert) => {
    if (alert.action_url) {
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

      {/* Bulk Actions Bar */}
      {sortedAlerts.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
          <button onClick={toggleSelectAll} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            {allVisibleSelected ? (
              <CheckSquare className="h-4 w-4 text-primary" />
            ) : someSelected ? (
              <MinusSquare className="h-4 w-4 text-primary" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            {allVisibleSelected ? "Desseleccionar todos" : "Seleccionar todos"}
          </button>

          {selectedIds.size > 0 && (
            <>
              <span className="text-sm font-medium text-primary">{selectedIds.size} seleccionados</span>
              <div className="flex gap-2 ml-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkResolve}
                  className="text-xs text-green-700 hover:text-green-800 hover:bg-green-100"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Resolver seleccionados
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Apagar seleccionados
                </Button>
              </div>
            </>
          )}
        </div>
      )}

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
            const isSelected = selectedIds.has(alert.id);
            return (
              <Card key={alert.id} className={`${config.border} ${config.bg} border ${isSelected ? "ring-2 ring-primary" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(alert.id)}
                      className="mt-1 flex-shrink-0"
                    />
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

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar alertas</AlertDialogTitle>
            <AlertDialogDescription>
              Tens a certeza que queres apagar {selectedIds.size} alertas? Esta acção não pode ser revertida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Apagar {selectedIds.size} alertas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PlatformAlertsContent;
