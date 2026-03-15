import { useState } from "react";
import {
  useAllBusinessModules,
  useCreateBusinessModule,
  useUpdateBusinessModule,
  useDeleteBusinessModule,
  BusinessModule,
} from "@/hooks/useBusinessModules";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

const MODULE_TYPES = ["text", "textarea", "url", "image", "gallery", "video", "boolean", "select"] as const;
const SECTIONS = ["presenca_publica", "dados_privados", "marketing"] as const;

const sectionLabels: Record<string, string> = {
  presenca_publica: "Presença Pública",
  dados_privados: "Dados Privados",
  marketing: "Marketing",
};

const emptyModule = {
  name: "",
  label: "",
  type: "text" as BusinessModule["type"],
  section: "presenca_publica",
  is_public_default: true,
  is_required: false,
  is_active: true,
  order_index: 0,
  plan_restriction: null as string | null,
  options: null as any,
};

const BusinessModulesContent = () => {
  const { data: modules = [], isLoading } = useAllBusinessModules();
  const createModule = useCreateBusinessModule();
  const updateModule = useUpdateBusinessModule();
  const deleteModule = useDeleteBusinessModule();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyModule);
  const [optionsText, setOptionsText] = useState("");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [hasValuesMap, setHasValuesMap] = useState<Record<string, number>>({});

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyModule);
    setOptionsText("");
    setDialogOpen(true);
  };

  const openEdit = (m: BusinessModule) => {
    setEditingId(m.id);
    setForm({
      name: m.name,
      label: m.label,
      type: m.type,
      section: m.section,
      is_public_default: m.is_public_default,
      is_required: m.is_required,
      is_active: m.is_active,
      order_index: m.order_index,
      plan_restriction: m.plan_restriction,
      options: m.options,
    });
    setOptionsText(m.options ? JSON.stringify(m.options, null, 2) : "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.label) {
      toast({ title: "Nome e label são obrigatórios", variant: "destructive" });
      return;
    }
    try {
      const payload = {
        ...form,
        options: form.type === "select" && optionsText ? JSON.parse(optionsText) : null,
      };
      if (editingId) {
        // Check if type changed and has values
        const original = modules.find((m) => m.id === editingId);
        if (original && original.type !== payload.type) {
          const { count } = await supabase
            .from("business_module_values")
            .select("*", { count: "exact", head: true })
            .eq("module_id", editingId);
          if (count && count > 0) {
            toast({ title: "Não é possível alterar o tipo de um módulo com valores existentes", variant: "destructive" });
            return;
          }
        }
        await updateModule.mutateAsync({ id: editingId, ...payload });
        toast({ title: "Módulo atualizado" });
      } else {
        await createModule.mutateAsync(payload);
        toast({ title: "Módulo criado" });
      }
      setDialogOpen(false);
    } catch (e: any) {
      const detail = e?.details || e?.hint || e?.message || "Erro desconhecido";
      const code = e?.code ? ` (${e.code})` : "";
      toast({ title: "Erro ao guardar módulo", description: `${detail}${code}`, variant: "destructive" });
      console.error("[BusinessModulesContent] save error:", e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { count } = await supabase
        .from("business_module_values")
        .select("*", { count: "exact", head: true })
        .eq("module_id", id);
      if (count && count > 0) {
        toast({ title: "Não é possível eliminar módulo com valores associados. Desative-o em vez disso.", variant: "destructive" });
        return;
      }
      await deleteModule.mutateAsync(id);
      toast({ title: "Módulo eliminado" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const toggleActive = async (m: BusinessModule) => {
    await updateModule.mutateAsync({ id: m.id, is_active: !m.is_active });
    toast({ title: m.is_active ? "Módulo desativado" : "Módulo ativado" });
  };

  const filtered = sectionFilter === "all" ? modules : modules.filter((m) => m.section === sectionFilter);

  const set = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configuração da Ficha</h2>
          <p className="text-sm text-muted-foreground">Defina campos dinâmicos para os negócios</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Criar Módulo
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Label className="text-sm">Secção:</Label>
        <Select value={sectionFilter} onValueChange={setSectionFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {SECTIONS.map((s) => (
              <SelectItem key={s} value={s}>{sectionLabels[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Secção</TableHead>
              <TableHead>Público</TableHead>
              <TableHead>Obrig.</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead>Ordem</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  Nenhum módulo encontrado
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((m) => (
                <TableRow key={m.id} className={!m.is_active ? "opacity-50" : ""}>
                  <TableCell className="font-mono text-xs">{m.name}</TableCell>
                  <TableCell>{m.label}</TableCell>
                  <TableCell><Badge variant="secondary">{m.type}</Badge></TableCell>
                  <TableCell className="text-xs">{sectionLabels[m.section] || m.section}</TableCell>
                  <TableCell>{m.is_public_default ? "✓" : "—"}</TableCell>
                  <TableCell>{m.is_required ? "✓" : "—"}</TableCell>
                  <TableCell>
                    <Switch checked={m.is_active} onCheckedChange={() => toggleActive(m)} />
                  </TableCell>
                  <TableCell>{m.order_index}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(m)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(m.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Módulo" : "Criar Módulo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome interno *</Label>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="ex: facebook_url" disabled={!!editingId} />
              </div>
              <div className="space-y-2">
                <Label>Label *</Label>
                <Input value={form.label} onChange={(e) => set("label", e.target.value)} placeholder="ex: Facebook" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v: any) => set("type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MODULE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Secção</Label>
                <Select value={form.section} onValueChange={(v) => set("section", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SECTIONS.map((s) => (
                      <SelectItem key={s} value={s}>{sectionLabels[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ordem</Label>
              <Input type="number" value={form.order_index} onChange={(e) => set("order_index", parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Restrição de plano (opcional)</Label>
              <Input value={form.plan_restriction || ""} onChange={(e) => set("plan_restriction", e.target.value || null)} placeholder="ex: business, consumer, ou vazio" />
            </div>
            {form.type === "select" && (
              <div className="space-y-2">
                <Label>Opções (JSON array)</Label>
                <Textarea value={optionsText} onChange={(e) => setOptionsText(e.target.value)} placeholder='["opção 1", "opção 2"]' rows={3} />
              </div>
            )}
            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <Switch checked={form.is_public_default} onCheckedChange={(c) => set("is_public_default", c)} />
                <span className="text-sm">Público por defeito</span>
              </label>
              <label className="flex items-center gap-2">
                <Switch checked={form.is_required} onCheckedChange={(c) => set("is_required", c)} />
                <span className="text-sm">Obrigatório</span>
              </label>
              <label className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(c) => set("is_active", c)} />
                <span className="text-sm">Ativo</span>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={createModule.isPending || updateModule.isPending}>
                {(createModule.isPending || updateModule.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingId ? "Guardar" : "Criar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BusinessModulesContent;
