import { useState } from "react";
import { useSearchLogsAggregated, useMarkSearchReviewed, useDeleteSearchLogs } from "@/hooks/useSearchLogs";
import { useCategories } from "@/hooks/useCategories";
import { useCreateCategory } from "@/hooks/useCategories";
import { useCreateSubcategory } from "@/hooks/useSubcategories";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, CheckCircle, AlertTriangle, MoreHorizontal, Trash2, FolderPlus, Tag } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const SearchLogsContent = () => {
  const { data: logs = [], isLoading } = useSearchLogsAggregated();
  const { data: categories = [] } = useCategories();
  const markReviewed = useMarkSearchReviewed();
  const deleteSearchLogs = useDeleteSearchLogs();
  const createCategory = useCreateCategory();
  const createSubcategory = useCreateSubcategory();
  const { toast } = useToast();
  const [filter, setFilter] = useState<"all" | "pending">("pending");

  // Dialog state
  const [dialogType, setDialogType] = useState<"category" | "subcategory" | null>(null);
  const [dialogTerm, setDialogTerm] = useState("");
  const [newName, setNewName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const filtered = filter === "pending" ? logs.filter((l) => !l.is_reviewed) : logs;

  const handleMark = async (term: string) => {
    try {
      await markReviewed.mutateAsync(term);
      toast({ title: "Marcado como analisado" });
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  const handleDelete = async (term: string) => {
    try {
      await deleteSearchLogs.mutateAsync(term);
      toast({ title: "Registos apagados" });
    } catch {
      toast({ title: "Erro ao apagar", variant: "destructive" });
    }
  };

  const openCreateDialog = (type: "category" | "subcategory", term: string) => {
    setDialogType(type);
    setDialogTerm(term);
    setNewName(term.charAt(0).toUpperCase() + term.slice(1));
    setSelectedCategoryId("");
  };

  const handleCreateCategory = async () => {
    if (!newName.trim()) return;
    try {
      const slug = newName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      await createCategory.mutateAsync({
        name: newName.trim(),
        slug,
        description: null,
        icon: null,
        image_url: null,
        alcance_default: "local",
        display_order: 0,
        is_active: true,
      });
      await markReviewed.mutateAsync(dialogTerm);
      toast({ title: `Categoria "${newName}" criada com sucesso` });
      setDialogType(null);
    } catch {
      toast({ title: "Erro ao criar categoria", variant: "destructive" });
    }
  };

  const handleCreateSubcategory = async () => {
    if (!newName.trim() || !selectedCategoryId) return;
    try {
      const slug = newName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      await createSubcategory.mutateAsync({
        name: newName.trim(),
        slug,
        category_id: selectedCategoryId,
        description: null,
        icon: null,
        display_order: 0,
        is_active: true,
      });
      await markReviewed.mutateAsync(dialogTerm);
      toast({ title: `Subcategoria "${newName}" criada com sucesso` });
      setDialogType(null);
    } catch {
      toast({ title: "Erro ao criar subcategoria", variant: "destructive" });
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
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Pesquisas Sem Resultado</h1>
        <p className="text-muted-foreground">Termos pesquisados que não devolveram resultados</p>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant={filter === "pending" ? "default" : "outline"} onClick={() => setFilter("pending")}>
          <AlertTriangle className="w-4 h-4 mr-1" />
          Por analisar
        </Button>
        <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
          Todos
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>{filter === "pending" ? "Nenhuma pesquisa por analisar!" : "Sem registos de pesquisa."}</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl shadow-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="p-4 font-semibold">Termo</th>
                <th className="p-4 font-semibold text-center">Frequência</th>
                <th className="p-4 font-semibold">Última pesquisa</th>
                <th className="p-4 font-semibold text-center">Estado</th>
                <th className="p-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.search_term} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{log.search_term}</span>
                    </div>
                    {log.count >= 3 && (
                      <p className="text-xs text-accent mt-1">💡 Considerar criar categoria ou subcategoria?</p>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <Badge variant={log.count >= 5 ? "destructive" : log.count >= 3 ? "default" : "secondary"}>
                      {log.count}×
                    </Badge>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {format(new Date(log.last_searched), "dd MMM yyyy, HH:mm", { locale: pt })}
                  </td>
                  <td className="p-4 text-center">
                    {log.is_reviewed ? (
                      <Badge variant="secondary">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Analisado
                      </Badge>
                    ) : (
                      <Badge variant="outline">Pendente</Badge>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!log.is_reviewed && (
                          <DropdownMenuItem onClick={() => handleMark(log.search_term)}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Marcar como analisado
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => openCreateDialog("category", log.search_term)}>
                          <FolderPlus className="w-4 h-4 mr-2" />
                          Criar nova Categoria
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openCreateDialog("subcategory", log.search_term)}>
                          <Tag className="w-4 h-4 mr-2" />
                          Criar nova Subcategoria
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(log.search_term)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Apagar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Category/Subcategory Dialog */}
      <Dialog open={dialogType !== null} onOpenChange={(open) => !open && setDialogType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === "category" ? "Criar nova Categoria" : "Criar nova Subcategoria"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              A partir do termo pesquisado: <strong>"{dialogTerm}"</strong>
            </p>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome..." />
            </div>
            {dialogType === "subcategory" && (
              <div className="space-y-2">
                <Label>Categoria associada</Label>
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar categoria..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogType(null)}>
              Cancelar
            </Button>
            <Button
              onClick={dialogType === "category" ? handleCreateCategory : handleCreateSubcategory}
              disabled={!newName.trim() || (dialogType === "subcategory" && !selectedCategoryId)}
            >
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SearchLogsContent;
