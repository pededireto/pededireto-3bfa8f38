import { useRef, useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useBusinessRequests, useBusinessRequestsMeta } from "@/hooks/useBusinessDashboard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

const matchStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  enviado:    { label: "Novo",        variant: "secondary"    },
  aceite:     { label: "Aceite",      variant: "default"      },
  recusado:   { label: "Recusado",    variant: "destructive"  },
  respondido: { label: "Respondido",  variant: "outline"      },
};

// ─── Sub-componente: Chat de um pedido (com Realtime) ─────────────────────────

const RequestChat = ({
  requestId,
  businessUserId,
  onRead,
}: {
  requestId: string;
  businessUserId: string;
  onRead: () => void;
}) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Buscar mensagens
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["business-request-messages", requestId],
    refetchInterval: 60000, // fallback polling reduzido (realtime é o principal)
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

  // Supabase Realtime subscription
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, qc]);

  // Marcar mensagens do consumidor como lidas
  useEffect(() => {
    if (messages.length === 0) return;
    const unread = messages.filter((m) => m.sender_role === "consumer" && !m.read_at);
    if (unread.length === 0) return;

    supabase
      .from("request_messages" as any)
      .update({ read_at: new Date().toISOString() } as any)
      .in("id", unread.map((m) => m.id))
      .then(() => {
        qc.invalidateQueries({ queryKey: ["business-unread-requests-count"] });
        qc.invalidateQueries({ queryKey: ["business-requests-meta"] });
        onRead();
      });
  }, [messages, qc, onRead]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase
        .from("request_messages" as any)
        .insert({
          request_id: requestId,
          sender_id: businessUserId,
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
            <p className="text-xs text-muted-foreground mt-0.5">
              Inicia a conversa com o consumidor abaixo.
            </p>
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
                  {!isBusiness && (
                    <p className="text-xs font-semibold mb-1 opacity-70">Consumidor</p>
                  )}
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
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props { businessId: string; }

const BusinessRequestsContent = ({ businessId }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: requests = [], isLoading } = useBusinessRequests(businessId);
  const [openChats, setOpenChats] = useState<Record<string, boolean>>({});
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const requestIds = requests
    .map((m: any) => m.service_requests?.id)
    .filter(Boolean) as string[];

  const { data: requestMeta = {} } = useBusinessRequestsMeta(businessId, requestIds);

  const toggleChat = (requestId: string) => {
    setOpenChats((prev) => ({ ...prev, [requestId]: !prev[requestId] }));
  };

  const handleRead = useCallback(() => {}, []);

  // ── Aceitar / Recusar pedido ──────────────────────────────────────────────
  const handleStatusChange = async (matchId: string, newStatus: "aceite" | "recusado") => {
    setUpdatingStatus(matchId);
    try {
      const { error } = await supabase
        .from("request_business_matches" as any)
        .update({ status: newStatus } as any)
        .eq("id", matchId);
      if (error) throw error;
      toast({
        title: newStatus === "aceite" ? "Pedido aceite!" : "Pedido recusado",
        description: newStatus === "aceite"
          ? "Agora podes ver os dados de contacto e iniciar a conversa."
          : "O pedido foi recusado.",
      });
      qc.invalidateQueries({ queryKey: ["business-requests"] });
    } catch {
      toast({ title: "Erro ao atualizar pedido", variant: "destructive" });
    } finally {
      setUpdatingStatus(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Pedidos Recebidos</h1>
        <p className="text-muted-foreground">Pedidos de orçamento e serviços dos consumidores</p>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Inbox className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Sem pedidos recebidos.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((match: any) => {
            const sr        = match.service_requests;
            const profile   = sr?.profiles;
            const isUrgent  = sr?.urgency === "urgent";
            const requestId = sr?.id as string | undefined;
            const meta      = requestId ? (requestMeta as any)[requestId] : undefined;
            const chatOpen  = requestId ? !!openChats[requestId] : false;
            const isAccepted = match.status === "aceite" || match.contact_unlocked === true;
            const isPending  = match.status === "enviado" || match.status === "visualizado";

            const statusCfg = matchStatusConfig[match.status] || {
              label: match.status,
              variant: "secondary" as const,
            };

            return (
              <div
                key={match.id}
                className={`bg-card rounded-xl p-5 shadow-sm border transition-colors space-y-3 ${
                  meta?.hasUnread ? "border-primary/50 bg-primary/[0.02] dark:bg-primary/[0.04]" : "border-border"
                }`}
              >
                {/* ── Cabeçalho ── */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1 min-w-0">
                    {isUrgent && (
                      <div className="flex items-center gap-1 text-destructive text-xs font-semibold mb-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> URGENTE
                      </div>
                    )}
                    <p className="font-medium text-foreground">
                      {sr?.description || "Pedido sem descrição"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {sr?.categories?.name}
                      {sr?.subcategories?.name ? ` • ${sr.subcategories.name}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                    {meta?.hasUnread && (
                      <span className="flex items-center gap-1 text-xs text-primary font-semibold animate-pulse">
                        <Bell className="h-3 w-3" /> Nova mensagem
                      </span>
                    )}
                  </div>
                </div>

                {/* ── Botões Aceitar / Recusar (só se ainda pendente) ── */}
                {isPending && (
                  <div className="flex items-center gap-2 py-1">
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(match.id, "aceite")}
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
                      onClick={() => handleStatusChange(match.id, "recusado")}
                      disabled={updatingStatus === match.id}
                      className="flex items-center gap-1.5 text-destructive hover:text-destructive"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Recusar
                    </Button>
                  </div>
                )}

                {/* ── Info do consumidor (condicional ao status) ── */}
                {profile && (
                  <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                    <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      Consumidor
                    </p>
                    {/* Nome sempre visível */}
                    {profile.full_name && (
                      <div className="flex items-center gap-2 text-foreground">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        {profile.full_name}
                      </div>
                    )}
                    {/* Email e telefone só após aceitação */}
                    {isAccepted ? (
                      <>
                        {profile.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            <a href={`mailto:${profile.email}`} className="text-primary hover:underline">
                              {profile.email}
                            </a>
                          </div>
                        )}
                        {profile.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            <a href={`tel:${profile.phone}`} className="text-primary hover:underline">
                              {profile.phone}
                            </a>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground text-xs mt-1">
                        <Lock className="h-3 w-3" />
                        Aceita o pedido para ver o contacto do consumidor
                      </div>
                    )}
                  </div>
                )}

                {/* ── Localização ── */}
                {(sr?.location_city || sr?.location_postal_code || sr?.address) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {[sr?.address, sr?.location_city, sr?.location_postal_code]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                )}

                {/* ── Rodapé: data + botão conversa ── */}
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

                  {requestId && (
                    <Button
                      size="sm"
                      variant={meta?.hasUnread ? "default" : "outline"}
                      onClick={() => toggleChat(requestId)}
                      className="flex items-center gap-1.5"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      {chatOpen ? "Fechar" : meta?.hasUnread ? "Responder" : "Conversa"}
                      {chatOpen
                        ? <ChevronUp className="h-3.5 w-3.5" />
                        : <ChevronDown className="h-3.5 w-3.5" />
                      }
                    </Button>
                  )}
                </div>

                {/* ── Chat inline ── */}
                {requestId && chatOpen && user && (
                  <RequestChat
                    requestId={requestId}
                    businessUserId={user.id}
                    onRead={handleRead}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BusinessRequestsContent;
