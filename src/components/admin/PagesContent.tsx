import { useState } from "react";
import { useInstitutionalPages, useUpdateInstitutionalPage } from "@/hooks/useInstitutionalPages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Pencil, FileText, Eye, EyeOff } from "lucide-react";
import type { InstitutionalPage } from "@/hooks/useInstitutionalPages";

const PagesContent = () => {
  const { toast } = useToast();
  const { data: pages = [], isLoading } = useInstitutionalPages();
  const updatePage = useUpdateInstitutionalPage();
  const [editingPage, setEditingPage] = useState<InstitutionalPage | null>(null);
  const [form, setForm] = useState({
    title: "", content: "", is_active: true,
    meta_title: "", meta_description: "",
  });

  const openEdit = (page: InstitutionalPage) => {
    setEditingPage(page);
    setForm({
      title: page.title,
      content: page.content || "",
      is_active: page.is_active,
      meta_title: page.meta_title || "",
      meta_description: page.meta_description || "",
    });
  };

  const handleSave = async () => {
    if (!editingPage) return;
    try {
      await updatePage.mutateAsync({
        id: editingPage.id,
        title: form.title,
        content: form.content,
        is_active: form.is_active,
        meta_title: form.meta_title || null,
        meta_description: form.meta_description || null,
      });
      toast({ title: "Página atualizada" });
      setEditingPage(null);
    } catch {
      toast({ title: "Erro ao guardar", variant: "destructive" });
    }
  };

  const toggleActive = async (page: InstitutionalPage) => {
    try {
      await updatePage.mutateAsync({ id: page.id, is_active: !page.is_active });
      toast({ title: page.is_active ? "Página desativada" : "Página ativada" });
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Páginas Institucionais</h1>
        <p className="text-muted-foreground">Gerir conteúdo das páginas institucionais</p>
      </div>

      <div className="space-y-3">
        {pages.map((page) => (
          <div key={page.id} className="bg-card rounded-xl p-5 shadow-card flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium">{page.title}</h3>
              <p className="text-sm text-muted-foreground">/{page.slug}</p>
            </div>
            <div className="flex items-center gap-3">
              {page.is_active ? (
                <Badge variant="secondary" className="bg-success/10 text-success">Ativa</Badge>
              ) : (
                <Badge variant="secondary">Inativa</Badge>
              )}
              <Button size="sm" variant="ghost" onClick={() => toggleActive(page)} title={page.is_active ? "Desativar" : "Ativar"}>
                {page.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => openEdit(page)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingPage} onOpenChange={(open) => { if (!open) setEditingPage(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Página — {editingPage?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Conteúdo (HTML)</Label>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={12} className="font-mono text-sm" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Meta Título (SEO)</Label>
                <Input value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} placeholder="Máx. 60 caracteres" />
              </div>
              <div className="space-y-2">
                <Label>Meta Descrição (SEO)</Label>
                <Input value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} placeholder="Máx. 160 caracteres" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(c) => setForm({ ...form, is_active: c })} />
              <Label>Página Ativa</Label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditingPage(null)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={updatePage.isPending}>
                {updatePage.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PagesContent;
