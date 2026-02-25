import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Calendar,
  MessageCircle,
  Send,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface RequestDetail {
  id: string;
  description: string | null;
  status: string;
  urgency: string | null;
  location_city: string | null;
  location_postal_code: string | null;
  created_at: string;
  categories?: { name: string } | null;
  subcategories?: { name: string } | null;
}

interface Match {
  id: string;
  status: string;
  sent_at: string;
  responded_at: string | null;
  price_quote: string | null;
  businesses?: { id: string; name: string; slug: string } | null;
}

interface Message {
  id: string;
  message: string;
  sender_id: string;
  sender_role: string;
  created_at: string;
  read_at: string | null;
}

// ─── Configs visuais ──────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  novo: { label: "Novo", variant: "secondary" },
  em_contacto: { label: "Em Contacto", variant: "outline" },
  encaminhado: { label: "Encaminhado", variant: "default" },
  concluido: { label: "Concluído", variant: "default" },
  cancelado: { label: "Cancelado", variant: "destructive" },
};

const matchStatusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  enviado: {
    label: "Aguarda resposta",
    icon: <Clock className="h-3.5 w-3.5" />,
    color: "text-muted-foreground",
  },
  aceite: {
    label: "Aceitou o pedido",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    color: "text-green-600 dark:text-green-400",
  },
  recusado: {
    label: "Recusou",
    icon: <XCircle className="h-3.5 w-3.5" />,
    color: "text-destructive",
  },
};

// ─── Componente principal ─────────────────────────────────────────────────────

const RequestDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  // ── Query: detalhe do pedido ────────────────────────────────────────────────
  const { data: request, isLoading: requestLoading } = useQuery({
    queryKey: ["request-detail", id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_requests" as any)
        .select(`
          id, description, status, urgency,
          location_city, location_postal_code, created_at,
          categories:category_id (name),
          subcategories:subcategory_id (name)
        `)
        .eq("id", id!)
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data as unknown as RequestDetail;
    },
  });

  // ── Query: matches (negócios contactados) ──────────────────────────────────
  const { data: matches = [] } = useQuery({
    queryKey: ["request-matches-detail", id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("request_business_matches" as any)
        .select(`
          id, status, sent_at, responded_at, price_quote,
          businesses:business_id (id, name, slug)
        `)
        .eq("request_id", id!)
        .order("sent_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Match[];
    },
  });

  // ── Query: mensagens ────────────────────────────────────────────────────────
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["request-messages", id],
    enabled: !!id && !!user,
    refetchInterval: 60000, // fallback (realtime é o principal)
    queryFn: async () => {
      const { data, error } = await supabase
        .from("request_messages" as any)
        .select("id, message, sender_id, sender_role, created_at, read_at")
        .eq("request_id", id!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as Message[];
    },
  });

  // ── Supabase Realtime para mensagens ────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`consumer-request-messages-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "request_messages",
          filter: `request_id=eq.${id}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["request-messages", id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, qc]);

  // ── Supabase Realtime para matches (status updates) ─────────────────────────
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`consumer-request-matches-${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "request_business_matches",
          filter: `request_id=eq.${id}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["request-matches-detail", id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, qc]);

  // ── Marcar mensagens como lidas ─────────────────────────────────────────────
  useEffect(() => {
    if (!id || !user || messages.length === 0) return;
    const unread = messages.filter(
      (m) => m.sender_role === "business" && !m.read_at
    );
    if (unread.length === 0) return;

    supabase
      .from("request_messages" as any)
      .update({ read_at: new Date().toISOString() } as any)
      .in("id", unread.map((m) => m.id))
      .then(() => {
        qc.invalidateQueries({ queryKey: ["consumer-requests-meta"] });
      });
  }, [messages, id, user, qc]);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Enviar mensagem ─────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!newMessage.trim() || !id || !user) return;
    setSending(true);
    try {
      const { error } = await supabase
        .from("request_messages" as any)
        .insert({
          request_id: id,
          sender_id: user.id,
          sender_role: "consumer",
          message: newMessage.trim(),
        } as any);
      if (error) throw error;
      setNewMessage("");
      qc.invalidateQueries({ queryKey: ["request-messages", id] });
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

  // ── Loading / erro ──────────────────────────────────────────────────────────
  if (authLoading || requestLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-16 text-center">
          <p className="text-muted-foreground mb-4">Pedido não encontrado ou sem permissão de acesso.</p>
          <Button asChild variant="outline">
            <Link to="/dashboard">Voltar ao Dashboard</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const cfg = statusConfig[request.status] || { label: request.status, variant: "secondary" as const };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container py-8 max-w-4xl">

        {/* ── Navegação ── */}
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Os Meus Pedidos
            </Link>
          </Button>
        </div>

        {/* ── Cabeçalho do pedido ── */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1">
              {request.categories?.name || "Sem categoria"}
              {request.subcategories?.name ? ` • ${request.subcategories.name}` : ""}
            </p>
            <h1 className="text-2xl font-bold text-foreground leading-snug">
              {request.description
                ? request.description.length > 150
                  ? request.description.slice(0, 150) + "…"
                  : request.description
                : "Sem descrição"}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
              {request.location_city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {request.location_city}
                  {request.location_postal_code ? ` · ${request.location_postal_code}` : ""}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(request.created_at).toLocaleDateString("pt-PT", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              {request.urgency === "urgent" && (
                <span className="text-destructive font-semibold">⚠ Urgente</span>
              )}
            </div>
          </div>
          <Badge variant={cfg.variant} className="flex-shrink-0">
            {cfg.label}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Coluna principal: Chat ── */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  Conversa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">

                {/* Área de mensagens */}
                <div className="min-h-[240px] max-h-[420px] overflow-y-auto space-y-3 pr-1">
                  {messagesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <MessageCircle className="h-10 w-10 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Ainda não há mensagens neste pedido.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Quando um profissional responder, a conversa aparece aqui.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isConsumer = msg.sender_role === "consumer";
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isConsumer ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                              isConsumer
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-muted text-foreground rounded-bl-sm"
                            }`}
                          >
                            {!isConsumer && (
                              <p className="text-xs font-semibold mb-1 opacity-70">Profissional</p>
                            )}
                            <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                            <p className={`text-xs mt-1 ${isConsumer ? "opacity-70 text-right" : "opacity-50"}`}>
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

                {/* Input de mensagem */}
                <div className="flex gap-2 pt-2 border-t">
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
              </CardContent>
            </Card>
          </div>

          {/* ── Coluna lateral: Negócios contactados ── */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Negócios Contactados
                  {matches.length > 0 && (
                    <span className="ml-auto text-xs font-normal text-muted-foreground">
                      {matches.length}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {matches.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Ainda nenhum negócio foi contactado.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {matches.map((match) => {
                      const ms = matchStatusConfig[match.status] || {
                        label: match.status,
                        icon: <Clock className="h-3.5 w-3.5" />,
                        color: "text-muted-foreground",
                      };
                      const isAccepted = match.status === "aceite";
                      return (
                        <div
                          key={match.id}
                          className={`flex items-start justify-between gap-2 py-2 border-b last:border-0 ${
                            isAccepted ? "bg-green-50/50 dark:bg-green-950/10 -mx-2 px-2 rounded-lg" : ""
                          }`}
                        >
                          <div className="min-w-0">
                            {match.businesses?.slug ? (
                              <Link
                                to={`/negocio/${match.businesses.slug}`}
                                className={`text-sm font-medium hover:text-primary transition-colors truncate block ${
                                  isAccepted ? "text-green-700 dark:text-green-400" : ""
                                }`}
                              >
                                {match.businesses?.name || "Negócio"}
                              </Link>
                            ) : (
                              <p className="text-sm font-medium truncate">
                                {match.businesses?.name || "Negócio"}
                              </p>
                            )}
                            <span className={`flex items-center gap-1 text-xs mt-0.5 ${ms.color}`}>
                              {ms.icon}
                              {ms.label}
                            </span>
                            {match.price_quote && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Orçamento: <span className="font-medium text-foreground">{match.price_quote}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RequestDetailPage;
