import { useState, useMemo } from "react";
import {
  useAllServiceRequests,
  useRequestMatches,
  useUpdateRequestStatus,
  useCreateMatch,
  useUpdateMatchStatus,
} from "@/hooks/useServiceRequests";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Eye, Building2, AlertTriangle, MapPin, User, Mail, Send, Clock, Phone, Bell, CalendarDays, DollarSign, FileText, Timer, Trash2 } from "lucide-react";
import { differenceInHours, formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

// ═══ Correct enum values for request_status ═══
const STATUS_ORDER = ["aberto", "em_conversa", "propostas_recebidas", "em_negociacao", "fechado"] as const;
const SIDE_STATUSES = ["cancelado", "expirado"] as const;

const statusLabels: Record<string, string> = {
  aberto: "Aberto",
  em_conversa: "Em Conversa",
  propostas_recebidas: "Propostas Recebidas",
  em_negociacao: "Em Negociação",
  fechado: "Fechado",
  cancelado: "Cancelado",
  expirado: "Expirado",
};

const statusColors: Record<string, { bg: string; text: string; ring: string }> = {
  aberto: { bg: "bg-blue-100 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-300", ring: "ring-blue-400" },
  em_conversa: { bg: "bg-yellow-100 dark:bg-yellow-950/40", text: "text-yellow-700 dark:text-yellow-300", ring: "ring-yellow-400" },
  propostas_recebidas: { bg: "bg-orange-100 dark:bg-orange-950/40", text: "text-orange-700 dark:text-orange-300", ring: "ring-orange-400" },
  em_negociacao: { bg: "bg-purple-100 dark:bg-purple-950/40", text: "text-purple-700 dark:text-purple-300", ring: "ring-purple-400" },
  fechado: { bg: "bg-green-100 dark:bg-green-950/40", text: "text-green-700 dark:text-green-300", ring: "ring-green-400" },
  cancelado: { bg: "bg-red-100 dark:bg-red-950/40", text: "text-red-700 dark:text-red-300", ring: "ring-red-400" },
  expirado: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-500 dark:text-gray-400", ring: "ring-gray-400" },
};

const matchStatusLabels: Record<string, string> = {
  enviado: "Enviado",
  aceite: "Aceite",
  recusado: "Recusado",
  sem_resposta: "Sem Resposta",
};

const BUDGET_LABELS: Record<string, string> = {
  "500": "Até 500€",
  "500-1000": "500€ – 1.000€",
  "1000-5000": "1.000€ – 5.000€",
  "5000+": "Mais de 5.000€",
};

const AVAILABILITY_LABELS: Record<string, string> = {
  mornings: "Manhãs",
  afternoons: "Tardes",
  weekends: "Fins de semana",
};

// ═══ Time-based alert color helper ═══
const getTimeAlertColor = (hoursOld: number) => {
  if (hoursOld > 72) return "text-destructive";
  if (hoursOld > 48) return "text-orange-500";
  if (hoursOld > 24) return "text-yellow-500";
  return "text-muted-foreground";
};

// ═══ Status Stepper Component ═══
const StatusStepper = ({ currentStatus, onStatusChange }: { currentStatus: string; onStatusChange: (status: string) => void }) => {
  const currentIdx = STATUS_ORDER.indexOf(currentStatus as any);
  const isSide = SIDE_STATUSES.includes(currentStatus as any);

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {STATUS_ORDER.map((status, idx) => {
        const colors = statusColors[status];
        const isActive = status === currentStatus;
        const isPast = !isSide && currentIdx >= 0 && idx < currentIdx;
        const isNext = !isSide && currentIdx >= 0 && idx === currentIdx + 1;

        return (
          <div key={status} className="flex items-center gap-1">
            <button
              onClick={() => isNext && onStatusChange(status)}
              disabled={!isNext}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? `${colors.bg} ${colors.text} ring-2 ${colors.ring}`
                  : isPast
                    ? `${colors.bg} ${colors.text} opacity-60`
                    : isNext
                      ? `${colors.bg} ${colors.text} opacity-80 hover:opacity-100 cursor-pointer ring-1 ring-dashed ${colors.ring}`
                      : "bg-muted text-muted-foreground opacity-40"
              }`}
            >
              {statusLabels[status]}
            </button>
            {idx < STATUS_ORDER.length - 1 && (
              <span className={`text-xs ${isPast || isActive ? "text-foreground" : "text-muted-foreground/30"}`}>→</span>
            )}
          </div>
        );
      })}
      <span className="mx-1 text-muted-foreground/30">|</span>
      {SIDE_STATUSES.map((status) => {
        const colors = statusColors[status];
        const isActive = status === currentStatus;
        return (
          <button
            key={status}
            onClick={() => !isActive && onStatusChange(status)}
            disabled={isActive}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              isActive
                ? `${colors.bg} ${colors.text} ring-2 ${colors.ring}`
                : `hover:${colors.bg} hover:${colors.text} text-muted-foreground opacity-60 hover:opacity-100 cursor-pointer`
            }`}
          >
            {statusLabels[status]}
          </button>
        );
      })}
    </div>
  );
};

