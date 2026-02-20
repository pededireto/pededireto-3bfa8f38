import { useState } from "react";
import {
  useInstitutionalPages,
  useCreateInstitutionalPage,
  useUpdateInstitutionalPage,
  useDeleteInstitutionalPage,
} from "@/hooks/useInstitutionalPages";
import type { InstitutionalPage, PageBlock } from "@/hooks/useInstitutionalPages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Pencil, FileText, Eye, EyeOff, Plus, Trash2, LayoutTemplate, Code, GripVertical } from "lucide-react";
import BlockEditor from "./BlockEditor";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface PageForm {
  title: string;
  slug: string;
  content: string;
  page_type: "simple" | "advanced";
  blocks: PageBlock[];
  is_active: boolean;
  show_in_header: boolean;
  show_in_footer: boolean;
  meta_title: string;
  meta_description: string;
}

const emptyForm: PageForm = {
  title: "", slug: "", content: "", page_type: "simple", blocks: [],
  is_active: true, show_in_header: true, show_in_footer: true,
  meta_title: "", meta_description: "",
};

function SortablePageRow({
  page,
  onToggleActive,
  onEdit,
  onDelete,
}: {
  page: InstitutionalPage;
  onToggleActive: (page: InstitutionalPage) => void;
  onEdit: (page: InstitutionalPage) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-card rounded-xl p-5 shadow-card flex items-center gap-4">
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground">
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        {page.page_type === "advanced" ? (
          <LayoutTemplate className="w-5 h-5 text-primary" />
        ) : (
          <FileText className="w-5 h-5 text-primary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium">{page.title}</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>/pagina/{page.slug}</span>
          {page.page_type === "advanced" && (
            <Badge variant="outline" className="text-xs">Avançada</Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {page.show_in_header && <Badge variant="outline" className="text-xs">Header</Badge>}
        {page.show_in_footer && <Badge variant="outline" className="text-xs">Footer</Badge>}
        {page.is_active ? (
          <Badge variant="secondary" className="bg-success/10 text-success">Ativa</Badge>
        ) : (
          <Badge variant="secondary">Inativa</Badge>
        )}
        <Button size="sm" variant="ghost" onClick={() => onToggleActive(page)} title={page.is_active ? "Desativar" : "Ativar"}>
          {page.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onEdit(page)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="ghost" className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Apagar página?</AlertDialogTitle>
              <AlertDialogDescription>Esta ação não pode ser revertida.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(page.id)}>Apagar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

const PagesContent = () => {
  const { toast } = useToast();
  const { data: pages = [], isLoading } = useInstitutionalPages();
  const createPage = useCreateInstitutionalPage();
  const updatePage = useUpdateInstitutionalPage();
  const deletePage = useDeleteInstitutionalPage();

  const [editingPage, setEditingPage] = useState<InstitutionalPage | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<PageForm>(emptyForm);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const openCreate = () => {
    setEditingPage(null);
    setIsCreating(true);
    setForm(emptyForm);
  };

  const openEdit = (page: InstitutionalPage) => {
    setIsCreating(false);
    setEditingPage(page);
    setForm({
      title: page.title,
      slug: page.slug,
      content: page.content || "",
      page_type: page.page_type,
      blocks: page.blocks || [],
      is_active: page.is_active,
      show_in_header: page.show_in_header,
      show_in_footer: page.show_in_footer,
      meta_title: page.meta_title || "",
      meta_description: page.meta_description || "",
    });
  };

  const closeDialog = () => { setEditingPage(null); setIsCreating(false); };

  const handleSave = async () => {
    if (!form.title || !form.slug) {
      toast({ title: "Preencha título e slug", variant: "destructive" });
      return;
    }

    try {
      if (isCreating) {
        await createPage.mutateAsync({
          title: form.title,
          slug: form.slug,
          page_type: form.page_type,
          content: form.page_type === "simple" ? form.content : null,
          blocks: form.page_type === "advanced" ? form.blocks : [],
          is_active: form.is_active,
          show_in_header: form.show_in_header,
          show_in_footer: form.show_in_footer,
          meta_title: form.meta_title || null,
          meta_description: form.meta_description || null,
        });
        toast({ title: "Página criada com sucesso" });
      } else if (editingPage) {
        await updatePage.mutateAsync({
          id: editingPage.id,
          title: form.title,
          slug: form.slug,
          page_type: form.page_type,
          content: form.page_type === "simple" ? form.content : null,
          blocks: form.page_type === "advanced" ? form.blocks : [],
          is_active: form.is_active,
          show_in_header: form.show_in_header,
          show_in_footer: form.show_in_footer,
          meta_title: form.meta_title || null,
          meta_description: form.meta_description || null,
        } as any);
        toast({ title: "Página atualizada" });
      }
      closeDialog();
    } catch {
      toast({ title: "Erro ao guardar", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePage.mutateAsync(id);
      toast({ title: "Página apagada" });
    } catch {
      toast({ title: "Erro ao apagar", variant: "destructive" });
    }
  };

  const toggleActive = async (page: InstitutionalPage) => {
    try {
      await updatePage.mutateAsync({ id: page.id, is_active: !page.is_active } as any);
      toast({ title: page.is_active ? "Página desativada" : "Página ativada" });
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = pages.findIndex((p) => p.id === active.id);
    const newIndex = pages.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(pages, oldIndex, newIndex);

    // Persist new order
    try {
      await Promise.all(
        reordered.map((page, i) =>
          updatePage.mutateAsync({ id: page.id, display_order: i } as any)
        )
      );
      toast({ title: "Ordem atualizada" });
    } catch {
      toast({ title: "Erro ao reordenar", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const dialogOpen = isCreating || !!editingPage;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Páginas Institucionais</h1>
          <p className="text-muted-foreground">Criar e gerir páginas do site</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Nova Página
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={pages.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {pages.map((page) => (
              <SortablePageRow
                key={page.id}
                page={page}
                onToggleActive={toggleActive}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {pages.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhuma página criada. Clique em "Nova Página" para começar.
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? "Nova Página" : `Editar — ${editingPage?.title}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Slug (URL)</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                  placeholder="ex: sobre-nos"
                />
              </div>
            </div>

            {/* Page type */}
            <div className="space-y-2">
              <Label>Modelo de Página</Label>
              <Select value={form.page_type} onValueChange={(v: "simple" | "advanced") => setForm({ ...form, page_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">
                    <span className="flex items-center gap-2"><Code className="h-4 w-4" /> Simples (HTML)</span>
                  </SelectItem>
                  <SelectItem value="advanced">
                    <span className="flex items-center gap-2"><LayoutTemplate className="h-4 w-4" /> Avançada (Blocos)</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Content editor based on type */}
            {form.page_type === "simple" ? (
              <div className="space-y-2">
                <Label>Conteúdo (HTML)</Label>
                <Textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Blocos de Conteúdo</Label>
                <BlockEditor blocks={form.blocks} onChange={(blocks) => setForm({ ...form, blocks })} />
              </div>
            )}

            {/* SEO */}
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

            {/* Toggles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(c) => setForm({ ...form, is_active: c })} />
                <Label>Ativa</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.show_in_header} onCheckedChange={(c) => setForm({ ...form, show_in_header: c })} />
                <Label>No Header</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.show_in_footer} onCheckedChange={(c) => setForm({ ...form, show_in_footer: c })} />
                <Label>No Footer</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button onClick={handleSave} disabled={createPage.isPending || updatePage.isPending}>
                {(createPage.isPending || updatePage.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isCreating ? "Criar Página" : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PagesContent;
