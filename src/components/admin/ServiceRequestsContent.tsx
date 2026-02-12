import { useState, useMemo } from "react";
import {
  useAllServiceRequests,
  useRequestMatches,
  useUpdateRequestStatus,
  useCreateMatch,
  useUpdateMatchStatus,
} from "@/hooks/useServiceRequests";
import { useAllBusinesses } from "@/hooks/useBusinesses";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Eye, Plus, Building2 } from "lucide-react";

const statusLabels: Record<string, string> = {
  novo: "Novo",
  em_contacto: "Em Contacto",
  encaminhado: "Encaminhado",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

const statusColors: Record<string, string> = {
  novo: "default",
  em_contacto: "secondary",
  encaminhado: "outline",
  concluido: "default",
  cancelado: "destructive",
};

const matchStatusLabels: Record<string, string> = {
  enviado: "Enviado",
  aceite: "Aceite",
  recusado: "Recusado",
  sem_resposta: "Sem Resposta",
};

const ServiceRequestsContent = () => {
  const { data: requests = [], isLoading } = useAllServiceRequests();
  const { data: businesses = [] } = useAllBusinesses();
  const updateStatus = useUpdateRequestStatus();
  const createMatch = useCreateMatch();
  const updateMatchStatus = useUpdateMatchStatus();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [businessSearch, setBusinessSearch] = useState("");

  const { data: matches = [] } = useRequestMatches(selectedRequestId);

  const filtered = useMemo(() => {
    return requests.filter(r => {
      const matchesSearch = !search ||
        (r.profiles?.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.profiles?.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.description || "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, search, statusFilter]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast({ title: "Estado atualizado" });
    } catch {
      toast({ title: "Erro ao atualizar estado", variant: "destructive" });
    }
  };

  const handleAddMatch = async (businessId: string) => {
    if (!selectedRequestId) return;
    try {
      await createMatch.mutateAsync({ requestId: selectedRequestId, businessId });
      toast({ title: "Negócio associado ao pedido" });
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

  const filteredBusinesses = businesses.filter(b =>
    b.name.toLowerCase().includes(businessSearch.toLowerCase())
  ).slice(0, 10);

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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por utilizador ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(statusLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-4 shadow-card text-center">
          <p className="text-2xl font-bold">{requests.length}</p>
          <p className="text-sm text-muted-foreground">Total</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card text-center">
          <p className="text-2xl font-bold">{requests.filter(r => r.status === "novo").length}</p>
          <p className="text-sm text-muted-foreground">Novos</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card text-center">
          <p className="text-2xl font-bold">{requests.filter(r => r.status === "encaminhado").length}</p>
          <p className="text-sm text-muted-foreground">Encaminhados</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card text-center">
          <p className="text-2xl font-bold">{requests.filter(r => r.status === "concluido").length}</p>
          <p className="text-sm text-muted-foreground">Concluídos</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-4 font-medium text-muted-foreground">Utilizador</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Categoria</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Descrição</th>
              <th className="text-center p-4 font-medium text-muted-foreground">Estado</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Data</th>
              <th className="text-center p-4 font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((req) => (
              <tr key={req.id} className="border-b border-border/50 hover:bg-secondary/20">
                <td className="p-4">
                  <p className="font-medium">{req.profiles?.full_name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{req.profiles?.email}</p>
                </td>
                <td className="p-4 text-muted-foreground hidden md:table-cell">
                  {req.categories?.name || "—"}
                  {req.subcategories?.name && <span className="text-xs block">{req.subcategories.name}</span>}
                </td>
                <td className="p-4 text-muted-foreground hidden lg:table-cell max-w-xs truncate">
                  {req.description || "—"}
                </td>
                <td className="p-4 text-center">
                  <Select value={req.status} onValueChange={(v) => handleStatusChange(req.id, v)}>
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-4 text-muted-foreground hidden md:table-cell">
                  {new Date(req.created_at).toLocaleDateString("pt-PT")}
                </td>
                <td className="p-4 text-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedRequestId(req.id);
                      setMatchDialogOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" /> Ver
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhum pedido encontrado.</p>
        )}
      </div>

      {/* Match Dialog */}
      <Dialog open={matchDialogOpen} onOpenChange={setMatchDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Negócios Associados</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Existing matches */}
            {matches.length > 0 ? (
              <div className="space-y-2">
                {matches.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div>
                      <p className="font-medium">{m.businesses?.name || "—"}</p>
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

            {/* Add business */}
            <div className="border-t pt-4 space-y-2">
              <p className="text-sm font-medium">Associar Negócio</p>
              <Input
                placeholder="Pesquisar negócio..."
                value={businessSearch}
                onChange={(e) => setBusinessSearch(e.target.value)}
              />
              {businessSearch && (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {filteredBusinesses.map((b) => (
                    <button
                      key={b.id}
                      className="w-full text-left p-2 rounded hover:bg-secondary/50 text-sm flex items-center gap-2"
                      onClick={() => handleAddMatch(b.id)}
                    >
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {b.name}
                    </button>
                  ))}
                  {filteredBusinesses.length === 0 && (
                    <p className="text-xs text-muted-foreground p-2">Nenhum resultado.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceRequestsContent;
