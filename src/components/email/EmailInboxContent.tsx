import { useState } from "react";
import { Mail, MailOpen, Reply, AlertCircle, Search, Eye, User } from "lucide-react";
import DOMPurify from "dompurify";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEmailInbox, useUpdateInboxItem } from "@/hooks/useEmailMarketing";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  new: "default",
  read: "secondary",
  replied: "outline",
  archived: "secondary",
};

const EmailInboxContent = () => {
  const { toast } = useToast();
  const { data: emails = [], isPending } = useEmailInbox();
  const updateItem = useUpdateInboxItem();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const filtered = emails.filter((e: any) => {
    const matchSearch = !search ||
      e.from_email.toLowerCase().includes(search.toLowerCase()) ||
      e.subject.toLowerCase().includes(search.toLowerCase()) ||
      (e.from_name || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openDetail = (email: any) => {
    setSelectedEmail(email);
    setDetailOpen(true);
    if (email.status === "new") {
      updateItem.mutate({ id: email.id, status: "read" });
    }
  };

  const markStatus = async (id: string, status: string) => {
    await updateItem.mutateAsync({ id, status });
    toast({ title: `Email marcado como ${status}` });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Inbox</h2>
        <p className="text-muted-foreground">Emails recebidos</p>
      </div>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Pesquisar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="new">Novos</SelectItem>
            <SelectItem value="read">Lidos</SelectItem>
            <SelectItem value="replied">Respondidos</SelectItem>
            <SelectItem value="archived">Arquivados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isPending ? (
        <p className="text-muted-foreground">A carregar...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">Nenhum email encontrado.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((email: any) => (
            <Card key={email.id} className={`cursor-pointer transition-colors hover:bg-muted/50 ${email.status === "new" ? "border-primary/50" : ""}`} onClick={() => openDetail(email)}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="shrink-0">
                  {email.status === "new" ? <Mail className="w-5 h-5 text-primary" /> : <MailOpen className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium truncate ${email.status === "new" ? "text-foreground" : "text-muted-foreground"}`}>
                      {email.from_name || email.from_email}
                    </span>
                    <Badge variant={statusColors[email.status] || "secondary"} className="text-xs">{email.status}</Badge>
                  </div>
                  <p className="text-sm text-foreground truncate">{email.subject}</p>
                  <p className="text-xs text-muted-foreground truncate">{email.body_text?.substring(0, 100) || "—"}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(email.received_at).toLocaleDateString("pt-PT")}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedEmail?.subject}</DialogTitle>
          </DialogHeader>
          {selectedEmail && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{selectedEmail.from_name || "—"}</span>
                <span className="text-muted-foreground">{"<"}{selectedEmail.from_email}{">"}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Recebido: {new Date(selectedEmail.received_at).toLocaleString("pt-PT")}
              </div>
              <div className="border rounded-lg p-4 bg-background">
                {selectedEmail.body_html ? (
                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedEmail.body_html, {
                    ALLOWED_TAGS: [
                      "p", "br", "strong", "em", "b", "i", "u", "s",
                      "ul", "ol", "li", "blockquote", "a", "span", "div",
                      "h1", "h2", "h3", "h4", "h5", "h6", "hr",
                      "table", "thead", "tbody", "tr", "td", "th"
                    ],
                    ALLOWED_ATTR: ["href", "target", "rel", "class", "style"],
                    ALLOW_DATA_ATTR: false,
                  }) }} />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm">{selectedEmail.body_text || "Sem conteúdo"}</pre>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => markStatus(selectedEmail.id, "archived")}>Arquivar</Button>
                <Button variant="outline" size="sm" onClick={() => markStatus(selectedEmail.id, "replied")}>
                  <Reply className="w-3 h-3 mr-1" />Marcar Respondido
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailInboxContent;
