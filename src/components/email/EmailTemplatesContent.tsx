import { useState } from "react";
import { Plus, Edit2, Trash2, Eye, Copy, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEmailTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate, renderTemplate } from "@/hooks/useEmailMarketing";
import { useToast } from "@/hooks/use-toast";

const MOCK_DATA: Record<string, string> = {
  nome: "João Silva",
  email: "joao@exemplo.pt",
  cidade: "Lisboa",
  plano: "Premium",
  link_dashboard: "https://pededireto.pt/dashboard",
};

const TEMPLATE_CATEGORIES = ["onboarding", "follow-up", "upsell", "reactivation", "notification", "general"];

const EmailTemplatesContent = () => {
  const { toast } = useToast();
  const { data: templates = [], isPending } = useEmailTemplates();
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();

  const [search, setSearch] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [previewHtml, setPreviewHtml] = useState("");

  const [form, setForm] = useState({ name: "", subject: "", html_content: "", text_content: "", category: "general" });

  const filtered = templates.filter((t: any) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.subject.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setEditingTemplate(null);
    setForm({ name: "", subject: "", html_content: "", text_content: "", category: "general" });
    setEditOpen(true);
  };

  const openEdit = (t: any) => {
    setEditingTemplate(t);
    setForm({ name: t.name, subject: t.subject, html_content: t.html_content, text_content: t.text_content || "", category: t.category || "general" });
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.subject || !form.html_content) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    try {
      if (editingTemplate) {
        await updateTemplate.mutateAsync({ id: editingTemplate.id, ...form });
        toast({ title: "Template atualizado" });
      } else {
        await createTemplate.mutateAsync(form);
        toast({ title: "Template criado" });
      }
      setEditOpen(false);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apagar template?")) return;
    await deleteTemplate.mutateAsync(id);
    toast({ title: "Template apagado" });
  };

  const handlePreview = (t: any) => {
    setPreviewHtml(renderTemplate(t.html_content, MOCK_DATA));
    setPreviewOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Templates de Email</h2>
          <p className="text-muted-foreground">Gerir templates reutilizáveis</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Novo Template</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Pesquisar templates..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {isPending ? (
        <p className="text-muted-foreground">A carregar...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">Nenhum template encontrado.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t: any) => (
            <Card key={t.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{t.name}</CardTitle>
                  <Badge variant={t.is_active ? "default" : "secondary"}>{t.is_active ? "Ativo" : "Inativo"}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{t.subject}</p>
                {t.category && <Badge variant="outline" className="w-fit">{t.category}</Badge>}
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handlePreview(t)}><Eye className="w-3 h-3 mr-1" />Preview</Button>
                <Button variant="outline" size="sm" onClick={() => openEdit(t)}><Edit2 className="w-3 h-3 mr-1" />Editar</Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)} className="text-destructive"><Trash2 className="w-3 h-3" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Editar Template" : "Novo Template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assunto *</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Olá {{nome}}, ..." />
            </div>
            <div className="space-y-2">
              <Label>HTML Content *</Label>
              <Textarea rows={12} value={form.html_content} onChange={(e) => setForm({ ...form, html_content: e.target.value })} placeholder="<h1>Olá {{nome}}</h1>..." className="font-mono text-xs" />
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-1">Variáveis disponíveis:</p>
              <div className="flex flex-wrap gap-1">
                {["nome", "email", "cidade", "plano", "link_dashboard"].map(v => (
                  <Badge key={v} variant="outline" className="text-xs cursor-pointer" onClick={() => {
                    navigator.clipboard.writeText(`{{${v}}}`);
                    toast({ title: `{{${v}}} copiado` });
                  }}>
                    <Copy className="w-2.5 h-2.5 mr-1" />{`{{${v}}}`}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createTemplate.isPending || updateTemplate.isPending}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview do Template</DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg p-4 bg-background" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailTemplatesContent;
