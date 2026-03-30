import { useState } from "react";
import { Plus, Send, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useEmailCampaigns, useCreateCampaign, useUpdateCampaign, useEmailTemplates, useSendEmail, renderTemplate } from "@/hooks/useEmailMarketing";
import { useToast } from "@/hooks/use-toast";
import { useCategories } from "@/hooks/useCategories";
import { supabase } from "@/integrations/supabase/client";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Rascunho", variant: "secondary" },
  scheduled: { label: "Agendada", variant: "outline" },
  sending: { label: "A enviar", variant: "default" },
  sent: { label: "Enviada", variant: "default" },
  cancelled: { label: "Cancelada", variant: "destructive" },
};

const PLAN_OPTIONS = [
  { value: "", label: "Todos os planos" },
  { value: "free", label: "Free" },
  { value: "1_month", label: "1 Mês" },
  { value: "3_months", label: "3 Meses" },
  { value: "6_months", label: "6 Meses" },
  { value: "1_year", label: "1 Ano" },
];

const EmailCampaignsContent = () => {
  const { toast } = useToast();
  const { data: campaigns = [], isPending } = useEmailCampaigns();
  const { data: templates = [] } = useEmailTemplates();
  const { data: categories = [] } = useCategories();
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const sendEmail = useSendEmail();

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);

  // Visual filter form instead of raw JSON
  const [form, setForm] = useState({
    name: "",
    template_id: "",
    scheduled_at: "",
    filter_city: "",
    filter_category_id: "",
    filter_plan: "",
    filter_verified: false,
    filter_has_email: true,
  });

  const filtered = campaigns.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const buildSegmentCriteria = () => {
    const criteria: Record<string, any> = {};
    if (form.filter_city) criteria.city = form.filter_city;
    if (form.filter_category_id) criteria.category_id = form.filter_category_id;
    if (form.filter_plan) criteria.subscription_plan = form.filter_plan;
    if (form.filter_verified) criteria.is_verified = true;
    if (form.filter_has_email) criteria.has_email = true;
    return criteria;
  };

  const handleCreate = async () => {
    if (!form.name || !form.template_id) {
      toast({ title: "Preencha nome e template", variant: "destructive" });
      return;
    }
    try {
      await createCampaign.mutateAsync({
        name: form.name,
        template_id: form.template_id,
        segment_criteria: buildSegmentCriteria(),
        scheduled_at: form.scheduled_at || undefined,
      });
      toast({ title: "Campanha criada" });
      setCreateOpen(false);
      setForm({ name: "", template_id: "", scheduled_at: "", filter_city: "", filter_category_id: "", filter_plan: "", filter_verified: false, filter_has_email: true });
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
      await updateCampaign.mutateAsync({ id: selectedCampaign.id, status: "sending" });

      const criteria = selectedCampaign.segment_criteria || {};
      let query = (supabase as any).from("businesses").select("id, name, email, city").eq("is_active", true).not("email", "is", null);
      if (criteria.city) query = query.eq("city", criteria.city);
      if (criteria.category_id) query = query.eq("category_id", criteria.category_id);
      if (criteria.subscription_plan) query = query.eq("subscription_plan", criteria.subscription_plan);
      if (criteria.is_verified) query = query.eq("is_verified", true);
      const { data: recipients = [] } = await query.limit(500);

      const template = templates.find((t: any) => t.id === selectedCampaign.template_id);
      if (!template) throw new Error("Template não encontrado");

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

      {/* Create Dialog with visual filters */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
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

            {/* Visual segment filters */}
            <div className="border-t pt-4 space-y-3">
              <Label className="text-sm font-medium">Segmentação</Label>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Cidade</Label>
                  <Input value={form.filter_city} onChange={(e) => setForm({ ...form, filter_city: e.target.value })} placeholder="Ex: Lisboa" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Categoria</Label>
                  <Select value={form.filter_category_id} onValueChange={(v) => setForm({ ...form, filter_category_id: v === "all" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Plano</Label>
                  <Select value={form.filter_plan} onValueChange={(v) => setForm({ ...form, filter_plan: v === "all" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {PLAN_OPTIONS.filter(p => p.value).map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 bg-muted/40 rounded-lg">
                <Switch checked={form.filter_verified} onCheckedChange={(v) => setForm({ ...form, filter_verified: v })} />
                <p className="text-sm">Apenas verificados</p>
              </div>
              <div className="flex items-center gap-3 p-2 bg-muted/40 rounded-lg">
                <Switch checked={form.filter_has_email} onCheckedChange={(v) => setForm({ ...form, filter_has_email: v })} />
                <p className="text-sm">Apenas com email</p>
              </div>
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
