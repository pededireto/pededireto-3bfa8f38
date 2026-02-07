import { useState, useRef } from "react";
import { BusinessWithCategory, useCreateBusiness, useUpdateBusiness, useDeleteBusiness, SUBSCRIPTION_PLANS, SubscriptionPlan, SubscriptionStatus } from "@/hooks/useBusinesses";
import { Category } from "@/hooks/useCategories";
import { useAllSubcategories, Subcategory } from "@/hooks/useSubcategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, Search, Building2, Upload, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

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
  const { data: allSubcategories = [] } = useAllSubcategories();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; errors: string[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<BusinessWithCategory | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    category_id: "",
    subcategory_id: "",
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
    is_active: true,
    display_order: 0,
    subscription_plan: "free" as SubscriptionPlan,
    subscription_start_date: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      category_id: "",
      subcategory_id: "",
      description: "",
      logo_url: "",
      city: "",
      zone: "",
      alcance: "local",
      schedule_weekdays: "",
      schedule_weekend: "",
      cta_website: "",
      cta_whatsapp: "",
      cta_phone: "",
      cta_email: "",
      is_featured: false,
      is_premium: false,
      is_active: true,
      display_order: 0,
      subscription_plan: "free",
      subscription_start_date: "",
    });
    setEditingBusiness(null);
  };

  const openEditDialog = (business: BusinessWithCategory) => {
    setEditingBusiness(business);
    setFormData({
      name: business.name,
      slug: business.slug,
      category_id: business.category_id || "",
      subcategory_id: business.subcategory_id || "",
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
      is_active: business.is_active,
      display_order: business.display_order,
      subscription_plan: business.subscription_plan,
      subscription_start_date: business.subscription_start_date || "",
    });
    setDialogOpen(true);
  };

  // Calculate subscription dates
  const getSubscriptionDates = (plan: SubscriptionPlan, startDate: string) => {
    if (plan === "free" || !startDate) {
      return { subscription_price: 0, subscription_start_date: null, subscription_end_date: null, subscription_status: "inactive" as SubscriptionStatus };
    }

    const planInfo = SUBSCRIPTION_PLANS[plan];
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + planInfo.months);

    return {
      subscription_price: planInfo.price,
      subscription_start_date: start.toISOString().split("T")[0],
      subscription_end_date: end.toISOString().split("T")[0],
      subscription_status: "active" as SubscriptionStatus,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const subscriptionData = getSubscriptionDates(formData.subscription_plan, formData.subscription_start_date);

      const businessData = {
        name: formData.name,
        slug: formData.slug || generateSlug(formData.name),
        category_id: formData.category_id || null,
        subcategory_id: formData.subcategory_id || null,
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
        is_active: formData.subscription_plan !== "free" ? true : formData.is_active,
        display_order: formData.display_order,
        subscription_plan: formData.subscription_plan,
        ...subscriptionData,
      };

      if (editingBusiness) {
        await updateBusiness.mutateAsync({ id: editingBusiness.id, ...businessData });
        toast({ title: "Negócio atualizado com sucesso" });
      } else {
        await createBusiness.mutateAsync(businessData);
        toast({ title: "Negócio criado com sucesso" });
      }

      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível guardar o negócio",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este negócio?")) return;

    try {
      await deleteBusiness.mutateAsync(id);
      toast({ title: "Negócio removido com sucesso" });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover o negócio",
        variant: "destructive",
      });
    }
  };

  // Excel import
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
        const rowNum = i + 2; // Excel row number (1-indexed + header)

        try {
          // Validate required fields
          if (!row.name) {
            errors.push(`Linha ${rowNum}: Nome em falta`);
            continue;
          }

          // Find category
          let categoryId: string | null = null;
          if (row.category) {
            const cat = categories.find(c => c.name.toLowerCase() === row.category.toLowerCase());
            if (cat) {
              categoryId = cat.id;
            } else {
              errors.push(`Linha ${rowNum}: Categoria "${row.category}" não encontrada`);
              continue;
            }
          }

          // Find subcategory
          let subcategoryId: string | null = null;
          if (row.subcategory && categoryId) {
            const sub = allSubcategories.find(
              s => s.name.toLowerCase() === row.subcategory.toLowerCase() && s.category_id === categoryId
            );
            if (sub) {
              subcategoryId = sub.id;
            } else {
              errors.push(`Linha ${rowNum}: Subcategoria "${row.subcategory}" não encontrada na categoria "${row.category}"`);
              continue;
            }
          }

          // Map alcance
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
            subcategory_id: subcategoryId,
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
            display_order: 0,
            subscription_plan: "free" as SubscriptionPlan,
            subscription_price: 0,
            subscription_start_date: null,
            subscription_end_date: null,
            subscription_status: "inactive" as SubscriptionStatus,
          };

          await createBusiness.mutateAsync(businessData);
          success++;
        } catch (err: any) {
          errors.push(`Linha ${rowNum}: ${err.message || "Erro desconhecido"}`);
        }
      }

      setImportResults({ success, errors });
      toast({
        title: "Importação concluída",
        description: `${success} importados, ${errors.length} erros`,
      });
    } catch (err) {
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

  const filteredSubcategories = allSubcategories.filter(s => s.category_id === formData.category_id);

  const filteredBusinesses = businesses.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.categories?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isLoading = createBusiness.isPending || updateBusiness.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Negócios</h1>
          <p className="text-muted-foreground">Gerir todos os negócios da plataforma</p>
        </div>

        <div className="flex gap-2">
          {/* Import Excel Button */}
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
                    Colunas: <code>name</code>, <code>category</code>, <code>subcategory</code>, <code>description</code>,
                    <code>city</code>, <code>alcance</code>, <code>whatsapp</code>, <code>telefone</code>,
                    <code>email</code>, <code>website</code>, <code>logo_url</code>
                  </p>
                  <p className="text-muted-foreground text-xs">
                    • Negócios importados ficam inativos por defeito<br />
                    • Categoria e subcategoria devem existir no sistema<br />
                    • Alcance: Local, Nacional ou Híbrido
                  </p>
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleExcelImport}
                    className="hidden"
                    id="excel-import"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importing}
                    className="w-full"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        A importar...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Selecionar ficheiro .xlsx
                      </>
                    )}
                  </Button>
                </div>

                {importResults && (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <p className="font-medium">
                      ✅ {importResults.success} importados com sucesso
                    </p>
                    {importResults.errors.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-destructive">
                          ❌ {importResults.errors.length} erros:
                        </p>
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

          {/* Add Business Button */}
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="btn-cta-primary">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Negócio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingBusiness ? "Editar Negócio" : "Novo Negócio"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug (URL)</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="gerado automaticamente"
                    />
                  </div>
                </div>

                {/* Category + Subcategory */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Categoria *</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value, subcategory_id: "" })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar categoria" />
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
                  <div className="space-y-2">
                    <Label>Subcategoria *</Label>
                    <Select
                      value={formData.subcategory_id}
                      onValueChange={(value) => setFormData({ ...formData, subcategory_id: value })}
                      disabled={!formData.category_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={formData.category_id ? "Selecionar subcategoria" : "Escolha categoria primeiro"} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredSubcategories.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alcance">Alcance</Label>
                  <Select
                    value={formData.alcance}
                    onValueChange={(value: "local" | "nacional" | "hibrido") =>
                      setFormData({ ...formData, alcance: value })
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

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logo_url">URL do Logo</Label>
                    <Input
                      id="logo_url"
                      value={formData.logo_url}
                      onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cta_whatsapp">WhatsApp</Label>
                    <Input
                      id="cta_whatsapp"
                      value={formData.cta_whatsapp}
                      onChange={(e) => setFormData({ ...formData, cta_whatsapp: e.target.value })}
                      placeholder="+351..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cta_phone">Telefone</Label>
                    <Input
                      id="cta_phone"
                      value={formData.cta_phone}
                      onChange={(e) => setFormData({ ...formData, cta_phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cta_website">Website</Label>
                    <Input
                      id="cta_website"
                      value={formData.cta_website}
                      onChange={(e) => setFormData({ ...formData, cta_website: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cta_email">Email</Label>
                    <Input
                      id="cta_email"
                      type="email"
                      value={formData.cta_email}
                      onChange={(e) => setFormData({ ...formData, cta_email: e.target.value })}
                    />
                  </div>
                </div>

                {/* Subscription Section */}
                <div className="border-t border-border pt-4">
                  <h3 className="font-semibold mb-3">Subscrição</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Plano</Label>
                      <Select
                        value={formData.subscription_plan}
                        onValueChange={(value: SubscriptionPlan) =>
                          setFormData({ ...formData, subscription_plan: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => (
                            <SelectItem key={key} value={key}>
                              {plan.label} {plan.price > 0 ? `— ${plan.price}€` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.subscription_plan !== "free" && (
                      <div className="space-y-2">
                        <Label>Data de início</Label>
                        <Input
                          type="date"
                          value={formData.subscription_start_date}
                          onChange={(e) => setFormData({ ...formData, subscription_start_date: e.target.value })}
                        />
                        {formData.subscription_start_date && (
                          <p className="text-xs text-muted-foreground">
                            Fim: {(() => {
                              const d = getSubscriptionDates(formData.subscription_plan, formData.subscription_start_date);
                              return d.subscription_end_date || "-";
                            })()}
                            {" "}• {SUBSCRIPTION_PLANS[formData.subscription_plan].price}€
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-6 pt-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Ativo</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_featured"
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                    />
                    <Label htmlFor="is_featured">Destaque</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_premium"
                      checked={formData.is_premium}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_premium: checked })}
                    />
                    <Label htmlFor="is_premium">Premium</Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
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

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar negócios..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
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
                  <td className="p-4 text-muted-foreground">
                    {business.categories?.name || "-"}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {business.subcategories?.name || "-"}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {business.city || "-"}
                  </td>
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
                      {business.subscription_status === "active" && (
                        <Badge variant="secondary" className="bg-accent/10 text-accent-foreground">
                          Sub. Ativa
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(business)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(business.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBusinesses.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Nenhum negócio encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BusinessesContent;
