import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Check, X, Zap, Crown, Star, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useCommercialPlans } from "@/hooks/useCommercialPlans";
import { usePlanRules, PlanRule } from "@/hooks/usePlanRules";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type BillingCycle = "monthly" | "annual";

interface TierConfig {
  key: string;
  label: string;
  icon: React.ElementType;
  description: string;
  highlight?: boolean;
  badge?: string;
  color: string;
}

const TIERS: TierConfig[] = [
  {
    key: "free",
    label: "Gratuito",
    icon: Shield,
    description: "Perfil básico para começar",
    color: "border-border",
  },
  {
    key: "start",
    label: "START",
    icon: Star,
    description: "Visibilidade e contactos directos",
    color: "border-primary/50",
  },
  {
    key: "pro",
    label: "PRO",
    icon: Zap,
    description: "Analytics avançado e destaque",
    highlight: true,
    badge: "Mais popular",
    color: "border-primary",
  },
  {
    key: "pioneiro",
    label: "PRO Pioneiro",
    icon: Crown,
    description: "Máxima visibilidade e suporte prioritário",
    badge: "Oferta limitada",
    color: "border-accent",
  },
];

const FEATURES = [
  { label: "Perfil no directório", tiers: ["free", "start", "pro", "pioneiro"] },
  { label: "Aparecer na pesquisa", tiers: ["free", "start", "pro", "pioneiro"] },
  { label: "Galeria de fotos (até 1)", tiers: ["free"] },
  { label: "Galeria de fotos (até 2)", tiers: ["start"] },
  { label: "Galeria de fotos (até 6)", tiers: ["pro", "pioneiro"] },
  { label: "Receber pedidos de serviço", tiers: ["start", "pro", "pioneiro"] },
  { label: "WhatsApp & redes sociais visíveis", tiers: ["start", "pro", "pioneiro"] },
  { label: "Analytics básico", tiers: ["start", "pro", "pioneiro"] },
  { label: "Vídeo no perfil", tiers: ["pro", "pioneiro"] },
  { label: "Analytics PRO & Intelligence Center", tiers: ["pro", "pioneiro"] },
  { label: "Destaque na subcategoria", tiers: ["pro", "pioneiro"] },
  { label: "Destaque na categoria", tiers: ["pioneiro"] },
  { label: "Super destaque (homepage)", tiers: ["pioneiro"] },
  { label: "Bloco premium nas listagens", tiers: ["pioneiro"] },
  { label: "Suporte prioritário", tiers: ["pioneiro"] },
];

