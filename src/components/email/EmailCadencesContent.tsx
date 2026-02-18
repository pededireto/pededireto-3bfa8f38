import { useState } from "react";
import { Plus, Play, Pause, Trash2, Settings, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEmailCadences, useCreateCadence, useCadenceSteps, useAddCadenceStep, useDeleteCadenceStep, useCadenceEnrollments, useEnrollInCadence, useEmailTemplates } from "@/hooks/useEmailMarketing";
import { useToast } from "@/hooks/use-toast";

const EmailCadencesContent = () => {
  const { toast } = useToast();
  const { data: cadences = [], isPending } = useEmailCadences();
  const { data: templates = [] } = useEmailTemplates();
  const createCadence = useCreateCadence();
  const addStep = useAddCadenceStep();
  const deleteStep = useDeleteCadenceStep();
  const enrollInCadence = useEnrollInCadence();

  const [createOpen, setCreateOpen] = useState(false);
  const [stepsOpen, setStepsOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [selectedCadence, setSelectedCadence] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", category: "" });
  const [stepForm, setStepForm] = useState({ template_id: "", delay_days: "0", delay_hours: "0" });
  const [enrollForm, setEnrollForm] = useState({ recipient_email: "", pause_on_reply: true });

  const { data: steps = [] } = useCadenceSteps(selectedCadence?.id);
  const { data: enrollments = [] } = useCadenceEnrollments(selectedCadence?.id);

  const handleCreate = async () => {
    if (!form.name) { toast({ title: "Nome obrigatório", variant: "destructive" }); return; }
    try {
      await createCadence.mutateAsync(form);
      toast({ title: "Cadence criada" });
      setCreateOpen(false);
      setForm({ name: "", description: "", category: "" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const handleAddStep = async () => {
    if (!stepForm.template_id || !selectedCadence) return;
    try {
      await addStep.mutateAsync({
        cadence_id: selectedCadence.id,
        template_id: stepForm.template_id,
        step_order: steps.length + 1,
        delay_days: parseInt(stepForm.delay_days) || 0,
        delay_hours: parseInt(stepForm.delay_hours) || 0,
      });
      toast({ title: "Step adicionado" });
      setStepForm({ template_id: "", delay_days: "0", delay_hours: "0" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const handleEnroll = async () => {
    if (!enrollForm.recipient_email || !selectedCadence) return;
    try {
      await enrollInCadence.mutateAsync({
        cadence_id: selectedCadence.id,
        recipient_email: enrollForm.recipient_email,
        pause_on_reply: enrollForm.pause_on_reply,
      });
      toast({ title: "Inscrito na cadence" });
      setEnrollForm({ recipient_email: "", pause_on_reply: true });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Cadences</h2>
          <p className="text-muted-foreground">Sequências automáticas de email</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4 mr-2" />Nova Cadence</Button>
      </div>

      {isPending ? (
        <p className="text-muted-foreground">A carregar...</p>
      ) : cadences.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma cadence criada.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cadences.map((c: any) => (
            <Card key={c.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{c.name}</CardTitle>
                  <Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? "Ativa" : "Inativa"}</Badge>
                </div>
                {c.description && <p className="text-sm text-muted-foreground">{c.description}</p>}
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setSelectedCadence(c); setStepsOpen(true); }}>
                  <Settings className="w-3 h-3 mr-1" />Steps
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setSelectedCadence(c); setEnrollOpen(true); }}>
                  <Users className="w-3 h-3 mr-1" />Inscrever
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Cadence</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="space-y-2"><Label>Categoria</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Steps Dialog */}
      <Dialog open={stepsOpen} onOpenChange={setStepsOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Steps de: {selectedCadence?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {steps.map((s: any, i: number) => (
              <div key={s.id} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                <Badge variant="outline" className="shrink-0">#{s.step_order}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.email_templates?.name || "—"}</p>
                  <p className="text-xs text-muted-foreground">Delay: {s.delay_days}d {s.delay_hours || 0}h</p>
                </div>
                {i < steps.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                <Button variant="ghost" size="icon" onClick={() => deleteStep.mutateAsync({ id: s.id, cadenceId: selectedCadence.id })}>
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            ))}

            <div className="border-t pt-4 space-y-3">
              <Label className="text-sm font-medium">Adicionar Step</Label>
              <Select value={stepForm.template_id} onValueChange={(v) => setStepForm({ ...stepForm, template_id: v })}>
                <SelectTrigger><SelectValue placeholder="Template" /></SelectTrigger>
                <SelectContent>
                  {templates.filter((t: any) => t.is_active).map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1"><Label className="text-xs">Dias</Label><Input type="number" value={stepForm.delay_days} onChange={(e) => setStepForm({ ...stepForm, delay_days: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">Horas</Label><Input type="number" value={stepForm.delay_hours} onChange={(e) => setStepForm({ ...stepForm, delay_hours: e.target.value })} /></div>
              </div>
              <Button size="sm" onClick={handleAddStep} disabled={!stepForm.template_id}><Plus className="w-3 h-3 mr-1" />Adicionar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enroll Dialog */}
      <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Inscrever em: {selectedCadence?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email do destinatário *</Label>
              <Input type="email" value={enrollForm.recipient_email} onChange={(e) => setEnrollForm({ ...enrollForm, recipient_email: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={enrollForm.pause_on_reply} onChange={(e) => setEnrollForm({ ...enrollForm, pause_on_reply: e.target.checked })} id="pause_on_reply" />
              <Label htmlFor="pause_on_reply" className="text-sm">Pausar se responder</Label>
            </div>

            {enrollments.length > 0 && (
              <div className="border-t pt-3">
                <Label className="text-sm">Inscrições existentes ({enrollments.length})</Label>
                <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                  {enrollments.map((e: any) => (
                    <div key={e.id} className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                      <span className="truncate">{e.recipient_email}</span>
                      <Badge variant="outline" className="text-xs">{e.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnrollOpen(false)}>Fechar</Button>
            <Button onClick={handleEnroll} disabled={!enrollForm.recipient_email}>Inscrever</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailCadencesContent;
