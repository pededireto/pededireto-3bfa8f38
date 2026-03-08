import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmailTemplates, renderTemplate } from "@/hooks/useEmailMarketing";
import { useToast } from "@/hooks/use-toast";
import { Download, Send, Trash2, Search, Users, Mail, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

// ─── HOOKS ────────────────────────────────────────────────
const useNewsletterSubscribers = () => {
  return useQuery({
    queryKey: ["newsletter-subscribers"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("newsletter_subscribers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as { id: string; email: string; source: string | null; created_at: string; is_active: boolean }[];
    },
  });
};

const useDeleteSubscriber = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("newsletter_subscribers")
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["newsletter-subscribers"] }),
  });
};

// ─── COMPONENT ────────────────────────────────────────────
const NewsletterContent = () => {
  const { toast } = useToast();
  const { data: subscribers = [], isPending } = useNewsletterSubscribers();
  const { data: templates = [] } = useEmailTemplates();
  const deleteSubscriber = useDeleteSubscriber();
  const [search, setSearch] = useState("");
  const [sendOpen, setSendOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [sending, setSending] = useState(false);

  const [form, setForm] = useState({
    subject: "",
    templateId: "",
    customHtml: "",
  });

  const activeSubscribers = subscribers.filter((s) => s.is_active !== false);
  const filtered = activeSubscribers.filter((s) =>
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportCSV = () => {
    const csv = ["email,source,data_subscricao"]
      .concat(activeSubscribers.map((s) => `${s.email},${s.source || ""},${s.created_at}`))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter_subscribers_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exportado com sucesso" });
  };

  const getEmailHtml = (): string => {
    if (form.templateId) {
      const template = templates.find((t: any) => t.id === form.templateId);
      return template?.html_content || "";
    }
    return form.customHtml;
  };

  const handlePreview = () => {
    const html = getEmailHtml();
    if (!html) {
      toast({ title: "Sem conteúdo para preview", variant: "destructive" });
      return;
    }
    setPreviewHtml(renderTemplate(html, { nome: "Subscritor", email: "exemplo@email.pt" }));
    setPreviewOpen(true);
  };

  const handleSend = async () => {
    const html = getEmailHtml();
    if (!form.subject || !html) {
      toast({ title: "Preencha o assunto e conteúdo", variant: "destructive" });
      return;
    }
    if (!confirm(`Enviar newsletter para ${activeSubscribers.length} subscritores?`)) return;

    setSending(true);
    let sent = 0;
    let errors = 0;

    // Add unsubscribe footer
    const siteUrl = window.location.origin;
    const htmlWithUnsub = html + `
      <div style="text-align:center;margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#999;">
        <p>Recebeu este email porque se subscreveu à newsletter PedeDireto.</p>
        <p><a href="${siteUrl}/unsubscribe?email={{email}}" style="color:#999;">Cancelar subscrição</a></p>
      </div>
    `;

    for (const sub of activeSubscribers) {
      try {
        const finalHtml = renderTemplate(htmlWithUnsub, { nome: "Subscritor", email: sub.email });
        const { error } = await supabase.functions.invoke("send-email", {
          body: {
            to: sub.email,
            subject: form.subject,
            html: finalHtml,
            metadata: { recipient_type: "newsletter", source: "newsletter_blast" },
          },
        });
        if (error) {
          errors++;
        } else {
          sent++;
        }
      } catch {
        errors++;
      }
    }

    setSending(false);
    setSendOpen(false);
    toast({
      title: `Newsletter enviada`,
      description: `${sent} enviados, ${errors} erros`,
    });
  };

  const handleDeactivate = async (id: string, email: string) => {
    if (!confirm(`Desativar ${email}?`)) return;
    await deleteSubscriber.mutateAsync(id);
    toast({ title: "Subscritor desativado" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Newsletter</h2>
          <p className="text-muted-foreground">Gerir subscritores e enviar newsletters</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />Exportar CSV
          </Button>
          <Button onClick={() => setSendOpen(true)}>
            <Send className="w-4 h-4 mr-2" />Enviar Newsletter
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{activeSubscribers.length}</p>
                <p className="text-sm text-muted-foreground">Subscritores ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Mail className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{subscribers.filter(s => !s.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Cancelados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Mail className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{templates.length}</p>
                <p className="text-sm text-muted-foreground">Templates disponíveis</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Pesquisar por email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {/* Table */}
      {isPending ? (
        <p className="text-muted-foreground">A carregar...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">Nenhum subscritor encontrado.</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{s.source || "direto"}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(s.created_at), "dd MMM yyyy", { locale: pt })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.is_active !== false ? "default" : "secondary"}>
                      {s.is_active !== false ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleDeactivate(s.id, s.email)} className="text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Send Newsletter Dialog */}
      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enviar Newsletter</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Será enviada para <strong>{activeSubscribers.length}</strong> subscritores ativos via <strong>geral@pededireto.pt</strong>
            </p>

            <div className="space-y-2">
              <Label>Assunto *</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Ex: Novidades PedeDireto — Janeiro 2026" />
            </div>

            <div className="space-y-2">
              <Label>Usar template existente</Label>
              <Select value={form.templateId} onValueChange={(v) => setForm({ ...form, templateId: v, customHtml: "" })}>
                <SelectTrigger><SelectValue placeholder="Selecionar template..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Escrever conteúdo manual —</SelectItem>
                  {templates.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t.name} — {t.subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(!form.templateId || form.templateId === "none") && (
              <div className="space-y-2">
                <Label>Conteúdo HTML *</Label>
                <Textarea
                  rows={10}
                  value={form.customHtml}
                  onChange={(e) => setForm({ ...form, customHtml: e.target.value })}
                  placeholder="<h1>Olá!</h1><p>Novidades da semana...</p>"
                  className="font-mono text-xs"
                />
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="w-4 h-4 mr-1" />Preview
            </Button>
            <Button variant="outline" onClick={() => setSendOpen(false)}>Cancelar</Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              {sending ? "A enviar..." : `Enviar para ${activeSubscribers.length}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview da Newsletter</DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg p-4 bg-background" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewsletterContent;
