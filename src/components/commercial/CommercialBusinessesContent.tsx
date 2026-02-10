import { useState } from "react";
import { BusinessWithCategory, useUpdateBusiness, CommercialStatus } from "@/hooks/useBusinesses";
import { useCommercialPlans } from "@/hooks/useCommercialPlans";
import { Category } from "@/hooks/useCategories";
import { useAllSubcategories } from "@/hooks/useSubcategories";
import { useBusinessSubcategoryIds, useSyncBusinessSubcategories } from "@/hooks/useBusinessSubcategories";
import { useCreateActionRequest } from "@/hooks/useActionRequests";
import { useCreateAuditLog } from "@/hooks/useAuditLogs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Search, Building2, MessageSquare, AlertTriangle, UserCheck, UserX, Handshake, Ban } from "lucide-react";
import ContactLogsDialog from "@/components/admin/ContactLogsDialog";
import { SubscriptionPlan, SubscriptionStatus, PremiumLevel } from "@/hooks/useBusinesses";
import { useEffect } from "react";

interface CommercialBusinessesContentProps {
  businesses: BusinessWithCategory[];
  categories: Category[];
}

const commercialStatusLabels: Record<string, string> = {
  nao_contactado: "Não Contactado",
  contactado: "Contactado",
  interessado: "Interessado",
  cliente: "Cliente",
  perdido: "Perdido",
};

