import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, Loader2, Search, CheckCircle, Circle, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  status: "open" | "resolved";
  user_type: string;
  last_message_at: string;
  created_at: string;
  tags: string[];
  business_id: string | null;
  user_id: string;
  // joins
  business_name?: string;
  user_email?: string;
  unread_count?: number;
  last_message_preview?: string;
}

interface Message {
  id: string;
  content: string;
  sender_type: "user" | "staff";
  sender_name: string | null;
  read_at: string | null;
  created_at: string;
}

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0)
    return date.toLocaleTimeString("pt-PT", {
      hour: "2-digit",
      minute: "2-digit",
    });
  if (diffDays === 1) return "Ontem";
  return date.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
  });
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-green-500/10 text-green-600 border-green-500/20",
  resolved: "bg-muted text-muted-foreground border-border",
};

const AdminSupportContent = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "resolved">("all");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);

  // Nova mensagem para iniciar conversa
  const [showNewConv, setShowNewConv] = useState(false);
  const [newTarget, setNewTarget] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [searchingUser, setSearchingUser] = useState(false);
  const [foundUser, setFoundUser] = useState<any>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Carregar conversas ──────────────────────────────────
  const loadConversations = async () => {
    setLoadingConvs(true);
    try {
      const { data, error } = await supabase
        .from("support_conversations" as any)
        .select("*")
        .order("last_message_at", { ascending: false });

      if (error) throw error;

      // Enriquecer com dados de negócio, user e preview
      const enriched = await Promise.all(
        (data || []).map(async (conv: any) => {
          let business_name = "—";
          let user_email = "—";

          if (conv.business_id) {
            const { data: biz } = await supabase
              .from("businesses")
              .select("name")
              .eq("id", conv.business_id)
              .maybeSingle();
            if (biz) business_name = biz.name;
          }

          if (conv.user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("email")
              .eq("user_id", conv.user_id)
              .maybeSingle();
            if (profile) user_email = (profile as any).email || "—";
          }

          // Última mensagem
          const { data: lastMsg } = await supabase
            .from("support_messages" as any)
            .select("content, sender_type")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          // Mensagens não lidas do utilizador
          const { count: unread } = await supabase
            .from("support_messages" as any)
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .eq("sender_type", "user")
            .is("read_at", null);

          return {
            ...conv,
            business_name,
            user_email,
            last_message_preview: lastMsg
              ? `${lastMsg.sender_type === "staff" ? "Tu: " : ""}${(lastMsg as any).content?.slice(0, 60)}`
              : "Sem mensagens",
            unread_count: unread || 0,
          };
        }),
      );

      setConversations(enriched);
    } catch (err: any) {
      console.error("Erro:", err);
    } finally {
      setLoadingConvs(false);
    }
  };

  // ── Carregar mensagens ──────────────────────────────────
  const loadMessages = async (convId: string) => {
    setLoadingMsgs(true);
    try {
      const { data, error } = await supabase
        .from("support_messages" as any)
        .select("id, content, sender_type, sender_name, read_at, created_at")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages((data || []) as unknown as Message[]);

      // Marcar mensagens do utilizador como lidas
      await supabase
        .from("support_messages" as any)
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", convId)
        .eq("sender_type", "user")
        .is("read_at", null);

      // Actualizar contagem
      setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, unread_count: 0 } : c)));
    } catch (err: any) {
      console.error("Erro mensagens:", err);
    } finally {
      setLoadingMsgs(false);
    }
  };

  // ── Enviar resposta ─────────────────────────────────────
  const handleSend = async () => {
    if (!messageText.trim() || !selectedConv || !user) return;
    setSending(true);
    const text = messageText.trim();
    setMessageText("");

    try {
      const { data, error } = await supabase
        .from("support_messages" as any)
        .insert({
          conversation_id: selectedConv.id,
          sender_id: user.id,
          sender_type: "staff",
          sender_name: "Equipa PedeDireto",
          content: text,
        })
        .select()
        .single();

      if (error) throw error;
      setMessages((prev) => [...prev, data as unknown as Message]);
    } catch (err: any) {
      toast({ title: "Erro ao enviar", variant: "destructive" });
      setMessageText(text);
    } finally {
      setSending(false);
    }
  };

  // ── Marcar como resolvido ───────────────────────────────
  const toggleResolved = async () => {
    if (!selectedConv) return;
    const newStatus = selectedConv.status === "open" ? "resolved" : "open";
    await supabase
      .from("support_conversations" as any)
      .update({ status: newStatus })
      .eq("id", selectedConv.id);

    setSelectedConv((prev) => (prev ? { ...prev, status: newStatus } : prev));
    setConversations((prev) => prev.map((c) => (c.id === selectedConv.id ? { ...c, status: newStatus } : c)));
  };

  // ── Iniciar conversa com utilizador ────────────────────
  const handleSearchUser = async () => {
    if (!newTarget.trim()) return;
    setSearchingUser(true);
    try {
      const { data } = await supabase
        .from("businesses")
        .select("id, name, owner_email")
        .ilike("name", `%${newTarget}%`)
        .limit(5);
      setFoundUser(data || []);
    } finally {
      setSearchingUser(false);
    }
  };

  const handleStartConversation = async (biz: any) => {
    if (!newMessage.trim() || !user) return;
    try {
      // Encontrar user_id do negócio
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", biz.owner_email)
        .maybeSingle();

      if (!profile) {
        toast({
          title: "Utilizador não encontrado",
          description: "O negócio não tem utilizador associado",
          variant: "destructive",
        });
        return;
      }

      // Criar conversa
      const { data: conv, error } = await supabase
        .from("support_conversations" as any)
        .insert({
          user_id: (profile as any).user_id,
          business_id: biz.id,
          user_type: "business",
          status: "open",
        })
        .select()
        .single();

      if (error) throw error;

      // Enviar mensagem inicial
      await supabase.from("support_messages" as any).insert({
        conversation_id: (conv as any).id,
        sender_id: user.id,
        sender_type: "staff",
        sender_name: "Equipa PedeDireto",
        content: newMessage.trim(),
      });

      toast({ title: "Conversa iniciada com sucesso!" });
      setShowNewConv(false);
      setNewTarget("");
      setNewMessage("");
      setFoundUser(null);
      await loadConversations();
    } catch (err: any) {
      toast({ title: "Erro ao iniciar conversa", variant: "destructive" });
    }
  };

  // ── Realtime ────────────────────────────────────────────
  useEffect(() => {
    if (!selectedConv) return;
    const channel = supabase
      .channel(`admin-support-${selectedConv.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `conversation_id=eq.${selectedConv.id}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.sender_type === "user") {
            setMessages((prev) => {
              if (prev.find((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
            // Marcar como lida imediatamente
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
  }, [selectedConv?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    loadConversations();
  }, []);

  // ── Filtros ─────────────────────────────────────────────
  const filtered = conversations.filter((c) => {
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    const matchSearch =
      !search ||
      c.business_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.user_email?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Suporte & Mensagens</h1>
          {totalUnread > 0 && <Badge variant="destructive">{totalUnread} não lidas</Badge>}
        </div>
        <Button size="sm" onClick={() => setShowNewConv(!showNewConv)}>
          + Nova mensagem
        </Button>
      </div>

      {/* Painel de nova conversa */}
      {showNewConv && (
        <div className="mb-4 p-4 rounded-xl border border-border bg-card space-y-3">
          <h3 className="font-semibold text-sm">Iniciar conversa com negócio</h3>
          <div className="flex gap-2">
            <Input
              placeholder="Nome do negócio..."
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchUser()}
            />
            <Button size="sm" onClick={handleSearchUser} disabled={searchingUser}>
              {searchingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          {Array.isArray(foundUser) && foundUser.length > 0 && (
            <div className="space-y-2">
              {foundUser.map((biz: any) => (
                <div key={biz.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{biz.name}</p>
                    <p className="text-xs text-muted-foreground">{biz.owner_email}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setFoundUser(biz)}>
                    Seleccionar
                  </Button>
                </div>
              ))}
            </div>
          )}
          {foundUser && !Array.isArray(foundUser) && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                A enviar para: <strong>{foundUser.name}</strong>
              </p>
              <Textarea
                placeholder="Mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={3}
              />
              <Button size="sm" onClick={() => handleStartConversation(foundUser)} disabled={!newMessage.trim()}>
                Enviar e iniciar conversa
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Split panel */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* Lista de conversas */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-2">
          {/* Filtros */}
          <div className="flex gap-2">
            <Input
              placeholder="Pesquisar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 h-8 text-xs"
            />
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="open">Abertos</SelectItem>
                <SelectItem value="resolved">Resolvidos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista */}
          <ScrollArea className="flex-1">
            {loadingConvs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sem conversas</p>
            ) : (
              <div className="space-y-1 pr-1">
                {filtered.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setSelectedConv(conv);
                      loadMessages(conv.id);
                    }}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors",
                      selectedConv?.id === conv.id
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-muted/50 border border-transparent",
                    )}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <MessageCircle className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold truncate">{conv.business_name}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
                          {formatTime(conv.last_message_at)}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">{conv.last_message_preview}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <span
                          className={cn("text-[10px] px-1.5 py-0.5 rounded-full border", STATUS_COLORS[conv.status])}
                        >
                          {conv.status === "open" ? "Aberto" : "Resolvido"}
                        </span>
                        {(conv.unread_count || 0) > 0 && (
                          <Badge className="h-4 text-[10px] px-1 ml-auto">{conv.unread_count}</Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Painel de conversa */}
        <div className="flex-1 flex flex-col border border-border rounded-xl overflow-hidden min-w-0">
          {!selectedConv ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Selecciona uma conversa</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header da conversa */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
                <div>
                  <p className="font-semibold text-sm">{selectedConv.business_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedConv.user_email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={toggleResolved}>
                    {selectedConv.status === "open" ? (
                      <>
                        <CheckCircle className="h-3 w-3" /> Resolver
                      </>
                    ) : (
                      <>
                        <Circle className="h-3 w-3" /> Reabrir
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Mensagens */}
              <ScrollArea className="flex-1 p-4">
                {loadingMsgs ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_type === "staff" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={cn(
                            "max-w-[75%] rounded-2xl px-4 py-3 text-sm",
                            msg.sender_type === "staff"
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-muted rounded-bl-md",
                          )}
                        >
                          {msg.sender_type === "user" && (
                            <p className="text-xs font-medium mb-1 opacity-70">{selectedConv.business_name}</p>
                          )}
                          <p className="leading-relaxed">{msg.content}</p>
                          <p
                            className={cn(
                              "text-[10px] mt-1",
                              msg.sender_type === "staff" ? "text-primary-foreground/60" : "text-muted-foreground",
                            )}
                          >
                            {formatTime(msg.created_at)}
                            {msg.sender_type === "staff" && (msg.read_at ? " ✓✓" : " ✓")}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input resposta */}
              {selectedConv.status === "open" ? (
                <div className="flex items-end gap-2 p-3 border-t border-border">
                  <Textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Escreve a tua resposta..."
                    className="flex-1 min-h-[60px] max-h-[120px] resize-none text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    disabled={sending}
                  />
                  <Button
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    onClick={handleSend}
                    disabled={!messageText.trim() || sending}
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              ) : (
                <div className="p-3 border-t border-border text-center">
                  <p className="text-xs text-muted-foreground">
                    Conversa resolvida —{" "}
                    <button className="text-primary hover:underline" onClick={toggleResolved}>
                      Reabrir
                    </button>
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSupportContent;
