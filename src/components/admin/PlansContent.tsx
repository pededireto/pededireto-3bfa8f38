import { useState } from "react";
import {
  useCommercialPlans,
  useCreatePlan,
  useUpdatePlan,
  useDeletePlan,
  CommercialPlan,
} from "@/hooks/useCommercialPlans";
import { usePlanRules, useUpsertPlanRule } from "@/hooks/usePlanRules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, CreditCard, ShieldCheck, Banknote, Smartphone } from "lucide-react";

const emptyPlan = {
  name: "",
  price: 0,
  duration_months: 1,
  is_active: true,
  premium_level: null as CommercialPlan["premium_level"],
  description: "",
  display_order: 0,
  plan_type: "business" as CommercialPlan["plan_type"],
  payment_method: "sepa" as CommercialPlan["payment_method"],
  stripe_price_id: "",
  stripe_product_id: "",
};

const emptyRules = {
  max_gallery_images: null as number | null,
  max_modules: null as number | null,
  allow_video: false,
  allow_category_highlight: false,
  allow_super_highlight: false,
  allow_premium_block: false,
  allow_analytics_basic: false,
  allow_analytics_pro: false,
};

// Labels e cores por método de pagamento
const paymentMethodConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  sepa: { label: "DD SEPA", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Banknote },
  mbway: { label: "MB Way", color: "bg-orange-500/10 text-orange-500 border-orange-500/20", icon: Smartphone },
  free: { label: "Gratuito", color: "bg-muted text-muted-foreground", icon: CreditCard },
};

