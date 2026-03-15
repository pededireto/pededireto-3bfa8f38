import { useState, useRef, useMemo } from "react";
import {
  BusinessWithCategory,
  useCreateBusiness,
  useDeleteBusiness,
  useUpdateBusiness,
  SUBSCRIPTION_PLANS,
  SubscriptionPlan,
  SubscriptionStatus,
  CommercialStatus,
} from "@/hooks/useBusinesses";
import { useCommercialPlans } from "@/hooks/useCommercialPlans";
import { Category } from "@/hooks/useCategories";
import { useAllSubcategories } from "@/hooks/useSubcategories";
import { useSyncBusinessSubcategories } from "@/hooks/useBusinessSubcategories";
import { useBusinessSubcategoryMap } from "@/hooks/useBusinessSubcategoryMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Trash2,
  Loader2,
  Search,
  Building2,
  Upload,
  FileSpreadsheet,
  Download,
  Pencil,
  Power,
  CheckSquare,
  Trophy,
  Medal,
} from "lucide-react";
import ContactLogsDialog from "@/components/admin/ContactLogsDialog";
import BusinessFileCard from "@/components/admin/BusinessFileCard";
import ImportBySourceDialog from "@/components/admin/ImportBySourceDialog";
import ImportByTextDialog from "@/components/admin/ImportByTextDialog";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";

interface BusinessesContentProps {
  businesses: BusinessWithCategory[];
  categories: Category[];
}

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

