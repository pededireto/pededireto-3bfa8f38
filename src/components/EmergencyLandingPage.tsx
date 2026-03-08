import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  AlertTriangle,
  Zap,
  Search,
  Wrench,
  Heart,
  Truck,
  CheckCircle2,
  ArrowRight,
  Shield,
  Clock,
  Wifi,
  Smartphone,
  Bell,
  MessageSquare,
  Construction,
  Info,
  Building2,
} from "lucide-react";

const EmergencyLandingPage = () => {
  return (
    <div className="min-h-screen">
      {/* ── Emergency Banner ── */}
      <section className="bg-destructive/10 border-b-2 border-destructive/30 py-6">
        <div className="container max-w-4xl">
          <div className="flex flex-col items-center text-center gap-4">
            <span className="text-4xl">🚨</span>
            <div>
              <h2 className="text-xl font-bold text-destructive mb-2">
                Risco imediato? Liga já para o 112
              </h2>
              <p className="text-muted-foreground text-sm max-w-xl mx-auto">
                O Pede Direto não substitui os serviços oficiais de emergência. Em situações de perigo, contacta sempre as autoridades.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              <a href="tel:112" className="inline-flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-full font-semibold text-sm hover:opacity-90 transition-opacity">
                <Phone className="w-4 h-4" /> 112 — Emergências
              </a>
              <span className="inline-flex items-center gap-2 bg-muted text-muted-foreground px-4 py-2 rounded-full text-sm font-medium">
                🚒 Bombeiros locais
              </span>
              <span className="inline-flex items-center gap-2 bg-muted text-muted-foreground px-4 py-2 rounded-full text-sm font-medium">
                🚓 PSP / GNR
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Hero ── */}
      <section className="section-hero py-16 md:py-24">
        <div className="container max-w-3xl text-center">
          <span className="text-5xl mb-6 block">🚨</span>
          <Badge variant="outline" className="mb-4 text-sm">Emergências</Badge>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">
            Quando o tempo é curto,{" "}
            <span className="text-primary">encontrar ajuda é urgente.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            O Pede Direto existe para ajudar a encontrar rapidamente quem resolve — especialmente quando o problema não pode esperar. Saber quem contactar faz toda a diferença.
          </p>
        </div>
      </section>

      {/* ── Quando usar ── */}
      <section className="py-16 bg-muted/30">
        <div className="container max-w-3xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">⚠️ Quando usar esta área</h2>
            <p className="text-muted-foreground">
              Esta secção está preparada para momentos em que é preciso agir rápido:
            </p>
          </div>
          <div className="space-y-3 max-w-lg mx-auto">
            {[
              { icon: "🌧️", text: "Danos causados por tempestades ou inundações" },
              { icon: "⚡", text: "Cortes de eletricidade ou falhas de energia" },
              { icon: "🚰", text: "Ruturas de água, fugas ou entupimentos" },
              { icon: "🏥", text: "Necessidade de cuidados de saúde próximos" },
              { icon: "🚚", text: "Situações urgentes de transporte ou apoio logístico" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-card rounded-xl p-4 shadow-sm">
                <span className="text-xl">{item.icon}</span>
                <span className="text-foreground font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Como pedir ajuda ── */}
      <section className="py-16">
        <div className="container max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Como pedir ajuda agora</h2>

          {/* CTA urgente */}
          <Card className="mb-12 border-destructive/30 bg-destructive/5">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-destructive" />
                <h3 className="text-xl font-bold">Pedido urgente — directo à plataforma</h3>
              </div>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Se precisas de um profissional agora — canalizador, electricista, assistência técnica — submete um pedido de orçamento urgente. O sistema notifica automaticamente os profissionais disponíveis na tua zona.
              </p>
              <Button asChild size="lg" className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                <Link to="/pedir-servico">Pedir ajuda urgente →</Link>
              </Button>
            </CardContent>
          </Card>

          {/* 3 Passos */}
          <div>
            <h3 className="text-xl font-bold text-center mb-8">Como funciona em 3 passos</h3>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Descreve o problema",
                  desc: 'Algumas palavras chegam — "fuga de água urgente" ou "sem electricidade". O sistema percebe e actua.',
                },
                {
                  step: "2",
                  title: "Profissionais são notificados automaticamente",
                  desc: "A plataforma notifica em tempo real os profissionais certos na tua zona. Vês quantos já viram e quantos responderam.",
                },
                {
                  step: "3",
                  title: "Contactas directamente — sem intermediários",
                  desc: "Falas directamente por telefone ou WhatsApp. Sem formulários. Sem esperas desnecessárias.",
                },
              ].map((s) => (
                <Card key={s.step} className="relative overflow-hidden">
                  <CardContent className="p-6">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg mb-4">
                      {s.step}
                    </div>
                    <h4 className="font-bold mb-2">{s.title}</h4>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Categorias de apoio urgente ── */}
      <section className="py-16 bg-muted/30">
        <div className="container max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">🔍 Categorias de apoio urgente</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Serviços essenciais com contactos diretos para ligação imediata. Sem intermediários. Sem formulários.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              {
                icon: <Wrench className="w-7 h-7 text-primary" />,
                emoji: "🔧",
                title: "Reparações urgentes",
                desc: "Canalizadores, electricistas, assistência técnica — profissionais com tempo de resposta médio visível no perfil",
              },
              {
                icon: <Heart className="w-7 h-7 text-primary" />,
                emoji: "⚕️",
                title: "Saúde",
                desc: "Farmácias, clínicas, apoio domiciliário — com horários e contacto directo",
              },
              {
                icon: <Zap className="w-7 h-7 text-primary" />,
                emoji: "⚡",
                title: "Energia e apoio técnico",
                desc: "Falhas de energia, geradores, assistência eléctrica de emergência",
              },
              {
                icon: <Truck className="w-7 h-7 text-primary" />,
                emoji: "🚚",
                title: "Transportes e logística",
                desc: "Resposta rápida, apoio em situações críticas e transporte urgente",
              },
            ].map((cat, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex gap-4">
                  <span className="text-3xl">{cat.emoji}</span>
                  <div>
                    <h3 className="font-bold text-lg mb-1">{cat.title}</h3>
                    <p className="text-sm text-muted-foreground">{cat.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Já disponível + Em preparação ── */}
      <section className="py-16">
        <div className="container max-w-4xl">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Já disponível */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-8">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-bold">Já disponível na plataforma</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Ferramentas pensadas para urgências.</p>
                <ul className="space-y-2">
                  {[
                    "Pedidos urgentes com marcação explícita de urgência",
                    "Notificação em tempo real aos profissionais da zona",
                    "Tempo de resposta médio visível em cada perfil",
                    '"X profissionais notificados, X já responderam" — em tempo real',
                    "Contacto directo por telefone e WhatsApp — sem intermediários",
                    "PWA instalável no telemóvel — acesso rápido mesmo fora do browser",
                    "Indicador de offline — sabes sempre se tens ou não ligação",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Em preparação */}
            <Card className="border-muted bg-muted/30">
              <CardContent className="p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Construction className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-lg font-bold">Em preparação</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Acesso rápido, mesmo em situações difíceis.</p>
                <p className="text-sm text-muted-foreground mb-4">
                  O Pede Direto continua a melhorar o suporte a situações de emergência.
                </p>
                <ul className="space-y-2 mb-6">
                  {[
                    "Modo de acesso rápido a contactos essenciais offline",
                    "Listagem curada de serviços de emergência por zona",
                    "Parcerias com associações e juntas de freguesia locais",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground italic">
                  Estamos a construir isto passo a passo, com responsabilidade.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Mensagem do INEM ── */}
      <section className="py-16 bg-muted/30">
        <div className="container max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Mensagem do INEM</h2>
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-bold">🏥 Instituto Nacional de Emergência Médica</p>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-6">
                <div className="flex items-start gap-2">
                  <span className="text-lg">📋</span>
                  <p className="text-muted-foreground text-sm italic">
                    Conteúdo da mensagem do INEM a inserir aqui.
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Informação oficial disponibilizada pelo INEM em parceria com o Pede Direto.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Disclaimer ── */}
      <section className="py-12">
        <div className="container max-w-3xl">
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-8">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-destructive" />
                <h3 className="font-bold text-lg">Importante</h3>
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                O Pede Direto não substitui os serviços oficiais de emergência. Em situações de risco imediato, contacta sempre:
              </p>
              <div className="space-y-3">
                <a href="tel:112" className="flex items-center gap-3 bg-card rounded-lg p-3 hover:bg-muted transition-colors">
                  <Phone className="w-5 h-5 text-destructive" />
                  <span className="font-bold">112</span>
                  <span className="text-muted-foreground text-sm">— Número nacional de emergência</span>
                </a>
                <div className="flex items-center gap-3 bg-card rounded-lg p-3">
                  <span>🚒</span>
                  <span className="text-sm text-foreground">Bombeiros locais da tua área</span>
                </div>
                <div className="flex items-center gap-3 bg-card rounded-lg p-3">
                  <span>🚓</span>
                  <span className="text-sm text-foreground">Forças de segurança (PSP / GNR)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="py-16 bg-muted/30">
        <div className="container max-w-2xl text-center">
          <span className="text-5xl mb-4 block">💚</span>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Um projeto pensado para pessoas.
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Vivemos tempos em que imprevistos acontecem com mais frequência. O Pede Direto quer ser uma ferramenta prática de apoio, ligada à comunidade e ao comércio local. Porque encontrar ajuda não devia ser complicado — mesmo quando tudo complica.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link to="/registar">Criar conta gratuita →</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/registar-negocio">Registar o meu negócio →</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer link ── */}
      <section className="py-6 text-center">
        <a href="mailto:contacto@pededireto.pt" className="text-sm text-muted-foreground hover:text-primary transition-colors">
          Dúvidas? 💬 Fale connosco
        </a>
      </section>
    </div>
  );
};

export default EmergencyLandingPage;
