import { useState } from "react";
import { Plus, Trash2, Settings, Users, ArrowRight, Search, Filter, CheckCircle2, Loader2, ChevronLeft, ChevronRight, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useEmailCadences, useCreateCadence, useCadenceSteps, useAddCadenceStep,
  useDeleteCadenceStep, useCadenceEnrollments, useEnrollInCadence,
  useEmailTemplates, useSegmentPreview, useBulkEnrollInCadence,
  useCadenceStepPerformance,
} from "@/hooks/useEmailMarketing";
import { useToast } from "@/hooks/use-toast";
import { useCategories } from "@/hooks/useCategories";

const COMMERCIAL_STATUSES = [
  { value: "", label: "Todos os estados" },
  { value: "contactado", label: "Contactado" },
  { value: "nao_contactado", label: "Não contactado" },
  { value: "cliente", label: "Cliente" },
  { value: "perdido", label: "Perdido" },
];

const CONDITION_TYPES = [
  { value: "always", label: "Sempre (sem condição)" },
  { value: "if_opened", label: "Se abriu step anterior" },
  { value: "if_not_opened", label: "Se NÃO abriu step anterior" },
  { value: "if_clicked", label: "Se clicou step anterior" },
  { value: "if_not_clicked", label: "Se NÃO clicou step anterior" },
];

const PAGE_SIZE = 100;

