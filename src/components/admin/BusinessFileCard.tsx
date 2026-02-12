import { useState, useEffect } from "react";
import { BusinessWithCategory, useUpdateBusiness, useCreateBusiness, CommercialStatus, SubscriptionPlan, SubscriptionStatus, PremiumLevel } from "@/hooks/useBusinesses";
import { useCommercialPlans } from "@/hooks/useCommercialPlans";
import { useActiveBusinessModules, useBusinessModuleValues, useUpsertBusinessModuleValues, BusinessModule } from "@/hooks/useBusinessModules";
import { Category } from "@/hooks/useCategories";
import { useAllSubcategories } from "@/hooks/useSubcategories";
import { useBusinessSubcategoryIds, useSyncBusinessSubcategories } from "@/hooks/useBusinessSubcategories";
import { useCreateAuditLog } from "@/hooks/useAuditLogs";
import { useContactLogs, useCreateContactLog } from "@/hooks/useContactLogs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronDown, ChevronRight, Building2, Globe, Scale, Handshake,
  CreditCard, DollarSign, ShieldCheck, Loader2, Phone, Mail, MessageCircle,
  MessageSquare, Plus, Puzzle
} from "lucide-react";

// ---------- types ----------

interface BusinessFileCardProps {
  business: BusinessWithCategory | null; // null = create mode
  categories: Category[];
  isAdmin: boolean;
  onSaved: () => void;
  onCancel: () => void;
}

const commercialStatusLabels: Record<string, string> = {
  nao_contactado: "Não Contactado",
  contactado: "Contactado",
  interessado: "Interessado",
  cliente: "Cliente",
  perdido: "Perdido",
};

const generateSlug = (name: string) =>
  name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// ---------- Section wrapper ----------

