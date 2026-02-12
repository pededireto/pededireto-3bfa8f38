import type { BusinessWithCategory } from "@/hooks/useBusinesses";
import { useCommercialPlans } from "@/hooks/useCommercialPlans";
import { usePlanRuleByPlanId } from "@/hooks/usePlanRules";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Check, X } from "lucide-react";

interface Props { business: BusinessWithCategory; }

const BusinessPlanContent = ({ business }: Props) => {
  const { data: plans = [] } = useCommercialPlans(true);
  const { data: rules } = usePlanRuleByPlanId(business.plan_id);
  const currentPlan = plans.find((p) => p.id === business.plan_id);

  const ruleItems = rules ? [
    { label: "Vídeo", allowed: rules.allow_video },
    { label: "Destaque Categoria", allowed: rules.allow_category_highlight },
    { label: "Super Destaque", allowed: rules.allow_super_highlight },
    { label: "Bloco Premium", allowed: rules.allow_premium_block },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">O Meu Plano</h1>
        <p className="text-muted-foreground">Detalhes e benefícios do seu plano atual</p>
      </div>

      <div className="bg-card rounded-xl p-6 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">{currentPlan?.name || "Gratuito"}</h2>
          <Badge variant={business.subscription_status === "active" ? "default" : "secondary"}>
            {business.subscription_status === "active" ? "Ativo" : "Inativo"}
          </Badge>
        </div>
        {currentPlan && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
            <div><span className="text-muted-foreground block text-xs">Preço</span><span className="font-medium">{currentPlan.price}€</span></div>
            <div><span className="text-muted-foreground block text-xs">Duração</span><span className="font-medium">{currentPlan.duration_months} meses</span></div>
            <div><span className="text-muted-foreground block text-xs">Início</span><span className="font-medium">{business.subscription_start_date || "-"}</span></div>
            <div><span className="text-muted-foreground block text-xs">Fim</span><span className="font-medium">{business.subscription_end_date || "-"}</span></div>
          </div>
        )}
        {rules && ruleItems.length > 0 && (
          <div className="border-t border-border pt-4 mt-4">
            <h3 className="font-semibold text-sm mb-3">Permissões do Plano</h3>
            <div className="grid grid-cols-2 gap-2">
              {ruleItems.map((r) => (
                <div key={r.label} className="flex items-center gap-2 text-sm">
                  {r.allowed ? <Check className="h-4 w-4 text-primary" /> : <X className="h-4 w-4 text-muted-foreground" />}
                  <span className={r.allowed ? "" : "text-muted-foreground"}>{r.label}</span>
                </div>
              ))}
              {rules.max_gallery_images !== null && <div className="text-sm text-muted-foreground">Máx. {rules.max_gallery_images} imagens gallery</div>}
              {rules.max_modules !== null && <div className="text-sm text-muted-foreground">Máx. {rules.max_modules} módulos</div>}
            </div>
          </div>
        )}
      </div>

      <div className="bg-card rounded-xl p-6 shadow-card">
        <h2 className="text-lg font-semibold mb-4">Planos Disponíveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.filter((p) => p.plan_type === "business").map((plan) => (
            <div key={plan.id} className={`border rounded-xl p-4 ${plan.id === business.plan_id ? "border-primary bg-primary/5" : "border-border"}`}>
              <h3 className="font-bold">{plan.name}</h3>
              <p className="text-2xl font-bold text-primary mt-1">{plan.price}€</p>
              <p className="text-sm text-muted-foreground">{plan.duration_months} meses</p>
              {plan.description && <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>}
              {plan.id === business.plan_id ? (
                <Badge className="mt-3">Plano Atual</Badge>
              ) : (
                <Button variant="outline" size="sm" className="mt-3 w-full" disabled>Contactar para Upgrade</Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BusinessPlanContent;
