import { useState } from "react";
import { Eye, Pencil, Trash2, Plus, Star, ExternalLink } from "lucide-react";
import { useAdminBlogPosts, useCreateBlogPost, useUpdateBlogPost, useDeleteBlogPost, generateSlug, BlogPost } from "@/hooks/useBlogPosts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORY_OPTIONS = [
  { value: "servicos", label: "Serviços" },
  { value: "obras", label: "Obras" },
  { value: "negocios", label: "Negócios" },
  { value: "dicas", label: "Dicas" },
  { value: "outros", label: "Outros" },
];

const CATEGORY_COLORS: Record<string, string> = {
  servicos: "bg-blue-100 text-blue-800",
  obras: "bg-orange-100 text-orange-800",
  negocios: "bg-green-100 text-green-800",
  dicas: "bg-purple-100 text-purple-800",
  outros: "bg-gray-100 text-gray-800",
};

const emptyPost: Partial<BlogPost> = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  cover_image_url: "",
  category: "dicas",
  tags: [],
  author_name: "Equipa PedeDireto",
  author_avatar_url: "",
  is_published: false,
  featured: false,
  read_time_minutes: 5,
  meta_title: "",
  meta_description: "",
};

const BlogContent = () => {
  const { data: posts = [], isPending } = useAdminBlogPosts();
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const deletePost = useDeleteBlogPost();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Partial<BlogPost>>(emptyPost);
  const [isEditing, setIsEditing] = useState(false);
  const [tagsInput, setTagsInput] = useState("");

  const openCreate = () => {
    setEditingPost({ ...emptyPost });
    setTagsInput("");
    setIsEditing(false);
    setDialogOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditingPost({ ...post });
    setTagsInput((post.tags || []).join(", "));
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleTitleChange = (title: string) => {
    setEditingPost((prev) => ({
      ...prev,
      title,
      slug: !isEditing || prev.slug === generateSlug(prev.title || "") ? generateSlug(title) : prev.slug,
    }));
  };

  const handleSave = async (publish: boolean) => {
    if (!editingPost.title?.trim() || !editingPost.content?.trim()) {
      toast({ title: "Erro", description: "Título e conteúdo são obrigatórios.", variant: "destructive" });
      return;
    }

    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    const payload = {
      ...editingPost,
      tags,
      is_published: publish,
      published_at: publish && !editingPost.published_at ? new Date().toISOString() : editingPost.published_at,
    };

    try {
      if (isEditing && editingPost.id) {
        await updatePost.mutateAsync({ id: editingPost.id, ...payload } as any);
        toast({ title: "Artigo atualizado" });
      } else {
        await createPost.mutateAsync(payload as any);
        toast({ title: "Artigo criado" });
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePost.mutateAsync(id);
      toast({ title: "Artigo eliminado" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const togglePublish = async (post: BlogPost) => {
    await updatePost.mutateAsync({
      id: post.id,
      is_published: !post.is_published,
      published_at: !post.is_published && !post.published_at ? new Date().toISOString() : post.published_at,
    } as any);
    toast({ title: post.is_published ? "Artigo despublicado" : "Artigo publicado" });
  };

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Blog</h2>
          <p className="text-muted-foreground">Gerir artigos e guias</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Novo Artigo</Button>
      </div>

      {isPending ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : (
        <div className="border border-border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-center">⭐</TableHead>
                <TableHead className="text-right">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium max-w-[250px] truncate">
                    <button onClick={() => openEdit(post)} className="hover:text-primary text-left truncate block max-w-full">{post.title}</button>
                  </TableCell>
                  <TableCell>
                    <Badge className={CATEGORY_COLORS[post.category] || ""} variant="secondary">
                      {CATEGORY_OPTIONS.find((c) => c.value === post.category)?.label || post.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={post.is_published ? "default" : "secondary"}>
                      {post.is_published ? "Publicado" : "Rascunho"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(post.published_at)}</TableCell>
                  <TableCell className="text-right">{post.views_count}</TableCell>
                  <TableCell className="text-center">{post.featured && <Star className="h-4 w-4 text-yellow-500 mx-auto" />}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(post)} title="Editar"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" asChild title="Pré-visualizar">
                        <a href={`/blog/${post.slug}?preview=true`} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => togglePublish(post)} title={post.is_published ? "Despublicar" : "Publicar"}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" title="Eliminar"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Eliminar artigo?</AlertDialogTitle>
                            <AlertDialogDescription>Esta acção é irreversível.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(post.id)}>Eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Artigo" : "Novo Artigo"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Conteúdo */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Conteúdo</h4>
              <div>
                <Label>Título *</Label>
                <Input value={editingPost.title || ""} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Título do artigo" />
              </div>
              <div>
                <Label>Slug (URL) *</Label>
                <Input value={editingPost.slug || ""} onChange={(e) => setEditingPost((p) => ({ ...p, slug: e.target.value }))} placeholder="titulo-do-artigo" />
              </div>
              <div>
                <Label>Resumo <span className="text-xs text-muted-foreground">(máx 200 chars)</span></Label>
                <Textarea value={editingPost.excerpt || ""} onChange={(e) => setEditingPost((p) => ({ ...p, excerpt: e.target.value }))} maxLength={200} rows={2} />
                <p className="text-xs text-muted-foreground text-right">{(editingPost.excerpt || "").length}/200</p>
              </div>
              <div>
                <Label>Conteúdo * <span className="text-xs text-muted-foreground">(Markdown: ## título, **bold**, - lista)</span></Label>
                <Textarea value={editingPost.content || ""} onChange={(e) => setEditingPost((p) => ({ ...p, content: e.target.value }))} rows={15} />
              </div>
            </div>

            {/* Media */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Media</h4>
              <div>
                <Label>URL da imagem de capa</Label>
                <Input value={editingPost.cover_image_url || ""} onChange={(e) => setEditingPost((p) => ({ ...p, cover_image_url: e.target.value }))} placeholder="https://..." />
                {editingPost.cover_image_url && (
                  <img src={editingPost.cover_image_url} alt="Preview" className="mt-2 h-32 w-full object-cover rounded-lg" />
                )}
              </div>
            </div>

            {/* Organização */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Organização</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Categoria *</Label>
                  <Select value={editingPost.category || "dicas"} onValueChange={(v) => setEditingPost((p) => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tempo de leitura (min)</Label>
                  <Input type="number" min={1} value={editingPost.read_time_minutes || 5} onChange={(e) => setEditingPost((p) => ({ ...p, read_time_minutes: parseInt(e.target.value) || 5 }))} />
                </div>
              </div>
              <div>
                <Label>Tags <span className="text-xs text-muted-foreground">(separadas por vírgula)</span></Label>
                <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="canalizador, dicas, casa" />
              </div>
            </div>

            {/* Autor */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Autor</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nome do autor</Label>
                  <Input value={editingPost.author_name || ""} onChange={(e) => setEditingPost((p) => ({ ...p, author_name: e.target.value }))} />
                </div>
                <div>
                  <Label>Avatar URL</Label>
                  <Input value={editingPost.author_avatar_url || ""} onChange={(e) => setEditingPost((p) => ({ ...p, author_avatar_url: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* SEO */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">SEO</h4>
              <div>
                <Label>Meta título <span className="text-xs text-muted-foreground">(se vazio usa o título)</span></Label>
                <Input value={editingPost.meta_title || ""} onChange={(e) => setEditingPost((p) => ({ ...p, meta_title: e.target.value }))} />
              </div>
              <div>
                <Label>Meta descrição <span className="text-xs text-muted-foreground">(se vazio usa o resumo)</span></Label>
                <Textarea value={editingPost.meta_description || ""} onChange={(e) => setEditingPost((p) => ({ ...p, meta_description: e.target.value }))} rows={2} />
              </div>
            </div>

            {/* Publicação */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Publicação</h4>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={editingPost.featured || false} onCheckedChange={(v) => setEditingPost((p) => ({ ...p, featured: v }))} />
                  <Label>Destaque</Label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => handleSave(false)} disabled={createPost.isPending || updatePost.isPending}>
                Guardar rascunho
              </Button>
              <Button onClick={() => handleSave(true)} disabled={createPost.isPending || updatePost.isPending}>
                Publicar
              </Button>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogContent;
