import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  ArrowRight,
  Bell,
  Mail,
  ExternalLink,
  Briefcase,
  Shield,
  Receipt,
  Megaphone,
  Clock,
} from "lucide-react";

const OffersPartnersLandingPage = () => {
  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="section-hero py-16 md:py-24">
        <div className="container max-w-3xl text-center">
          <Badge variant="outline" className="mb-4 text-sm">Ofertas e Parceiros</Badge>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">
            Ofertas exclusivas para a{" "}
            <span className="text-primary">comunidade Pede Direto.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Negociámos parcerias especiais para ti — descontos em ferramentas, serviços e plataformas que te ajudam a gerir melhor o teu negócio e o teu dia a dia. Todas selecionadas pela nossa equipa.
          </p>
        </div>
      </section>

      {/* ── Ofertas ativas ── */}
      <section className="py-16 bg-muted/30">
        <div className="container max-w-4xl">
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">Ofertas ativas</h2>
            <Badge className="bg-primary text-primary-foreground">1 oferta</Badge>
          </div>

          {/* Bolt Business */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b bg-card">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">🚗</span>
                  <div>
                    <h3 className="text-xl font-bold">Bolt Business</h3>
                    <p className="text-sm text-muted-foreground">Transportes profissionais</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-extrabold text-primary">25%</span>
                  <p className="text-xs text-muted-foreground font-medium">desconto</p>
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                <p className="text-muted-foreground mb-6">
                  Se tens uma empresa ou trabalhas por conta própria, a Bolt Business permite gerir todas as deslocações profissionais numa única conta — com faturação centralizada, relatórios de viagens e controlo total dos gastos.
                </p>

                <div className="bg-muted/50 rounded-xl p-5 mb-6">
                  <h4 className="font-bold mb-3">O que ganhas com esta oferta</h4>
                  <ul className="space-y-2">
                    {[
                      "25% de desconto nas primeiras 20 viagens",
                      "Faturação automática para a tua empresa",
                      "Sem pagamentos em dinheiro — tudo numa conta",
                      "Relatórios mensais de despesas de transporte",
                      "Disponível em Portugal e em toda a Europa",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <Button asChild size="lg">
                    <a href="https://get.business.bolt.eu/o7qyqr0ammelt.eu/o7qyqr0ammelt.eu/o7qyqr0ammel" target="_blank" rel="noopener noreferrer" className="gap-2">
                      Ativar oferta Bolt Business <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                  <p className="text-xs text-muted-foreground max-w-md">
                    Oferta para novas contas Bolt Business. Desconto aplicado automaticamente através deste link.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Mais ofertas a caminho ── */}
      <section className="py-16">
        <div className="container max-w-4xl">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-2xl md:text-3xl font-bold">Mais ofertas a caminho</h2>
            <Badge variant="secondary">Em breve</Badge>
          </div>
          <p className="text-muted-foreground mb-8">
            Estamos a negociar mais parcerias para a comunidade Pede Direto. Fica atento às novidades.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                emoji: "🗂️",
                icon: <Briefcase className="w-5 h-5 text-muted-foreground" />,
                title: "Ferramentas de gestão",
                desc: "Faturação, agenda, gestão de clientes",
              },
              {
                emoji: "🛡️",
                icon: <Shield className="w-5 h-5 text-muted-foreground" />,
                title: "Seguros para profissionais",
                desc: "Responsabilidade civil, acidentes, saúde",
              },
              {
                emoji: "🧾",
                icon: <Receipt className="w-5 h-5 text-muted-foreground" />,
                title: "Contabilidade simplificada",
                desc: "IRS, IVA, recibos verdes sem complicações",
              },
              {
                emoji: "📣",
                icon: <Megaphone className="w-5 h-5 text-muted-foreground" />,
                title: "Marketing digital",
                desc: "Ferramentas para crescer online sem gastar muito",
              },
            ].map((item, i) => (
              <Card key={i} className="opacity-75">
                <CardContent className="p-5 flex items-center gap-4">
                  <span className="text-3xl">{item.emoji}</span>
                  <div className="flex-1">
                    <h3 className="font-bold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    <Clock className="w-3 h-3 mr-1" /> Em breve
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section className="py-16 bg-muted/30">
        <div className="container max-w-2xl text-center">
          <span className="text-5xl mb-4 block">📬</span>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Recebe as novidades por email</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Subscreve a newsletter da Pede Direto e sê o primeiro a saber quando chegarem novas parcerias, descontos e funcionalidades. O resumo semanal chega todas as segundas-feiras.
          </p>
          <ul className="space-y-2 mb-8 text-sm text-left max-w-sm mx-auto">
            {[
              "Novas parcerias e ofertas exclusivas",
              "Funcionalidades novas da plataforma",
              "Dicas e guias para negócios locais",
              "Cancelas quando quiseres — sem complicações",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span className="text-foreground">{item}</span>
              </li>
            ))}
          </ul>
          <Button asChild size="lg">
            <a href="#newsletter" className="gap-2">
              <Mail className="w-4 h-4" /> Subscrever newsletter →
            </a>
          </Button>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="py-16">
        <div className="container max-w-2xl text-center">
          <span className="text-5xl mb-4 block">🔔</span>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Sê o primeiro a saber{" "}
            <span className="text-primary">quando novas ofertas chegarem.</span>
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Regista o teu negócio ou cria a tua conta e recebe notificação assim que tivermos novas parcerias disponíveis.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">/consumidor
              <L/consumidorink to="/registar">Criar conta gratuita →</Link>
            </Button>
            <Button asChild variant="outline" size="lgclaim-business <Link to="/registar-negocio">Registar o meu negócio →</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer link ── */}
      <section className="py-6 text-center">
        <a href="mailto:contacto@pededireto.pt" className="text-sm text-muted-foreground hover:text-primary transition-colors">
          Dúvidas sobre as parcerias? 💬 Fale connosco
        </a>
      </section>
    </div>
  );
};

export default OffersPartnersLandingPage;
