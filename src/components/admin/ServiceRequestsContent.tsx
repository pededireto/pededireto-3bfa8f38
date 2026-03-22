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
import { Loader2, Search, Eye, Building2, AlertTriangle, MapPin, User, Mail, Send, Clock } from "lucide-react";
import { differenceInHours } from "date-fns";

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
      {/* Side statuses */}
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

const ServiceRequestsContent = () => {
  const { data: requests = [], isLoading } = useAllServiceRequests();
  const updateStatus = useUpdateRequestStatus();
  const createMatch = useCreateMatch();
  const updateMatchStatus = useUpdateMatchStatus();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [businessSearch, setBusinessSearch] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{ id: string; status: string } | null>(null);

  const { data: matches = [] } = useRequestMatches(selectedRequestId);

  const selectedRequest = useMemo(
    () => requests.find((r) => r.id === selectedRequestId),
    [requests, selectedRequestId]
  );

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
      return matchesSearch && matchesStatus;
    });
  }, [requests, search, statusFilter]);

  const handleStatusChange = async (id: string, status: string) => {
    // Require confirmation for terminal states
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
        <Button
          size="sm"
          variant={statusFilter === "all" ? "default" : "outline"}
          onClick={() => setStatusFilter("all")}
        >
          Todos ({statusCounts.all})
        </Button>
        {[...STATUS_ORDER, ...SIDE_STATUSES].map((s) => {
          const colors = statusColors[s];
          const count = statusCounts[s] || 0;
          if (count === 0 && statusFilter !== s) return null;
          return (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? "default" : "outline"}
              onClick={() => setStatusFilter(s)}
              className={statusFilter === s ? "" : `${colors.text}`}
            >
              {statusLabels[s]} ({count})
            </Button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por utilizador ou descrição..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
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
              <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Data</th>
              <th className="text-center p-4 font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((req) => {
              const hoursOld = differenceInHours(new Date(), new Date(req.created_at));
              const isStale = hoursOld > 24 && req.status === "aberto";
              const colors = statusColors[req.status] || statusColors.aberto;

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
                      {/* Quick action: advance to next status */}
                      {STATUS_ORDER.includes(req.status as any) && STATUS_ORDER.indexOf(req.status as any) < STATUS_ORDER.length - 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => handleStatusChange(req.id, STATUS_ORDER[STATUS_ORDER.indexOf(req.status as any) + 1])}
                          title={`Avançar para ${statusLabels[STATUS_ORDER[STATUS_ORDER.indexOf(req.status as any) + 1]]}`}
                        >
                          →
                        </Button>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground hidden md:table-cell">
                    {new Date(req.created_at).toLocaleDateString("pt-PT")}
                    {isStale && <span className="text-xs text-destructive block">+24h sem resposta</span>}
                  </td>
                  <td className="p-4 text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedRequestId(req.id);
                        setMatchDialogOpen(true);
                        setBusinessSearch("");
                      }}
                    >
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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-5">
              {/* Status Stepper */}
              <StatusStepper
                currentStatus={selectedRequest.status}
                onStatusChange={(status) => handleStatusChange(selectedRequest.id, status)}
              />

              {/* Request details */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    {selectedRequest.urgency === "urgent" && (
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
                </div>

                {(selectedRequest as any).location_city && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {[(selectedRequest as any).location_city, (selectedRequest as any).location_postal_code].filter(Boolean).join(", ")}
                  </div>
                )}

                {selectedRequest.profiles && (
                  <div className="border-t border-border pt-3 space-y-1 text-sm">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Consumidor</p>
                    {selectedRequest.profiles.full_name && (
                      <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-muted-foreground" />{selectedRequest.profiles.full_name}</div>
                    )}
                    {selectedRequest.profiles.email && (
                      <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /><a href={`mailto:${selectedRequest.profiles.email}`} className="text-primary hover:underline">{selectedRequest.profiles.email}</a></div>
                    )}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Criado: {new Date(selectedRequest.created_at).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>

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
                          <Button
                            size="sm"
                            variant={alreadyMatched ? "outline" : "default"}
                            disabled={alreadyMatched}
                            onClick={() => handleAddMatch(b.id)}
                          >
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
                    {matches.map((m: any) => (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                        <div>
                          <p className="font-medium text-sm">{m.businesses?.name || "—"}</p>
                          <p className="text-xs text-muted-foreground">
                            Enviado: {new Date(m.sent_at).toLocaleDateString("pt-PT")}
                            {m.price_quote && ` • Orçamento: ${m.price_quote}`}
                          </p>
                        </div>
                        <Select value={m.status} onValueChange={(v) => handleMatchStatusChange(m.id, v)}>
                          <SelectTrigger className="w-[130px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(matchStatusLabels).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum negócio associado ainda.</p>
                )}
              </div>

              {/* Manual add */}
              <div className="border-t pt-4 space-y-2">
                <p className="text-sm font-medium">Associar Manualmente</p>
                <Input
                  placeholder="Pesquisar negócio..."
                  value={businessSearch}
                  onChange={(e) => setBusinessSearch(e.target.value)}
                />
                {businessSearch && (
                  <ManualBusinessSearch
                    search={businessSearch}
                    onSelect={handleAddMatch}
                    existingMatchIds={matches.map((m: any) => m.business_id)}
                  />
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for terminal states */}
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
