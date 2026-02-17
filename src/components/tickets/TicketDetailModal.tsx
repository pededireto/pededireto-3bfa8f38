import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send, FileText, UserCheck, X } from "lucide-react";
import { TicketStatusBadge, TicketPriorityBadge, CATEGORY_LABELS, DEPARTMENT_LABELS } from "./TicketStatusBadge";
import { useTicketMessages, useSendMessage, useUpdateTicket, useTicketTemplates, useTicketHistory } from "@/hooks/useTickets";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface TicketDetailModalProps {
  ticket: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole?: string;
}

const TicketDetailModal = ({ ticket, open, onOpenChange, userRole = "cs" }: TicketDetailModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: messages = [], isPending: loadingMessages } = useTicketMessages(ticket?.id || null);
  const { data: templates = [] } = useTicketTemplates();
  const { data: history = [] } = useTicketHistory(ticket?.id || null);
  const sendMessage = useSendMessage();
  const updateTicket = useUpdateTicket();

  const [messageText, setMessageText] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [activeTab, setActiveTab] = useState<"conversation" | "internal">("conversation");

  if (!ticket) return null;

  const publicMessages = messages.filter((m: any) => !m.is_internal_note);
  const internalMessages = messages.filter((m: any) => m.is_internal_note);
  const displayMessages = activeTab === "conversation" ? publicMessages : internalMessages;

  const handleSend = async () => {
    if (!messageText.trim()) return;
    try {
      await sendMessage.mutateAsync({
        ticketId: ticket.id,
        message: messageText.trim(),
        isInternalNote: activeTab === "internal" || isInternalNote,
        userRole,
      });
      setMessageText("");
      setIsInternalNote(false);
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      const updates: any = { status };
      if (status === "resolved") updates.resolved_at = new Date().toISOString();
      if (status === "closed") updates.closed_at = new Date().toISOString();
      await updateTicket.mutateAsync({ id: ticket.id, ...updates });
      toast({ title: `Status alterado para ${status}` });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleAssignToMe = async () => {
    try {
      await updateTicket.mutateAsync({ id: ticket.id, assigned_to_user: user?.id, status: "assigned" });
      toast({ title: "Ticket atribuído a ti!" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleSelectTemplate = (templateText: string) => {
    setMessageText(templateText);
    setShowTemplates(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        {/* Header */}
        <div className="border-b p-4 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">{ticket.title}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <TicketStatusBadge status={ticket.status} />
              <TicketPriorityBadge priority={ticket.priority} />
              <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[ticket.category] || ticket.category}</Badge>
              <Badge variant="outline" className="text-xs">{DEPARTMENT_LABELS[ticket.assigned_to_department] || ticket.assigned_to_department}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {ticket.assigned_to_user !== user?.id && (
              <Button size="sm" variant="outline" onClick={handleAssignToMe} disabled={updateTicket.isPending}>
                <UserCheck className="h-3 w-3 mr-1" /> Atribuir a mim
              </Button>
            )}
            <Select value={ticket.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Aberto</SelectItem>
                <SelectItem value="assigned">Atribuído</SelectItem>
                <SelectItem value="in_progress">Em Progresso</SelectItem>
                <SelectItem value="waiting_response">Aguardando</SelectItem>
                <SelectItem value="resolved">Resolvido</SelectItem>
                <SelectItem value="closed">Fechado</SelectItem>
                <SelectItem value="escalated">Escalado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col md:flex-row h-[calc(90vh-140px)]">
          {/* Main area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Tabs */}
            <div className="flex border-b px-4">
              <button
                onClick={() => setActiveTab("conversation")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "conversation" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Conversação ({publicMessages.length})
              </button>
              <button
                onClick={() => setActiveTab("internal")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "internal" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Notas Internas ({internalMessages.length})
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Description as first message */}
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Descrição original</p>
                  <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: pt })}
                  </p>
                </div>
              </div>

              {loadingMessages ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                displayMessages.map((msg: any) => {
                  const isOwn = msg.user_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-lg p-3 ${
                        isOwn
                          ? "bg-primary/10 text-foreground"
                          : "bg-muted text-foreground"
                      }`}>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          {msg.user_role || "staff"}
                          {msg.is_internal_note && " • 🔒 Nota interna"}
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: pt })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply */}
            <div className="border-t p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1"
                    onClick={() => setShowTemplates(!showTemplates)}
                  >
                    <FileText className="h-4 w-4" /> Templates
                  </Button>
                  {showTemplates && (
                    <div className="absolute bottom-full right-0 mb-1 w-72 bg-card border rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                      {templates.map((t: any) => (
                        <button
                          key={t.id}
                          onClick={() => handleSelectTemplate(t.template_text)}
                          className="w-full text-left p-2 hover:bg-muted text-sm border-b last:border-0"
                        >
                          <span className="font-medium">{t.title}</span>
                          <p className="text-xs text-muted-foreground line-clamp-1">{t.template_text}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <Textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={activeTab === "internal" ? "Escreve uma nota interna..." : "Escreve a resposta..."}
                rows={2}
                className="resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSend();
                }}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="internal-note"
                    checked={activeTab === "internal" || isInternalNote}
                    onCheckedChange={(v) => setIsInternalNote(!!v)}
                    disabled={activeTab === "internal"}
                  />
                  <label htmlFor="internal-note" className="text-xs text-muted-foreground">Nota interna</label>
                </div>
                <Button onClick={handleSend} disabled={sendMessage.isPending || !messageText.trim()} size="sm">
                  {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                  Enviar
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full md:w-72 border-t md:border-t-0 md:border-l overflow-y-auto p-4 space-y-4 bg-muted/30">
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Negócio</p>
                <p className="font-medium">{ticket.businesses?.name || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Criado em</p>
                <p>{new Date(ticket.created_at).toLocaleString("pt-PT")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Primeira resposta</p>
                <p>{ticket.first_response_at
                  ? `${Math.round((new Date(ticket.first_response_at).getTime() - new Date(ticket.created_at).getTime()) / 60000)} min`
                  : "Sem resposta"
                }</p>
              </div>
            </div>

            {history.length > 0 && (
              <Accordion type="single" collapsible>
                <AccordionItem value="history">
                  <AccordionTrigger className="text-sm py-2">Histórico ({history.length})</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {history.slice(0, 10).map((h: any, i: number) => (
                        <div key={i} className="text-xs text-muted-foreground border-l-2 border-muted pl-2">
                          <p>{h.action_description || `${h.field_changed}: ${h.old_value} → ${h.new_value}`}</p>
                          <p className="text-[10px]">
                            {h.changed_at && formatDistanceToNow(new Date(h.changed_at), { addSuffix: true, locale: pt })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TicketDetailModal;
