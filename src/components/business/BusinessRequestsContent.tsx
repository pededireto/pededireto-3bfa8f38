import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import {
  useBusinessRequests,
  useBusinessRequestsMeta,
  useArchiveRequest,
  useRestoreRequest,
  type RequestArchiveFilter,
} from "@/hooks/useBusinessDashboard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Inbox,
  MapPin,
  Phone,
  Mail,
  AlertTriangle,
  User,
  MessageCircle,
  Send,
  Bell,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  XCircle,
  Lock,
  Archive,
  RotateCcw,
  Search,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatReviewerName } from "@/lib/utils";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  message: string;
  sender_id: string;
  sender_role: string;
  created_at: string;
  read_at: string | null;
}

// ─── Config de estados do match ───────────────────────────────────────────────

const matchStatusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  enviado: { label: "Novo", variant: "secondary" },
  aceite: { label: "Aceite", variant: "default" },
  recusado: { label: "Recusado", variant: "destructive" },
  respondido: { label: "Respondido", variant: "outline" },
};

// ─── Sub-componente: Chat de um pedido (com Realtime) ─────────────────────────

const RequestChat = ({ requestId, onRead }: { requestId: string; onRead: () => void }) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["business-request-messages", requestId],
    refetchInterval: 60000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("request_messages" as any)
        .select("id, message, sender_id, sender_role, created_at, read_at")
        .eq("request_id", requestId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as Message[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(`request-messages-${requestId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "request_messages",
          filter: `request_id=eq.${requestId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["business-request-messages", requestId] });
          qc.invalidateQueries({ queryKey: ["business-requests-meta"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, qc]);

  useEffect(() => {
    if (messages.length === 0) return;
    const unread = messages.filter((m) => m.sender_role === "consumer" && !m.read_at);
    if (unread.length === 0) return;

    supabase
      .from("request_messages" as any)
      .update({ read_at: new Date().toISOString() } as any)
      .in(
        "id",
        unread.map((m) => m.id),
      )
      .then(() => {
        qc.invalidateQueries({ queryKey: ["business-unread-requests-count"] });
        qc.invalidateQueries({ queryKey: ["business-requests-meta"] });
        onRead();
      });
  }, [messages, qc, onRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada.");

      const { error } = await supabase.from("request_messages" as any).insert({
        request_id: requestId,
        sender_id: session.user.id,
        sender_role: "business",
        message: newMessage.trim(),
      } as any);

      if (error) throw error;
      setNewMessage("");
      qc.invalidateQueries({ queryKey: ["business-request-messages", requestId] });
    } catch {
      toast({ title: "Erro ao enviar mensagem", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t pt-4 mt-2 space-y-3">
      <div className="min-h-[160px] max-h-[320px] overflow-y-auto space-y-2 pr-1">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageCircle className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Sem mensagens ainda.</p>
            <p className="text-xs text-muted-foreground mt-0.5">Inicia a conversa com o consumidor abaixo.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isBusiness = msg.sender_role === "business";
            return (
              <div key={msg.id} className={`flex ${isBusiness ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    isBusiness
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}
                >
                  {!isBusiness && <p className="text-xs font-semibold mb-1 opacity-70">Consumidor</p>}
                  <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                  <p className={`text-xs mt-1 ${isBusiness ? "opacity-70 text-right" : "opacity-50"}`}>
                    {new Date(msg.created_at).toLocaleTimeString("pt-PT", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" · "}
                    {new Date(msg.created_at).toLocaleDateString("pt-PT", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escreve uma mensagem… (Enter para enviar)"
          className="resize-none min-h-[60px] max-h-[120px]"
          disabled={sending}
        />
        <Button
          onClick={handleSend}
          disabled={!newMessage.trim() || sending}
          size="icon"
          className="flex-shrink-0 self-end h-10 w-10"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props {
  businessId: string;
}

const BusinessRequestsContent = ({ businessId }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [archiveFilter, setArchiveFilter] = useState<RequestArchiveFilter>("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");

  const { data: requests = [], isPending } = useBusinessRequests(businessId, archiveFilter);
  const [openChats, setOpenChats] = useState<Record<string, boolean>>({});
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const archiveMutation = useArchiveRequest();
  const restoreMutation = useRestoreRequest();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Client-side filtering
  const filteredRequests = useMemo(() => {
    return requests.filter((match: any) => {
      const sr = match.service_requests;

      // Status filter
      if (statusFilter !== "all" && match.status !== statusFilter) return false;

      // Urgency filter
      if (urgencyFilter === "urgent" && sr?.urgency !== "urgent") return false;
      if (urgencyFilter === "normal" && sr?.urgency === "urgent") return false;

      // Search filter
      if (debouncedSearch) {
        const s = debouncedSearch.toLowerCase();
        const desc = (sr?.description || "").toLowerCase();
        const name = (sr?.profiles?.full_name || sr?.consumer_name || "").toLowerCase();
        const city = (sr?.location_city || "").toLowerCase();
        if (!desc.includes(s) && !name.includes(s) && !city.includes(s)) return false;
      }

      return true;
    });
  }, [requests, statusFilter, urgencyFilter, debouncedSearch]);

  const requestIds = filteredRequests.map((m: any) => m.service_requests?.id).filter(Boolean) as string[];
  const { data: requestMeta = {} } = useBusinessRequestsMeta(businessId, requestIds);

  // Counts for tabs (from all requests, not filtered)
  const allActiveCount = requests.filter((m: any) => !m.archived_at).length;
  const allArchivedCount = requests.filter((m: any) => !!m.archived_at).length;

  const toggleChat = (requestId: string) => {
    setOpenChats((prev) => ({ ...prev, [requestId]: !prev[requestId] }));
  };

  const handleRead = useCallback(() => {}, []);

  const handleStatusChange = async (matchId: string, newStatus: "aceite" | "recusado", requestId?: string) => {
    setUpdatingStatus(matchId);
    try {
      const { error } = await supabase
        .from("request_business_matches" as any)
        .update({ status: newStatus } as any)
        .eq("id", matchId);
      if (error) throw error;
      toast({
        title: newStatus === "aceite" ? "Pedido aceite!" : "Pedido recusado",
        description:
          newStatus === "aceite"
            ? "Agora podes ver os dados de contacto e iniciar a conversa."
            : "O pedido foi recusado.",
      });
      qc.invalidateQueries({ queryKey: ["business-requests"] });

      // P2: Notify consumer via email when business accepts
      if (newStatus === "aceite" && requestId) {
        supabase.functions
          .invoke("notify-consumer", {
            body: { type: "match_accepted", request_id: requestId, business_id: businessId },
          })
          .catch((err) => console.error("notify-consumer error:", err));
      }
    } catch {
      toast({ title: "Erro ao atualizar pedido", variant: "destructive" });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleArchive = (matchId: string) => {
    archiveMutation.mutate(matchId, {
      onSuccess: () => toast({ title: "Pedido arquivado" }),
      onError: () => toast({ title: "Erro ao arquivar", variant: "destructive" }),
    });
  };

  const handleRestore = (matchId: string) => {
    restoreMutation.mutate(matchId, {
      onSuccess: () => toast({ title: "Pedido restaurado" }),
      onError: () => toast({ title: "Erro ao restaurar", variant: "destructive" }),
    });
  };

  const renderRequestCard = (match: any) => {
    const sr = match.service_requests;
    const profile = sr?.profiles;
    const isUrgent = sr?.urgency === "urgent";
    const requestId = sr?.id as string | undefined;
    const meta = requestId ? (requestMeta as any)[requestId] : undefined;
    const chatOpen = requestId ? !!openChats[requestId] : false;
    const isAccepted = match.status === "aceite" || match.contact_unlocked === true;
    const isPending = match.status === "enviado" || match.status === "visualizado";
    const isArchived = !!match.archived_at;

    const statusCfg = matchStatusConfig[match.status] || {
      label: match.status,
      variant: "secondary" as const,
    };

    return (
      <div
        key={match.id}
        className={`bg-card rounded-xl p-5 shadow-sm border transition-colors space-y-3 ${
          meta?.hasUnread ? "border-primary/50 bg-primary/[0.02] dark:bg-primary/[0.04]" : "border-border"
        } ${isArchived ? "opacity-70" : ""}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-1 min-w-0">
            {isUrgent && (
              <div className="flex items-center gap-1 text-destructive text-xs font-semibold mb-1">
                <AlertTriangle className="h-3.5 w-3.5" /> URGENTE
              </div>
            )}
            <p className="font-medium text-foreground">{sr?.description || "Pedido sem descrição"}</p>
            <p className="text-sm text-muted-foreground">
              {sr?.categories?.name}
              {sr?.subcategories?.name ? ` • ${sr.subcategories.name}` : ""}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
            {isArchived && <Badge variant="outline" className="text-xs">Arquivado</Badge>}
            {meta?.hasUnread && (
              <span className="flex items-center gap-1 text-xs text-primary font-semibold animate-pulse">
                <Bell className="h-3 w-3" /> Nova mensagem
              </span>
            )}
          </div>
        </div>

        {/* Accept / Reject buttons */}
        {isPending && !isArchived && (
          <div className="flex items-center gap-2 py-1">
            <Button
              size="sm"
              onClick={() => handleStatusChange(match.id, "aceite", requestId)}
              disabled={updatingStatus === match.id}
              className="flex items-center gap-1.5"
            >
              {updatingStatus === match.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Aceitar Pedido
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange(match.id, "recusado", requestId)}
              disabled={updatingStatus === match.id}
              className="flex items-center gap-1.5 text-destructive hover:text-destructive"
            >
              <XCircle className="h-3.5 w-3.5" />
              Recusar
            </Button>
          </div>
        )}

        {/* Consumer info */}
        {isAccepted ? (
          <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
            <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-1">Consumidor</p>
            {(sr?.consumer_name || profile?.full_name) && (
              <div className="flex items-center gap-2 text-foreground">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                {sr?.consumer_name || profile?.full_name}
              </div>
            )}
            {(sr?.consumer_email || profile?.email) && (
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <a href={`mailto:${sr?.consumer_email || profile?.email}`} className="text-primary hover:underline">
                  {sr?.consumer_email || profile?.email}
                </a>
              </div>
            )}
            {(sr?.consumer_phone || profile?.phone) && (
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <a href={`tel:${sr?.consumer_phone || profile?.phone}`} className="text-primary hover:underline">
                  {sr?.consumer_phone || profile?.phone}
                </a>
              </div>
            )}
          </div>
        ) : (
          profile && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
              <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-1">Consumidor</p>
              {(sr?.consumer_name || profile?.full_name) && (
                <div className="flex items-center gap-2 text-foreground">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  {sr?.consumer_name || profile?.full_name}
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground text-xs mt-1">
                <Lock className="h-3 w-3" />
                Aceita o pedido para ver o contacto do consumidor
              </div>
            </div>
          )
        )}

        {/* Location */}
        {(sr?.location_city || sr?.location_postal_code || sr?.address) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {[sr?.address, sr?.location_city, sr?.location_postal_code].filter(Boolean).join(", ")}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-xs text-muted-foreground">
            {new Date(match.sent_at).toLocaleDateString("pt-PT", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>

          <div className="flex items-center gap-2">
            {/* Archive / Restore */}
            {isArchived ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRestore(match.id)}
                disabled={restoreMutation.isPending}
                className="flex items-center gap-1.5 text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Restaurar
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleArchive(match.id)}
                disabled={archiveMutation.isPending}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <Archive className="h-3.5 w-3.5" /> Arquivar
              </Button>
            )}

            {/* Chat button */}
            {requestId && isAccepted && (
              <Button
                size="sm"
                variant={meta?.hasUnread ? "default" : "outline"}
                onClick={() => toggleChat(requestId)}
                className="flex items-center gap-1.5"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                {chatOpen ? "Fechar" : meta?.hasUnread ? "Responder" : "Conversa"}
                {chatOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </Button>
            )}
          </div>
        </div>

        {/* Inline chat */}
        {requestId && chatOpen && isAccepted && <RequestChat requestId={requestId} onRead={handleRead} />}
      </div>
    );
  };

  const renderEmpty = () => {
    const messages: Record<RequestArchiveFilter, { title: string; desc: string }> = {
      active: { title: "Sem pedidos ativos", desc: "Quando receberes novos pedidos, aparecerão aqui." },
      archived: { title: "Sem pedidos arquivados", desc: "Os pedidos que arquivares aparecerão aqui." },
      all: { title: "Sem pedidos recebidos", desc: "Ainda não recebeste nenhum pedido de consumidores." },
    };
    const msg = messages[archiveFilter];
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Inbox className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p className="font-medium">{msg.title}</p>
        <p className="text-sm mt-1">{msg.desc}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Pedidos Recebidos</h1>
        <p className="text-muted-foreground">Pedidos de orçamento e serviços dos consumidores</p>
      </div>

      {/* Tabs */}
      <Tabs value={archiveFilter} onValueChange={(v) => setArchiveFilter(v as RequestArchiveFilter)}>
        <TabsList>
          <TabsTrigger value="active" className="flex items-center gap-1.5">
            Ativos
            {allActiveCount > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs h-5 min-w-5 px-1.5">{allActiveCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="archived" className="flex items-center gap-1.5">
            Arquivados
            {allArchivedCount > 0 && (
              <Badge variant="outline" className="ml-1 text-xs h-5 min-w-5 px-1.5">{allArchivedCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
        </TabsList>

        {/* Filters bar */}
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por descrição, nome ou cidade…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="enviado">Novo</SelectItem>
              <SelectItem value="aceite">Aceite</SelectItem>
              <SelectItem value="recusado">Recusado</SelectItem>
              <SelectItem value="respondido">Respondido</SelectItem>
            </SelectContent>
          </Select>
          <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Urgência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {isPending ? (
          <div className="space-y-4 mt-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          renderEmpty()
        ) : (
          <div className="space-y-4 mt-4">
            {filteredRequests.map(renderRequestCard)}
          </div>
        )}
      </Tabs>
    </div>
  );
};

export default BusinessRequestsContent;
