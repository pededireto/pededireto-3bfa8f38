import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TicketStatusBadge, TicketPriorityBadge } from "@/components/tickets/TicketStatusBadge";
import { useTicketStats, useSlaViolations } from "@/hooks/useTickets";
import { BarChart3, Clock, CheckCircle, AlertTriangle, Inbox, Loader2, Timer, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

const CsDashboard = () => {
  const stats = useTicketStats("cs");
  const { data: slaViolations = [] } = useSlaViolations("cs");

  const riskyTickets = slaViolations.filter((t: any) =>
    t.sla_status === "🔴 SLA Violado" || t.sla_status === "🟡 Perto do Limite"
  );

  return (
    <div className="space-y-6">
      {/* Row 1: Main metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activeCount}</p>
                <p className="text-xs text-muted-foreground">Tickets Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgResponseMin}<span className="text-sm font-normal"> min</span></p>
                <p className="text-xs text-muted-foreground">Tempo Médio Resposta</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.resolutionRate}%</p>
                <p className="text-xs text-muted-foreground">Taxa Resolução (30d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{riskyTickets.filter((t: any) => t.sla_status === "🔴 SLA Violado").length}</p>
                <p className="text-xs text-muted-foreground">SLA Violado</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Status breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <span className="text-2xl">🟢</span>
            <div>
              <p className="text-xl font-bold">{stats.openCount}</p>
              <p className="text-xs text-muted-foreground">Abertos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <span className="text-2xl">🔵</span>
            <div>
              <p className="text-xl font-bold">{stats.inProgressCount}</p>
              <p className="text-xs text-muted-foreground">Em Progresso</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <span className="text-2xl">🟣</span>
            <div>
              <p className="text-xl font-bold">{stats.waitingResponseCount}</p>
              <p className="text-xs text-muted-foreground">Aguardando</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-xl font-bold">{stats.escalatedCount}</p>
              <p className="text-xs text-muted-foreground">Escalados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending response tickets */}
      {stats.pendingResponseTickets.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Inbox className="h-4 w-4" /> Tickets Pendentes de Resposta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.pendingResponseTickets.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.businesses?.name || "—"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <TicketPriorityBadge priority={t.priority} />
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(t.created_at), { addSuffix: true, locale: pt })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SLA Risk */}
      {riskyTickets.length > 0 && (
        <Card className="border-red-200 dark:border-red-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-red-600">
              <Timer className="h-4 w-4" /> Tickets em Risco de SLA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {riskyTickets.slice(0, 5).map((t: any) => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.title}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <TicketPriorityBadge priority={t.priority} />
                    <span className="text-xs font-medium">{t.sla_status}</span>
                    <span className="text-xs text-muted-foreground">{Math.round(t.hours_open || 0)}h</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CsDashboard;
