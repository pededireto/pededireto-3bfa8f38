import type { BusinessWithCategory } from "@/hooks/useBusinesses";
import { useCommercialPlans } from "@/hooks/useCommercialPlans";
import { usePlanRuleByPlanId } from "@/hooks/usePlanRules";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Check, X, MessageCircle, Star } from "lucide-react";

interface Props { business: BusinessWithCategory; }

const WHATSAPP_PLANS: Record<string, string> = {
  "basico": "https://api.whatsapp.com/send/?phone=351210203862&text=Ol%C3%A1%2C+estou+interessado+no+plano+basico+negocio+1+mes.&type=phone_number&app_absent=0",
  "oferta 2 meses": "https://api.whatsapp.com/send/?phone=351210203862&text=Ol%C3%A1%2C+estou+interessado+na+oferta+comercial+negocio+2+meses.&type=phone_number&app_absent=0",
  "destaque": "https://api.whatsapp.com/send/?phone=351210203862&text=Ol%C3%A1%2C+estou+interessado+no+plano+destaque+negocio+3+meses.&type=phone_number&app_absent=0",
  "pioneiro": "https://api.whatsapp.com/send/?phone=351210203862&text=Ol%C3%A1%2C+estou+interessado+no+plano+pioneiro+negocio+3+meses.&type=phone_number&app_absent=0",
  "oferta 5 meses": "https://api.whatsapp.com/send/?phone=351210203862&text=Ol%C3%A1%2C+estou+interessado+na+oferta+comercial+negocio+5+meses.&type=phone_number&app_absent=0",
  "premium": "https://api.whatsapp.com/send/?phone=351210203862&text=Ol%C3%A1%2C+estou+interessado+no+plano+premium+negocio+6+meses.&type=phone_number&app_absent=0",
  "super premium": "https://api.whatsapp.com/send/?phone=351210203862&text=Ol%C3%A1%2C+estou+interessado+no+plano+super+premium+negocio+12+meses.&type=phone_number&app_absent=0",
};

function getWhatsAppLink(planName: string): string {
  const normalized = planName.toLowerCase().trim();
  // Try exact match first
  if (WHATSAPP_PLANS[normalized]) return WHATSAPP_PLANS[normalized];
  // Try partial match
  for (const [key, url] of Object.entries(WHATSAPP_PLANS)) {
    if (normalized.includes(key) || key.includes(normalized)) return url;
  }
  // Fallback generic
  return `https://api.whatsapp.com/send/?phone=351210203862&text=Ol%C3%A1%2C+estou+interessado+no+plano+${encodeURIComponent(planName)}.&type=phone_number&app_absent=0`;
}

function isSuperPremium(name: string): boolean {
  return name.toLowerCase().includes("super premium");
}

const BusinessPlanContent = ({ business }: Props) => {
  const { data: plans = [] } = useCommercialPlans(true);
  const { data: rules } = usePlanRuleByPlanId(business.plan_id);
  const currentPlan = plans.find((p) => p.id === business.plan_id);
  const currentPrice = currentPlan?.price ?? 0;

  const ruleItems = rules ? [
    { label: "Vídeo", allowed: rules.allow_video },
    { label: "Destaque Categoria", allowed: rules.allow_category_highlight },
    { label: "Super Destaque", allowed: rules.allow_super_highlight },
    { label: "Bloco Premium", allowed: rules.allow_premium_block },
  ] : [];

  const businessPlans = plans.filter((p) => p.plan_type === "business");
  const upgradePlans = businessPlans.filter((p) => p.id !== business.plan_id && (p.price ?? 0) > currentPrice);

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

      {/* Upgrade Plans */}
      <div className="bg-card rounded-xl p-6 shadow-card">
        <h2 className="text-lg font-semibold mb-4">
          {currentPrice > 0 ? "Fazer Upgrade" : "Planos Disponíveis"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(currentPrice > 0 ? upgradePlans : businessPlans).map((plan) => {
            const isSuper = isSuperPremium(plan.name);
            const isCurrent = plan.id === business.plan_id;
            return (
              <div
                key={plan.id}
                className={`relative border rounded-xl p-5 transition-all ${
                  isCurrent
                    ? "border-primary bg-primary/5"
                    : isSuper
                    ? "border-primary/50 bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/30"
                }`}
              >
                {isSuper && (
                  <Badge className="absolute -top-2 right-3 bg-primary text-primary-foreground text-xs">
                    <Star className="h-3 w-3 mr-1" /> Mais Popular
                  </Badge>
                )}
                <h3 className="font-bold text-lg">{plan.name}</h3>
                <p className="text-3xl font-bold text-primary mt-1">{plan.price}€</p>
                <p className="text-sm text-muted-foreground">{plan.duration_months} meses</p>
                {plan.description && <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>}
                {isCurrent ? (
                  <Badge className="mt-4">Plano Atual</Badge>
                ) : (
                  <Button
                    className="mt-4 w-full gap-2"
                    variant={isSuper ? "default" : "outline"}
                    asChild
                  >
                    <a
                      href={getWhatsAppLink(plan.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {currentPrice > 0 ? "Fazer Upgrade" : "Aderir via WhatsApp"}
                    </a>
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BusinessPlanContent;