const CommercialBusinessesContent = ({ businesses, categories }: CommercialBusinessesContentProps) => {
  const { toast } = useToast();
  const updateBusiness = useUpdateBusiness();
  const createActionRequest = useCreateActionRequest();
  const createAuditLog = useCreateAuditLog();
  const syncSubcategories = useSyncBusinessSubcategories();
  const { data: allSubcategories = [] } = useAllSubcategories();
  const { data: commercialPlans = [] } = useCommercialPlans(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCommercialStatus, setFilterCommercialStatus] = useState("");
  const [filterOrigin, setFilterOrigin] = useState("");
  const [filterSubscription, setFilterSubscription] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<BusinessWithCategory | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logo_url: "",
    city: "",
    zone: "",
    cta_website: "",
    cta_whatsapp: "",
    cta_phone: "",
    cta_email: "",
    is_active: false,
    commercial_status: "nao_contactado" as CommercialStatus,
    plan_id: "" as string,
    subscription_start_date: "",
    category_id: "",
    subcategory_ids: [] as string[],
  });

  const { data: editSubcategoryIds } = useBusinessSubcategoryIds(editingBusiness?.id);

  useEffect(() => {
    if (editSubcategoryIds && editingBusiness) {
      setFormData((prev) => ({ ...prev, subcategory_ids: editSubcategoryIds }));
    }
  }, [editSubcategoryIds, editingBusiness]);

  const openEditDialog = (business: BusinessWithCategory) => {
    setEditingBusiness(business);
    setFormData({
      name: business.name,
      description: business.description || "",
      logo_url: business.logo_url || "",
      city: business.city || "",
      zone: business.zone || "",
      cta_website: business.cta_website || "",
      cta_whatsapp: business.cta_whatsapp || "",
      cta_phone: business.cta_phone || "",
      cta_email: business.cta_email || "",
      is_active: business.is_active,
      commercial_status: business.commercial_status || "nao_contactado",
      plan_id: business.plan_id || "",
      subscription_start_date: business.subscription_start_date || "",
      category_id: business.category_id || "",
      subcategory_ids: [],
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
      subscription_plan: "1_month" as SubscriptionPlan,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBusiness) return;

    try {
      const subscriptionData = getSubscriptionDates(formData.plan_id, formData.subscription_start_date);
      const primarySubcategoryId = formData.subcategory_ids.length > 0 ? formData.subcategory_ids[0] : null;

      const updates: any = {
        id: editingBusiness.id,
        description: formData.description || null,
        logo_url: formData.logo_url || null,
        city: formData.city || null,
        zone: formData.zone || null,
        cta_website: formData.cta_website || null,
        cta_whatsapp: formData.cta_whatsapp || null,
        cta_phone: formData.cta_phone || null,
        cta_email: formData.cta_email || null,
        is_active: formData.is_active,
        commercial_status: formData.commercial_status,
        subcategory_id: primarySubcategoryId,
      };

      if (formData.plan_id) {
        Object.assign(updates, {
          plan_id: formData.plan_id,
          ...subscriptionData,
          activated_at: formData.is_active ? new Date().toISOString() : null,
        });
      }

      if (formData.commercial_status === "contactado" && editingBusiness.commercial_status === "nao_contactado") {
        updates.contacted_at = new Date().toISOString();
      }

      await updateBusiness.mutateAsync(updates);

      if (formData.subcategory_ids.length > 0) {
        await syncSubcategories.mutateAsync({
          businessId: editingBusiness.id,
          subcategoryIds: formData.subcategory_ids,
        });
      }

      // Log the action
      await createAuditLog.mutateAsync({
        action: "update_business",
        target_table: "businesses",
        target_id: editingBusiness.id,
        target_name: editingBusiness.name,
        changes: {
          commercial_status: { old: editingBusiness.commercial_status, new: formData.commercial_status },
          is_active: { old: editingBusiness.is_active, new: formData.is_active },
        },
      });

      toast({ title: "Negócio atualizado com sucesso" });
      setDialogOpen(false);
      setEditingBusiness(null);
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível guardar as alterações", variant: "destructive" });
    }
  };

  const handleQuickStatusChange = async (business: BusinessWithCategory, newStatus: CommercialStatus) => {
    try {
      const updates: any = { id: business.id, commercial_status: newStatus };
      if (newStatus === "contactado" && business.commercial_status === "nao_contactado") {
        updates.contacted_at = new Date().toISOString();
      }
      await updateBusiness.mutateAsync(updates);
      await createAuditLog.mutateAsync({
        action: "change_commercial_status",
        target_table: "businesses",
        target_id: business.id,
        target_name: business.name,
        changes: { commercial_status: { old: business.commercial_status, new: newStatus } },
      });
      toast({ title: `Estado alterado para "${commercialStatusLabels[newStatus]}"` });
    } catch {
      toast({ title: "Erro ao alterar estado", variant: "destructive" });
    }
  };

  const handleRequestDelete = async (business: BusinessWithCategory) => {
    try {
      await createActionRequest.mutateAsync({
        action_type: "delete_business",
        target_table: "businesses",
        target_id: business.id,
        target_name: business.name,
        details: `Comercial solicitou remoção do negócio "${business.name}"`,
      });
      toast({ title: "Pedido de remoção enviado", description: "O administrador irá avaliar o pedido." });
    } catch {
      toast({ title: "Erro ao enviar pedido", variant: "destructive" });
    }
  };

  const filteredSubcategories = allSubcategories.filter(s => s.category_id === formData.category_id);

  const filteredBusinesses = businesses.filter(b => {
    const matchesSearch = !searchTerm ||
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.cta_phone?.includes(searchTerm) ||
      b.cta_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCommercial = !filterCommercialStatus || filterCommercialStatus === "all" || b.commercial_status === filterCommercialStatus;
    const matchesOrigin = !filterOrigin || filterOrigin === "all" ||
      (b as any).registration_source === filterOrigin;
    const matchesSub = !filterSubscription || filterSubscription === "all" ||
      (filterSubscription === "free" && b.subscription_status === "inactive") ||
      (filterSubscription === "active" && b.subscription_status === "active") ||
      (filterSubscription === "inactive" && !b.is_active);
    return matchesSearch && matchesCommercial && matchesOrigin && matchesSub;
  });

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
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Negócios</h1>
        <p className="text-muted-foreground">Gestão comercial dos negócios da plataforma</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Pesquisar negócios..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterCommercialStatus} onValueChange={setFilterCommercialStatus}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Estado comercial" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos estados</SelectItem>
            <SelectItem value="nao_contactado">Não Contactado</SelectItem>
            <SelectItem value="contactado">Contactado</SelectItem>
            <SelectItem value="interessado">Interessado</SelectItem>
            <SelectItem value="cliente">Cliente</SelectItem>
            <SelectItem value="perdido">Perdido</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterOrigin} onValueChange={setFilterOrigin}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Origem" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas origens</SelectItem>
            <SelectItem value="self_service">Self-service</SelectItem>
            <SelectItem value="import_excel">Import Excel</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSubscription} onValueChange={setFilterSubscription}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Subscrição" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="free">Gratuitos</SelectItem>
            <SelectItem value="active">Subscrição ativa</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Businesses Table */}
      <div className="bg-card rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">Negócio</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Categoria</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Cidade</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Estado</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Ações Rápidas</th>
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
                      <div>
                        <span className="font-medium block">{business.name}</span>
                        <span className="text-xs text-muted-foreground">{business.cta_phone || business.cta_email || ""}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground text-sm">{business.categories?.name || "-"}</td>
                  <td className="p-4 text-muted-foreground text-sm">{business.city || "-"}</td>
                  <td className="p-4">
                    <div className="flex gap-1 flex-wrap">
                      <Badge variant="secondary" className={
                        business.commercial_status === "cliente" ? "bg-success/10 text-success" :
                        business.commercial_status === "interessado" ? "bg-warning/10 text-warning" :
                        business.commercial_status === "contactado" ? "bg-primary/10 text-primary" :
                        business.commercial_status === "perdido" ? "bg-destructive/10 text-destructive" :
                        "bg-muted text-muted-foreground"
                      }>
                        {commercialStatusLabels[business.commercial_status] || "Não Contactado"}
                      </Badge>
                      {business.is_active ? (
                        <Badge variant="secondary" className="bg-success/10 text-success">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-muted text-muted-foreground">Inativo</Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1 flex-wrap">
                      {business.commercial_status === "nao_contactado" && (
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleQuickStatusChange(business, "contactado")}>
                          <UserCheck className="h-3 w-3 mr-1" /> Contactado
                        </Button>
                      )}
                      {(business.commercial_status === "contactado" || business.commercial_status === "interessado") && (
                        <Button size="sm" variant="outline" className="text-xs h-7 text-success border-success/30" onClick={() => handleQuickStatusChange(business, "cliente")}>
                          <Handshake className="h-3 w-3 mr-1" /> Cliente
                        </Button>
                      )}
                      {business.commercial_status !== "perdido" && business.commercial_status !== "cliente" && (
                        <Button size="sm" variant="outline" className="text-xs h-7 text-destructive border-destructive/30" onClick={() => handleQuickStatusChange(business, "perdido")}>
                          <Ban className="h-3 w-3 mr-1" /> Perdido
                        </Button>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-1">
                      <ContactLogsDialog businessId={business.id} businessName={business.name} />
                      <Button size="sm" variant="ghost" onClick={() => openEditDialog(business)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-warning hover:text-warning"
                        onClick={() => handleRequestDelete(business)}
                        title="Solicitar remoção"
                      >
                        <AlertTriangle className="h-4 w-4" />
                      </Button>
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

      <p className="text-sm text-muted-foreground text-right">{filteredBusinesses.length} de {businesses.length} negócios</p>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingBusiness(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Negócio — {editingBusiness?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {/* Subcategories */}
            {formData.category_id && filteredSubcategories.length > 0 && (
              <div className="space-y-2">
                <Label>Subcategorias</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-border rounded-lg p-3">
                  {filteredSubcategories.map((sub) => (
                    <label key={sub.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded p-1">
                      <Checkbox checked={formData.subcategory_ids.includes(sub.id)} onCheckedChange={() => toggleSubcategory(sub.id)} />
                      <span className="text-sm">{sub.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Commercial Status */}
            <div className="border-t border-border pt-4">
              <h3 className="font-semibold mb-3">Estado Comercial</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select value={formData.commercial_status} onValueChange={(value: CommercialStatus) => setFormData({ ...formData, commercial_status: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nao_contactado">Não Contactado</SelectItem>
                      <SelectItem value="contactado">Contactado</SelectItem>
                      <SelectItem value="interessado">Interessado</SelectItem>
                      <SelectItem value="cliente">Cliente</SelectItem>
                      <SelectItem value="perdido">Perdido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch checked={formData.is_active} onCheckedChange={(c) => setFormData({ ...formData, is_active: c })} />
                  <Label>Visível publicamente</Label>
                </div>
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
                      const dates = getSubscriptionDates(formData.plan_id, formData.subscription_start_date);
                      return <p className="text-xs text-muted-foreground">Fim: {dates.subscription_end_date || "-"}</p>;
                    })()}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={updateBusiness.isPending}>
                {updateBusiness.isPending ? "A guardar..." : "Guardar alterações"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommercialBusinessesContent;