function Section({ title, icon: Icon, defaultOpen = true, children }: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 w-full py-3 px-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
        >
          {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          <Icon className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">{title}</span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-1 pt-4 pb-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

// ---------- Contact History Inline ----------

function ContactHistoryInline({ businessId }: { businessId: string }) {
  const { data: logs = [], isLoading } = useContactLogs(businessId);
  const createLog = useCreateContactLog();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [tipo, setTipo] = useState("telefone");
  const [nota, setNota] = useState("");

  const tipoIcons: Record<string, React.ElementType> = { telefone: Phone, email: Mail, whatsapp: MessageCircle, outro: MessageSquare };
  const tipoLabels: Record<string, string> = { telefone: "Telefone", email: "Email", whatsapp: "WhatsApp", outro: "Outro" };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLog.mutateAsync({ business_id: businessId, tipo_contacto: tipo, nota: nota || undefined });
      toast({ title: "Contacto registado" });
      setShowForm(false);
      setNota("");
    } catch {
      toast({ title: "Erro ao registar contacto", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3">
      {!showForm ? (
        <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" /> Registar contacto
        </Button>
      ) : (
        <div className="border border-border rounded-lg p-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="telefone">Telefone</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Textarea value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Detalhes do contacto..." rows={2} className="text-sm" />
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleSubmit} disabled={createLog.isPending}>
              {createLog.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />} Guardar
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
      ) : logs.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sem histórico de contactos.</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {logs.map((log) => {
            const Icon = tipoIcons[log.tipo_contacto] || MessageSquare;
            return (
              <div key={log.id} className="flex gap-2 p-2 rounded bg-muted/30 text-sm">
                <Icon className="w-3.5 h-3.5 mt-0.5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] h-5">{tipoLabels[log.tipo_contacto]}</Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(log.created_at).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {log.nota && <p className="text-xs mt-1">{log.nota}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------- Main Component ----------

const BusinessFileCard = ({ business, categories, isAdmin, onSaved, onCancel }: BusinessFileCardProps) => {
  const { toast } = useToast();
  const createBusiness = useCreateBusiness();
  const updateBusiness = useUpdateBusiness();
  const createAuditLog = useCreateAuditLog();
  const syncSubcategories = useSyncBusinessSubcategories();
  const { data: allSubcategories = [] } = useAllSubcategories();
  const { data: commercialPlans = [] } = useCommercialPlans(true);
  const { data: editSubcategoryIds } = useBusinessSubcategoryIds(business?.id);
  const { data: activeModules = [] } = useActiveBusinessModules();
  const { data: existingModuleValues = [] } = useBusinessModuleValues(business?.id);
  const upsertModuleValues = useUpsertBusinessModuleValues();

  const isEditing = !!business;

  const [form, setForm] = useState({
    // Identity
    name: "", slug: "", description: "", logo_url: "",
    // Public presence
    city: "", zone: "", alcance: "local" as "local" | "nacional" | "hibrido",
    category_id: "", subcategory_ids: [] as string[],
    cta_phone: "", cta_email: "", cta_whatsapp: "", cta_website: "",
    schedule_weekdays: "", schedule_weekend: "",
    // Legal
    nif: "", address: "", owner_name: "", owner_phone: "", owner_email: "",
    // Commercial
    commercial_status: "nao_contactado" as CommercialStatus,
    is_active: false,
    // Subscription
    plan_id: "", subscription_start_date: "",
    is_featured: false, is_premium: false, premium_level: "" as string,
    display_order: 0,
  });

  // Dynamic module values state
  const [moduleValues, setModuleValues] = useState<Record<string, { value: string | null; value_json: any }>>({});

  // Load business data when editing
  useEffect(() => {
    if (business) {
      setForm({
        name: business.name, slug: business.slug,
        description: business.description || "", logo_url: business.logo_url || "",
        city: business.city || "", zone: business.zone || "",
        alcance: business.alcance || "local",
        category_id: business.category_id || "", subcategory_ids: [],
        cta_phone: business.cta_phone || "", cta_email: business.cta_email || "",
        cta_whatsapp: business.cta_whatsapp || "", cta_website: business.cta_website || "",
        schedule_weekdays: business.schedule_weekdays || "", schedule_weekend: business.schedule_weekend || "",
        nif: (business as any).nif || "", address: (business as any).address || "",
        owner_name: (business as any).owner_name || "", owner_phone: (business as any).owner_phone || "",
        owner_email: (business as any).owner_email || "",
        commercial_status: business.commercial_status || "nao_contactado",
        is_active: business.is_active,
        plan_id: business.plan_id || "", subscription_start_date: business.subscription_start_date || "",
        is_featured: business.is_featured, is_premium: business.is_premium,
        premium_level: business.premium_level || "", display_order: business.display_order,
      });
    }
  }, [business]);

  useEffect(() => {
    if (editSubcategoryIds && business) {
      setForm(prev => ({ ...prev, subcategory_ids: editSubcategoryIds }));
    }
  }, [editSubcategoryIds, business]);

  // Load existing module values
  useEffect(() => {
    if (existingModuleValues.length > 0) {
      const map: Record<string, { value: string | null; value_json: any }> = {};
      existingModuleValues.forEach((v) => {
        map[v.module_id] = { value: v.value, value_json: v.value_json };
      });
      setModuleValues(map);
    }
  }, [existingModuleValues]);

  const filteredSubcategories = allSubcategories.filter(s => s.category_id === form.category_id);

  const toggleSubcategory = (subId: string) => {
    setForm(prev => ({
      ...prev,
      subcategory_ids: prev.subcategory_ids.includes(subId)
        ? prev.subcategory_ids.filter(id => id !== subId)
        : [...prev.subcategory_ids, subId],
    }));
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

    // Validate required fields when marking as client
    if (form.commercial_status === "cliente") {
      const missing: string[] = [];
      if (!form.nif) missing.push("NIF");
      if (!form.address) missing.push("Morada");
      if (!form.owner_name) missing.push("Nome do responsável");
      if (!form.owner_email) missing.push("Email do responsável");
      if (missing.length > 0) {
        toast({ title: "Dados obrigatórios em falta", description: `Para marcar como cliente: ${missing.join(", ")}`, variant: "destructive" });
        return;
      }
    }

    // Validate required dynamic modules
    const requiredModules = activeModules.filter((m) => m.is_required);
    const missingModules = requiredModules.filter((m) => {
      const val = moduleValues[m.id];
      return !val || (!val.value && !val.value_json);
    });
    if (missingModules.length > 0) {
      toast({ title: "Campos adicionais obrigatórios em falta", description: missingModules.map((m) => m.label).join(", "), variant: "destructive" });
      return;
    }

    try {
      const subscriptionData = getSubscriptionDates(form.plan_id, form.subscription_start_date);
      const primarySubcategoryId = form.subcategory_ids.length > 0 ? form.subcategory_ids[0] : null;

      const data: any = {
        name: form.name,
        slug: form.slug || generateSlug(form.name),
        category_id: form.category_id || null,
        subcategory_id: primarySubcategoryId,
        plan_id: form.plan_id || null,
        description: form.description || null,
        logo_url: form.logo_url || null,
        city: form.city || null,
        zone: form.zone || null,
        alcance: form.alcance,
        schedule_weekdays: form.schedule_weekdays || null,
        schedule_weekend: form.schedule_weekend || null,
        cta_website: form.cta_website || null,
        cta_whatsapp: form.cta_whatsapp || null,
        cta_phone: form.cta_phone || null,
        cta_email: form.cta_email || null,
        nif: form.nif || null,
        address: form.address || null,
        owner_name: form.owner_name || null,
        owner_phone: form.owner_phone || null,
        owner_email: form.owner_email || null,
        is_featured: form.is_featured,
        is_premium: form.is_premium,
        premium_level: form.premium_level ? (form.premium_level as PremiumLevel) : null,
        is_active: form.plan_id ? true : form.is_active,
        display_order: form.display_order,
        commercial_status: form.commercial_status,
        ...subscriptionData,
      };

      let businessId: string;

      if (isEditing) {
        await updateBusiness.mutateAsync({ id: business.id, ...data });
        businessId = business.id;

        await createAuditLog.mutateAsync({
          action: "update_business",
          target_table: "businesses",
          target_id: business.id,
          target_name: business.name,
          changes: {
            commercial_status: { old: business.commercial_status, new: form.commercial_status },
            is_active: { old: business.is_active, new: form.is_active },
          },
        });

        toast({ title: "Negócio atualizado com sucesso" });
      } else {
        data.cta_app = null;
        data.images = [];
        data.coordinates = null;
        const result = await createBusiness.mutateAsync(data);
        businessId = result.id;
        toast({ title: "Negócio criado com sucesso" });
      }

      if (form.subcategory_ids.length > 0) {
        await syncSubcategories.mutateAsync({ businessId, subcategoryIds: form.subcategory_ids });
      }

      // Save dynamic module values
      const moduleEntries = Object.entries(moduleValues).filter(([_, v]) => v.value || v.value_json);
      if (moduleEntries.length > 0) {
        await upsertModuleValues.mutateAsync({
          businessId,
          values: moduleEntries.map(([moduleId, v]) => ({
            module_id: moduleId,
            value: v.value,
            value_json: v.value_json,
          })),
        });
      }

      onSaved();
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível guardar o negócio", variant: "destructive" });
    }
  };

  const isLoading = createBusiness.isPending || updateBusiness.isPending;

  const set = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* 1. Identidade do Negócio */}
      <Section title="1. Identidade do Negócio" icon={Building2}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input value={form.name} onChange={(e) => { set("name", e.target.value); if (!isEditing) set("slug", generateSlug(e.target.value)); }} required />
          </div>
          <div className="space-y-2">
            <Label>Slug (URL)</Label>
            <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="gerado automaticamente" />
          </div>
        </div>
        <div className="space-y-2 mt-3">
          <Label>Descrição</Label>
          <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} />
        </div>
        <div className="space-y-2 mt-3">
          <Label>URL do Logo</Label>
          <Input value={form.logo_url} onChange={(e) => set("logo_url", e.target.value)} placeholder="https://..." />
        </div>
      </Section>

      {/* 2. Presença Pública */}
      <Section title="2. Presença Pública" icon={Globe}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm(prev => ({ ...prev, category_id: v, subcategory_ids: [] }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar categoria" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Alcance</Label>
              <Select value={form.alcance} onValueChange={(v: any) => set("alcance", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local</SelectItem>
                  <SelectItem value="nacional">Nacional</SelectItem>
                  <SelectItem value="hibrido">Híbrido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.category_id && filteredSubcategories.length > 0 && (
            <div className="space-y-2">
              <Label>Subcategorias</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-border rounded-lg p-3">
                {filteredSubcategories.map(sub => (
                  <label key={sub.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded p-1">
                    <Checkbox checked={form.subcategory_ids.includes(sub.id)} onCheckedChange={() => toggleSubcategory(sub.id)} />
                    <span className="text-sm">{sub.name}</span>
                  </label>
                ))}
              </div>
              {form.subcategory_ids.length > 0 && (
                <p className="text-xs text-muted-foreground">{form.subcategory_ids.length} selecionada(s)</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Zona</Label>
              <Input value={form.zone} onChange={(e) => set("zone", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Telefone público</Label>
              <Input value={form.cta_phone} onChange={(e) => set("cta_phone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email público</Label>
              <Input type="email" value={form.cta_email} onChange={(e) => set("cta_email", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>WhatsApp</Label>
              <Input value={form.cta_whatsapp} onChange={(e) => set("cta_whatsapp", e.target.value)} placeholder="+351..." />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={form.cta_website} onChange={(e) => set("cta_website", e.target.value)} placeholder="https://..." />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Horário Semana</Label>
              <Input value={form.schedule_weekdays} onChange={(e) => set("schedule_weekdays", e.target.value)} placeholder="09:00–18:00" />
            </div>
            <div className="space-y-2">
              <Label>Horário Fim-de-semana</Label>
              <Input value={form.schedule_weekend} onChange={(e) => set("schedule_weekend", e.target.value)} placeholder="Encerrado" />
            </div>
          </div>
        </div>
      </Section>

      {/* 3. Dados Legais e Administrativos */}
      <Section title="3. Dados Legais e Administrativos" icon={Scale} defaultOpen={isEditing && form.commercial_status === "cliente"}>
        <div className="space-y-1 mb-3">
          <p className="text-xs text-muted-foreground">
            ⚠️ Estes dados são obrigatórios quando o negócio é marcado como "Cliente".
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>NIF {form.commercial_status === "cliente" && <span className="text-destructive">*</span>}</Label>
            <Input value={form.nif} onChange={(e) => set("nif", e.target.value)} placeholder="Número fiscal" />
          </div>
          <div className="space-y-2">
            <Label>Morada {form.commercial_status === "cliente" && <span className="text-destructive">*</span>}</Label>
            <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
          <div className="space-y-2">
            <Label>Responsável {form.commercial_status === "cliente" && <span className="text-destructive">*</span>}</Label>
            <Input value={form.owner_name} onChange={(e) => set("owner_name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Telefone responsável</Label>
            <Input value={form.owner_phone} onChange={(e) => set("owner_phone", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email responsável {form.commercial_status === "cliente" && <span className="text-destructive">*</span>}</Label>
            <Input type="email" value={form.owner_email} onChange={(e) => set("owner_email", e.target.value)} />
          </div>
        </div>
      </Section>

      {/* 4. Estado Comercial e Histórico */}
      <Section title="4. Estado Comercial e Histórico" icon={Handshake} defaultOpen={true}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Estado Comercial</Label>
            <Select value={form.commercial_status} onValueChange={(v: CommercialStatus) => set("commercial_status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(commercialStatusLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Switch checked={form.is_active} onCheckedChange={(c) => set("is_active", c)} />
            <Label>Visível publicamente</Label>
          </div>
        </div>

        {isEditing && (
          <div className="mt-4 border-t border-border pt-4">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Histórico de Contactos</h4>
            <ContactHistoryInline businessId={business.id} />
          </div>
        )}
      </Section>

      {/* 5. Subscrição e Produto */}
      <Section title="5. Subscrição e Produto" icon={CreditCard} defaultOpen={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Plano</Label>
            <Select value={form.plan_id || "none"} onValueChange={(v) => set("plan_id", v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Selecionar plano" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Gratuito</SelectItem>
                {commercialPlans.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} {p.price > 0 ? `— ${p.price}€` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {form.plan_id && (
            <div className="space-y-2">
              <Label>Data de início</Label>
              <Input type="date" value={form.subscription_start_date} onChange={(e) => set("subscription_start_date", e.target.value)} />
              {form.subscription_start_date && (() => {
                const dates = getSubscriptionDates(form.plan_id, form.subscription_start_date);
                const plan = commercialPlans.find(p => p.id === form.plan_id);
                return <p className="text-xs text-muted-foreground">Fim: {dates.subscription_end_date || "-"}{plan ? ` • ${plan.price}€` : ""}</p>;
              })()}
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Nível Premium</Label>
              <Select value={form.premium_level || "none"} onValueChange={(v) => setForm(prev => ({ ...prev, premium_level: v === "none" ? "" : v, is_premium: v !== "none" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem Premium</SelectItem>
                  <SelectItem value="SUPER">Super Destaque</SelectItem>
                  <SelectItem value="CATEGORIA">Destaque Categoria</SelectItem>
                  <SelectItem value="SUBCATEGORIA">Destaque Subcategoria</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-6 items-center pt-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_featured} onCheckedChange={(c) => set("is_featured", c)} />
                <Label>Destaque</Label>
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* 6. Contexto Financeiro */}
      <Section title="6. Contexto Financeiro" icon={DollarSign} defaultOpen={false}>
        <div className="bg-muted/30 rounded-lg p-4 space-y-2">
          {isEditing && business ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block text-xs">Plano atual</span>
                  <span className="font-medium">{commercialPlans.find(p => p.id === business.plan_id)?.name || "Gratuito"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Preço</span>
                  <span className="font-medium">{business.subscription_price ? `${business.subscription_price}€` : "0€"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Estado subscrição</span>
                  <Badge variant="secondary" className={
                    business.subscription_status === "active" ? "bg-success/10 text-success" :
                    business.subscription_status === "expired" ? "bg-destructive/10 text-destructive" :
                    "bg-muted text-muted-foreground"
                  }>
                    {business.subscription_status === "active" ? "Ativa" :
                     business.subscription_status === "expired" ? "Expirada" : "Inativa"}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Fim</span>
                  <span className="font-medium">{business.subscription_end_date || "-"}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Nota: Não são recolhidos dados bancários. Gestão de pagamentos é feita externamente.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Informação financeira disponível após criação do negócio.</p>
          )}
        </div>
      </Section>

      {/* 7. Auditoria e Alertas (Admin only) */}
      {isAdmin && isEditing && business && (
        <Section title="7. Auditoria e Alertas" icon={ShieldCheck} defaultOpen={false}>
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-muted-foreground block text-xs">Criado em</span>
                <span>{business.created_at ? new Date(business.created_at).toLocaleDateString("pt-PT") : "-"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Atualizado em</span>
                <span>{business.updated_at ? new Date(business.updated_at).toLocaleDateString("pt-PT") : "-"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Origem</span>
                <Badge variant="secondary">{(business as any).registration_source || "manual"}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">ID</span>
                <span className="text-[10px] font-mono break-all">{business.id}</span>
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* 8. Campos Adicionais (Dynamic Modules) */}
      {activeModules.length > 0 && (
        <Section title="8. Campos Adicionais" icon={Puzzle} defaultOpen={isEditing}>
          {(() => {
            const grouped = activeModules.reduce<Record<string, BusinessModule[]>>((acc, m) => {
              (acc[m.section] = acc[m.section] || []).push(m);
              return acc;
            }, {});
            const sectionLabels: Record<string, string> = {
              presenca_publica: "Presença Pública",
              dados_privados: "Dados Privados",
              marketing: "Marketing",
            };
            return Object.entries(grouped).map(([section, mods]) => (
              <div key={section} className="space-y-3 mb-4">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground">{sectionLabels[section] || section}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mods.map((mod) => {
                    const val = moduleValues[mod.id] || { value: null, value_json: null };
                    const setModVal = (v: string | null, vj?: any) =>
                      setModuleValues((prev) => ({ ...prev, [mod.id]: { value: v, value_json: vj ?? prev[mod.id]?.value_json ?? null } }));

                    return (
                      <div key={mod.id} className="space-y-1">
                        <Label>{mod.label} {mod.is_required && <span className="text-destructive">*</span>}</Label>
                        {mod.type === "text" && (
                          <Input value={val.value || ""} onChange={(e) => setModVal(e.target.value)} />
                        )}
                        {mod.type === "textarea" && (
                          <Textarea value={val.value || ""} onChange={(e) => setModVal(e.target.value)} rows={3} />
                        )}
                        {mod.type === "url" && (
                          <Input type="url" value={val.value || ""} onChange={(e) => setModVal(e.target.value)} placeholder="https://..." />
                        )}
                        {mod.type === "image" && (
                          <Input type="url" value={val.value || ""} onChange={(e) => setModVal(e.target.value)} placeholder="URL da imagem" />
                        )}
                        {mod.type === "video" && (
                          <Input type="url" value={val.value || ""} onChange={(e) => setModVal(e.target.value)} placeholder="URL do vídeo (YouTube, Vimeo)" />
                        )}
                        {mod.type === "boolean" && (
                          <Switch checked={val.value === "true"} onCheckedChange={(c) => setModVal(c ? "true" : "false")} />
                        )}
                        {mod.type === "select" && Array.isArray(mod.options) && (
                          <Select value={val.value || ""} onValueChange={(v) => setModVal(v)}>
                            <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                            <SelectContent>
                              {mod.options.map((opt: string) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {mod.type === "gallery" && (
                          <div className="space-y-2">
                            {(Array.isArray(val.value_json) ? val.value_json : []).map((url: string, i: number) => (
                              <div key={i} className="flex gap-2">
                                <Input
                                  value={url}
                                  onChange={(e) => {
                                    const arr = [...(val.value_json || [])];
                                    arr[i] = e.target.value;
                                    setModuleValues((prev) => ({ ...prev, [mod.id]: { value: null, value_json: arr } }));
                                  }}
                                  placeholder="URL da imagem"
                                />
                                <Button type="button" variant="ghost" size="sm" onClick={() => {
                                  const arr = (val.value_json || []).filter((_: any, idx: number) => idx !== i);
                                  setModuleValues((prev) => ({ ...prev, [mod.id]: { value: null, value_json: arr } }));
                                }}>✕</Button>
                              </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={() => {
                              const arr = [...(val.value_json || []), ""];
                              setModuleValues((prev) => ({ ...prev, [mod.id]: { value: null, value_json: arr } }));
                            }}>
                              <Plus className="h-3 w-3 mr-1" /> Adicionar imagem
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ));
          })()}
        </Section>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEditing ? "Guardar alterações" : "Criar negócio"}
        </Button>
      </div>
    </form>
  );
};

export default BusinessFileCard;
