import { useState } from "react";
import { Send, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEmailTemplates, useSendEmail, renderTemplate } from "@/hooks/useEmailMarketing";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const EmailSendContent = () => {
  const { toast } = useToast();
  const { data: templates = [] } = useEmailTemplates();
  const sendEmail = useSendEmail();

  const [businessSearch, setBusinessSearch] = useState("");
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [templateId, setTemplateId] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [sending, setSending] = useState(false);

  const searchBusinesses = async (q: string) => {
    setBusinessSearch(q);
    if (q.length < 2) { setBusinesses([]); return; }
    const { data } = await (supabase as any).from("businesses").select("id, name, email, city").ilike("name", `%${q}%`).not("email", "is", null).limit(10);
    setBusinesses(data || []);
  };

  const selectBusiness = (b: any) => {
    setSelectedBusiness(b);
    setBusinesses([]);
    setBusinessSearch(b.name);
  };

  const selectTemplate = (id: string) => {
    setTemplateId(id);
    const t = templates.find((t: any) => t.id === id);
    if (t && selectedBusiness) {
      setSubject(renderTemplate(t.subject, { nome: selectedBusiness.name, email: selectedBusiness.email, cidade: selectedBusiness.city || "" }));
      setHtml(renderTemplate(t.html_content, { nome: selectedBusiness.name, email: selectedBusiness.email, cidade: selectedBusiness.city || "" }));
    } else if (t) {
      setSubject(t.subject);
      setHtml(t.html_content);
    }
  };

  const handleSend = async () => {
    if (!selectedBusiness?.email || !subject || !html) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      await sendEmail.mutateAsync({
        to: selectedBusiness.email,
        subject,
        html,
        templateId: templateId || undefined,
        metadata: { business_id: selectedBusiness.id, recipient_type: "business" },
      });
      toast({ title: "Email enviado com sucesso!" });
      setSelectedBusiness(null);
      setBusinessSearch("");
      setSubject("");
      setHtml("");
      setTemplateId("");
    } catch (e: any) {
      toast({ title: "Erro ao enviar", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Enviar Email</h2>
        <p className="text-muted-foreground">Envio individual a um negócio</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Business Search */}
          <div className="space-y-2">
            <Label>Destinatário (Negócio) *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar negócio..."
                value={businessSearch}
                onChange={(e) => searchBusinesses(e.target.value)}
                className="pl-10"
              />
            </div>
            {businesses.length > 0 && (
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {businesses.map((b: any) => (
                  <button key={b.id} className="w-full text-left p-3 hover:bg-muted transition-colors" onClick={() => selectBusiness(b)}>
                    <p className="text-sm font-medium text-foreground">{b.name}</p>
                    <p className="text-xs text-muted-foreground">{b.email} • {b.city}</p>
                  </button>
                ))}
              </div>
            )}
            {selectedBusiness && (
              <div className="p-3 bg-primary/10 rounded-lg">
                <p className="text-sm font-medium text-foreground">{selectedBusiness.name}</p>
                <p className="text-xs text-muted-foreground">{selectedBusiness.email}</p>
              </div>
            )}
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Template (opcional)</Label>
            <Select value={templateId} onValueChange={selectTemplate}>
              <SelectTrigger><SelectValue placeholder="Sem template / escrever manualmente" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem template</SelectItem>
                {templates.filter((t: any) => t.is_active).map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label>Assunto *</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Assunto do email" />
          </div>

          {/* HTML Content */}
          <div className="space-y-2">
            <Label>Conteúdo HTML *</Label>
            <Textarea rows={12} value={html} onChange={(e) => setHtml(e.target.value)} className="font-mono text-xs" placeholder="<p>Olá {{nome}},</p>..." />
          </div>

          <Button onClick={handleSend} disabled={sending || !selectedBusiness?.email}>
            <Send className="w-4 h-4 mr-2" />{sending ? "A enviar..." : "Enviar Email"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailSendContent;
