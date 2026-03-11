import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useActiveCommissionModel } from "@/hooks/useActiveCommissionModel";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, UserPlus, Store, DollarSign, ArrowRight, TrendingUp, Shield, Zap } from "lucide-react";

const AffiliateLandingPage = () => {
  const { user } = useAuth();
  const { data: campaign } = useActiveCommissionModel();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-primary/10 via-background to-primary/5 py-16 md:py-24">
          <div className="container text-center max-w-3xl mx-auto space-y-6">
            <Badge variant="secondary" className="text-sm px-4 py-1.5">
              🤝 Programa de Afiliados
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
              Indica negócios e ganha comissões
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Regista negócios na plataforma Pede Direto e recebe comissões sempre que subscrevem um plano pago. Simples, transparente e sem limite.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              {user ? (
                <Button asChild size="lg" className="text-base gap-2">
                  <Link to="/dashboard">
                    <ArrowRight className="h-5 w-5" />
                    Aceder ao Portal de Afiliados
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="text-base gap-2">
                    <Link to="/registar/consumidor">
                      <UserPlus className="h-5 w-5" />
                      Criar Conta
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="text-base gap-2">
                    <Link to="/register/business">
                      <Store className="h-5 w-5" />
                      Registar Negócio
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Campaign Banner */}
        <section className="container -mt-8 relative z-10 max-w-3xl mx-auto">
          {campaign ? (
            <Card className="bg-primary text-primary-foreground border-0 shadow-lg">
              <CardContent className="py-6 px-8">
                <div className="flex items-start gap-4">
                  <div className="bg-primary-foreground/20 rounded-full p-3 flex-shrink-0">
                    <Megaphone className="h-6 w-6" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="font-bold text-lg">🎯 Campanha Activa: {campaign.name}</h3>
                    <div className="flex flex-wrap gap-4 text-sm opacity-90">
                      <span>💰 One-shot: <strong>{(Number(campaign.rate) * 100).toFixed(0)}%</strong></span>
                      <span>🔄 Renovação: <strong>{(Number(campaign.renewal_rate) * 100).toFixed(0)}%</strong></span>
                      {campaign.valid_from && (
                        <span>📅 {new Date(campaign.valid_from).toLocaleDateString("pt-PT")} — {campaign.valid_until ? new Date(campaign.valid_until).toLocaleDateString("pt-PT") : "sem fim"}</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-muted border-border">
              <CardContent className="py-6 px-8">
                <div className="flex items-center gap-3">
                  <Megaphone className="h-5 w-5 text-muted-foreground" />
                  <p className="text-muted-foreground">Nenhuma campanha activa de momento. Contacta o administrador.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* How it works */}
        <section className="container py-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">Como funciona?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: UserPlus, title: "1. Regista-te", desc: "Cria a tua conta na plataforma e acede ao Portal de Afiliados." },
              { icon: Store, title: "2. Indica negócios", desc: "Regista leads com a Ficha de Cliente completa. Nós tratamos do resto." },
              { icon: DollarSign, title: "3. Ganha comissões", desc: "Recebe comissões automáticas quando o negócio subscreve um plano pago." },
            ].map((step) => (
              <Card key={step.title} className="text-center">
                <CardContent className="pt-8 pb-6 px-6 space-y-3">
                  <div className="bg-primary/10 rounded-full w-14 h-14 flex items-center justify-center mx-auto">
                    <step.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="bg-muted/30 py-16">
          <div className="container max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-10">Porquê ser afiliado?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { icon: TrendingUp, title: "Comissões recorrentes", desc: "Ganha não só na primeira subscrição, mas também nas renovações." },
                { icon: Shield, title: "Anti-duplicação", desc: "O sistema protege as tuas leads — ninguém pode registar o mesmo negócio." },
                { icon: Zap, title: "Automático", desc: "Comissões calculadas automaticamente quando o negócio ativa o plano." },
                { icon: DollarSign, title: "Pagamento flexível", desc: "Escolhe entre transferência bancária ou créditos na plataforma." },
              ].map((b) => (
                <div key={b.title} className="flex items-start gap-4 bg-card rounded-xl p-5 shadow-sm">
                  <div className="bg-primary/10 rounded-lg p-2.5 flex-shrink-0">
                    <b.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{b.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container py-16 text-center max-w-xl mx-auto space-y-4">
          <h2 className="text-2xl font-bold">Pronto para começar?</h2>
          <p className="text-muted-foreground">Junta-te ao programa de afiliados e começa a ganhar comissões hoje.</p>
          {user ? (
            <Button asChild size="lg" className="text-base">
              <Link to="/dashboard">Ir para o Portal de Afiliados</Link>
            </Button>
          ) : (
            <Button asChild size="lg" className="text-base">
              <Link to="/registar/consumidor">Criar conta gratuita</Link>
            </Button>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AffiliateLandingPage;
