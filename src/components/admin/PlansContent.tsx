import { useState } from "react";
import { useCommercialPlans, useCreatePlan, useUpdatePlan, useDeletePlan, CommercialPlan } from "@/hooks/useCommercialPlans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, CreditCard } from "lucide-react";

const emptyPlan = {
  name: "",
  price: 0,
  duration_months: 1,
  is_active: true,
  premium_level: null as CommercialPlan["premium_level"],
  description: "",
  display_order: 0,
  plan_type: "business" as CommercialPlan["plan_type"],
};

const PlansContent = () => {
  const { data: plans = [], isLoading } = useCommercialPlans();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Partial<CommercialPlan> | null>(null);
  const [form, setForm] = useState(emptyPlan);

  const openCreate = () => {
    setEditingPlan(null);
    setForm(emptyPlan);
    setDialogOpen(true);
  };

  const openEdit = (plan: CommercialPlan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      price: plan.price,
      duration_months: plan.duration_months,
      is_active: plan.is_active,
      premium_level: plan.premium_level,
      description: plan.description || "",
      display_order: plan.display_order,
      plan_type: plan.plan_type || "business",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingPlan?.id) {
        await updatePlan.mutateAsync({ id: editingPlan.id, ...form });
        toast({ title: "Plano atualizado" });
      } else {
        await createPlan.mutateAsync(form);
        toast({ title: "Plano criado" });
      }
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
    if (!level) return "Nenhum";
    return level === "SUPER" ? "Super Destaque" : level === "CATEGORIA" ? "Destaque" : "Subcategoria";
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

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className={`bg-card rounded-xl p-6 shadow-card border-2 ${plan.is_active ? "border-transparent" : "border-destructive/20 opacity-60"}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg">{plan.name}</h3>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEdit(plan)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(plan.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>

            <p className="text-3xl font-bold text-primary mb-1">{plan.price}€</p>
            <p className="text-sm text-muted-foreground mb-3">
              {plan.duration_months === 0 ? "Sem limite" : `${plan.duration_months} ${plan.duration_months === 1 ? "mês" : "meses"}`}
            </p>

            {plan.description && (
              <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
            )}

            <div className="flex flex-wrap gap-2">
              <Badge variant={plan.is_active ? "default" : "secondary"}>
                {plan.is_active ? "Ativo" : "Inativo"}
              </Badge>
              <Badge variant="outline">
                {plan.plan_type === "consumer" ? "Consumidor" : "Negócio"}
              </Badge>
              {plan.premium_level && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {premiumLabel(plan.premium_level)}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Editar Plano" : "Novo Plano"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Preço (€)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Duração (meses)</Label>
                <Input type="number" value={form.duration_months} onChange={(e) => setForm({ ...form, duration_months: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div>
              <Label>Nível Premium</Label>
              <Select value={form.premium_level || "none"} onValueChange={(v) => setForm({ ...form, premium_level: v === "none" ? null : v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  <SelectItem value="SUBCATEGORIA">Subcategoria</SelectItem>
                  <SelectItem value="CATEGORIA">Destaque</SelectItem>
                  <SelectItem value="SUPER">Super Destaque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo de Plano</Label>
              <Select value={form.plan_type} onValueChange={(v) => setForm({ ...form, plan_type: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="business">Negócio</SelectItem>
                  <SelectItem value="consumer">Consumidor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <Label>Ordem</Label>
              <Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Ativo</Label>
            </div>
            <Button className="w-full" onClick={handleSave} disabled={!form.name}>
              {editingPlan ? "Guardar Alterações" : "Criar Plano"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlansContent;
