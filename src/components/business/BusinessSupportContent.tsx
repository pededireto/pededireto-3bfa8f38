import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface SupportMessage {
  id: string;
  content: string;
  sender_type: "user" | "staff";
  sender_name: string | null;
  read_at: string | null;
  created_at: string;
}

interface SupportConversation {
  id: string;
  status: string;
  last_message_at: string;
  unread_count?: number;
}

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Ontem";
  return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" });
};

const BusinessSupportContent = ({ businessId }: { businessId: string }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Carregar conversas ──────────────────────────────────
  const loadConversations = async () => {
    if (!user) return;
    setLoadingConvs(true);
    try {
      const { data, error } = await supabase
        .from("support_conversations" as any)
        .select("id, status, last_message_at")
        .eq("user_id", user.id)
        .order("last_message_at", { ascending: false });

      if (error) throw error;

      // Contar mensagens não lidas (do staff) por conversa
      const convs = await Promise.all(
        (data || []).map(async (conv: any) => {
          const { count } = await supabase
            .from("support_messages" as any)
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .eq("sender_type", "staff")
            .is("read_at", null);
          return { ...conv, unread_count: count || 0 };
        }),
      );

      setConversations(convs);

      // Se não há conversas, criar a primeira automaticamente
      if (convs.length === 0) {
        await createWelcomeConversation();
      }
    } catch (err: any) {
      console.error("Erro ao carregar conversas:", err);
    } finally {
      setLoadingConvs(false);
    }
  };

  // ── Criar conversa de boas-vindas ───────────────────────
  const createWelcomeConversation = async () => {
    if (!user) return;
    try {
      const { data: conv, error: convErr } = await supabase
        .from("support_conversations" as any)
        .insert({
          user_id: user.id,
          business_id: businessId,
          user_type: "business",
          status: "open",
        })
        .select()
        .single();

      if (convErr) throw convErr;

      // Mensagem automática de boas-vindas da equipa
      await supabase.from("support_messages" as any).insert({
        conversation_id: (conv as any).id,
        sender_type: "staff",
        sender_name: "Equipa PedeDireto",
        content:
          "Olá! 👋 Bem-vindo ao suporte da Pede Direto. Estamos aqui para te ajudar a tirar o máximo partido da plataforma. Se tiveres alguma dúvida, é só escrever!",
      });

      await loadConversations();
    } catch (err: any) {
      console.error("Erro ao criar conversa:", err);
    }
  };

  // ── Carregar mensagens de uma conversa ──────────────────
  const loadMessages = async (convId: string) => {
    setLoadingMsgs(true);
    try {
      const { data, error } = await supabase
        .from("support_messages" as any)
        .select("id, content, sender_type, sender_name, read_at, created_at")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages((data || []) as unknown as SupportMessage[]);

      // Marcar mensagens do staff como lidas
      await supabase
        .from("support_messages" as any)
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", convId)
        .eq("sender_type", "staff")
        .is("read_at", null);
    } catch (err: any) {
      console.error("Erro ao carregar mensagens:", err);
    } finally {
      setLoadingMsgs(false);
    }
  };

  // ── Enviar mensagem ─────────────────────────────────────
  const handleSend = async () => {
    if (!messageText.trim() || !selectedConvId || !user) return;
    setSending(true);
    const text = messageText.trim();
    setMessageText("");

    try {
      const { data, error } = await supabase
        .from("support_messages" as any)
        .insert({
          conversation_id: selectedConvId,
          sender_id: user.id,
          sender_type: "user",
          sender_name: "Tu",
          content: text,
        })
        .select()
        .single();

      if (error) throw error;
      setMessages((prev) => [...prev, data as unknown as SupportMessage]);
    } catch (err: any) {
      toast({ title: "Erro ao enviar mensagem", variant: "destructive" });
      setMessageText(text);
    } finally {
      setSending(false);
    }
  };

  // ── Realtime — novas mensagens do staff ─────────────────
  useEffect(() => {
    if (!selectedConvId) return;

    const channel = supabase
      .channel(`support-${selectedConvId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `conversation_id=eq.${selectedConvId}`,
        },
        (payload) => {
          const msg = payload.new as SupportMessage;
          // Só adiciona se não for do próprio utilizador (já foi adicionado optimisticamente)
          if (msg.sender_type === "staff") {
            setMessages((prev) => {
              if (prev.find((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
            // Marcar como lida
            supabase
              .from("support_messages" as any)
              .update({ read_at: new Date().toISOString() })
              .eq("id", msg.id);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConvId]);

  // ── Scroll para o fundo quando chegam mensagens ─────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Carregar conversas no mount ─────────────────────────
  useEffect(() => {
    loadConversations();
  }, [user]);

  // ── Abrir conversa ──────────────────────────────────────
  const openConversation = async (convId: string) => {
    setSelectedConvId(convId);
    await loadMessages(convId);
    // Atualizar contagem de não lidos
    setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, unread_count: 0 } : c)));
  };

  // ── Vista lista de conversas ────────────────────────────
  if (!selectedConvId) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Suporte PedeDireto</h1>
          <p className="text-sm text-muted-foreground">A equipa responde normalmente em menos de 2h úteis</p>
        </div>

        {loadingConvs ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => openConversation(conv.id)}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-card shadow-card hover:bg-muted/50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Equipa PedeDireto</span>
                    <span className="text-xs text-muted-foreground">{formatTime(conv.last_message_at)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {conv.status === "resolved" ? "✅ Resolvido" : "🟢 Em aberto"}
                  </p>
                </div>
                {(conv.unread_count || 0) > 0 && (
                  <Badge className="h-5 min-w-5 flex items-center justify-center text-[10px] px-1">
                    {conv.unread_count}
                  </Badge>
                )}
              </button>
            ))}

            <div className="rounded-xl border border-dashed border-muted-foreground/30 p-6 text-center">
              <MessageCircle className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Precisas de ajuda? A nossa equipa está disponível.</p>
              <Button
                size="sm"
                className="mt-3"
                onClick={async () => {
                  if (conversations.length > 0) {
                    openConversation(conversations[0].id);
                  } else {
                    await createWelcomeConversation();
                  }
                }}
              >
                Enviar mensagem
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Vista de chat ───────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[400px]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <button
          onClick={() => setSelectedConvId(null)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Voltar
        </button>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageCircle className="h-4 w-4 text-primary" />
          </div>
          <div>
            <span className="text-sm font-semibold">Equipa PedeDireto</span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mensagens */}
      <ScrollArea className="flex-1 py-4">
        {loadingMsgs ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 px-1">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender_type === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.sender_type === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted rounded-bl-md"
                  }`}
                >
                  {msg.sender_type === "staff" && (
                    <p className="text-xs font-medium mb-1 opacity-70">{msg.sender_name || "Equipa PedeDireto"}</p>
                  )}
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p
                    className={`text-[10px] mt-1 ${
                      msg.sender_type === "user" ? "text-primary-foreground/60" : "text-muted-foreground"
                    }`}
                  >
                    {formatTime(msg.created_at)}
                    {msg.sender_type === "user" && (msg.read_at ? " ✓✓" : " ✓")}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="flex items-center gap-2 pt-4 border-t border-border">
        <Input
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Escreve uma mensagem..."
          className="flex-1"
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          disabled={sending}
        />
        <Button size="icon" onClick={handleSend} disabled={!messageText.trim() || sending}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default BusinessSupportContent;