const EmailCadencesContent = () => {
  const { toast } = useToast();
  const { data: cadences = [], isPending } = useEmailCadences();
  const { data: templates = [] } = useEmailTemplates();
  const { data: categories = [] } = useCategories();
  const createCadence = useCreateCadence();
  const addStep = useAddCadenceStep();
  const deleteStep = useDeleteCadenceStep();
  const enrollInCadence = useEnrollInCadence();
  const bulkEnroll = useBulkEnrollInCadence();

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [stepsOpen, setStepsOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [perfOpen, setPerfOpen] = useState(false);
  const [selectedCadence, setSelectedCadence] = useState<any>(null);

  // Forms
  const [form, setForm] = useState({ name: "", description: "", category: "" });
  const [stepForm, setStepForm] = useState({
    template_id: "", delay_days: "0", delay_hours: "0",
    condition_type: "always", condition_ref_step: "",
  });
  const [enrollForm, setEnrollForm] = useState({ recipient_email: "", pause_on_reply: true });

  // Bulk enrollment state
  const [segmentFilters, setSegmentFilters] = useState({
    category_id: "",
    commercial_status: "",
    has_email: true,
  });
  const [bulkPage, setBulkPage] = useState(0);
  const [previewEnabled, setPreviewEnabled] = useState(false);
  const [pauseOnReply, setPauseOnReply] = useState(true);
  const [selectedBusinessIds, setSelectedBusinessIds] = useState<Set<string>>(new Set());
  const [bulkStep, setBulkStep] = useState<"filter" | "preview" | "confirm">("filter");

  const { data: steps = [] } = useCadenceSteps(selectedCadence?.id);
  const { data: enrollments = [] } = useCadenceEnrollments(selectedCadence?.id);
  const { data: perfData = [] } = useCadenceStepPerformance(perfOpen ? selectedCadence?.id : undefined);

  const { data: segmentData, isLoading: segmentLoading } = useSegmentPreview(
    {
      category_id: segmentFilters.category_id || undefined,
      commercial_status: segmentFilters.commercial_status || undefined,
      has_email: segmentFilters.has_email,
      limit: PAGE_SIZE,
      offset: bulkPage * PAGE_SIZE,
    },
    previewEnabled && bulkOpen
  );

  const totalPages = segmentData ? Math.ceil(segmentData.total / PAGE_SIZE) : 0;

  // Enrollment summary stats
  const enrollmentStats = {
    total: enrollments.length,
    active: enrollments.filter((e: any) => e.status === "active").length,
    converted: enrollments.filter((e: any) => e.status === "converted").length,
    completed: enrollments.filter((e: any) => e.status === "completed").length,
    paused: enrollments.filter((e: any) => e.status === "paused").length,
  };

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
        condition_type: stepForm.condition_type || "always",
        condition_ref_step: stepForm.condition_ref_step ? parseInt(stepForm.condition_ref_step) : null,
      });
      toast({ title: "Step adicionado" });
      setStepForm({ template_id: "", delay_days: "0", delay_hours: "0", condition_type: "always", condition_ref_step: "" });
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

  const handlePreview = () => {
    setPreviewEnabled(true);
    setBulkPage(0);
    setSelectedBusinessIds(new Set());
    setBulkStep("preview");
  };

  const handleSelectAll = () => {
    if (!segmentData) return;
    const allIds = new Set(segmentData.businesses.map(b => b.id));
    setSelectedBusinessIds(allIds);
  };

  const handleDeselectAll = () => setSelectedBusinessIds(new Set());

  const toggleBusiness = (id: string) => {
    setSelectedBusinessIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkEnroll = async () => {
    if (!selectedCadence || !segmentData) return;
    const toEnroll = segmentData.businesses.filter(b => selectedBusinessIds.has(b.id));
    if (toEnroll.length === 0) { toast({ title: "Nenhum negócio selecionado", variant: "destructive" }); return; }

    try {
      const result = await bulkEnroll.mutateAsync({
        cadence_id: selectedCadence.id,
        businesses: toEnroll,
        pause_on_reply: pauseOnReply,
      });
      toast({ title: `✅ ${result.enrolled} negócios inscritos!`, description: result.skipped > 0 ? `${result.skipped} ignorados (sem email)` : undefined });
      setBulkOpen(false);
      setBulkStep("filter");
      setPreviewEnabled(false);
      setSelectedBusinessIds(new Set());
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const openBulk = (cadence: any) => {
    setSelectedCadence(cadence);
    setBulkStep("filter");
    setPreviewEnabled(false);
    setSegmentFilters({ category_id: "", commercial_status: "", has_email: true });
    setSelectedBusinessIds(new Set());
    setBulkPage(0);
    setBulkOpen(true);
  };

  const openPerformance = (cadence: any) => {
    setSelectedCadence(cadence);
    setPerfOpen(true);
  };

  const conditionLabel = (type: string, refStep: number | null) => {
    if (type === "always" || !type) return null;
    const label = CONDITION_TYPES.find(c => c.value === type)?.label || type;
    return refStep != null ? `${label} (#${refStep})` : label;
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
                {c.category && <Badge variant="outline" className="text-xs mt-1">{c.category}</Badge>}
              </CardHeader>
              <CardContent className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => { setSelectedCadence(c); setStepsOpen(true); }}>
                  <Settings className="w-3 h-3 mr-1" />Steps
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setSelectedCadence(c); setEnrollOpen(true); }}>
                  <Users className="w-3 h-3 mr-1" />Inscrever
                </Button>
                <Button size="sm" onClick={() => openBulk(c)} className="bg-primary/90 hover:bg-primary">
                  <Filter className="w-3 h-3 mr-1" />Inscrição em Massa
                </Button>
                <Button variant="outline" size="sm" onClick={() => openPerformance(c)}>
                  <BarChart3 className="w-3 h-3 mr-1" />Performance
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── PERFORMANCE DIALOG ── */}
      <Dialog open={perfOpen} onOpenChange={setPerfOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Performance — {selectedCadence?.name}
            </DialogTitle>
          </DialogHeader>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold">{enrollmentStats.total}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-primary">{enrollmentStats.active}</p><p className="text-xs text-muted-foreground">Ativos</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-green-600">{enrollmentStats.converted}</p><p className="text-xs text-muted-foreground">Convertidos</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold">{enrollmentStats.completed}</p><p className="text-xs text-muted-foreground">Completados</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-amber-600">{enrollmentStats.paused}</p><p className="text-xs text-muted-foreground">Pausados</p></CardContent></Card>
          </div>

          {enrollmentStats.total > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Taxa de conversão: {((enrollmentStats.converted / enrollmentStats.total) * 100).toFixed(1)}%
              </Badge>
            </div>
          )}

          {/* Step performance table */}
          <div className="bg-card rounded-xl shadow-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Step</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead className="text-right">Enviados</TableHead>
                  <TableHead className="text-right">Abertos</TableHead>
                  <TableHead className="text-right">% Open</TableHead>
                  <TableHead className="text-right">Clicados</TableHead>
                  <TableHead className="text-right">% Click</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {perfData.length > 0 ? perfData.map((row: any) => (
                  <TableRow key={row.step_id}>
                    <TableCell><Badge variant="outline">#{row.step_order}</Badge></TableCell>
                    <TableCell className="font-medium">{row.template_name || "—"}</TableCell>
                    <TableCell className="text-right">{row.sent}</TableCell>
                    <TableCell className="text-right">{row.opened}</TableCell>
                    <TableCell className="text-right">{row.open_rate}%</TableCell>
                    <TableCell className="text-right">{row.clicked}</TableCell>
                    <TableCell className="text-right">{row.click_rate}%</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Sem dados de performance ainda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── BULK ENROLLMENT DIALOG ── */}
      <Dialog open={bulkOpen} onOpenChange={(o) => { setBulkOpen(o); if (!o) { setPreviewEnabled(false); setBulkStep("filter"); } }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Inscrição em Massa — {selectedCadence?.name}
            </DialogTitle>
          </DialogHeader>

          {/* STEP 1: Filtros */}
          {bulkStep === "filter" && (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">Define o segmento de negócios a inscrever nesta cadence.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={segmentFilters.category_id} onValueChange={(v) => setSegmentFilters(f => ({ ...f, category_id: v === "all" ? "" : v }))}>
                    <SelectTrigger><SelectValue placeholder="Todas as categorias" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Estado Comercial</Label>
                  <Select value={segmentFilters.commercial_status} onValueChange={(v) => setSegmentFilters(f => ({ ...f, commercial_status: v === "all" ? "" : v }))}>
                    <SelectTrigger><SelectValue placeholder="Todos os estados" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os estados</SelectItem>
                      {COMMERCIAL_STATUSES.filter(s => s.value).map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
                <Switch checked={segmentFilters.has_email} onCheckedChange={(v) => setSegmentFilters(f => ({ ...f, has_email: v }))} />
                <div>
                  <p className="text-sm font-medium">Apenas negócios com email</p>
                  <p className="text-xs text-muted-foreground">Filtra negócios sem email registado</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
                <Switch checked={pauseOnReply} onCheckedChange={setPauseOnReply} />
                <div>
                  <p className="text-sm font-medium">Pausar se responder</p>
                  <p className="text-xs text-muted-foreground">A cadence pausa automaticamente quando o negócio responde</p>
                </div>
              </div>

              <Button className="w-full" onClick={handlePreview}>
                <Search className="w-4 h-4 mr-2" />
                Pré-visualizar Segmento
              </Button>
            </div>
          )}

          {/* STEP 2: Preview e seleção */}
          {bulkStep === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setBulkStep("filter")}>
                  ← Alterar filtros
                </Button>
                {segmentData && (
                  <p className="text-sm text-muted-foreground">
                    {segmentData.total} negócios encontrados · {selectedBusinessIds.size} selecionados
                  </p>
                )}
              </div>

              {segmentLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : segmentData && segmentData.businesses.length > 0 ? (
                <>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleSelectAll}>Selecionar tudo ({segmentData.businesses.length})</Button>
                    <Button variant="outline" size="sm" onClick={handleDeselectAll}>Limpar seleção</Button>
                  </div>

                  <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                    {segmentData.businesses.map(b => (
                      <div
                        key={b.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedBusinessIds.has(b.id) ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}
                        onClick={() => toggleBusiness(b.id)}
                      >
                        <div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center flex-shrink-0 ${selectedBusinessIds.has(b.id) ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                          {selectedBusinessIds.has(b.id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{b.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{b.email} · {b.city}</p>
                        </div>
                        <Badge variant="outline" className="text-xs flex-shrink-0">{b.commercial_status || "—"}</Badge>
                      </div>
                    ))}
                  </div>

                  {/* Paginação */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <Button variant="outline" size="sm" disabled={bulkPage === 0} onClick={() => { setBulkPage(p => p - 1); setSelectedBusinessIds(new Set()); }}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-xs text-muted-foreground">Página {bulkPage + 1} de {totalPages} · {PAGE_SIZE} por página</span>
                      <Button variant="outline" size="sm" disabled={bulkPage >= totalPages - 1} onClick={() => { setBulkPage(p => p + 1); setSelectedBusinessIds(new Set()); }}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    disabled={selectedBusinessIds.size === 0 || bulkEnroll.isPending}
                    onClick={handleBulkEnroll}
                  >
                    {bulkEnroll.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />A inscrever...</>
                    ) : (
                      <><Users className="w-4 h-4 mr-2" />Inscrever {selectedBusinessIds.size} negócios</>
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Nenhum negócio encontrado com estes filtros.</p>
                  <Button variant="outline" className="mt-3" onClick={() => setBulkStep("filter")}>Alterar filtros</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── CREATE DIALOG ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Cadence</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar categoria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem categoria</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── STEPS DIALOG ── */}
      <Dialog open={stepsOpen} onOpenChange={setStepsOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Steps de: {selectedCadence?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {steps.map((s: any, i: number) => (
              <div key={s.id} className="p-3 border rounded-lg bg-muted/50 space-y-1">
                <div className="flex items-center gap-3">
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
                {conditionLabel(s.condition_type, s.condition_ref_step) && (
                  <Badge variant="secondary" className="text-xs">
                    {conditionLabel(s.condition_type, s.condition_ref_step)}
                  </Badge>
                )}
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

              {/* Condition */}
              <div className="space-y-2">
                <Label className="text-xs">Condição para executar</Label>
                <Select value={stepForm.condition_type} onValueChange={(v) => setStepForm({ ...stepForm, condition_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONDITION_TYPES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {stepForm.condition_type !== "always" && steps.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs">Step de referência</Label>
                  <Select value={stepForm.condition_ref_step} onValueChange={(v) => setStepForm({ ...stepForm, condition_ref_step: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecionar step" /></SelectTrigger>
                    <SelectContent>
                      {steps.map((s: any) => (
                        <SelectItem key={s.step_order} value={String(s.step_order)}>
                          Step #{s.step_order} — {s.email_templates?.name || "—"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button size="sm" onClick={handleAddStep} disabled={!stepForm.template_id}><Plus className="w-3 h-3 mr-1" />Adicionar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── ENROLL INDIVIDUAL DIALOG ── */}
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
                      <Badge variant={e.status === "converted" ? "default" : "outline"} className={`text-xs ${e.status === "converted" ? "bg-green-600" : ""}`}>
                        {e.status}
                      </Badge>
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