const BusinessesContent = ({ businesses, categories }: BusinessesContentProps) => {
  const { toast } = useToast();
  const createBusiness = useCreateBusiness();

  const deleteBusiness = useDeleteBusiness();
  const updateBusiness = useUpdateBusiness();
  const syncSubcategories = useSyncBusinessSubcategories();
  const { data: allSubcategories = [] } = useAllSubcategories();
  const { data: commercialPlans = [] } = useCommercialPlans(true);
  const { data: subMap } = useBusinessSubcategoryMap();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  // ✅ NOVO: estado para filtro de cidade
  const [filterCity, setFilterCity] = useState("");
  const [filterSubcategory, setFilterSubcategory] = useState("");
  const [rankingMode, setRankingMode] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; errors: string[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<BusinessWithCategory | null>(null);

  // BULK ACTIONS STATE
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // ✅ NOVO: lista de cidades únicas extraída dos negócios (sem query extra à BD)
  const availableCities = useMemo(() => {
    const cities = businesses
      .map((b) => b.city)
      .filter((c): c is string => Boolean(c && c.trim()))
      .map((c) => c.trim());
    return [...new Set(cities)].sort((a, b) => a.localeCompare(b, "pt"));
  }, [businesses]);

  const resetForm = () => {
    setEditingBusiness(null);
  };

  const openEditDialog = (business: BusinessWithCategory) => {
    setEditingBusiness(business);
    setDialogOpen(true);
  };

  const handleToggleActive = async (business: BusinessWithCategory) => {
    const newStatus = !business.is_active;
    const label = newStatus ? "ativar" : "inativar";
    if (!confirm(`Tem certeza que deseja ${label} "${business.name}"?`)) return;
    try {
      await updateBusiness.mutateAsync({ id: business.id, is_active: newStatus });
      toast({ title: newStatus ? "Negócio ativado" : "Negócio inativado" });
    } catch {
      toast({ title: "Erro", description: `Não foi possível ${label} o negócio`, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este negócio permanentemente?")) return;
    try {
      await deleteBusiness.mutateAsync(id);
      toast({ title: "Negócio removido com sucesso" });
    } catch (error: any) {
      const detail = error?.details || error?.hint || error?.message || "Não foi possível remover o negócio";
      const code = error?.code ? ` (${error.code})` : "";
      toast({ title: "Erro ao remover negócio", description: `${detail}${code}`, variant: "destructive" });
      console.error("[BusinessesContent] delete error:", error);
    }
  };

  // BULK ACTIONS
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredBusinesses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredBusinesses.map((b) => b.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkActivate = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Ativar ${selectedIds.size} negócios selecionados?`)) return;

    setIsBulkProcessing(true);
    let success = 0;
    let errors = 0;

    for (const id of selectedIds) {
      try {
        await supabase.from("businesses").update({ is_active: true }).eq("id", id);
        success++;
      } catch {
        errors++;
      }
    }

    setIsBulkProcessing(false);
    setSelectedIds(new Set());
    toast({
      title: `${success} negócios ativados`,
      description: errors > 0 ? `${errors} erros` : undefined,
    });

    // Force refresh
    window.location.reload();
  };

  const handleBulkDeactivate = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Desativar ${selectedIds.size} negócios selecionados?`)) return;

    setIsBulkProcessing(true);
    let success = 0;
    let errors = 0;

    for (const id of selectedIds) {
      try {
        await supabase.from("businesses").update({ is_active: false }).eq("id", id);
        success++;
      } catch {
        errors++;
      }
    }

    setIsBulkProcessing(false);
    setSelectedIds(new Set());
    toast({
      title: `${success} negócios desativados`,
      description: errors > 0 ? `${errors} erros` : undefined,
    });

    window.location.reload();
  };

  // Excel import with | separated subcategories
  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResults(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

      let success = 0;
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;

        try {
          if (!row.name) {
            errors.push(`Linha ${rowNum}: Nome em falta`);
            continue;
          }

          let categoryId: string | null = null;
          if (row.category) {
            const cat = categories.find((c) => c.name.toLowerCase() === row.category.toLowerCase());
            if (cat) {
              categoryId = cat.id;
            } else {
              errors.push(`Linha ${rowNum}: Categoria "${row.category}" não encontrada`);
              continue;
            }
          }

          const subcategoryIds: string[] = [];
          let primarySubcategoryId: string | null = null;
          const subcatNames = (row.subcategory || row.subcategories || "")
            .split("|")
            .map((s) => s.trim())
            .filter(Boolean);

          for (const subName of subcatNames) {
            const sub = allSubcategories.find(
              (s) => s.name.toLowerCase() === subName.toLowerCase() && (!categoryId || s.category_id === categoryId),
            );
            if (sub) {
              subcategoryIds.push(sub.id);
              if (!primarySubcategoryId) primarySubcategoryId = sub.id;
            } else {
              errors.push(`Linha ${rowNum}: Subcategoria "${subName}" não encontrada`);
            }
          }

          let alcance: "local" | "nacional" | "hibrido" = "local";
          if (row.alcance) {
            const norm = row.alcance.toLowerCase().trim();
            if (norm === "nacional") alcance = "nacional";
            else if (norm === "hibrido" || norm === "híbrido") alcance = "hibrido";
          }

          const businessData = {
            name: row.name.trim(),
            slug: generateSlug(row.name.trim()),
            category_id: categoryId,
            subcategory_id: primarySubcategoryId,
            description: row.description?.trim() || null,
            city: row.city?.trim() || null,
            zone: null,
            alcance,
            logo_url: row.logo_url?.trim() || null,
            cta_whatsapp: row.whatsapp?.trim() || null,
            cta_phone: row.telefone?.trim() || null,
            cta_email: row.email?.trim() || null,
            cta_website: row.website?.trim() || null,
            cta_app: null,
            images: [],
            coordinates: null,
            schedule_weekdays: null,
            schedule_weekend: null,
            is_active: false,
            is_featured: false,
            is_premium: false,
            premium_level: null,
            commercial_status: "nao_contactado" as CommercialStatus,
            display_order: 0,
            plan_id: null,
            subscription_plan: "free" as SubscriptionPlan,
            subscription_price: 0,
            subscription_start_date: null,
            subscription_end_date: null,
            subscription_status: "inactive" as SubscriptionStatus,
            public_address: null,
          };

          const result = await createBusiness.mutateAsync(businessData);

          if (subcategoryIds.length > 0 && result.id) {
            await syncSubcategories.mutateAsync({ businessId: result.id, subcategoryIds });
          }

          success++;
        } catch (err: any) {
          errors.push(`Linha ${rowNum}: ${err.message || "Erro desconhecido"}`);
        }
      }

      setImportResults({ success, errors });
      toast({ title: "Importação concluída", description: `${success} importados, ${errors.length} erros` });
    } catch {
      toast({
        title: "Erro na importação",
        description: "Ficheiro inválido ou formato incorreto",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExcelExport = () => {
    const commercialLabels: Record<string, string> = {
      nao_contactado: "Não Contactado",
      contactado: "Contactado",
      interessado: "Interessado",
      cliente: "Cliente",
    };
    const exportData = filteredBusinesses.map((b) => ({
      Nome: b.name,
      Categoria: b.categories?.name || "-",
      Subcategoria: b.subcategories?.name || "-",
      Cidade: b.city || "-",
      Telefone: b.cta_phone || "-",
      WhatsApp: b.cta_whatsapp || "-",
      Email: b.cta_email || "-",
      Website: b.cta_website || "-",
      Estado: b.is_active ? "Ativo" : "Inativo",
      "Estado Comercial": commercialLabels[b.commercial_status] || "Não Contactado",
      Destaque: b.is_featured ? "Sim" : "Não",
      Premium: b.is_premium ? "Sim" : "Não",
      "Nível Premium": b.premium_level || "-",
      "Data de Criação": b.created_at ? new Date(b.created_at).toLocaleDateString("pt-PT") : "-",
      Subscrição: SUBSCRIPTION_PLANS[b.subscription_plan]?.label || "Gratuito",
      "Fim Subscrição": b.subscription_end_date || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Negócios");
    XLSX.writeFile(wb, `negocios-pededireto-${new Date().toISOString().split("T")[0]}.xlsx`);
    toast({ title: "Exportação concluída", description: `${exportData.length} negócios exportados` });
  };

  // Subcategorias filtradas pela categoria selecionada
  const filteredSubcategories = useMemo(() => {
    if (!filterCategory || filterCategory === "all") return allSubcategories;
    return allSubcategories.filter((s) => s.category_id === filterCategory);
  }, [allSubcategories, filterCategory]);

  // ✅ FILTRO: inclui filtro por cidade + subcategoria
  const filteredBusinesses = useMemo(() => {
    const list = businesses.filter((b) => {
      const matchesSearch =
        !searchTerm ||
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.categories?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.cta_email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !filterCategory || filterCategory === "all" || b.category_id === filterCategory;
      const matchesStatus =
        !filterStatus ||
        filterStatus === "all" ||
        (filterStatus === "active" && b.is_active) ||
        (filterStatus === "inactive" && !b.is_active) ||
        (filterStatus === "featured" && b.is_featured) ||
        (filterStatus === "premium" && b.is_premium);
      const matchesCity = !filterCity || filterCity === "all" || b.city?.trim() === filterCity;
      const matchesSubcategory =
        !filterSubcategory ||
        filterSubcategory === "all" ||
        b.subcategory_id === filterSubcategory ||
        (subMap && subMap.get(b.id)?.includes(filterSubcategory));
      return matchesSearch && matchesCategory && matchesStatus && matchesCity && matchesSubcategory;
    });

    if (rankingMode) {
      return [...list].sort((a, b) => (b.ranking_score ?? 0) - (a.ranking_score ?? 0));
    }
    return list;
  }, [businesses, searchTerm, filterCategory, filterStatus, filterCity, filterSubcategory, subMap, rankingMode]);

  const getPositionBadge = (pos: number) => {
    if (pos === 1) return <span className="text-lg">🥇</span>;
    if (pos === 2) return <span className="text-lg">🥈</span>;
    if (pos === 3) return <span className="text-lg">🥉</span>;
    return <span className="text-xs font-bold text-muted-foreground">#{pos}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Negócios</h1>
          <p className="text-muted-foreground">Gerir todos os negócios da plataforma</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExcelExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>

          <ImportBySourceDialog />
          <ImportByTextDialog />

          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Importar Excel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Importar Negócios (Excel)</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                  <p className="font-medium">Formato esperado (.xlsx):</p>
                  <p className="text-muted-foreground">
                    Colunas: <code>name</code>, <code>category</code>, <code>subcategories</code>,{" "}
                    <code>description</code>,<code>city</code>, <code>alcance</code>, <code>whatsapp</code>,{" "}
                    <code>telefone</code>,<code>email</code>, <code>website</code>, <code>logo_url</code>
                  </p>
                  <p className="text-muted-foreground text-xs">
                    • Subcategorias separadas por <code>|</code> (ex: Canalizadores|Eletricidade)
                    <br />
                    • Negócios importados ficam inativos por defeito
                    <br />• Categoria e subcategorias devem existir no sistema
                  </p>
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleExcelImport}
                    className="hidden"
                    id="excel-import"
                  />
                  <Button onClick={() => fileInputRef.current?.click()} disabled={importing} className="w-full">
                    {importing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />A importar...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Selecionar ficheiro
                      </>
                    )}
                  </Button>
                </div>

                {importResults && (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <p className="font-medium">✅ {importResults.success} importados com sucesso</p>
                    {importResults.errors.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-destructive">❌ {importResults.errors.length} erros:</p>
                        <ul className="text-xs text-muted-foreground mt-1 space-y-1 max-h-40 overflow-y-auto">
                          {importResults.errors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="btn-cta-primary">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Negócio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingBusiness ? `Ficha — ${editingBusiness.name}` : "Nova Ficha de Cliente"}
                </DialogTitle>
              </DialogHeader>
              <BusinessFileCard
                business={editingBusiness}
                categories={categories}
                isAdmin={true}
                onSaved={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
                onCancel={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome, cidade ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); setFilterSubcategory(""); }}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterSubcategory} onValueChange={setFilterSubcategory}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Subcategoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas subcategorias</SelectItem>
              {filteredSubcategories.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos estados</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
              <SelectItem value="featured">Destaques</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCity} onValueChange={setFilterCity}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Cidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas cidades</SelectItem>
              {availableCities.map((city) => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={rankingMode ? "default" : "outline"}
            onClick={() => setRankingMode(!rankingMode)}
            className="gap-2"
          >
            <Trophy className="h-4 w-4" />
            Ranking
          </Button>
        </div>
      </div>

      {/* BULK ACTIONS BAR */}
      {selectedIds.size > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckSquare className="h-5 w-5 text-primary" />
            <span className="font-medium">{selectedIds.size} negócios selecionados</span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleBulkActivate}
              disabled={isBulkProcessing}
              className="bg-success hover:bg-success/90"
            >
              {isBulkProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Ativar Selecionados
            </Button>
            <Button size="sm" variant="outline" onClick={handleBulkDeactivate} disabled={isBulkProcessing}>
              {isBulkProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Desativar Selecionados
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
              Limpar
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-card rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-4 w-12">
                  <Checkbox
                    checked={selectedIds.size === filteredBusinesses.length && filteredBusinesses.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                {rankingMode && (
                  <th className="text-center p-4 font-medium text-muted-foreground w-16">#</th>
                )}
                <th className="text-left p-4 font-medium text-muted-foreground">Negócio</th>
                {rankingMode && (
                  <th className="text-center p-4 font-medium text-muted-foreground w-24">Score</th>
                )}
                <th className="text-left p-4 font-medium text-muted-foreground">Categoria</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Subcategoria</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Cidade</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Estado</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredBusinesses.map((business, index) => (
                <tr
                  key={business.id}
                  className={`border-t border-border ${rankingMode && index < 3 ? "bg-primary/5" : ""}`}
                >
                  <td className="p-4">
                    <Checkbox
                      checked={selectedIds.has(business.id)}
                      onCheckedChange={() => toggleSelect(business.id)}
                    />
                  </td>
                  {rankingMode && (
                    <td className="p-4 text-center">
                      {getPositionBadge(index + 1)}
                    </td>
                  )}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {business.logo_url ? (
                        <img
                          src={business.logo_url}
                          alt={business.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary/50" />
                        </div>
                      )}
                      <span className="font-medium">{business.name}</span>
                    </div>
                  </td>
                  {rankingMode && (
                    <td className="p-4 text-center">
                      <Badge variant="outline" className="font-mono text-xs">
                        {business.ranking_score?.toFixed(1) ?? "—"}
                      </Badge>
                    </td>
                  )}
                  <td className="p-4 text-muted-foreground">{business.categories?.name || "-"}</td>
                  <td className="p-4 text-muted-foreground">{business.subcategories?.name || "-"}</td>
                  <td className="p-4 text-muted-foreground">{business.city || "-"}</td>
                  <td className="p-4">
                    <div className="flex gap-1 flex-wrap">
                      {business.is_active ? (
                        <Badge variant="secondary" className="bg-success/10 text-success">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-muted text-muted-foreground">
                          Inativo
                        </Badge>
                      )}
                      {business.is_featured && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          Destaque
                        </Badge>
                      )}
                      {business.is_premium && (
                        <Badge variant="secondary" className="bg-accent/10 text-accent">
                          Premium
                        </Badge>
                      )}
                      {business.commercial_status && business.commercial_status !== "nao_contactado" && (
                        <Badge
                          variant="secondary"
                          className={
                            business.commercial_status === "cliente"
                              ? "bg-success/10 text-success"
                              : business.commercial_status === "interessado"
                                ? "bg-warning/10 text-warning"
                                : "bg-muted text-muted-foreground"
                          }
                        >
                          {business.commercial_status === "contactado"
                            ? "Contactado"
                            : business.commercial_status === "interessado"
                              ? "Interessado"
                              : business.commercial_status === "cliente"
                                ? "Cliente"
                                : ""}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <ContactLogsDialog businessId={business.id} businessName={business.name} />
                      <Button size="sm" variant="ghost" onClick={() => openEditDialog(business)} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleActive(business)}
                        title={business.is_active ? "Inativar" : "Ativar"}
                        className={
                          business.is_active ? "text-warning hover:text-warning" : "text-success hover:text-success"
                        }
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(business.id)}
                        title="Apagar permanentemente"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBusinesses.length === 0 && (
                <tr>
                  <td colSpan={rankingMode ? 9 : 7} className="p-8 text-center text-muted-foreground">
                    Nenhum negócio encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-sm text-muted-foreground text-right">
        {filteredBusinesses.length} de {businesses.length} negócios
      </p>
    </div>
  );
};

export default BusinessesContent;
