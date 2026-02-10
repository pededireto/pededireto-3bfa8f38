import { useState, useRef, useEffect } from "react";
import { BusinessWithCategory, useCreateBusiness, useUpdateBusiness, useDeleteBusiness, SUBSCRIPTION_PLANS, SubscriptionPlan, SubscriptionStatus, CommercialStatus, PremiumLevel } from "@/hooks/useBusinesses";
import { useCommercialPlans, CommercialPlan } from "@/hooks/useCommercialPlans";
import { Category } from "@/hooks/useCategories";
import { useAllSubcategories, Subcategory } from "@/hooks/useSubcategories";
import { useBusinessSubcategoryIds, useSyncBusinessSubcategories } from "@/hooks/useBusinessSubcategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, Search, Building2, Upload, FileSpreadsheet, Download, MessageSquare } from "lucide-react";
import ContactLogsDialog from "@/components/admin/ContactLogsDialog";
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
  const updateBusiness = useUpdateBusiness();
  const deleteBusiness = useDeleteBusiness();
  const syncSubcategories = useSyncBusinessSubcategories();
  const { data: allSubcategories = [] } = useAllSubcategories();
  const { data: commercialPlans = [] } = useCommercialPlans(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; errors: string[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<BusinessWithCategory | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    category_id: "",
    subcategory_ids: [] as string[],
    description: "",
    logo_url: "",
    city: "",
    zone: "",
    alcance: "local" as "local" | "nacional" | "hibrido",
    schedule_weekdays: "",
    schedule_weekend: "",
    cta_website: "",
    cta_whatsapp: "",
    cta_phone: "",
    cta_email: "",
    is_featured: false,
    is_premium: false,
    premium_level: "" as string,
    is_active: true,
    display_order: 0,
    plan_id: "" as string,
    subscription_start_date: "",
    commercial_status: "nao_contactado" as CommercialStatus,
  });

  // Load subcategory IDs when editing
  const { data: editSubcategoryIds } = useBusinessSubcategoryIds(editingBusiness?.id);

  useEffect(() => {
    if (editSubcategoryIds && editingBusiness) {
      setFormData((prev) => ({ ...prev, subcategory_ids: editSubcategoryIds }));
    }
  }, [editSubcategoryIds, editingBusiness]);

  const resetForm = () => {
    setFormData({
      name: "", slug: "", category_id: "", subcategory_ids: [],
      description: "", logo_url: "", city: "", zone: "",
      alcance: "local", schedule_weekdays: "", schedule_weekend: "",
      cta_website: "", cta_whatsapp: "", cta_phone: "", cta_email: "",
      is_featured: false, is_premium: false, premium_level: "", is_active: true,
      display_order: 0, plan_id: "", subscription_start_date: "",
      commercial_status: "nao_contactado",
    });
    setEditingBusiness(null);
  };

  const openEditDialog = (business: BusinessWithCategory) => {
    setEditingBusiness(business);
    setFormData({
      name: business.name,
      slug: business.slug,
      category_id: business.category_id || "",
      subcategory_ids: [], // Will be loaded via useEffect
      description: business.description || "",
      logo_url: business.logo_url || "",
      city: business.city || "",
      zone: business.zone || "",
      alcance: business.alcance,
      schedule_weekdays: business.schedule_weekdays || "",
      schedule_weekend: business.schedule_weekend || "",
      cta_website: business.cta_website || "",
      cta_whatsapp: business.cta_whatsapp || "",
      cta_phone: business.cta_phone || "",
      cta_email: business.cta_email || "",
      is_featured: business.is_featured,
      is_premium: business.is_premium,
      premium_level: business.premium_level || "",
      is_active: business.is_active,
      display_order: business.display_order,
      plan_id: business.plan_id || "",
      subscription_start_date: business.subscription_start_date || "",
      commercial_status: business.commercial_status || "nao_contactado",
    });
    setDialogOpen(true);
  };

  const getSubscriptionDates = (planId: string, startDate: string) => {
    if (!planId || !startDate) {
      return { subscription_price: 0, subscription_start_date: null, subscription_end_date: null, subscription_status: "inactive" as SubscriptionStatus, subscription_plan: "free" as SubscriptionPlan };
    }
    const plan = commercialPlans.find(p => p.id === planId);
    if (!plan || plan.price === 0) {
      return { subscription_price: 0, subscription_start_date: null, subscription_end_date: null, subscription_status: "inactive" as SubscriptionStatus, subscription_plan: "free" as SubscriptionPlan };
    }
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + plan.duration_months);
    return {
      subscription_price: plan.price,
      subscription_start_date: start.toISOString().split("T")[0],
      subscription_end_date: end.toISOString().split("T")[0],
      subscription_status: "active" as SubscriptionStatus,
      subscription_plan: "1_month" as SubscriptionPlan, // legacy field, kept for compatibility
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const subscriptionData = getSubscriptionDates(formData.plan_id, formData.subscription_start_date);
      const primarySubcategoryId = formData.subcategory_ids.length > 0 ? formData.subcategory_ids[0] : null;

      const businessData = {
        name: formData.name,
        slug: formData.slug || generateSlug(formData.name),
        category_id: formData.category_id || null,
        subcategory_id: primarySubcategoryId,
        plan_id: formData.plan_id || null,
        description: formData.description || null,
        logo_url: formData.logo_url || null,
        city: formData.city || null,
        zone: formData.zone || null,
        alcance: formData.alcance,
        schedule_weekdays: formData.schedule_weekdays || null,
        schedule_weekend: formData.schedule_weekend || null,
        cta_website: formData.cta_website || null,
        cta_whatsapp: formData.cta_whatsapp || null,
        cta_phone: formData.cta_phone || null,
        cta_email: formData.cta_email || null,
        cta_app: null,
        images: [],
        coordinates: null,
        is_featured: formData.is_featured,
        is_premium: formData.is_premium,
        premium_level: formData.premium_level ? (formData.premium_level as PremiumLevel) : null,
        is_active: formData.plan_id ? true : formData.is_active,
        display_order: formData.display_order,
        commercial_status: formData.commercial_status,
        ...subscriptionData,
      };

      let businessId: string;

      if (editingBusiness) {
        const result = await updateBusiness.mutateAsync({ id: editingBusiness.id, ...businessData });
        businessId = editingBusiness.id;
        toast({ title: "Negócio atualizado com sucesso" });
      } else {
        const result = await createBusiness.mutateAsync(businessData);
        businessId = result.id;
        toast({ title: "Negócio criado com sucesso" });
      }

      // Sync subcategories junction table
      if (formData.subcategory_ids.length > 0) {
        await syncSubcategories.mutateAsync({
          businessId,
          subcategoryIds: formData.subcategory_ids,
        });
      }

      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível guardar o negócio", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este negócio?")) return;
    try {
      await deleteBusiness.mutateAsync(id);
      toast({ title: "Negócio removido com sucesso" });
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível remover o negócio", variant: "destructive" });
    }
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
          if (!row.name) { errors.push(`Linha ${rowNum}: Nome em falta`); continue; }

          // Find category
          let categoryId: string | null = null;
          if (row.category) {
            const cat = categories.find(c => c.name.toLowerCase() === row.category.toLowerCase());
            if (cat) { categoryId = cat.id; }
            else { errors.push(`Linha ${rowNum}: Categoria "${row.category}" não encontrada`); continue; }
          }

          // Find subcategories (support | separator)
          const subcategoryIds: string[] = [];
          let primarySubcategoryId: string | null = null;
          const subcatNames = (row.subcategory || row.subcategories || "")
            .split("|")
            .map(s => s.trim())
            .filter(Boolean);

          for (const subName of subcatNames) {
            const sub = allSubcategories.find(
              s => s.name.toLowerCase() === subName.toLowerCase() && (!categoryId || s.category_id === categoryId)
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
            zone: null, alcance,
            logo_url: row.logo_url?.trim() || null,
            cta_whatsapp: row.whatsapp?.trim() || null,
            cta_phone: row.telefone?.trim() || null,
            cta_email: row.email?.trim() || null,
            cta_website: row.website?.trim() || null,
            cta_app: null, images: [], coordinates: null,
            schedule_weekdays: null, schedule_weekend: null,
            is_active: false, is_featured: false, is_premium: false,
            premium_level: null,
            commercial_status: "nao_contactado" as CommercialStatus,
            display_order: 0,
            plan_id: null,
            subscription_plan: "free" as SubscriptionPlan,
            subscription_price: 0,
            subscription_start_date: null, subscription_end_date: null,
            subscription_status: "inactive" as SubscriptionStatus,
          };

          const result = await createBusiness.mutateAsync(businessData);

          // Sync subcategories
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
      toast({ title: "Erro na importação", description: "Ficheiro inválido ou formato incorreto", variant: "destructive" });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Excel export
  const handleExcelExport = () => {
    const commercialLabels: Record<string, string> = { nao_contactado: "Não Contactado", contactado: "Contactado", interessado: "Interessado", cliente: "Cliente" };
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

  const filteredSubcategories = allSubcategories.filter(s => s.category_id === formData.category_id);

  const filteredBusinesses = businesses.filter(b => {
    const matchesSearch = !searchTerm || 
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.categories?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || filterCategory === "all" || b.category_id === filterCategory;
    const matchesStatus = !filterStatus || filterStatus === "all" ||
      (filterStatus === "active" && b.is_active) ||
      (filterStatus === "inactive" && !b.is_active) ||
      (filterStatus === "featured" && b.is_featured) ||
      (filterStatus === "premium" && b.is_premium);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const isLoading = createBusiness.isPending || updateBusiness.isPending;

  const toggleSubcategory = (subId: string) => {
    setFormData((prev) => ({
      ...prev,
      subcategory_ids: prev.subcategory_ids.includes(subId)
        ? prev.subcategory_ids.filter(id => id !== subId)
        : [...prev.subcategory_ids, subId],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Negócios</h1>
          <p className="text-muted-foreground">Gerir todos os negócios da plataforma</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Export */}
          <Button variant="outline" onClick={handleExcelExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>

          {/* Import Excel */}
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
                    Colunas: <code>name</code>, <code>category</code>, <code>subcategories</code>, <code>description</code>,
                    <code>city</code>, <code>alcance</code>, <code>whatsapp</code>, <code>telefone</code>,
                    <code>email</code>, <code>website</code>, <code>logo_url</code>
                  </p>
                  <p className="text-muted-foreground text-xs">
                    • Subcategorias separadas por <code>|</code> (ex: Canalizadores|Eletricidade)<br />
                    • Negócios importados ficam inativos por defeito<br />
                    • Categoria e subcategorias devem existir no sistema
                  </p>
                </div>

                <div>
                  <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelImport} className="hidden" id="excel-import" />
                  <Button onClick={() => fileInputRef.current?.click()} disabled={importing} className="w-full">
                    {importing ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />A importar...</>) : (<><Upload className="h-4 w-4 mr-2" />Selecionar ficheiro</>)}
                  </Button>
                </div>

                {importResults && (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <p className="font-medium">✅ {importResults.success} importados com sucesso</p>
                    {importResults.errors.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-destructive">❌ {importResults.errors.length} erros:</p>
                        <ul className="text-xs text-muted-foreground mt-1 space-y-1 max-h-40 overflow-y-auto">
                          {importResults.errors.map((err, i) => (<li key={i}>{err}</li>))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Add Business */}
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="btn-cta-primary">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Negócio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingBusiness ? "Editar Negócio" : "Novo Negócio"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug (URL)</Label>
                    <Input id="slug" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="gerado automaticamente" />
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label>Categoria *</Label>
                  <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value, subcategory_ids: [] })}>
                    <SelectTrigger><SelectValue placeholder="Selecionar categoria" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Multi-select Subcategories */}
                <div className="space-y-2">
                  <Label>Subcategorias *</Label>
                  {!formData.category_id ? (
                    <p className="text-sm text-muted-foreground">Escolha categoria primeiro</p>
                  ) : filteredSubcategories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem subcategorias disponíveis</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-border rounded-lg p-3">
                      {filteredSubcategories.map((sub) => (
                        <label key={sub.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded p-1">
                          <Checkbox
                            checked={formData.subcategory_ids.includes(sub.id)}
                            onCheckedChange={() => toggleSubcategory(sub.id)}
                          />
                          <span className="text-sm">{sub.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {formData.subcategory_ids.length > 0 && (
                    <p className="text-xs text-muted-foreground">{formData.subcategory_ids.length} selecionada(s)</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Alcance</Label>
                  <Select value={formData.alcance} onValueChange={(value: "local" | "nacional" | "hibrido") => setFormData({ ...formData, alcance: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local</SelectItem>
                      <SelectItem value="nacional">Nacional</SelectItem>
                      <SelectItem value="hibrido">Híbrido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>URL do Logo</Label>
                    <Input value={formData.logo_url} onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>WhatsApp</Label>
                    <Input value={formData.cta_whatsapp} onChange={(e) => setFormData({ ...formData, cta_whatsapp: e.target.value })} placeholder="+351..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input value={formData.cta_phone} onChange={(e) => setFormData({ ...formData, cta_phone: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input value={formData.cta_website} onChange={(e) => setFormData({ ...formData, cta_website: e.target.value })} placeholder="https://..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={formData.cta_email} onChange={(e) => setFormData({ ...formData, cta_email: e.target.value })} />
                  </div>
                </div>

                {/* Subscription */}
                <div className="border-t border-border pt-4">
                  <h3 className="font-semibold mb-3">Subscrição</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Plano</Label>
                      <Select value={formData.plan_id || "none"} onValueChange={(value) => setFormData({ ...formData, plan_id: value === "none" ? "" : value })}>
                        <SelectTrigger><SelectValue placeholder="Selecionar plano" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Gratuito</SelectItem>
                          {commercialPlans.map((plan) => (
                            <SelectItem key={plan.id} value={plan.id}>
                              {plan.name} {plan.price > 0 ? `— ${plan.price}€` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.plan_id && (
                      <div className="space-y-2">
                        <Label>Data de início</Label>
                        <Input type="date" value={formData.subscription_start_date} onChange={(e) => setFormData({ ...formData, subscription_start_date: e.target.value })} />
                        {formData.subscription_start_date && (() => {
                          const selectedPlan = commercialPlans.find(p => p.id === formData.plan_id);
                          const dates = getSubscriptionDates(formData.plan_id, formData.subscription_start_date);
                          return (
                            <p className="text-xs text-muted-foreground">
                              Fim: {dates.subscription_end_date || "-"}
                              {selectedPlan ? ` • ${selectedPlan.price}€` : ""}
                            </p>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Commercial Status & Premium Level */}
                <div className="border-t border-border pt-4">
                  <h3 className="font-semibold mb-3">Estado Comercial & Premium</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Estado Comercial</Label>
                      <Select value={formData.commercial_status} onValueChange={(value: CommercialStatus) => setFormData({ ...formData, commercial_status: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nao_contactado">Não Contactado</SelectItem>
                          <SelectItem value="contactado">Contactado</SelectItem>
                          <SelectItem value="interessado">Interessado</SelectItem>
                          <SelectItem value="cliente">Cliente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Nível Premium</Label>
                      <Select value={formData.premium_level || "none"} onValueChange={(value) => setFormData({ ...formData, premium_level: value === "none" ? "" : value, is_premium: value !== "none" })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sem Premium</SelectItem>
                          <SelectItem value="SUPER">Super Destaque</SelectItem>
                          <SelectItem value="CATEGORIA">Destaque Categoria</SelectItem>
                          <SelectItem value="SUBCATEGORIA">Destaque Subcategoria</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-6 pt-4">
                  <div className="flex items-center gap-2">
                    <Switch checked={formData.is_active} onCheckedChange={(c) => setFormData({ ...formData, is_active: c })} />
                    <Label>Ativo</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={formData.is_featured} onCheckedChange={(c) => setFormData({ ...formData, is_featured: c })} />
                    <Label>Destaque</Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingBusiness ? "Guardar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Pesquisar negócios..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Todas categorias" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Todos estados" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos estados</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
            <SelectItem value="featured">Destaques</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <div className="bg-card rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">Negócio</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Categoria</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Subcategoria</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Cidade</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Estado</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredBusinesses.map((business) => (
                <tr key={business.id} className="border-t border-border">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {business.logo_url ? (
                        <img src={business.logo_url} alt={business.name} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary/50" />
                        </div>
                      )}
                      <span className="font-medium">{business.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">{business.categories?.name || "-"}</td>
                  <td className="p-4 text-muted-foreground">{business.subcategories?.name || "-"}</td>
                  <td className="p-4 text-muted-foreground">{business.city || "-"}</td>
                  <td className="p-4">
                    <div className="flex gap-1 flex-wrap">
                      {business.is_active ? (
                        <Badge variant="secondary" className="bg-success/10 text-success">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-muted text-muted-foreground">Inativo</Badge>
                      )}
                      {business.is_featured && <Badge variant="secondary" className="bg-primary/10 text-primary">Destaque</Badge>}
                      {business.is_premium && <Badge variant="secondary" className="bg-accent/10 text-accent">Premium</Badge>}
                      {business.commercial_status && business.commercial_status !== "nao_contactado" && (
                        <Badge variant="secondary" className={
                          business.commercial_status === "cliente" ? "bg-success/10 text-success" :
                          business.commercial_status === "interessado" ? "bg-warning/10 text-warning" :
                          "bg-muted text-muted-foreground"
                        }>
                          {business.commercial_status === "contactado" ? "Contactado" :
                           business.commercial_status === "interessado" ? "Interessado" :
                           business.commercial_status === "cliente" ? "Cliente" : ""}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <ContactLogsDialog businessId={business.id} businessName={business.name} />
                      <Button size="sm" variant="ghost" onClick={() => openEditDialog(business)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(business.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBusinesses.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhum negócio encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Total count */}
      <p className="text-sm text-muted-foreground text-right">{filteredBusinesses.length} de {businesses.length} negócios</p>
    </div>
  );
};

export default BusinessesContent;
