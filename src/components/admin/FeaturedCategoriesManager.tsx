import { useState } from "react";
import { useAllFeaturedCategories, useCreateFeaturedCategory, useUpdateFeaturedCategory, useDeleteFeaturedCategory } from "@/hooks/useFeaturedCategories";
import { useAllCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, ImageIcon, Loader2, LayoutGrid } from "lucide-react";

const FeaturedCategoriesManager = () => {
  const { toast } = useToast();
  const { data: featured = [], isLoading } = useAllFeaturedCategories();
  const { data: allCategories = [] } = useAllCategories();
  const createMutation = useCreateFeaturedCategory();
  const updateMutation = useUpdateFeaturedCategory();
  const deleteMutation = useDeleteFeaturedCategory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ category_id: "", cover_image_url: "", video_url: "", display_order: 0, is_active: true });

  const usedCategoryIds = featured.map((fc) => fc.category_id);
  const availableCategories = allCategories.filter(
    (c) => c.is_active && (!usedCategoryIds.includes(c.id) || c.id === form.category_id)
  );

  const openCreate = () => {
    setEditingId(null);
    setForm({ category_id: "", cover_image_url: "", video_url: "", display_order: featured.length, is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (fc: any) => {
    setEditingId(fc.id);
    setForm({ category_id: fc.category_id, cover_image_url: fc.cover_image_url || "", video_url: (fc as any).video_url || "", display_order: fc.display_order, is_active: fc.is_active });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.category_id) {
      toast({ title: "Seleccione uma categoria", variant: "destructive" });
      return;
    }
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, cover_image_url: form.cover_image_url || "", video_url: form.video_url || undefined, display_order: form.display_order, is_active: form.is_active } as any);
        toast({ title: "Categoria em destaque atualizada" });
      } else {
        await createMutation.mutateAsync({ ...form, cover_image_url: form.cover_image_url || "" } as any);
        toast({ title: "Categoria em destaque adicionada" });
      }
      setDialogOpen(false);
    } catch {
      toast({ title: "Erro ao guardar", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Categoria em destaque removida" });
    } catch {
      toast({ title: "Erro ao remover", variant: "destructive" });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="bg-card rounded-xl p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Categorias em Destaque (Homepage)</h2>
          <Badge variant="secondary">{featured.length}</Badge>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Adicionar
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : featured.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">Nenhuma categoria em destaque configurada.</p>
      ) : (
        <div className="space-y-3">
          {featured.map((fc) => (
            <div key={fc.id} className="flex items-center gap-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
              {fc.cover_image_url ? (
                <img src={fc.cover_image_url} alt={fc.categories?.name || ""} className="w-20 h-12 rounded-lg object-cover" />
              ) : (
                <div className="w-20 h-12 rounded-lg bg-muted flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{fc.categories?.name || "Categoria removida"}</h3>
                <p className="text-sm text-muted-foreground">Ordem: {fc.display_order}</p>
              </div>
              <Badge variant={fc.is_active ? "default" : "secondary"}>
                {fc.is_active ? "Ativo" : "Inativo"}
              </Badge>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => openEdit(fc)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(fc.id)} disabled={deleteMutation.isPending}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar" : "Adicionar"} Categoria em Destaque</DialogTitle>
            <DialogDescription>Configure a categoria e a imagem de capa.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Categoria</label>
              <Select value={form.category_id} onValueChange={(v) => setForm((f) => ({ ...f, category_id: v }))} disabled={!!editingId}>
                <SelectTrigger><SelectValue placeholder="Selecionar categoria" /></SelectTrigger>
                <SelectContent>
                  {availableCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">URL da Imagem de Capa</label>
              <Input value={form.cover_image_url} onChange={(e) => setForm((f) => ({ ...f, cover_image_url: e.target.value }))} placeholder="https://..." />
              {form.cover_image_url && (
                <img src={form.cover_image_url} alt="Preview" className="mt-2 w-full aspect-video object-cover rounded-lg border" />
              )}
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">Ordem</label>
                <Input type="number" value={form.display_order} onChange={(e) => setForm((f) => ({ ...f, display_order: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
                <span className="text-sm">Ativo</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {editingId ? "Guardar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeaturedCategoriesManager;
