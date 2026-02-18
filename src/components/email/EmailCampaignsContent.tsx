import { useState } from "react";
import { Plus, Send, Clock, CheckCircle, X, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useEmailCampaigns, useCreateCampaign, useUpdateCampaign, useEmailTemplates, useSendEmail, renderTemplate } from "@/hooks/useEmailMarketing";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Rascunho", variant: "secondary" },
  scheduled: { label: "Agendada", variant: "outline" },
  sending: { label: "A enviar", variant: "default" },
  sent: { label: "Enviada", variant: "default" },
  cancelled: { label: "Cancelada", variant: "destructive" },
};

const EmailCampaignsContent = () => {
  const { toast } = useToast();
  const { data: campaigns = [], isPending } = useEmailCampaigns();
  const { data: templates = [] } = useEmailTemplates();
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const sendEmail = useSendEmail();

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [form, setForm] = useState({ name: "", template_id: "", segment_criteria: "{}", scheduled_at: "" });

  const filtered = campaigns.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!form.name || !form.template_id) {
      toast({ title: "Preencha nome e template", variant: "destructive" });
      return;
    }
    try {
      let criteria = {};
      try { criteria = JSON.parse(form.segment_criteria); } catch {}
      await createCampaign.mutateAsync({
        name: form.name,
        template_id: form.template_id,
        segment_criteria: criteria,
        scheduled_at: form.scheduled_at || undefined,
      });
      toast({ title: "Campanha criada" });
      setCreateOpen(false);
      setForm({ name: "", template_id: "", segment_criteria: "{}", scheduled_at: "" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const handleSendCampaign = async (campaign: any) => {
    setSelectedCampaign(campaign);
    setSendOpen(true);
  };

  const confirmSend = async () => {
    if (!selectedCampaign) return;
    try {
      // Update status
      await updateCampaign.mutateAsync({ id: selectedCampaign.id, status: "sending" });

      // Get recipients based on segment_criteria
      const criteria = selectedCampaign.segment_criteria || {};
      let query = (supabase as any).from("businesses").select("id, name, email, city").eq("is_active", true).not("email", "is", null);
      if (criteria.city) query = query.eq("city", criteria.city);
      if (criteria.category_id) query = query.eq("category_id", criteria.category_id);
      if (criteria.has_subscription) query = query.eq("subscription_status", "active");
      const { data: recipients = [] } = await query.limit(500);

      const template = templates.find((t: any) => t.id === selectedCampaign.template_id);
      if (!template) throw new Error("Template não encontrado");

      // Send in batches
      let sentCount = 0;
      const batchSize = 50;
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        for (const recipient of batch) {
          if (!recipient.email) continue;
          const html = renderTemplate(template.html_content, {
            nome: recipient.name,
            email: recipient.email,
            cidade: recipient.city || "",
          });
          try {
            await sendEmail.mutateAsync({
              to: recipient.email,
              subject: renderTemplate(template.subject, { nome: recipient.name }),
              html,
              templateId: template.id,
              campaignId: selectedCampaign.id,
              metadata: { business_id: recipient.id, recipient_type: "business" },
            });
            sentCount++;
          } catch (e) {
            console.error("Send error for", recipient.email, e);
          }
        }
      }

      await updateCampaign.mutateAsync({
        id: selectedCampaign.id,
        status: "sent",
        recipient_count: sentCount,
      });

      toast({ title: `Campanha enviada para ${sentCount} destinatários` });
      setSendOpen(false);
    } catch (e: any) {
      toast({ title: "Erro ao enviar", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Campanhas</h2>
          <p className="text-muted-foreground">Email marketing segmentado</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4 mr-2" />Nova Campanha</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Pesquisar campanhas..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {isPending ? (
        <p className="text-muted-foreground">A carregar...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma campanha encontrada.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((c: any) => {
            const status = statusMap[c.status] || statusMap.draft;
            return (
              <Card key={c.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground">{c.name}</h3>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Template: {c.email_templates?.name || "—"} • Destinatários: {c.recipient_count || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c.scheduled_at ? `Agendada: ${new Date(c.scheduled_at).toLocaleString("pt-PT")}` : ""} •
                      Criada: {new Date(c.created_at).toLocaleDateString("pt-PT")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {c.status === "draft" && (
                      <Button size="sm" onClick={() => handleSendCampaign(c)}>
                        <Send className="w-3 h-3 mr-1" />Enviar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Campanha</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Template *</Label>
              <Select value={form.template_id} onValueChange={(v) => setForm({ ...form, template_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar template" /></SelectTrigger>
                <SelectContent>
                  {templates.filter((t: any) => t.is_active).map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Critérios de Segmentação (JSON)</Label>
              <Textarea value={form.segment_criteria} onChange={(e) => setForm({ ...form, segment_criteria: e.target.value })} className="font-mono text-xs" rows={4} placeholder='{"city": "Lisboa", "has_subscription": true}' />
            </div>
            <div className="space-y-2">
              <Label>Agendar para (opcional)</Label>
              <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createCampaign.isPending}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Confirmation */}
      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar Envio</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">
            Tem a certeza que deseja enviar a campanha <strong>{selectedCampaign?.name}</strong>?
            Os emails serão enviados a todos os negócios que correspondam aos critérios.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpen(false)}>Cancelar</Button>
            <Button onClick={confirmSend} disabled={sendEmail.isPending}>
              <Send className="w-4 h-4 mr-2" />Confirmar Envio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailCampaignsContent;