const PricingPage = () => {
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const { data: plans = [] } = useCommercialPlans(true);
  const { data: rules = [] } = usePlanRules();

  // Group active plans by tier
  const getPlanForTier = (tierKey: string, cycle: BillingCycle) => {
    const isAnnual = cycle === "annual";

    if (tierKey === "free") {
      return plans.find((p) => p.price === 0 && p.plan_type === "business");
    }
    if (tierKey === "start") {
      return plans.find(
        (p) =>
          p.name.toLowerCase().includes("start") &&
          p.payment_method === "sepa" &&
          (isAnnual ? p.name.toLowerCase().includes("anual") : !p.name.toLowerCase().includes("anual"))
      );
    }
    if (tierKey === "pro") {
      return plans.find(
        (p) =>
          p.name.toLowerCase().includes("pro") &&
          !p.name.toLowerCase().includes("pioneiro") &&
          p.payment_method === "sepa" &&
          (isAnnual ? p.name.toLowerCase().includes("anual") : !p.name.toLowerCase().includes("anual"))
      );
    }
    if (tierKey === "pioneiro") {
      return plans.find((p) => p.name.toLowerCase().includes("pioneiro"));
    }
    return null;
  };

  const getMonthlyEquivalent = (plan: any, tierKey: string) => {
    if (!plan) return null;
    if (tierKey === "free") return 0;
    if (billing === "annual") {
      return (plan.price / 11).toFixed(2); // 11 months = 1 free
    }
    return plan.price.toFixed(2);
  };

  return (
    <>
      <Helmet>
        <title>Preços | Pede Direto — Planos para Negócios</title>
        <meta
          name="description"
          content="Compare os planos Pede Direto para o seu negócio. Desde gratuito até PRO Pioneiro — escolha a visibilidade que precisa."
        />
      </Helmet>

      <Header />

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="py-16 md:py-24 text-center px-4">
          <div className="container max-w-4xl mx-auto space-y-6">
            <Badge variant="secondary" className="text-sm px-4 py-1">
              Planos para Negócios
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">
              Escolha o plano certo para o seu negócio
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Apareça nos resultados, receba pedidos e acompanhe as métricas do seu negócio.
              Comece grátis e evolua quando quiser.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-3 pt-4">
              <span className={`text-sm font-medium ${billing === "monthly" ? "text-foreground" : "text-muted-foreground"}`}>
                Mensal
              </span>
              <Switch
                checked={billing === "annual"}
                onCheckedChange={(v) => setBilling(v ? "annual" : "monthly")}
              />
              <span className={`text-sm font-medium ${billing === "annual" ? "text-foreground" : "text-muted-foreground"}`}>
                Anual
              </span>
              {billing === "annual" && (
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                  1 mês grátis
                </Badge>
              )}
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pb-16 px-4">
          <div className="container max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {TIERS.map((tier) => {
                const plan = getPlanForTier(tier.key, billing);
                const monthlyPrice = getMonthlyEquivalent(plan, tier.key);

                return (
                  <div
                    key={tier.key}
                    className={`relative rounded-2xl border-2 ${tier.color} bg-card p-6 flex flex-col ${
                      tier.highlight ? "shadow-lg ring-2 ring-primary/20 scale-[1.02]" : "shadow-card"
                    }`}
                  >
                    {tier.badge && (
                      <Badge
                        className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs px-3 ${
                          tier.highlight ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
                        }`}
                      >
                        {tier.badge}
                      </Badge>
                    )}

                    <div className="text-center space-y-3 mb-6">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mx-auto">
                        <tier.icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground">{tier.label}</h3>
                      <p className="text-sm text-muted-foreground">{tier.description}</p>
                    </div>

                    <div className="text-center mb-6">
                      {tier.key === "free" ? (
                        <div className="text-3xl font-bold text-foreground">€0</div>
                      ) : monthlyPrice ? (
                        <>
                          <div className="text-3xl font-bold text-foreground">
                            €{monthlyPrice}
                            <span className="text-sm font-normal text-muted-foreground">/mês</span>
                          </div>
                          {billing === "annual" && plan && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Facturado €{plan.price.toFixed(2)}/ano
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="text-xl font-semibold text-muted-foreground">Contactar</div>
                      )}
                    </div>

                    <div className="flex-1 space-y-3 mb-6">
                      {FEATURES.map((feature) => {
                        const included = feature.tiers.includes(tier.key);
                        return (
                          <div key={feature.label} className="flex items-start gap-2 text-sm">
                            {included ? (
                              <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground/40 flex-shrink-0 mt-0.5" />
                            )}
                            <span className={included ? "text-foreground" : "text-muted-foreground/50"}>
                              {feature.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <Link to={tier.key === "free" ? "/register/business" : "/claim-business"} className="mt-auto">
                      <Button
                        className={`w-full ${tier.highlight ? "" : "variant-outline"}`}
                        variant={tier.highlight ? "default" : "outline"}
                      >
                        {tier.key === "free" ? "Começar grátis" : "Começar agora"}
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ section */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-2xl font-bold text-foreground">Perguntas Frequentes</h2>
            <div className="text-left space-y-6">
              {[
                {
                  q: "Posso mudar de plano a qualquer momento?",
                  a: "Sim, pode fazer upgrade ou downgrade quando quiser. A diferença será ajustada proporcionalmente.",
                },
                {
                  q: "Qual a diferença entre SEPA e MB Way?",
                  a: "Os planos SEPA (débito directo) têm um preço mais baixo. MB Way é mais conveniente mas tem um custo ligeiramente superior.",
                },
                {
                  q: "Existe compromisso de permanência?",
                  a: "Não. Os planos mensais podem ser cancelados a qualquer momento. Os anuais beneficiam de 1 mês grátis.",
                },
                {
                  q: "Como funciona o período de verificação?",
                  a: "Após registar o seu negócio, a nossa equipa verifica os dados em 24-48h. Depois disso, o perfil fica visível publicamente.",
                },
              ].map(({ q, a }) => (
                <div key={q} className="space-y-1">
                  <h3 className="font-semibold text-foreground">{q}</h3>
                  <p className="text-sm text-muted-foreground">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
};

export default PricingPage;
