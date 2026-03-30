import { useState } from "react";
import { useSubcategoryRelations, useCreateSubcategoryRelation, useDeleteSubcategoryRelation } from "@/hooks/useSubcategoryRelations";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Link2, ArrowRight, Download, Upload, FileSpreadsheet } from "lucide-react";
import ImportRelationsDialog from "./ImportRelationsDialog";
import * as XLSX from "xlsx";

const RELATION_TYPES = [
  { value: "suggestion", label: "Sugestão", description: "Aparece como 'Também pode interessar'" },
  { value: "complement", label: "Complementar", description: "Serviço que complementa o principal" },
  { value: "alternative", label: "Alternativa", description: "Alternativa ao serviço principal" },
];

const SubcategoryRelationsContent = () => {
  const { toast } = useToast();
  const { data: relations = [], isLoading } = useSubcategoryRelations();
  const createRelation = useCreateSubcategoryRelation();
  const deleteRelation = useDeleteSubcategoryRelation();

  const [sourceSubId, setSourceSubId] = useState("");
  const [targetSubId, setTargetSubId] = useState("");
  const [relationType, setRelationType] = useState("suggestion");
  const [priority, setPriority] = useState(1);
  const [filterSource, setFilterSource] = useState("");
  const [importOpen, setImportOpen] = useState(false);

  const { data: allSubs = [] } = useQuery({
    queryKey: ["all-subcategories-with-cat"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subcategories")
        .select("id, name, slug, categories:category_id(name)")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return (data ?? []).map((s: any) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        categoryName: s.categories?.name ?? "",
      }));
    },
  });

  const handleAdd = async () => {
    if (!sourceSubId || !targetSubId || sourceSubId === targetSubId) {
      toast({ title: "Selecione duas subcategorias diferentes", variant: "destructive" });
      return;
    }
    try {
      await createRelation.mutateAsync({
        subcategory_id: sourceSubId,
        related_subcategory_id: targetSubId,
        relation_type: relationType,
        priority,
      });
      toast({ title: "Relação criada com sucesso" });
      setSourceSubId("");
      setTargetSubId("");
    } catch (e: any) {
      toast({ title: e.message?.includes("duplicate") ? "Relação já existe" : "Erro ao criar relação", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRelation.mutateAsync(id);
      toast({ title: "Relação removida" });
    } catch {
      toast({ title: "Erro ao remover", variant: "destructive" });
    }
  };

  // Download template XLSX
  const handleDownloadTemplate = () => {
    const templateData = [
      { subcategoria_origem: "Cabeleireiro & Barbearia", subcategoria_sugerida: "Estética & Unhas", tipo: "suggestion", prioridade: 1 },
      { subcategoria_origem: "Pizzarias", subcategoria_sugerida: "Hambúrgueres", tipo: "alternative", prioridade: 1 },
      { subcategoria_origem: "Remodelações & Obras", subcategoria_sugerida: "Canalizadores", tipo: "suggestion", prioridade: 1 },
    ];
    const subsRef = [...allSubs]
      .sort((a, b) => a.categoryName.localeCompare(b.categoryName) || a.name.localeCompare(b.name))
      .map(s => ({ Nome: s.name, Categoria: s.categoryName, Slug: s.slug }));

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, ws1, "Template");
    const ws2 = XLSX.utils.json_to_sheet(subsRef);
    XLSX.utils.book_append_sheet(wb, ws2, "Subcategorias");
    XLSX.writeFile(wb, "pededireto-template-relacoes.xlsx");
  };

  // Export existing relations
  const handleExport = () => {
    const typeLabel = (t: string) => t === "suggestion" ? "suggestion" : t === "complement" ? "complement" : "alternative";
    const exportData = relations.map(r => ({
      subcategoria_origem: r.subcategory_name,
      subcategoria_sugerida: r.related_subcategory_name,
      tipo: typeLabel(r.relation_type),
      prioridade: r.priority,
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Relações");
    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `pededireto-relacoes-subcategorias-${date}.xlsx`);
  };

  // Group relations by source subcategory
  const grouped = relations.reduce((acc, rel) => {
    const key = rel.subcategory_name || rel.subcategory_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(rel);
    return acc;
  }, {} as Record<string, typeof relations>);

  const filteredGroups = Object.entries(grouped).filter(
    ([key]) => !filterSource || key.toLowerCase().includes(filterSource.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Subcategorias Relacionadas</h1>
          <p className="text-muted-foreground">Definir sugestões inteligentes entre subcategorias.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4 mr-1" /> Descarregar Template
          </Button>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4 mr-1" /> Importar CSV/Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={relations.length === 0}>
            <FileSpreadsheet className="h-4 w-4 mr-1" /> Exportar CSV
          </Button>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
        <h3 className="font-semibold text-sm mb-2">Como funciona?</h3>
        <p className="text-sm text-muted-foreground">
          Quando um utilizador pesquisa e os resultados são de uma subcategoria (ex: <span className="font-medium text-foreground">Catering & Bebidas</span>),
          o motor automaticamente mostra negócios das subcategorias relacionadas (ex: <span className="font-medium text-foreground">Restaurantes</span>) na secção "Também pode interessar".
        </p>
      </div>

      {/* Add form */}
      <div className="bg-card rounded-xl p-6 shadow-card">
        <h2 className="font-semibold mb-4">Adicionar Relação</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Subcategoria Origem</Label>
            <Select value={sourceSubId} onValueChange={setSourceSubId}>
              <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
              <SelectContent>
                {allSubs.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} <span className="text-muted-foreground text-xs">({s.categoryName})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end justify-center pb-2">
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Subcategoria Sugerida</Label>
            <Select value={targetSubId} onValueChange={setTargetSubId}>
              <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
              <SelectContent>
                {allSubs.filter((s) => s.id !== sourceSubId).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} <span className="text-muted-foreground text-xs">({s.categoryName})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Tipo</Label>
            <Select value={relationType} onValueChange={setRelationType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RELATION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleAdd} disabled={createRelation.isPending || !sourceSubId || !targetSubId}>
            {createRelation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
            Adicionar
          </Button>
        </div>
      </div>

      {/* Relations list */}
      <div className="bg-card rounded-xl shadow-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <input
            type="text"
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            placeholder="Filtrar por subcategoria..."
            className="w-full max-w-md px-3 py-2 rounded-lg border border-border bg-background text-sm"
          />
        </div>

        {filteredGroups.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {relations.length === 0
              ? "Nenhuma relação definida. Adicione acima para começar."
              : "Nenhum resultado para o filtro."}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredGroups.map(([sourceName, rels]) => (
              <div key={sourceName} className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Link2 className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">{sourceName}</h3>
                  <Badge variant="secondary" className="text-xs">{rels[0]?.category_name}</Badge>
                </div>
                <div className="space-y-2 ml-6">
                  {rels.map((rel) => (
                    <div key={rel.id} className="flex items-center gap-3 text-sm">
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium">{rel.related_subcategory_name}</span>
                      <Badge variant="secondary" className="text-xs">{rel.related_category_name}</Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {rel.relation_type === "suggestion" ? "Sugestão" : rel.relation_type === "complement" ? "Complementar" : "Alternativa"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">P{rel.priority}</span>
                      <Button size="sm" variant="ghost" className="text-destructive ml-auto h-7 w-7 p-0" onClick={() => handleDelete(rel.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground text-right">{relations.length} relações</p>

      {/* Import Dialog */}
      <ImportRelationsDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        allSubs={allSubs}
        existingRelations={relations}
      />
    </div>
  );
};

export default SubcategoryRelationsContent;
