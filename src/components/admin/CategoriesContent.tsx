import { useState } from "react";
import { Category, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useCategories";
import { BusinessWithCategory } from "@/hooks/useBusinesses";
import {
  useAllSubcategories,
  useCreateSubcategory,
  useUpdateSubcategory,
  useDeleteSubcategory,
  Subcategory,
} from "@/hooks/useSubcategories";
import { useSubcategoryBusinessCounts } from "@/hooks/useBusinessSubcategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, FolderOpen, ChevronDown, ChevronRight } from "lucide-react";

interface CategoriesContentProps {
  categories: Category[];
  businesses: BusinessWithCategory[];
}

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

const iconOptions = [
  "UtensilsCrossed",
  "Wrench",
  "Store",
  "Hammer",
  "Scissors",
  "Briefcase",
  "Car",
  "Home",
  "Heart",
  "Sparkles",
];

const CategoriesContent = ({ categories, businesses }: CategoriesContentProps) => {
  const { toast } = useToast();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const { data: allSubcategories = [] } = useAllSubcategories();
  const { data: subcategoryBusinessCounts = {} } = useSubcategoryBusinessCounts();
  const createSubcategory = useCreateSubcategory();
  const updateSubcategory = useUpdateSubcategory();
  const deleteSubcategory = useDeleteSubcategory();

  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [subCategoryParentId, setSubCategoryParentId] = useState<string>("");

  // Category form — video_url adicionado
  const [catForm, setCatForm] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "Briefcase",
    image_url: "",
    video_url: "",
    alcance_default: "local" as "local" | "nacional" | "hibrido",
    display_order: 0,
    is_active: true,
  });

  // Subcategory form — video_url adicionado
  const [subForm, setSubForm] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "",
    image_url: "",
    video_url: "",
    category_id: "",
    display_order: 0,
    is_active: true,
  });

  const resetCatForm = () => {
    setCatForm({
      name: "",
      slug: "",
      description: "",
      icon: "Briefcase",
      image_url: "",
      video_url: "",
      alcance_default: "local",
      display_order: 0,
      is_active: true,
    });
    setEditingCategory(null);
  };

  const resetSubForm = () => {
    setSubForm({
      name: "",
      slug: "",
      description: "",
      icon: "",
      image_url: "",
      video_url: "",
      category_id: "",
      display_order: 0,
      is_active: true,
    });
    setEditingSubcategory(null);
  };

  const toggleExpand = (catId: string) => {
    const next = new Set(expandedCategories);
    if (next.has(catId)) next.delete(catId);
    else next.add(catId);
    setExpandedCategories(next);
  };

  const openEditCatDialog = (category: Category) => {
    setEditingCategory(category);
    setCatForm({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      icon: category.icon || "Briefcase",
      image_url: category.image_url || "",
      video_url: category.video_url || "",
      alcance_default: category.alcance_default,
      display_order: category.display_order,
      is_active: category.is_active,
    });
    setCatDialogOpen(true);
  };

  const openNewSubDialog = (categoryId: string) => {
    resetSubForm();
    setSubForm((prev) => ({ ...prev, category_id: categoryId }));
    setSubCategoryParentId(categoryId);
    setSubDialogOpen(true);
  };

  const openEditSubDialog = (sub: Subcategory) => {
    setEditingSubcategory(sub);
    setSubForm({
      name: sub.name,
      slug: sub.slug,
      description: sub.description || "",
      icon: sub.icon || "",
      image_url: (sub as any).image_url || "",
      video_url: (sub as any).video_url || "",
      category_id: sub.category_id,
      display_order: sub.display_order,
      is_active: sub.is_active,
    });
    setSubCategoryParentId(sub.category_id);
    setSubDialogOpen(true);
  };

  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...catForm,
        slug: catForm.slug || generateSlug(catForm.name),
        description: catForm.description || null,
        image_url: catForm.image_url || null,
        video_url: catForm.video_url || null, // ← novo campo
      };
      if (editingCategory) {
        await updateCategory.mutateAsync({ id: editingCategory.id, ...data });
        toast({ title: "Categoria atualizada" });
      } else {
        await createCategory.mutateAsync(data);
        toast({ title: "Categoria criada" });
      }
      setCatDialogOpen(false);
      resetCatForm();
    } catch {
      toast({ title: "Erro ao guardar categoria", variant: "destructive" });
    }
  };

  const handleSubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...subForm,
        slug: subForm.slug || generateSlug(subForm.name),
        description: subForm.description || null,
        icon: subForm.icon || null,
        image_url: subForm.image_url || null,
        video_url: subForm.video_url || null, // ← novo campo
        category_id: subForm.category_id || subCategoryParentId,
      };
      if (editingSubcategory) {
        await updateSubcategory.mutateAsync({ id: editingSubcategory.id, ...data });
        toast({ title: "Subcategoria atualizada" });
      } else {
        await createSubcategory.mutateAsync(data);
        toast({ title: "Subcategoria criada" });
      }
      setSubDialogOpen(false);
      resetSubForm();
    } catch {
      toast({ title: "Erro ao guardar subcategoria", variant: "destructive" });
    }
  };

  const handleDeleteCat = async (id: string) => {
    const businessCount = businesses.filter((b) => b.category_id === id).length;
    if (businessCount > 0) {
      toast({
        title: "Não é possível remover",
        description: `Tem ${businessCount} negócio(s) associado(s).`,
        variant: "destructive",
      });
      return;
    }
    if (!confirm("Remover esta categoria e suas subcategorias?")) return;
    try {
      await deleteCategory.mutateAsync(id);
      toast({ title: "Categoria removida" });
    } catch {
      toast({ title: "Erro ao remover", variant: "destructive" });
    }
  };

  const handleDeleteSub = async (id: string) => {
    const businessCount = subcategoryBusinessCounts[id] ?? 0;
    if (businessCount > 0) {
      toast({
        title: "Não é possível remover",
        description: `Tem ${businessCount} negócio(s) associado(s).`,
        variant: "destructive",
      });
      return;
    }
    if (!confirm("Remover esta subcategoria?")) return;
    try {
      await deleteSubcategory.mutateAsync(id);
      toast({ title: "Subcategoria removida" });
    } catch {
      toast({ title: "Erro ao remover", variant: "destructive" });
    }
  };

  const getBusinessCount = (categoryId: string) => businesses.filter((b) => b.category_id === categoryId).length;
  const getSubBusinessCount = (subId: string) => subcategoryBusinessCounts[subId] ?? 0;
  const getSubcategoriesForCategory = (catId: string) => allSubcategories.filter((s) => s.category_id === catId);

  const isCatLoading = createCategory.isPending || updateCategory.isPending;
  const isSubLoading = createSubcategory.isPending || updateSubcategory.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Categorias & Subcategorias</h1>
          <p className="text-muted-foreground">Gerir áreas e subáreas de negócio</p>
        </div>

        {/* Add Category Dialog */}
        <Dialog
          open={catDialogOpen}
          onOpenChange={(open) => {
            setCatDialogOpen(open);
            if (!open) resetCatForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="btn-cta-primary">
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCatSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={catForm.slug}
                  onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
                  placeholder="gerado automaticamente"
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  rows={2}
                  placeholder="Ex: Fome? Encontre restaurantes..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ícone</Label>
                  <Select value={catForm.icon} onValueChange={(v) => setCatForm({ ...catForm, icon: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((icon) => (
                        <SelectItem key={icon} value={icon}>
                          {icon}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Alcance Padrão</Label>
                  <Select
                    value={catForm.alcance_default}
                    onValueChange={(v: "local" | "nacional" | "hibrido") =>
                      setCatForm({ ...catForm, alcance_default: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local</SelectItem>
                      <SelectItem value="nacional">Nacional</SelectItem>
                      <SelectItem value="hibrido">Híbrido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Imagem (URL)</Label>
                <Input
                  type="url"
                  value={catForm.image_url}
                  onChange={(e) => setCatForm({ ...catForm, image_url: e.target.value })}
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>
              <div className="space-y-2">
                <Label>Vídeo (URL YouTube ou Supabase .mp4)</Label>
                <Input
                  type="url"
                  value={catForm.video_url}
                  onChange={(e) => setCatForm({ ...catForm, video_url: e.target.value })}
                  placeholder="https://youtube.com/watch?v=... ou https://...mp4"
                />
                <p className="text-xs text-muted-foreground">
                  Quando preenchido, o vídeo substitui a imagem no hero e nas páginas de categoria.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Ordem</Label>
                <Input
                  type="number"
                  value={catForm.display_order}
                  onChange={(e) => setCatForm({ ...catForm, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Switch checked={catForm.is_active} onCheckedChange={(c) => setCatForm({ ...catForm, is_active: c })} />
                <Label>Ativa</Label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setCatDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isCatLoading}>
                  {isCatLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingCategory ? "Guardar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Subcategory Dialog */}
      <Dialog
        open={subDialogOpen}
        onOpenChange={(open) => {
          setSubDialogOpen(open);
          if (!open) resetSubForm();
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSubcategory ? "Editar Subcategoria" : "Nova Subcategoria"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={subForm.name} onChange={(e) => setSubForm({ ...subForm, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={subForm.slug}
                onChange={(e) => setSubForm({ ...subForm, slug: e.target.value })}
                placeholder="gerado automaticamente"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={subForm.description}
                onChange={(e) => setSubForm({ ...subForm, description: e.target.value })}
                rows={2}
                placeholder="Texto orientado a problemas..."
              />
            </div>
            <div className="space-y-2">
              <Label>Imagem (URL)</Label>
              <Input
                type="url"
                value={subForm.image_url}
                onChange={(e) => setSubForm({ ...subForm, image_url: e.target.value })}
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label>Vídeo (URL YouTube ou Supabase .mp4)</Label>
              <Input
                type="url"
                value={subForm.video_url}
                onChange={(e) => setSubForm({ ...subForm, video_url: e.target.value })}
                placeholder="https://youtube.com/watch?v=... ou https://...mp4"
              />
            </div>
            <div className="space-y-2">
              <Label>Ordem</Label>
              <Input
                type="number"
                value={subForm.display_order}
                onChange={(e) => setSubForm({ ...subForm, display_order: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Switch checked={subForm.is_active} onCheckedChange={(c) => setSubForm({ ...subForm, is_active: c })} />
              <Label>Ativa</Label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setSubDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubLoading}>
                {isSubLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingSubcategory ? "Guardar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Categories + Subcategories List */}
      <div className="space-y-4">
        {categories.map((category) => {
          const subcats = getSubcategoriesForCategory(category.id);
          const isExpanded = expandedCategories.has(category.id);

          return (
            <div key={category.id} className="bg-card rounded-xl shadow-card overflow-hidden">
              {/* Category Row */}
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <button onClick={() => toggleExpand(category.id)} className="p-1 hover:bg-muted rounded">
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{category.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{getBusinessCount(category.id)} negócios</Badge>
                  <Badge variant="secondary">{subcats.length} subcategorias</Badge>
                  {category.video_url && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                      🎬 Vídeo
                    </Badge>
                  )}
                  {category.is_active ? (
                    <Badge variant="secondary" className="bg-success/10 text-success">
                      Ativa
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-muted text-muted-foreground">
                      Inativa
                    </Badge>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => openEditCatDialog(category)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleDeleteCat(category.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Subcategories */}
              {isExpanded && (
                <div className="border-t border-border bg-muted/20 px-5 pb-4">
                  <div className="flex items-center justify-between py-3">
                    <p className="text-sm font-medium text-muted-foreground">Subcategorias</p>
                    <Button size="sm" variant="outline" onClick={() => openNewSubDialog(category.id)}>
                      <Plus className="h-3 w-3 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {subcats.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
                      >
                        <div>
                          <span className="font-medium">{sub.name}</span>
                          {sub.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{sub.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {getSubBusinessCount(sub.id)} negócios
                          </Badge>
                          {(sub as any).video_url && (
                            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                              🎬
                            </Badge>
                          )}
                          {!sub.is_active && (
                            <Badge variant="secondary" className="text-xs bg-muted">
                              Inativa
                            </Badge>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => openEditSubDialog(sub)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleDeleteSub(sub.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {subcats.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhuma subcategoria.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {categories.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Nenhuma categoria criada ainda.</div>
        )}
      </div>
    </div>
  );
};

export default CategoriesContent;