const PlansContent = () => {
  const { data: plans = [], isLoading } = useCommercialPlans();
  const { data: allRules = [] } = usePlanRules();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  const upsertPlanRule = useUpsertPlanRule();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Partial<CommercialPlan> | null>(null);
  const [form, setForm] = useState(emptyPlan);
  const [rules, setRules] = useState(emptyRules);

  const openCreate = () => {
    setEditingPlan(null);
    setForm(emptyPlan);
    setRules(emptyRules);
    setDialogOpen(true);
  };

  const openEdit = (plan: CommercialPlan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      price: plan.price,
      duration_months: plan.duration_months,
      is_active: plan.is_active,
      premium_level: plan.premium_level ?? null,
      description: plan.description || "",
      display_order: plan.display_order,
      plan_type: plan.plan_type || "business",
      payment_method: plan.payment_method ?? "sepa",
      stripe_price_id: plan.stripe_price_id ?? "",
      stripe_product_id: plan.stripe_product_id ?? "",
    });
    const existingRule = allRules.find((r) => r.plan_id === plan.id);
    setRules(
      existingRule
        ? {
            max_gallery_images: existingRule.max_gallery_images,
            max_modules: existingRule.max_modules,
            allow_video: existingRule.allow_video,
            allow_category_highlight: existingRule.allow_category_highlight,
            allow_super_highlight: existingRule.allow_super_highlight,
            allow_premium_block: existingRule.allow_premium_block,
            allow_analytics_basic: existingRule.allow_analytics_basic,
            allow_analytics_pro: existingRule.allow_analytics_pro,
          }
        : emptyRules,
    );
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      let planId: string;

      const planData = {
        ...form,
        stripe_price_id: form.stripe_price_id || null,
        stripe_product_id: form.stripe_product_id || null,
      };

      if (editingPlan?.id) {
        await updatePlan.mutateAsync({ id: editingPlan.id, ...planData });
        planId = editingPlan.id;
        toast({ title: "Plano atualizado" });
      } else {
        const result = await createPlan.mutateAsync(planData);
        planId = (result as any).id;
        toast({ title: "Plano criado" });
      }

      await upsertPlanRule.mutateAsync({ plan_id: planId, ...rules });
      setDialogOpen(false);
    } catch {
      toast({ title: "Erro ao guardar plano", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminar este plano?")) return;
    try {
      await deletePlan.mutateAsync(id);
      toast({ title: "Plano eliminado" });
    } catch {
      toast({ title: "Erro ao eliminar (pode estar associado a negócios)", variant: "destructive" });
    }
  };

  const premiumLabel = (level: string | null) => {
    if (!level) return null;
    return level === "SUPER" ? "Super Destaque" : level === "CATEGORIA" ? "Destaque" : "Subcategoria";
  };

  // Agrupar planos por tipo (START, PRO, etc.) para melhor visualização
  const activePlans = plans.filter((p) => p.is_active);
  const inactivePlans = plans.filter((p) => !p.is_active);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Planos Comerciais</h1>
          <p className="text-muted-foreground">Gerir planos e preços sem alterar código</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      {/* Planos Activos */}
      <div>
        <h2 className="text-sm font-semibold uppercase text-muted-foreground mb-3 tracking-wider">
          Ativos ({activePlans.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activePlans.map((plan) => {
            const pmConfig = paymentMethodConfig[plan.payment_method || "free"];
            const PaymentIcon = pmConfig?.icon || CreditCard;
            return (
              <div
                key={plan.id}
                className="bg-card rounded-xl p-6 shadow-card border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <CreditCard className="w-4 h-4 text-primary flex-shrink-0" />
                    <h3 className="font-bold text-base truncate">{plan.name}</h3>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(plan)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDelete(plan.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>

                <p className="text-3xl font-bold text-primary mb-1">{plan.price}€</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {plan.duration_months === 0
                    ? "Sem limite"
                    : `${plan.duration_months} ${plan.duration_months === 1 ? "mês" : "meses"}`}
                </p>

                {plan.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{plan.description}</p>
                )}

                <div className="flex flex-wrap gap-2">
                  {/* Método de pagamento */}
                  {pmConfig && (
                    <Badge variant="outline" className={`text-xs gap-1 ${pmConfig.color}`}>
                      <PaymentIcon className="h-3 w-3" />
                      {pmConfig.label}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {plan.plan_type === "consumer" ? "Consumidor" : "Negócio"}
                  </Badge>
                  {premiumLabel(plan.premium_level) && (
                    <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                      {premiumLabel(plan.premium_level)}
                    </Badge>
                  )}
                  {/* Indicador Stripe */}
                  {plan.stripe_price_id ? (
                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/20">
                      ✓ Stripe
                    </Badge>
                  ) : plan.price > 0 ? (
                    <Badge
                      variant="outline"
                      className="text-xs bg-destructive/10 text-destructive border-destructive/20"
                    >
                      ! Sem Stripe
                    </Badge>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Planos Inactivos */}
      {inactivePlans.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase text-muted-foreground mb-3 tracking-wider">
            Inativos ({inactivePlans.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-50">
            {inactivePlans.map((plan) => (
              <div key={plan.id} className="bg-card rounded-xl p-4 border border-dashed border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{plan.name}</p>
                    <p className="text-muted-foreground text-sm">{plan.price}€</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(plan)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDelete(plan.id)}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dialog Criar/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Editar Plano" : "Novo Plano"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Nome */}
            <div>
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: START Mensal SEPA"
              />
            </div>

            {/* Preço e Duração */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Preço (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Duração (meses)</Label>
                <Input
                  type="number"
                  value={form.duration_months}
                  onChange={(e) => setForm({ ...form, duration_months: parseInt(e.target.value) || 0 })}
                  placeholder="0 = sem limite"
                />
              </div>
            </div>

            {/* Método de Pagamento ← NOVO */}
            <div>
              <Label>Método de Pagamento</Label>
              <Select
                value={form.payment_method || "sepa"}
                onValueChange={(v) => setForm({ ...form, payment_method: v as CommercialPlan["payment_method"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sepa">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4 text-blue-500" />
                      DD SEPA (Débito Direto)
                    </div>
                  </SelectItem>
                  <SelectItem value="mbway">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-orange-500" />
                      MB Way
                    </div>
                  </SelectItem>
                  <SelectItem value="free">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      Gratuito (sem pagamento)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Nível Premium */}
            <div>
              <Label>Nível Premium</Label>
              <Select
                value={form.premium_level || "none"}
                onValueChange={(v) => setForm({ ...form, premium_level: v === "none" ? null : (v as any) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  <SelectItem value="SUBCATEGORIA">Subcategoria</SelectItem>
                  <SelectItem value="CATEGORIA">Destaque</SelectItem>
                  <SelectItem value="SUPER">Super Destaque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Plano */}
            <div>
              <Label>Tipo de Plano</Label>
              <Select value={form.plan_type} onValueChange={(v) => setForm({ ...form, plan_type: v as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business">Negócio</SelectItem>
                  <SelectItem value="consumer">Consumidor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Descrição */}
            <div>
              <Label>Descrição</Label>
              <Input
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Funcionalidades incluídas..."
              />
            </div>

            {/* Stripe IDs ← NOVO — só aparece se não for gratuito */}
            {form.payment_method !== "free" && (
              <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">Ligação Stripe</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Stripe Price ID</Label>
                    <Input
                      value={form.stripe_price_id || ""}
                      onChange={(e) => setForm({ ...form, stripe_price_id: e.target.value })}
                      placeholder="price_xxxxxxxxxxxxxxxx"
                      className="font-mono text-xs"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Encontra no dashboard Stripe → Products → Price ID
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs">Stripe Product ID</Label>
                    <Input
                      value={form.stripe_product_id || ""}
                      onChange={(e) => setForm({ ...form, stripe_product_id: e.target.value })}
                      placeholder="prod_xxxxxxxxxxxxxxxx"
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
                {form.stripe_price_id && (
                  <div className="flex items-center gap-2 text-xs text-green-500">
                    <span>✓</span>
                    <span>Stripe ID configurado</span>
                  </div>
                )}
                {!form.stripe_price_id && form.price > 0 && (
                  <div className="flex items-center gap-2 text-xs text-destructive">
                    <span>!</span>
                    <span>Plano pago sem Stripe ID — pagamentos não vão funcionar</span>
                  </div>
                )}
              </div>
            )}

            {/* Ordem */}
            <div>
              <Label>Ordem de exibição</Label>
              <Input
                type="number"
                value={form.display_order}
                onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
              />
            </div>

            {/* Activo */}
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Ativo</Label>
            </div>

            <Button className="w-full" onClick={handleSave} disabled={!form.name}>
              {editingPlan ? "Guardar Alterações" : "Criar Plano"}
            </Button>

            {/* Regras e Permissões */}
            <div className="border-t border-border pt-4 mt-2">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Regras e Permissões</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Máx. Imagens Galeria</Label>
                  <Input
                    type="number"
                    value={rules.max_gallery_images ?? ""}
                    onChange={(e) =>
                      setRules({ ...rules, max_gallery_images: e.target.value ? parseInt(e.target.value) : null })
                    }
                    placeholder="Sem limite"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Máx. Módulos</Label>
                  <Input
                    type="number"
                    value={rules.max_modules ?? ""}
                    onChange={(e) =>
                      setRules({ ...rules, max_modules: e.target.value ? parseInt(e.target.value) : null })
                    }
                    placeholder="Sem limite"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="flex items-center gap-2">
                  <Switch checked={rules.allow_video} onCheckedChange={(v) => setRules({ ...rules, allow_video: v })} />
                  <Label className="text-xs">Permitir Vídeo</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={rules.allow_category_highlight}
                    onCheckedChange={(v) => setRules({ ...rules, allow_category_highlight: v })}
                  />
                  <Label className="text-xs">Destaque Categoria</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={rules.allow_super_highlight}
                    onCheckedChange={(v) => setRules({ ...rules, allow_super_highlight: v })}
                  />
                  <Label className="text-xs">Super Destaque</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={rules.allow_premium_block}
                    onCheckedChange={(v) => setRules({ ...rules, allow_premium_block: v })}
                  />
                  <Label className="text-xs">Bloco Premium</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={rules.allow_analytics_basic}
                    onCheckedChange={(v) => setRules({ ...rules, allow_analytics_basic: v })}
                  />
                  <Label className="text-xs">Analytics Basic</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={rules.allow_analytics_pro}
                    onCheckedChange={(v) => setRules({ ...rules, allow_analytics_pro: v })}
                  />
                  <Label className="text-xs">Analytics Pro</Label>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlansContent;
