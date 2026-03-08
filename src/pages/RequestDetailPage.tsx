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
  Star,
  ThumbsUp,
  LifeBuoy,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// --- Tipos ---

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

interface RatingState {
  matchId: string;
  businessId: string;
  businessName: string;
  rating: number;
  comment: string;
}

// --- Configs visuais ---

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  novo: { label: "Novo", variant: "secondary" },
  em_contacto: { label: "Em Contacto", variant: "outline" },
  encaminhado: { label: "Encaminhado", variant: "default" },
  aberto: { label: "Aberto", variant: "secondary" },
  em_conversa: { label: "Em Conversa", variant: "outline" },
  fechado: { label: "Resolvido", variant: "default" },
  cancelado: { label: "Cancelado", variant: "destructive" },
  concluido: { label: "Concluido", variant: "default" },
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
  expirado: {
    label: "Expirado",
    icon: <Clock className="h-3.5 w-3.5" />,
    color: "text-muted-foreground",
  },
};

// --- Componente de Estrelas ---

const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`h-8 w-8 transition-colors ${
              star <= (hovered || value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
};

// --- Componente principal ---

const RequestDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratings, setRatings] = useState<RatingState[]>([]);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpMessage, setHelpMessage] = useState("");
  const [submittingHelp, setSubmittingHelp] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  // Query: detalhe do pedido
  const { data: request, isLoading: requestLoading } = useQuery({
    queryKey: ["request-detail", id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_requests" as any)
        .select(
          `
          id, description, status, urgency,
          location_city, location_postal_code, created_at,
          categories:category_id (name),
          subcategories:subcategory_id (name)
        `,
        )
        .eq("id", id!)
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data as unknown as RequestDetail;
    },
  });

  // Query: matches
  const { data: matches = [] } = useQuery({
    queryKey: ["request-matches-detail", id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("request_business_matches" as any)
        .select(
          `
          id, status, sent_at, responded_at, price_quote,
          businesses:business_id (id, name, slug)
        `,
        )
        .eq("request_id", id!)
        .order("sent_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Match[];
    },
  });

  // Query: avaliacoes ja feitas
  const { data: existingRatings = [] } = useQuery({
    queryKey: ["request-ratings", id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("request_ratings" as any)
        .select("match_id, business_id, rating")
        .eq("request_id", id!);
      if (error) throw error;
      return (data || []) as unknown as { match_id: string; business_id: string; rating: number }[];
    },
  });

  // Query: mensagens
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["request-messages", id],
    enabled: !!id && !!user,
    refetchInterval: 60000,
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

  // Query: ticket activo ligado a este pedido (para o banner dinâmico)
  const { data: activeTicket } = useQuery({
    queryKey: ["request-active-ticket", id],
    enabled: !!id && !!user,
    refetchInterval: 30000,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("support_tickets")
        .select("id, status")
        .eq("request_id", id!)
        .not("status", "in", "(resolved,closed)")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data || null) as { id: string; status: string } | null;
    },
  });

  // Realtime: mensagens
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
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, qc]);

  // Realtime: matches
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
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, qc]);

  // Realtime: ticket (para o banner actualizar quando admin entra)
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`consumer-ticket-status-${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "support_tickets",
        },
        () => {
          qc.invalidateQueries({ queryKey: ["request-active-ticket", id] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, qc]);

  // Marcar mensagens como lidas
  useEffect(() => {
    if (!id || !user || messages.length === 0) return;
    const unread = messages.filter((m) => m.sender_role === "business" && !m.read_at);
    if (unread.length === 0) return;
    supabase
      .from("request_messages" as any)
      .update({ read_at: new Date().toISOString() } as any)
      .in(
        "id",
        unread.map((m) => m.id),
      )
      .then(() => {
        qc.invalidateQueries({ queryKey: ["consumer-requests-meta"] });
      });
  }, [messages, id, user, qc]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Enviar mensagem
  const handleSend = async () => {
    if (!newMessage.trim() || !id || !user) return;
    setSending(true);
    try {
      const { error } = await supabase.from("request_messages" as any).insert({
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

  // Marcar como Resolvido
  const handleResolve = async () => {
    if (!id || !user) return;
    const acceptedMatches = matches.filter((m) => m.status === "aceite");
    const alreadyRated = existingRatings.map((r) => r.match_id);
    const toRate = acceptedMatches.filter((m) => !alreadyRated.includes(m.id));
    if (toRate.length > 0) {
      setRatings(
        toRate.map((m) => ({
          matchId: m.id,
          businessId: m.businesses?.id || "",
          businessName: m.businesses?.name || "Negocio",
          rating: 0,
          comment: "",
        })),
      );
      setShowRatingModal(true);
    } else {
      await markResolved();
    }
  };

  const markResolved = async () => {
    if (!id || !user) return;
    setResolving(true);
    try {
      const { error } = await supabase
        .from("service_requests" as any)
        .update({ status: "fechado" } as any)
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["request-detail", id] });
      await qc.refetchQueries({ queryKey: ["request-detail", id] });
      await qc.invalidateQueries({ queryKey: ["consumer-requests"] });
      await qc.invalidateQueries({ queryKey: ["request-matches-detail", id] });
      toast({ title: "Pedido resolvido!", description: "Obrigado por utilizar o Pede Direto." });
    } catch {
      toast({ title: "Erro ao marcar como resolvido", variant: "destructive" });
    } finally {
      setResolving(false);
    }
  };

  // Submeter avaliacoes
  const handleSubmitRatings = async () => {
    if (!id || !user) return;
    setSubmittingRating(true);
    try {
      const toInsert = ratings
        .filter((r) => r.rating > 0)
        .map((r) => ({
          request_id: id,
          match_id: r.matchId,
          business_id: r.businessId,
          consumer_id: user.id,
          rating: r.rating,
          comment: r.comment.trim() || null,
        }));
      if (toInsert.length > 0) {
        const { error } = await supabase.from("request_ratings" as any).insert(toInsert as any);
        if (error) throw error;
      }
      setShowRatingModal(false);
      await markResolved();
      qc.invalidateQueries({ queryKey: ["request-ratings", id] });
    } catch {
      toast({ title: "Erro ao guardar avaliação", variant: "destructive" });
    } finally {
      setSubmittingRating(false);
    }
  };

  const updateRating = (matchId: string, field: "rating" | "comment", value: number | string) => {
    setRatings((prev) => prev.map((r) => (r.matchId === matchId ? { ...r, [field]: value } : r)));
  };

  // Pedir ajuda à equipa
  const handleSubmitHelp = async () => {
    if (!helpMessage.trim() || !id || !user) return;
    setSubmittingHelp(true);
    try {
      const { error: rpcError } = await supabase.rpc("create_consumer_support_ticket" as any, {
        p_title: `Pedido sem resposta: ${request?.description?.slice(0, 60) || "Sem descricao"}`,
        p_description: `Pedido ID: ${id} | Categoria: ${request?.categories?.name || "N/A"}${request?.subcategories?.name ? ` > ${request.subcategories.name}` : ""} | Localização: ${request?.location_city || "N/A"} | Mensagem: ${helpMessage.trim()}`,
        p_category: "request_reassignment",
        p_request_id: id,
      });
      if (rpcError) throw rpcError;
      setShowHelpModal(false);
      setHelpMessage("");
      qc.invalidateQueries({ queryKey: ["request-active-ticket", id] });
      toast({
        title: "Pedido de ajuda enviado!",
        description: "A equipa Pede Direto vai analisar e responder em breve.",
      });
    } catch {
      toast({ title: "Erro ao enviar pedido de ajuda", variant: "destructive" });
    } finally {
      setSubmittingHelp(false);
    }
  };

  // Loading / erro
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
  const isResolved = request.status === "fechado" || request.status === "concluido";
  const hasAcceptedMatch = matches.some((m) => m.status === "aceite");
  const allRefused = matches.length > 0 && matches.every((m) => m.status === "recusado" || m.status === "expirado");

  // P7: Welcome banner for newly created requests (< 60s ago)
  const isNewlyCreated = request && (Date.now() - new Date(request.created_at).getTime()) < 60000;

  // ── Estado do banner ──────────────────────────────────────────────────────
  const bannerState = (() => {
    if (isResolved || !allRefused) return "none";
    if (!activeTicket) return "red";
    if (["assigned", "in_progress", "waiting_response"].includes(activeTicket.status)) return "green";
    return "orange";
  })();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* P7: Welcome banner for newly created requests */}
      {isNewlyCreated && (
        <div className="bg-primary/10 border-b border-primary/20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-start gap-3 max-w-3xl mx-auto">
              <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div>
                <h2 className="font-bold text-foreground">Pedido enviado com sucesso!</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Estamos a contactar os melhores profissionais da sua área.
                  Receberá respostas em breve — normalmente em menos de 2 horas.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Pedido de Ajuda */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="text-center">
              <LifeBuoy className="h-10 w-10 text-primary mx-auto mb-2" />
              <h2 className="text-xl font-bold">Pedir Ajuda à Equipa</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Explica o problema e a nossa equipa vai analisar e encontrar a melhor solução para ti.
              </p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-sm space-y-1">
              <p className="font-medium">
                {request.description?.slice(0, 80)}
                {(request.description?.length || 0) > 80 ? "..." : ""}
              </p>
              <p className="text-muted-foreground text-xs">
                {request.categories?.name}
                {request.subcategories?.name ? ` - ${request.subcategories.name}` : ""} / {request.location_city}
              </p>
            </div>
            <Textarea
              placeholder="Descreve o problema... Ex: O negócio contactado não faz este tipo de serviço. Preciso de encontrar alguém que faça websites."
              className="resize-none min-h-[100px]"
              value={helpMessage}
              onChange={(e) => setHelpMessage(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowHelpModal(false);
                  setHelpMessage("");
                }}
                disabled={submittingHelp}
              >
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSubmitHelp} disabled={submittingHelp || !helpMessage.trim()}>
                {submittingHelp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar Pedido de Ajuda"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Avaliacao */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="text-center">
              <ThumbsUp className="h-10 w-10 text-primary mx-auto mb-2" />
              <h2 className="text-xl font-bold">Como correu?</h2>
              <p className="text-sm text-muted-foreground mt-1">Avalia os profissionais que aceitaram o teu pedido</p>
            </div>
            <div className="space-y-5 max-h-[50vh] overflow-y-auto pr-1">
              {ratings.map((r) => (
                <div key={r.matchId} className="space-y-2 border rounded-xl p-4">
                  <p className="font-semibold text-sm">{r.businessName}</p>
                  <StarRating value={r.rating} onChange={(v) => updateRating(r.matchId, "rating", v)} />
                  <Textarea
                    placeholder="Deixa um comentário (opcional)..."
                    className="resize-none min-h-[70px] text-sm"
                    value={r.comment}
                    onChange={(e) => updateRating(r.matchId, "comment", e.target.value)}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowRatingModal(false);
                  markResolved();
                }}
                disabled={submittingRating}
              >
                Saltar avaliação
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmitRatings}
                disabled={submittingRating || ratings.every((r) => r.rating === 0)}
              >
                {submittingRating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar avaliação"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 container py-8 max-w-4xl">
        {/* Navegacao */}
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Os Meus Pedidos
            </Link>
          </Button>
        </div>

        {/* Cabecalho do pedido */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1">
              {request.categories?.name || "Sem categoria"}
              {request.subcategories?.name ? ` - ${request.subcategories.name}` : ""}
            </p>
            <h1 className="text-2xl font-bold text-foreground leading-snug">
              {request.description
                ? request.description.length > 150
                  ? request.description.slice(0, 150) + "..."
                  : request.description
                : "Sem descrição"}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
              {request.location_city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {request.location_city}
                  {request.location_postal_code ? ` / ${request.location_postal_code}` : ""}
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
              {request.urgency === "urgent" && <span className="text-destructive font-semibold">Urgente</span>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <Badge variant={cfg.variant}>{cfg.label}</Badge>
            {!isResolved && hasAcceptedMatch && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleResolve}
                disabled={resolving}
                className="flex items-center gap-1.5 text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-950/20"
              >
                {resolving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Marcar como Resolvido
              </Button>
            )}
          </div>
        </div>

        {/* ── Banner dinâmico (🔴 vermelho / 🟠 laranja / 🟢 verde) ── */}
        {bannerState !== "none" && (
          <div
            className={`mb-4 rounded-xl border p-4 flex items-start gap-3 transition-all ${
              bannerState === "red"
                ? "border-destructive/30 bg-destructive/5"
                : bannerState === "orange"
                  ? "border-orange-400/40 bg-orange-50/50 dark:bg-orange-950/20"
                  : "border-green-500/40 bg-green-50/50 dark:bg-green-950/20"
            }`}
          >
            <AlertCircle
              className={`h-5 w-5 shrink-0 mt-0.5 ${
                bannerState === "red"
                  ? "text-destructive"
                  : bannerState === "orange"
                    ? "text-orange-500"
                    : "text-green-600"
              }`}
            />
            <div className="flex-1 min-w-0">
              <p
                className={`font-semibold text-sm ${
                  bannerState === "red"
                    ? "text-destructive"
                    : bannerState === "orange"
                      ? "text-orange-600 dark:text-orange-400"
                      : "text-green-700 dark:text-green-400"
                }`}
              >
                {bannerState === "red" && "Nenhum profissional aceitou este pedido"}
                {bannerState === "orange" && "A equipa Pede Direto está a analisar o teu pedido"}
                {bannerState === "green" && "A equipa Pede Direto está a tratar do teu pedido"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {bannerState === "red" &&
                  "Os negócios contactados recusaram ou não responderam. A nossa equipa pode ajudar-te a encontrar a solução certa."}
                {bannerState === "orange" && "Recebemos o teu pedido de ajuda e vamos responder em breve."}
                {bannerState === "green" &&
                  "Um membro da nossa equipa entrou no teu caso e está a trabalhar para encontrar a solução ideal."}
              </p>
            </div>
            {/* Botão só aparece no estado vermelho */}
            {bannerState === "red" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowHelpModal(true)}
                className="shrink-0 flex items-center gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                <LifeBuoy className="h-3.5 w-3.5" />
                Pedir Ajuda
              </Button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna principal: Chat */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  Conversa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="min-h-[240px] max-h-[420px] overflow-y-auto space-y-3 pr-1">
                  {messagesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <MessageCircle className="h-10 w-10 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">Ainda não há mensagens neste pedido.</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Quando um profissional responder, a conversa aparece aqui.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isConsumer = msg.sender_role === "consumer";
                      return (
                        <div key={msg.id} className={`flex ${isConsumer ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                              isConsumer
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-muted text-foreground rounded-bl-sm"
                            }`}
                          >
                            {!isConsumer && (
                              <p className="text-xs font-semibold mb-1 opacity-70">
                                {msg.sender_role === "admin" ? "Equipa Pede Direto" : "Profissional"}
                              </p>
                            )}
                            <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                            <p className={`text-xs mt-1 ${isConsumer ? "opacity-70 text-right" : "opacity-50"}`}>
                              {new Date(msg.created_at).toLocaleTimeString("pt-PT", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {" / "}
                              {new Date(msg.created_at).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {!isResolved ? (
                  <div className="flex gap-2 pt-2 border-t">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Escreve uma mensagem... (Enter para enviar)"
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
                ) : (
                  <div className="pt-2 border-t text-center">
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Este pedido foi marcado como resolvido
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Coluna lateral: Negocios contactados */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Negócios Contactados
                  {matches.length > 0 && (
                    <span className="ml-auto text-xs font-normal text-muted-foreground">{matches.length}</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {matches.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Ainda nenhum negócio foi contactado.</p>
                ) : (
                  <div className="space-y-3">
                    {matches.map((match) => {
                      const ms = matchStatusConfig[match.status] || {
                        label: match.status,
                        icon: <Clock className="h-3.5 w-3.5" />,
                        color: "text-muted-foreground",
                      };
                      const isAccepted = match.status === "aceite";
                      const alreadyRated = existingRatings.some((r) => r.match_id === match.id);
                      return (
                        <div
                          key={match.id}
                          className={`flex items-start justify-between gap-2 py-2 border-b last:border-0 ${
                            isAccepted ? "bg-green-50/50 dark:bg-green-950/10 -mx-2 px-2 rounded-lg" : ""
                          }`}
                        >
                          <div className="min-w-0 w-full">
                            {match.businesses?.slug ? (
                              <Link
                                to={`/negocio/${match.businesses.slug}`}
                                className={`text-sm font-medium hover:text-primary transition-colors truncate block ${
                                  isAccepted ? "text-green-700 dark:text-green-400" : ""
                                }`}
                              >
                                {match.businesses?.name || "Negocio"}
                              </Link>
                            ) : (
                              <p className="text-sm font-medium truncate">{match.businesses?.name || "Negocio"}</p>
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
                            {isAccepted && isResolved && alreadyRated && (
                              <span className="flex items-center gap-1 text-xs text-yellow-600 mt-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                Avaliado
                              </span>
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
