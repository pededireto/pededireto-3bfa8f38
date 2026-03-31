import { useState } from "react";
import { getBusinessStatusLabel, getBusinessStatusVariant } from "@/utils/businessStatus";
import type { BusinessWithCategory } from "@/hooks/useBusinesses";
import { useCommercialPlans } from "@/hooks/useCommercialPlans";
import { usePlanRuleByPlanId } from "@/hooks/usePlanRules";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useBusinessAddon, getAddonStatus } from "@/hooks/useBusinessAddons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Check, X, Star, Loader2, Smartphone, Building2, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props { business: BusinessWithCategory; }

const FREE_PLAN_ID = "543e0ec3-21ba-4223-bb7a-6375341349b4";

// Planos SEPA têm correspondência com planos MB Way
const SEPA_PLAN_NAMES = ["mensal sepa", "6 meses sepa", "anual sepa", "pioneiro"];

function isSepa(name: string): boolean {
  return SEPA_PLAN_NAMES.some(s => name.toLowerCase().includes(s));
}

function isSuperPremium(name: string): boolean {
  return name.toLowerCase().includes("anual") || name.toLowerCase().includes("super premium");
}

function isPioneiro(name: string): boolean {
  return name.toLowerCase().includes("pioneiro");
}

const BusinessPlanContent = ({ business }: Props) => {
  const { toast } = useToast();
  const { checkout } = useStripeCheckout();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  const { data: plans = [] } = useCommercialPlans(true);
  const { data: rules } = usePlanRuleByPlanId(business.plan_id);
  const { data: studioAddon } = useBusinessAddon(business.id, "marketing_ai");
  const studioStatus = getAddonStatus(studioAddon ?? null);
  const currentPlan = plans.find((p) => p.id === business.plan_id);
  const currentPrice = currentPlan?.price ?? 0;
  const isFreePlan = !business.plan_id || business.plan_id === FREE_PLAN_ID;

  const ruleItems = rules ? [
    { label: "Vídeo", allowed: rules.allow_video },
    { label: "Destaque Categoria", allowed: rules.allow_category_highlight },
    { label: "Super Destaque", allowed: rules.allow_super_highlight },
    { label: "Bloco Premium", allowed: rules.allow_premium_block },
  ] : [];

  const businessPlans = plans.filter((p) => p.plan_type === "business");
  const upgradePlans = businessPlans.filter((p) => p.id !== business.plan_id && (p.price ?? 0) > currentPrice);
  const plansToShow = isFreePlan ? businessPlans.filter(p => p.id !== FREE_PLAN_ID) : upgradePlans;

  const handleCheckout = async (plan: any, paymentMethod: "mbway" | "sepa") => {
    const key = `${plan.id}-${paymentMethod}`;
    setLoadingPlanId(key);
    try {
      await checkout({
        planId: plan.id,
        planName: plan.name,
        price: plan.price,
        businessId: business.id,
        paymentMethod,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao iniciar pagamento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingPlanId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">O Meu Plano</h1>
        <p className="text-muted-foreground">Detalhes e benefícios do seu plano atual</p>
      </div>

      {/* Plano atual */}
      <div className="bg-card rounded-xl p-6 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">{currentPlan?.name || "Gratuito"}</h2>
          <Badge variant={getBusinessStatusVariant(business)} >
            {getBusinessStatusLabel(business)}
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

      {/* Planos disponíveis */}
      <div className="bg-card rounded-xl p-6 shadow-card">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">
            {isFreePlan ? "Planos Disponíveis" : "Fazer Upgrade"}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Paga com <strong>MB Way</strong> (pagamento único) ou <strong>Débito SEPA</strong> (renovação automática — mais barato)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plansToShow.map((plan) => {
            const isSuper = isSuperPremium(plan.name);
            const isPio = isPioneiro(plan.name);
            const isCurrent = plan.id === business.plan_id;
            const planIsSepa = isSepa(plan.name);
            const paymentMethod = planIsSepa ? "sepa" : "mbway";
            const loadingKey = `${plan.id}-${paymentMethod}`;
            const isLoading = loadingPlanId === loadingKey;

            return (
              <div
                key={plan.id}
                className={`relative border rounded-xl p-5 transition-all ${
                  isCurrent
                    ? "border-primary bg-primary/5"
                    : isSuper || isPio
                    ? "border-primary/50 bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/30"
                }`}
              >
                {/* Badge destaque */}
                {isPio && (
                  <Badge className="absolute -top-2 right-3 bg-yellow-500 text-white text-xs">
                    <Star className="h-3 w-3 mr-1" /> Pioneiro — 50 lugares
                  </Badge>
                )}
                {isSuper && !isPio && (
                  <Badge className="absolute -top-2 right-3 bg-primary text-primary-foreground text-xs">
                    <Star className="h-3 w-3 mr-1" /> Mais Popular
                  </Badge>
                )}

                {/* Badge método de pagamento */}
                <div className="flex items-center gap-1.5 mb-3">
                  {planIsSepa
                    ? <><Building2 className="h-3.5 w-3.5 text-blue-400" /><span className="text-xs text-blue-400 font-medium">Débito SEPA — renovação automática</span></>
                    : <><Smartphone className="h-3.5 w-3.5 text-green-400" /><span className="text-xs text-green-400 font-medium">MB Way — pagamento único</span></>
                  }
                </div>

                <h3 className="font-bold text-lg">{plan.name}</h3>
                <p className="text-3xl font-bold text-primary mt-1">{plan.price}€</p>
                <p className="text-sm text-muted-foreground">{plan.duration_months} meses</p>

                {planIsSepa && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Cancela quando quiseres
                  </p>
                )}

                {plan.description && (
                  <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                )}

                {isCurrent ? (
                  <Badge className="mt-4">Plano Atual</Badge>
                ) : (
                  <Button
                    className="mt-4 w-full gap-2"
                    variant={isSuper || isPio ? "default" : "outline"}
                    disabled={isLoading}
                    onClick={() => handleCheckout(plan, paymentMethod)}
                  >
                    {isLoading
                      ? <><Loader2 className="h-4 w-4 animate-spin" />A processar...</>
                      : planIsSepa
                      ? <><Building2 className="h-4 w-4" />Subscrever com SEPA</>
                      : <><Smartphone className="h-4 w-4" />Pagar com MB Way</>
                    }
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ADD-ONS Disponíveis */}
      <div className="bg-card rounded-xl p-6 shadow-card">
        <h2 className="text-lg font-semibold mb-4">ADD-ONS Disponíveis</h2>
        <div className="border rounded-xl p-5 transition-all border-border hover:border-primary/30">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-full p-2.5">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Marketing AI Studio</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Cria conteúdo visual profissional para redes sociais com IA.
                </p>
                <p className="text-xl font-bold text-primary mt-2">19,90€<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {studioStatus.status === "active" || studioStatus.status === "expiring" ? (
                <>
                  <Badge variant="default" className="bg-green-500 text-white">
                    ✅ Activo
                  </Badge>
                  {studioStatus.expiresAt && (
                    <span className="text-xs text-muted-foreground">
                      {studioStatus.status === "expiring" 
                        ? `⚠️ Expira em ${studioStatus.daysLeft} dias` 
                        : `Válido até ${studioStatus.expiresAt.toLocaleDateString("pt-PT")}`}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <Badge variant="secondary">Não incluído</Badge>
                  <Button
                    size="sm"
                    className="gap-1.5 mt-1"
                    onClick={() => {
                      toast({
                        title: "Contacte-nos",
                        description: "Para ativar o Marketing AI Studio, contacte a nossa equipa via WhatsApp.",
                      });
                    }}
                  >
                    <Zap className="h-4 w-4" /> Adicionar ao Plano
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessPlanContent;
