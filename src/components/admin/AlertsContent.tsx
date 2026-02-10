import { useState } from "react";
import { Bell, MessageCircle, Mail, CheckCircle, AlertTriangle, TrendingUp, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useExpirationLogs, useUpdateContactStatus, useUncontactedCount } from "@/hooks/useExpirationLogs";
import { useCommercialPlans } from "@/hooks/useCommercialPlans";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";

const AlertsContent = () => {
  const [period, setPeriod] = useState<"today" | "7days" | "30days" | "all">("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: logs = [], isLoading } = useExpirationLogs({
    period,
    planName: planFilter === "all" ? undefined : planFilter,
    contactStatus: statusFilter === "all" ? undefined : statusFilter,
  });

  const { data: allLogs = [] } = useExpirationLogs({ period: "30days" });
  const { data: plans = [] } = useCommercialPlans();
  const updateStatus = useUpdateContactStatus();

  // Stats
  const uncontacted = logs.filter(l => l.contact_status === "nao_contactado").length;
  const renewed30d = allLogs.filter(l => l.contact_status === "renovado").length;
  const total30d = allLogs.length;
  const recoveryRate = total30d > 0 ? Math.round((renewed30d / total30d) * 100) : 0;
  const revenueAtRisk = logs
    .filter(l => l.contact_status === "nao_contactado")
    .reduce((sum, l) => sum + (l.plan_price || 0), 0);

  const handleStatusChange = (id: string, status: string) => {
    updateStatus.mutate({ id, contact_status: status }, {
      onSuccess: () => toast.success("Estado atualizado"),
      onError: () => toast.error("Erro ao atualizar"),
    });
  };

  const getWhatsAppUrl = (log: typeof logs[0]) => {
    if (!log.cta_whatsapp) return null;
    const phone = log.cta_whatsapp.replace(/\D/g, "");
    const text = encodeURIComponent(
      `Olá ${log.business_name}! 👋\n\nReparámos que o teu plano ${log.plan_name} expirou recentemente.\n\nGostaríamos de te ajudar a reativar a tua presença na plataforma PedeDireto!\n\nTemos uma proposta especial para ti. Podemos conversar? 😊\n\nEquipa PedeDireto`
    );
    return `https://wa.me/${phone}?text=${text}`;
  };

  const getEmailUrl = (log: typeof logs[0]) => {
    if (!log.cta_email) return null;
    const subject = encodeURIComponent(`${log.business_name} — Reativa já a tua presença no PedeDireto! 🚀`);
    const body = encodeURIComponent(
      `Olá,\n\nO teu plano ${log.plan_name} expirou no dia ${log.expired_at}.\n\nNão percas mais clientes! Reativa agora com condições especiais.\n\nOu contacta-nos diretamente para uma proposta personalizada.\n\nAbraço,\nEquipa Comercial PedeDireto`
    );
    return `mailto:${log.cta_email}?subject=${subject}&body=${body}`;
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      nao_contactado: { label: "Não contactado", variant: "destructive" },
      contactado: { label: "Contactado", variant: "default" },
      renovado: { label: "Renovado", variant: "secondary" },
      perdido: { label: "Perdido", variant: "outline" },
    };
    const info = map[status] || { label: status, variant: "outline" as const };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  const paidPlans = plans.filter(p => p.price > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="h-6 w-6 text-orange-500" />
        <h2 className="text-2xl font-bold">Alertas Comerciais</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Não Contactados</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uncontacted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Recuperação (30d)</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recoveryRate}%</div>
            <p className="text-xs text-muted-foreground">{renewed30d} de {total30d}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita em Risco</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revenueAtRisk.toFixed(2)}€</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Período" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="7days">Últimos 7 dias</SelectItem>
            <SelectItem value="30days">Últimos 30 dias</SelectItem>
            <SelectItem value="all">Todos</SelectItem>
          </SelectContent>
        </Select>

        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Plano anterior" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os planos</SelectItem>
            {paidPlans.map(p => (
              <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="nao_contactado">Não contactado</SelectItem>
            <SelectItem value="contactado">Contactado</SelectItem>
            <SelectItem value="renovado">Renovado</SelectItem>
            <SelectItem value="perdido">Perdido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">A carregar...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Nenhum alerta encontrado.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Negócio</TableHead>
                  <TableHead>Plano Anterior</TableHead>
                  <TableHead>Expirou em</TableHead>
                  <TableHead>Dias</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const days = differenceInDays(new Date(), new Date(log.expired_at));
                  const waUrl = getWhatsAppUrl(log);
                  const emailUrl = getEmailUrl(log);

                  return (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.business_name || "—"}</TableCell>
                      <TableCell>
                        {log.plan_name}
                        <span className="text-muted-foreground text-xs ml-1">({log.plan_price}€)</span>
                      </TableCell>
                      <TableCell>{format(new Date(log.expired_at), "dd/MM/yyyy", { locale: pt })}</TableCell>
                      <TableCell>{days}d</TableCell>
                      <TableCell className="text-xs space-y-1">
                        {log.cta_phone && <div>{log.cta_phone}</div>}
                        {log.cta_email && <div>{log.cta_email}</div>}
                      </TableCell>
                      <TableCell>{statusBadge(log.contact_status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {waUrl && (
                            <Button size="sm" variant="outline" asChild className="h-7 text-xs">
                              <a href={waUrl} target="_blank" rel="noopener noreferrer">
                                <MessageCircle className="h-3 w-3 mr-1" />WA
                              </a>
                            </Button>
                          )}
                          {emailUrl && (
                            <Button size="sm" variant="outline" asChild className="h-7 text-xs">
                              <a href={emailUrl}>
                                <Mail className="h-3 w-3 mr-1" />Email
                              </a>
                            </Button>
                          )}
                          {log.contact_status === "nao_contactado" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => handleStatusChange(log.id, "contactado")}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />Contactado
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertsContent;
