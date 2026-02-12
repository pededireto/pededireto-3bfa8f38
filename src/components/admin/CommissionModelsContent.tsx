import { useState } from "react";
import {
  useCommissionModels,
  useCreateCommissionModel,
  useActivateCommissionModel,
  useDeleteCommissionModel,
  useCommissionRules,
  useCreateCommissionRule,
  useDeleteCommissionRule,
} from "@/hooks/useCommercialPerformance";
import { useCommercialPlans } from "@/hooks/useCommercialPlans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Settings, Zap } from "lucide-react";

const CommissionModelsContent = () => {
  const { toast } = useToast();
  const { data: models = [], isLoading } = useCommissionModels();
  const { data: plans = [] } = useCommercialPlans();
  const createModel = useCreateCommissionModel();
  const activateModel = useActivateCommissionModel();
  const deleteModel = useDeleteCommissionModel();

  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const { data: rules = [] } = useCommissionRules(selectedModelId || undefined);
  const createRule = useCreateCommissionRule();
  const deleteRule = useDeleteCommissionRule();

  const [newModelName, setNewModelName] = useState("");
  const [newModelDesc, setNewModelDesc] = useState("");
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    plan_id: null as string | null,
    commission_type: "percentage" as "percentage" | "fixed",
    value: 0,
    applies_to: "first_payment" as "first_payment" | "monthly",
    duration_months: null as number | null,
  });

  const handleCreateModel = async () => {
    if (!newModelName) return;
    try {
      await createModel.mutateAsync({ name: newModelName, description: newModelDesc || undefined });
      toast({ title: "Modelo criado" });
      setNewModelName("");
      setNewModelDesc("");
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await activateModel.mutateAsync(id);
      toast({ title: "Modelo ativado" });
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminar este modelo e todas as suas regras?")) return;
    try {
      await deleteModel.mutateAsync(id);
      if (selectedModelId === id) setSelectedModelId(null);
      toast({ title: "Modelo eliminado" });
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  const handleCreateRule = async () => {
    if (!selectedModelId) return;
    try {
      await createRule.mutateAsync({
        commission_model_id: selectedModelId,
        ...ruleForm,
      });
      toast({ title: "Regra criada" });
      setRuleDialogOpen(false);
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await deleteRule.mutateAsync(id);
      toast({ title: "Regra eliminada" });
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">⚙️ Modelos de Comissão</h1>
        <p className="text-muted-foreground">Configurar modelos e regras de comissões para comerciais</p>
      </div>

      {/* Create Model */}
      <div className="bg-card rounded-xl p-6 shadow-card">
        <h2 className="text-lg font-semibold mb-3">Novo Modelo</h2>
        <div className="flex gap-2 flex-wrap">
          <Input placeholder="Nome do modelo" value={newModelName} onChange={(e) => setNewModelName(e.target.value)} className="w-64" />
          <Input placeholder="Descrição (opcional)" value={newModelDesc} onChange={(e) => setNewModelDesc(e.target.value)} className="flex-1" />
          <Button onClick={handleCreateModel} disabled={!newModelName}>
            <Plus className="h-4 w-4 mr-1" /> Criar
          </Button>
        </div>
      </div>

      {/* Models List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map((model: any) => (
          <div key={model.id} className={`bg-card rounded-xl p-6 shadow-card border-2 ${model.is_active ? "border-primary/50" : "border-transparent"}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold">{model.name}</h3>
                {model.description && <p className="text-sm text-muted-foreground">{model.description}</p>}
              </div>
              <Badge variant={model.is_active ? "default" : "secondary"}>
                {model.is_active ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <div className="flex gap-2">
              {!model.is_active && (
                <Button size="sm" variant="outline" onClick={() => handleActivate(model.id)}>
                  <Zap className="h-3 w-3 mr-1" /> Ativar
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setSelectedModelId(model.id)}>
                <Settings className="h-3 w-3 mr-1" /> Regras
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(model.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Rules for selected model */}
      {selectedModelId && (
        <div className="bg-card rounded-xl p-6 shadow-card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Regras do Modelo: {models.find((m: any) => m.id === selectedModelId)?.name}</h2>
            <Button size="sm" onClick={() => { setRuleForm({ plan_id: null, commission_type: "percentage", value: 0, applies_to: "first_payment", duration_months: null }); setRuleDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Nova Regra
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium text-muted-foreground">Plano</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Tipo</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Valor</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Aplica-se a</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Duração</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r: any) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="p-3 text-sm">{r.commercial_plans?.name || "Todos"}</td>
                    <td className="p-3 text-sm">{r.commission_type === "percentage" ? "Percentagem" : "Fixo"}</td>
                    <td className="p-3 text-sm text-right font-medium">
                      {r.commission_type === "percentage" ? `${r.value}%` : `${r.value}€`}
                    </td>
                    <td className="p-3 text-sm">{r.applies_to === "first_payment" ? "1º Pagamento" : "Mensal"}</td>
                    <td className="p-3 text-sm text-right">{r.duration_months ? `${r.duration_months} meses` : "-"}</td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteRule(r.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {rules.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Sem regras configuradas.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rule Dialog */}
      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Regra de Comissão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Plano (vazio = todos)</Label>
              <Select value={ruleForm.plan_id || "all"} onValueChange={(v) => setRuleForm({ ...ruleForm, plan_id: v === "all" ? null : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os planos</SelectItem>
                  {plans.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={ruleForm.commission_type} onValueChange={(v: any) => setRuleForm({ ...ruleForm, commission_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentagem</SelectItem>
                    <SelectItem value="fixed">Fixo (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor</Label>
                <Input type="number" value={ruleForm.value} onChange={(e) => setRuleForm({ ...ruleForm, value: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Aplica-se a</Label>
                <Select value={ruleForm.applies_to} onValueChange={(v: any) => setRuleForm({ ...ruleForm, applies_to: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="first_payment">1º Pagamento</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Duração (meses, vazio = ilimitado)</Label>
                <Input type="number" value={ruleForm.duration_months ?? ""} onChange={(e) => setRuleForm({ ...ruleForm, duration_months: e.target.value ? parseInt(e.target.value) : null })} placeholder="Ilimitado" />
              </div>
            </div>
            <Button className="w-full" onClick={handleCreateRule}>Criar Regra</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommissionModelsContent;
