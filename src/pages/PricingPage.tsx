import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Check, Zap, Crown, Star, Shield, Sparkles, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type BillingCycle = "monthly" | "annual";

interface TierConfig {
  key: string;
  label: string;
  icon: React.ElementType;
  description: string;
  priceMonthly: string;
  priceAnnual?: string;
  highlight?: boolean;
  badge?: string;
  color: string;
  cta: string;
  inheritLabel?: string;
  features: string[];
}

const TIERS: TierConfig[] = [
  {
    key: "free",
    label: "Gratuito",
    icon: Shield,
    description: "Perfil básico para começar",
    priceMonthly: "0",
    color: "border-border",
    cta: "Começar grátis",
    features: [
      "Perfil no directório (nome, logótipo, descrição, telefone, email, site, morada, horário)",
      "Aparecer na pesquisa",
      "Dashboard Business limitado",
      "Editar dados do negócio",
      "Programa de Afiliados",
    ],
  },
  {
    key: "start",
    label: "START",
    icon: Star,
    description: "Visibilidade e contactos directos",
    priceMonthly: "9.90",
    priceAnnual: "108.90",
    color: "border-primary/50",
    cta: "Começar agora",
    inheritLabel: "Tudo o que está no Gratuito, mais:",
    features: [
      "Galeria de fotos (até 2)",
      "WhatsApp visível no perfil",
      "Facebook, Instagram e TikTok links",
      "Dashboard Analytics básico com performance na plataforma",
      "Sistema de Avaliações",
      "Receber pedidos e orçamentos com Chat directo com clientes",
    ],
  },
  {
    key: "pro",
    label: "PRO",
    icon: Zap,
    description: "Analytics avançado e destaque",
    priceMonthly: "19.90",
    priceAnnual: "218.90",
    highlight: true,
    badge: "Mais popular",
    color: "border-primary",
    cta: "Começar agora",
    inheritLabel: "Tudo o que está no START, mais:",
    features: [
      "Galeria de fotos até 6",
      "Vídeo no perfil (logótipo integrado no vídeo quando activo)",
      "Reservar Agora + Pedir Online",
      "Promoções (1 foto com promoções em vigor)",
      "Analytics PRO & Intelligence Center",
      "Destaque na subcategoria",
    ],
  },
  {
    key: "pioneiro",
    label: "PRO Pioneiro",
    icon: Crown,
    description: "Máxima visibilidade e suporte prioritário",
    priceMonthly: "99.90",
    badge: "Oferta limitada",
    color: "border-accent",
    cta: "Começar agora",
    inheritLabel: "Tudo o que está no PRO, mais:",
    features: [
      "Destaque na categoria",
      "Super destaque (homepage)",
      "Bloco premium nas listagens",
      "Suporte prioritário",
    ],
  },
];

const ADDON_FEATURES = [
  "Gerador de scripts de Reels em 5 cenas (formato Grok/CapCut)",
  "Gerador de prompts de imagem para campanhas",
  "Sequências de vídeo optimizadas para Instagram e YouTube Shorts",
  "Histórico de conteúdos gerados",
  "Selecção de negócio, tom e estilo personalizados",
  "Compatível com qualquer plano PedeDireto",
];

const PricingPage = () => {
  const [billing, setBilling] = useState<BillingCycle>("monthly");

  const getPrice = (tier: TierConfig) => {
    if (tier.key === "free") return "0";
    if (billing === "annual" && tier.priceAnnual) {
      return (parseFloat(tier.priceAnnual) / 11).toFixed(2);
    }
    return tier.priceMonthly;
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
                const price = getPrice(tier);

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
                      ) : (
                        <>
                          <div className="text-3xl font-bold text-foreground">
                            €{price}
                            <span className="text-sm font-normal text-muted-foreground">/mês</span>
                          </div>
                          {billing === "annual" && tier.priceAnnual && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Facturado €{tier.priceAnnual}/ano
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    <div className="flex-1 space-y-3 mb-6">
                      {tier.inheritLabel && (
                        <p className="text-xs font-semibold text-primary mb-2">
                          {tier.inheritLabel}
                        </p>
                      )}
                      {tier.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <a
                      href="https://pededireto.pt/claim-business"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto"
                    >
                      <Button
                        className="w-full"
                        variant={tier.highlight ? "default" : tier.key === "free" ? "default" : "outline"}
                      >
                        {tier.cta}
                      </Button>
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ADD-ON Section */}
        <section className="pb-16 px-4">
          <div className="container max-w-4xl mx-auto">
            <div className="text-center mb-8 space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Potencia o teu negócio com IA
              </h2>
              <p className="text-muted-foreground">
                Disponível como add-on para qualquer plano
              </p>
            </div>

            <div className="relative rounded-2xl border-2 border-warning/40 bg-gradient-to-br from-warning/5 via-card to-accent/5 p-8 shadow-lg ring-1 ring-warning/20">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-warning/10">
                      <Video className="h-6 w-6 text-warning" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">
                        🎬 Marketing AI Studio
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        €19.90<span className="text-xs">/mês</span>
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-foreground/80">
                    Cria conteúdo profissional para redes sociais em segundos, com IA.
                  </p>

                  <div className="space-y-2">
                    {ADDON_FEATURES.map((f) => (
                      <div key={f} className="flex items-start gap-2 text-sm">
                        <Sparkles className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3 md:min-w-[200px] md:pt-16">
                  <a
                    href="https://pededireto.pt/claim-business"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="w-full bg-warning text-warning-foreground hover:bg-warning/90">
                      Adicionar ao meu plano
                    </Button>
                  </a>
                  <a
                    href="https://api.whatsapp.com/send?phone=351210203862&text=Ol%C3%A1%2C%20gostaria%20de%20saber%20mais%20sobre%20o%20Marketing%20AI%20Studio"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="w-full">
                      Pedir demonstração
                    </Button>
                  </a>
                </div>
              </div>
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
                {
                  q: "O Marketing AI Studio funciona com o plano gratuito?",
                  a: "Sim, o add-on Marketing AI Studio é compatível com qualquer plano, incluindo o gratuito.",
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