// ═══ Match Counts Summary ═══
const useMatchCounts = (requestIds: string[]) => {
  return useQuery({
    queryKey: ["admin-match-counts", requestIds],
    enabled: requestIds.length > 0,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("request_business_matches" as any)
        .select("request_id, status")
        .in("request_id", requestIds);
      if (error) throw error;

      const counts: Record<string, { total: number; aceite: number; recusado: number; enviado: number }> = {};
      (data || []).forEach((m: any) => {
        if (!counts[m.request_id]) counts[m.request_id] = { total: 0, aceite: 0, recusado: 0, enviado: 0 };
        counts[m.request_id].total++;
        if (m.status === "aceite") counts[m.request_id].aceite++;
        else if (m.status === "recusado") counts[m.request_id].recusado++;
        else if (m.status === "enviado") counts[m.request_id].enviado++;
      });
      return counts;
    },
  });
};

const ServiceRequestsContent = () => {
  const { data: requests = [], isLoading } = useAllServiceRequests();
  const updateStatus = useUpdateRequestStatus();
  const createMatch = useCreateMatch();
  const updateMatchStatus = useUpdateMatchStatus();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("all");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [businessSearch, setBusinessSearch] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{ id: string; status: string } | null>(null);

  const { data: matches = [] } = useRequestMatches(selectedRequestId);

  const selectedRequest = useMemo(
    () => requests.find((r) => r.id === selectedRequestId),
    [requests, selectedRequestId]
  );

  const requestIds = useMemo(() => requests.map((r) => r.id), [requests]);
  const { data: matchCounts = {} } = useMatchCounts(requestIds);

  const { data: suggestedBusinesses = [], isLoading: suggestionsLoading } = useQuery({
    queryKey: ["suggested-businesses", selectedRequest?.category_id, selectedRequest?.subcategory_id, selectedRequestId],
    enabled: !!selectedRequest?.category_id && matchDialogOpen,
    queryFn: async () => {
      if (!selectedRequest?.category_id) return [];
      let query = supabase
        .from("businesses")
        .select("id, name, city, slug, is_active, subscription_status")
        .eq("is_active", true)
        .eq("category_id", selectedRequest.category_id);

      if (selectedRequest.subcategory_id) {
        const { data: jData } = await supabase
          .from("business_subcategories")
          .select("business_id")
          .eq("subcategory_id", selectedRequest.subcategory_id);
        const bIds = (jData || []).map((j: any) => j.business_id);
        if (bIds.length > 0) {
          query = query.in("id", bIds);
        }
      }

      const { data, error } = await query.limit(5);
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: requests.length };
    [...STATUS_ORDER, ...SIDE_STATUSES].forEach((s) => {
      counts[s] = requests.filter((r) => r.status === s).length;
    });
    return counts;
  }, [requests]);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const matchesSearch =
        !search ||
        (r.profiles?.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.profiles?.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.description || "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;

      // Time filter
      if (timeFilter !== "all" && r.status === "aberto") {
        const hoursOld = differenceInHours(new Date(), new Date(r.created_at));
        if (timeFilter === "24h" && hoursOld < 24) return false;
        if (timeFilter === "48h" && hoursOld < 48) return false;
        if (timeFilter === "72h" && hoursOld < 72) return false;
      } else if (timeFilter !== "all" && r.status !== "aberto") {
        return false;
      }

      return matchesSearch && matchesStatus;
    });
  }, [requests, search, statusFilter, timeFilter]);

  const handleStatusChange = async (id: string, status: string) => {
    if (status === "fechado" || status === "cancelado") {
      setConfirmDialog({ id, status });
      return;
    }
    try {
      await updateStatus.mutateAsync({ id, status });
      toast({ title: `Estado alterado para "${statusLabels[status]}"` });
    } catch {
      toast({ title: "Erro ao atualizar estado", variant: "destructive" });
    }
  };

  const confirmStatusChange = async () => {
    if (!confirmDialog) return;
    try {
      await updateStatus.mutateAsync({ id: confirmDialog.id, status: confirmDialog.status });
      toast({ title: `Estado alterado para "${statusLabels[confirmDialog.status]}"` });
    } catch {
      toast({ title: "Erro ao atualizar estado", variant: "destructive" });
    }
    setConfirmDialog(null);
  };

  const handleAddMatch = async (businessId: string) => {
    if (!selectedRequestId) return;
    try {
      await createMatch.mutateAsync({ requestId: selectedRequestId, businessId });
      toast({ title: "Negócio associado com sucesso" });
    } catch {
      toast({ title: "Erro ao associar negócio", variant: "destructive" });
    }
  };

  const handleMatchStatusChange = async (matchId: string, status: string) => {
    if (!selectedRequestId) return;
    try {
      await updateMatchStatus.mutateAsync({ id: matchId, status, requestId: selectedRequestId });
      toast({ title: "Estado do match atualizado" });
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  const handleSendReminder = async (matchId: string, businessId: string) => {
    try {
      // Update reminder tracking
      await supabase
        .from("request_business_matches" as any)
        .update({
          reminder_sent_at: new Date().toISOString(),
          reminder_count: 1, // Simplified — ideally increment
        } as any)
        .eq("id", matchId);

      // Create notification for the business
      await supabase
        .from("business_notifications" as any)
        .insert({
          business_id: businessId,
          type: "reminder_request",
          payload: { request_id: selectedRequestId, message: "Tem um pedido pendente a aguardar a sua resposta." },
        } as any);

      // Invoke edge function
      supabase.functions
        .invoke("notify-business", {
          body: { type: "reminder_request", business_id: businessId, request_id: selectedRequestId },
        })
        .catch(() => {});

      toast({ title: "Lembrete enviado com sucesso" });
    } catch {
      toast({ title: "Erro ao enviar lembrete", variant: "destructive" });
    }
  };

  const handleRemoveMatch = async (matchId: string) => {
    try {
      await supabase
        .from("request_business_matches" as any)
        .delete()
        .eq("id", matchId);
      toast({ title: "Match removido" });
    } catch {
      toast({ title: "Erro ao remover", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Pedidos (Leads)</h1>
        <p className="text-muted-foreground">Gestão de pedidos de serviço recebidos</p>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={statusFilter === "all" ? "default" : "outline"} onClick={() => setStatusFilter("all")}>
          Todos ({statusCounts.all})
        </Button>
        {[...STATUS_ORDER, ...SIDE_STATUSES].map((s) => {
          const colors = statusColors[s];
          const count = statusCounts[s] || 0;
          if (count === 0 && statusFilter !== s) return null;
          return (
            <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)} className={statusFilter === s ? "" : `${colors.text}`}>
              {statusLabels[s]} ({count})
            </Button>
          );
        })}
      </div>

      {/* Search + Time Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Pesquisar por utilizador ou descrição..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tempo sem resposta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tempos</SelectItem>
            <SelectItem value="24h">Sem resposta +24h</SelectItem>
            <SelectItem value="48h">Sem resposta +48h</SelectItem>
            <SelectItem value="72h">Sem resposta +72h</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-4 font-medium text-muted-foreground">Utilizador</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Categoria</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Descrição</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Estado</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Empresas</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Tempo</th>
              <th className="text-center p-4 font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((req) => {
              const hoursOld = differenceInHours(new Date(), new Date(req.created_at));
              const isStale = hoursOld > 24 && req.status === "aberto";
              const colors = statusColors[req.status] || statusColors.aberto;
              const mc = matchCounts[req.id];
              const timeColor = req.status === "aberto" ? getTimeAlertColor(hoursOld) : "text-muted-foreground";

              return (
                <tr key={req.id} className={`border-b border-border/50 hover:bg-secondary/20 ${isStale ? "bg-red-50/50 dark:bg-red-950/10" : ""}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {isStale && <Clock className="h-3.5 w-3.5 text-destructive flex-shrink-0" />}
                      <div>
                        <p className="font-medium">{req.profiles?.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{req.profiles?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground hidden md:table-cell">
                    {req.categories?.name || "—"}
                    {req.subcategories?.name && <span className="text-xs block">{req.subcategories.name}</span>}
                  </td>
                  <td className="p-4 text-muted-foreground hidden lg:table-cell max-w-xs truncate">
                    {req.description || "—"}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Badge className={`${colors.bg} ${colors.text} border-0 text-xs`}>
                        {statusLabels[req.status] || req.status}
                      </Badge>
                      {STATUS_ORDER.includes(req.status as any) && STATUS_ORDER.indexOf(req.status as any) < STATUS_ORDER.length - 1 && (
                        <Button size="sm" variant="ghost" className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground" onClick={() => handleStatusChange(req.id, STATUS_ORDER[STATUS_ORDER.indexOf(req.status as any) + 1])} title={`Avançar para ${statusLabels[STATUS_ORDER[STATUS_ORDER.indexOf(req.status as any) + 1]]}`}>
                          →
                        </Button>
                      )}
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    {mc ? (
                      <span className="text-xs">
                        <span className="font-medium">{mc.total}</span> contactadas
                        {mc.aceite > 0 && <span className="text-green-600"> · {mc.aceite} aceitou</span>}
                        {mc.recusado > 0 && <span className="text-red-500"> · {mc.recusado} recusou</span>}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">0</span>
                    )}
                  </td>
                  <td className={`p-4 hidden md:table-cell text-xs ${timeColor}`}>
                    {formatDistanceToNow(new Date(req.created_at), { addSuffix: true, locale: pt })}
                  </td>
                  <td className="p-4 text-center">
                    <Button size="sm" variant="ghost" onClick={() => { setSelectedRequestId(req.id); setMatchDialogOpen(true); setBusinessSearch(""); }}>
                      <Eye className="h-4 w-4 mr-1" /> Ver
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhum pedido encontrado.</p>
        )}
      </div>

      {/* Detail + Match Dialog */}
      <Dialog open={matchDialogOpen} onOpenChange={setMatchDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-5">
              {/* Status Stepper */}
              <StatusStepper currentStatus={selectedRequest.status} onStatusChange={(status) => handleStatusChange(selectedRequest.id, status)} />

              {/* Full request details */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="space-y-1">
                  {(selectedRequest as any).urgency === "urgent" && (
                    <div className="flex items-center gap-1 text-destructive text-xs font-bold">
                      <AlertTriangle className="h-3.5 w-3.5" /> URGENTE
                    </div>
                  )}
                  <p className="text-sm font-medium text-primary">
                    {selectedRequest.categories?.name || "Sem categoria"}
                    {selectedRequest.subcategories?.name ? ` → ${selectedRequest.subcategories.name}` : ""}
                  </p>
                  <p className="text-foreground">{selectedRequest.description || "Sem descrição"}</p>
                </div>

                {/* Location */}
                {((selectedRequest as any).location_city || (selectedRequest as any).full_address) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {[(selectedRequest as any).location_city, (selectedRequest as any).location_postal_code, (selectedRequest as any).full_address].filter(Boolean).join(", ")}
                  </div>
                )}

                {/* New fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
                  {(selectedRequest as any).preferred_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Data: {new Date((selectedRequest as any).preferred_date).toLocaleDateString("pt-PT")}</span>
                    </div>
                  )}
                  {(selectedRequest as any).budget_range && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Orçamento: {BUDGET_LABELS[(selectedRequest as any).budget_range] || (selectedRequest as any).budget_range}</span>
                    </div>
                  )}
                  {(selectedRequest as any).availability && (
                    <div className="flex items-center gap-2 text-sm">
                      <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Disponibilidade: {AVAILABILITY_LABELS[(selectedRequest as any).availability] || (selectedRequest as any).availability}</span>
                    </div>
                  )}
                </div>

                {(selectedRequest as any).additional_notes && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Notas adicionais</p>
                    <p className="text-sm text-foreground">{(selectedRequest as any).additional_notes}</p>
                  </div>
                )}

                {/* Consumer info */}
                {selectedRequest.profiles && (
                  <div className="border-t border-border pt-3 space-y-1 text-sm">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Consumidor</p>
                    {selectedRequest.profiles.full_name && (
                      <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-muted-foreground" />{selectedRequest.profiles.full_name}</div>
                    )}
                    {selectedRequest.profiles.email && (
                      <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /><a href={`mailto:${selectedRequest.profiles.email}`} className="text-primary hover:underline">{selectedRequest.profiles.email}</a></div>
                    )}
                    {(selectedRequest as any).consumer_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <a href={`tel:${(selectedRequest as any).consumer_phone}`} className="text-primary hover:underline">{(selectedRequest as any).consumer_phone}</a>
                      </div>
                    )}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Criado: {new Date(selectedRequest.created_at).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>

              {/* Timeline */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Timeline do Pedido
                </h3>
                <div className="border-l-2 border-border pl-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-primary">✅</span>
                    <span>Pedido recebido — {new Date(selectedRequest.created_at).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  {matches.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-primary">✅</span>
                      <span>Enviado para {matches.length} negócio{matches.length > 1 ? "s" : ""}</span>
                    </div>
                  )}
                  {matches.filter((m: any) => m.status === "aceite").length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">✅</span>
                      <span>{matches.filter((m: any) => m.status === "aceite").length} negócio{matches.filter((m: any) => m.status === "aceite").length > 1 ? "s" : ""} aceitou/aceitaram</span>
                    </div>
                  )}
                  {matches.filter((m: any) => m.status === "enviado").length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500">⏳</span>
                      <span>Aguarda resposta de {matches.filter((m: any) => m.status === "enviado").length} negócio{matches.filter((m: any) => m.status === "enviado").length > 1 ? "s" : ""}</span>
                    </div>
                  )}
                  {selectedRequest.status === "fechado" && selectedRequest.closed_at && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">✅</span>
                      <span>Pedido fechado — {new Date(selectedRequest.closed_at).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Match counter summary */}
              {matches.length > 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm">
                  <strong>{matches.length}</strong> negócios contactados ·{" "}
                  <span className="text-green-600">{matches.filter((m: any) => m.status === "aceite").length} aceitaram</span> ·{" "}
                  <span className="text-red-500">{matches.filter((m: any) => m.status === "recusado").length} recusaram</span> ·{" "}
                  <span className="text-yellow-500">{matches.filter((m: any) => m.status === "enviado").length} sem resposta</span>
                </div>
              )}

              {/* Suggested businesses */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Negócios Sugeridos
                </h3>
                {suggestionsLoading ? (
                  <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                ) : suggestedBusinesses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum negócio encontrado nesta categoria.</p>
                ) : (
                  <div className="space-y-2">
                    {suggestedBusinesses.map((b: any) => {
                      const alreadyMatched = matches.some((m: any) => m.business_id === b.id);
                      return (
                        <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                          <div>
                            <p className="font-medium text-sm">{b.name}</p>
                            <p className="text-xs text-muted-foreground">{b.city || "—"}</p>
                          </div>
                          <Button size="sm" variant={alreadyMatched ? "outline" : "default"} disabled={alreadyMatched} onClick={() => handleAddMatch(b.id)}>
                            <Send className="h-3.5 w-3.5 mr-1" />
                            {alreadyMatched ? "Já enviado" : "Encaminhar"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Existing matches */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold">Negócios Associados ({matches.length})</h3>
                {matches.length > 0 ? (
                  <div className="space-y-2">
                    {matches.map((m: any) => {
                      const matchHours = differenceInHours(new Date(), new Date(m.sent_at));
                      const isMatchStale = m.status === "enviado" && matchHours > 24;
                      const matchTimeColor = m.status === "enviado" ? getTimeAlertColor(matchHours) : "text-muted-foreground";

                      return (
                        <div key={m.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg ${isMatchStale ? "bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800" : "bg-secondary/30"}`}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{m.businesses?.name || "—"}</p>
                              {isMatchStale && <Badge variant="outline" className="text-[10px] border-yellow-500 text-yellow-600">Sem resposta</Badge>}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                              <span>Enviado: {new Date(m.sent_at).toLocaleDateString("pt-PT")}</span>
                              <span className={matchTimeColor}>({formatDistanceToNow(new Date(m.sent_at), { addSuffix: true, locale: pt })})</span>
                              {m.price_quote && <span>• Orçamento: {m.price_quote}</span>}
                              {(m as any).reminder_sent_at && (
                                <span className="text-primary">• Lembrete {formatDistanceToNow(new Date((m as any).reminder_sent_at), { addSuffix: true, locale: pt })}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2 sm:mt-0">
                            {m.status === "enviado" && matchHours > 24 && (
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleSendReminder(m.id, m.business_id)} title="Enviar lembrete">
                                <Bell className="h-3 w-3 mr-1" /> Lembrete
                              </Button>
                            )}
                            <Select value={m.status} onValueChange={(v) => handleMatchStatusChange(m.id, v)}>
                              <SelectTrigger className="w-[120px] h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(matchStatusLabels).map(([k, v]) => (
                                  <SelectItem key={k} value={k}>{v}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveMatch(m.id)} title="Remover match">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum negócio associado ainda.</p>
                )}
              </div>

              {/* Manual add */}
              <div className="border-t pt-4 space-y-2">
                <p className="text-sm font-medium">+ Associar Manualmente</p>
                <Input placeholder="Pesquisar negócio..." value={businessSearch} onChange={(e) => setBusinessSearch(e.target.value)} />
                {businessSearch && (
                  <ManualBusinessSearch search={businessSearch} onSelect={handleAddMatch} existingMatchIds={matches.map((m: any) => m.business_id)} />
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração de estado</AlertDialogTitle>
            <AlertDialogDescription>
              Tens a certeza que queres marcar este pedido como "{confirmDialog ? statusLabels[confirmDialog.status] : ""}"?
              {confirmDialog?.status === "cancelado" && " Esta acção é final."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const ManualBusinessSearch = ({ search, onSelect, existingMatchIds }: { search: string; onSelect: (id: string) => void; existingMatchIds: string[] }) => {
  const { data: results = [], isLoading } = useQuery({
    queryKey: ["admin-business-search", search],
    enabled: search.length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, city")
        .ilike("name", `%${search}%`)
        .eq("is_active", true)
        .limit(10);
      if (error) throw error;
      return data as any[];
    },
  });

  if (isLoading) return <Loader2 className="h-4 w-4 animate-spin mx-auto" />;

  return (
    <div className="max-h-40 overflow-y-auto space-y-1">
      {results.map((b) => {
        const already = existingMatchIds.includes(b.id);
        return (
          <button
            key={b.id}
            disabled={already}
            className="w-full text-left p-2 rounded hover:bg-secondary/50 text-sm flex items-center gap-2 disabled:opacity-50"
            onClick={() => onSelect(b.id)}
          >
            <Building2 className="h-4 w-4 text-muted-foreground" />
            {b.name} {b.city && <span className="text-xs text-muted-foreground">({b.city})</span>}
            {already && <span className="text-xs text-muted-foreground ml-auto">Já associado</span>}
          </button>
        );
      })}
      {results.length === 0 && search.length >= 2 && (
        <p className="text-xs text-muted-foreground p-2">Nenhum resultado.</p>
      )}
    </div>
  );
};

export default ServiceRequestsContent;
