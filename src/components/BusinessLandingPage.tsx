import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Phone,
  Search,
  MessageCircle,
  FileText,
  Star,
  Trophy,
  BarChart3,
  Clock,
  Users,
  Link2,
  MapPin,
  Image,
  Zap,
  ClipboardList,
  CheckCircle2,
  ArrowRight,
  Shield,
  Ban,
  DollarSign,
  TrendingUp,
  Mail,
  Download,
  Eye,
} from "lucide-react";

/* ═══════════════════════════════════════════
   STATIC DATA
   ═══════════════════════════════════════════ */

const PROBLEMS = [
  {
    emoji: "🚫",
    title: "Clientes que não te chegam",
    description:
      "As pessoas procuram online, mas sem visibilidade vão ao concorrente que aparece primeiro.",
  },
  {
    emoji: "💸",
    title: "Publicidade cara e incerta",
    description:
      "Meta Ads, Google Ads, marketplaces com comissões — ferramentas complexas e caras, que não foram feitas para o teu negócio.",
  },
  {
    emoji: "🔗",
    title: "Intermediários a reter o teu cliente",
    description:
      "Noutras plataformas, o cliente é deles — não teu. No Pede Direto, o cliente fala diretamente contigo.",
  },
];

interface Feature {
  emoji: string;
  icon: React.ElementType;
  title: string;
  description: string;
  isNew?: boolean;
}

const PROFILE_FEATURES: Feature[] = [
  {
    emoji: "📲",
    icon: Phone,
    title: "Contacto direto. Sem intermediários. Sem comissões.",
    description:
      "Telefone, WhatsApp, email, website — o cliente contacta-te directamente. O cliente é teu. O dinheiro é todo teu.",
  },
  {
    emoji: "🔍",
    icon: Search,
    title: "Visibilidade no momento certo",
    description:
      "Apareces quando as pessoas estão activamente à procura do que ofereces — não a interromper o scroll, mas a responder a uma necessidade real.",
  },
  {
    emoji: "📍",
    icon: MapPin,
    title: "Local, regional ou nacional",
    description:
      "Define o teu raio de actuação. Serve a tua zona, a tua cidade ou todo o país — conforme o teu modelo de negócio.",
  },
  {
    emoji: "🖼️",
    icon: Image,
    title: "Perfil completo com galeria e vídeo",
    description:
      "Apresenta o teu negócio com fotos, vídeo de apresentação, horários, morada, redes sociais e descrição detalhada.",
  },
  {
    emoji: "⭐",
    icon: Star,
    title: "Avaliações verificadas e respostas públicas",
    description:
      "Recebe avaliações reais com moderação automática. Responde publicamente — cada resposta é prova de profissionalismo.",
  },
  {
    emoji: "🏆",
    icon: Trophy,
    title: "Sistema de ranking por mérito",
    description:
      "O teu lugar nas pesquisas é calculado com base em completude do perfil, avaliações, tempo de resposta e engagement — não em quem paga mais.",
    isNew: true,
  },
  {
    emoji: "🥇",
    icon: Shield,
    title: "Badges de conquista no perfil público",
    description:
      "Ganha badges automáticos por desempenho — Resposta Rápida, Top da Categoria, Perfil Completo e mais. Aparecem no teu perfil público e nas listagens.",
    isNew: true,
  },
  {
    emoji: "🔗",
    icon: Link2,
    title: "URL curta e partilha viral do Top 10",
    description:
      "O teu perfil tem URL própria. Se entrares no Top 10 da tua categoria, recebes um card de partilha pronto para WhatsApp e redes sociais.",
  },
  {
    emoji: "👥",
    icon: Users,
    title: "Gestão de equipa",
    description:
      "Adiciona membros à tua conta com roles diferenciados (owner, manager, staff). Cada um acede apenas ao que precisa.",
  },
];

const QUOTE_FEATURES: Feature[] = [
  {
    emoji: "📋",
    icon: ClipboardList,
    title: "Matching automático com clientes",
    description:
      "Quando um consumidor submete um pedido na tua categoria e zona, és notificado automaticamente. Respondes directamente pelo chat.",
  },
  {
    emoji: "💬",
    icon: MessageCircle,
    title: "Chat directo com o cliente",
    description:
      "Comunicação centralizada na plataforma — sem perder mensagens entre apps. O cliente vê o estado do pedido em tempo real.",
    isNew: true,
  },
  {
    emoji: "⚡",
    icon: Zap,
    title: "Tempo de resposta visível no perfil",
    description:
      'O teu perfil mostra "⚡ Responde em média em X minutos" — calculado automaticamente. Negócios que respondem mais rápido recebem mais pedidos.',
    isNew: true,
  },
];

const ANALYTICS_FEATURES: Feature[] = [
  {
    emoji: "📊",
    icon: BarChart3,
    title: "Analytics PRO — dados reais do teu perfil",
    description:
      "Visualizações totais, este mês e hoje. Cliques por canal. Taxa de conversão. Hora de pico e dia mais activo. Tudo num painel exclusivo PRO.",
  },
  {
    emoji: "🔬",
    icon: TrendingUp,
    title: "Intelligence Center — benchmarking",
    description:
      "Compara o teu desempenho com a média da tua categoria. Percebe onde estás acima ou abaixo da concorrência.",
    isNew: true,
  },
  {
    emoji: "📥",
    icon: Download,
    title: "Exportação CSV dos dados",
    description:
      "Exporta os teus dados de analytics para Excel ou Google Sheets com um clique. Disponível nos planos PRO.",
    isNew: true,
  },
  {
    emoji: "📧",
    icon: Mail,
    title: "Relatório semanal por email",
    description:
      "Todas as segundas-feiras recebes um resumo com o teu ranking, visitas da semana e comparação com a semana anterior.",
  },
];

const STATS = [
  { value: "36%+", label: "CTR médio nos perfis em destaque" },
  { value: "3×", label: "mais contactos para negócios com plano pago" },
  { value: "0€", label: "de comissões sobre as tuas vendas — sempre" },
];

const STEPS = [
  {
    icon: FileText,
    title: "Reclama o teu perfil",
    description:
      "O teu negócio pode já estar listado. Reclama-o gratuitamente — o perfil fica activo imediatamente.",
  },
  {
    icon: ClipboardList,
    title: "Preenche o perfil com o checklist guiado",
    description:
      "O dashboard guia-te passo a passo — logo, descrição, WhatsApp, fotos, horário. Cada passo aumenta o teu score.",
  },
  {
    icon: Eye,
    title: "Começas a aparecer nas pesquisas",
    description:
      "O teu perfil indexa automaticamente nas páginas de categoria e cidade. Clientes na tua zona encontram-te organicamente.",
  },
  {
    icon: Phone,
    title: "Recebes os primeiros contactos",
    description:
      "Com perfil completo e plano pago, os primeiros contactos costumam chegar nas primeiras 48 a 72 horas.",
  },
];

const PLAN_FEATURES = [
  "Perfil gratuito para sempre",
  "Planos mensais e anuais disponíveis",
  "Analytics PRO nos planos pagos",
  "Intelligence Center e benchmarking",
  "Destaque na categoria (PRO)",
  "Sem comissões sobre as tuas vendas",
  "Cancela quando quiseres",
];

const FAQ = [
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. Os planos têm duração mensal ou anual e não renovam automaticamente. Sem contratos longos, sem penalizações.",
  },
  {
    q: "Há comissões sobre as minhas vendas?",
    a: "Não. Zero. O Pede Direto cobra apenas pelo plano de visibilidade. O teu negócio, o teu dinheiro.",
  },
  {
    q: "O que é o Analytics PRO?",
    a: "Painel exclusivo para clientes PRO. Mostra visitas ao perfil, horas de pico, dia mais activo, canais de contacto preferidos e comparação com a concorrência via Intelligence Center.",
  },
  {
    q: "O ranking é justo? Quem paga aparece sempre primeiro?",
    a: "O ranking base é calculado por mérito — completude do perfil, avaliações, tempo de resposta e engagement. O destaque pago é opcional e claramente identificado.",
  },
  {
    q: "Quanto tempo até receber os primeiros contactos?",
    a: "O perfil fica activo imediatamente. Com plano pago e perfil bem preenchido, os primeiros contactos costumam chegar nas primeiras 48 a 72 horas.",
  },
  {
    q: "O que são os badges e para que servem?",
    a: "São conquistas atribuídas automaticamente com base no teu desempenho — Resposta Rápida, Top da Categoria, Perfil Completo, entre outros. Aparecem no teu perfil público e nas listagens.",
  },
  {
    q: "Posso ter mais do que uma pessoa a gerir o perfil?",
    a: "Sim. Podes convidar membros de equipa com roles diferenciados (owner, manager, staff), cada um com permissões adequadas ao seu papel.",
  },
];

const TRUST_ITEMS = [
  "Registo gratuito",
  "Sem cartão de crédito",
  "Upgrade a qualquer momento",
];

/* ═══════════════════════════════════════════
   HELPER: Feature Card
   ═══════════════════════════════════════════ */

const FeatureCard = ({ f }: { f: Feature }) => (
  <Card className="relative overflow-hidden hover:shadow-[var(--shadow-card-hover)] transition-shadow">
    {f.isNew && (
      <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground text-[10px] px-2 py-0.5">
        Novo
      </Badge>
    )}
    <CardContent className="p-5 flex gap-4">
      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-xl">
        {f.emoji}
      </div>
      <div>
        <h3 className="font-semibold text-sm">{f.title}</h3>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          {f.description}
        </p>
      </div>
    </CardContent>
  </Card>
);

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */

const BusinessLandingPage = () => {
  return (
    <>
      {/* ─── HERO ─── */}
      <section className="section-hero py-16 md:py-24">
        <div className="container max-w-4xl text-center space-y-6">
          <Badge variant="secondary" className="text-sm px-4 py-1.5">
            Pede Direto Business
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
            O teu próximo cliente
            <br className="hidden sm:block" /> está à procura de ti.{" "}
            <span className="text-primary">Agora.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Todos os dias, pessoas procuram serviços e negócios locais em
            Portugal. A questão é: quando procuram o que tu ofereces,
            encontram-te a ti?
          </p>
          <div className="pt-2">
            <Link to="/registar-negocio">
              <Button
                size="lg"
                className="text-base px-8 bg-[hsl(var(--cta))] hover:bg-[hsl(var(--cta-hover))] text-[hsl(var(--cta-foreground))] shadow-[var(--shadow-cta)]"
              >
                Registar o meu negócio <ArrowRight className="ml-1 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
            {["Começa grátis", "Sem cartão de crédito", "Upgrade quando quiseres"].map(
              (t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> {t}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* ─── O PROBLEMA ─── */}
      <section className="py-16 bg-secondary/30">
        <div className="container max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">O problema</h2>
            <p className="text-lg text-muted-foreground mt-2">
              Tens um bom negócio. Mas és difícil de encontrar.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              O boca a boca já não chega. As redes sociais exigem tempo e
              orçamento constante. E o teu negócio fica invisível para quem mais
              precisa de ti.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {PROBLEMS.map((p) => (
              <Card
                key={p.title}
                className="hover:shadow-[var(--shadow-card-hover)] transition-shadow"
              >
                <CardContent className="p-6 text-center space-y-3">
                  <span className="text-4xl">{p.emoji}</span>
                  <h3 className="font-semibold">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {p.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PERFIL PROFISSIONAL ─── */}
      <section className="py-16">
        <div className="container max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">
              O teu perfil profissional
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PROFILE_FEATURES.map((f) => (
              <FeatureCard key={f.title} f={f} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── PEDIDOS DE ORÇAMENTO ─── */}
      <section className="py-16 bg-secondary/30">
        <div className="container max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">
              Recebe pedidos de orçamento
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {QUOTE_FEATURES.map((f) => (
              <FeatureCard key={f.title} f={f} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── ANALYTICS & INTELIGÊNCIA ─── */}
      <section className="py-16">
        <div className="container max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">
              Analytics e inteligência de negócio
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {ANALYTICS_FEATURES.map((f) => (
              <FeatureCard key={f.title} f={f} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="py-10 border-y border-border bg-card/50">
        <div className="container">
          <p className="text-center text-sm text-muted-foreground mb-6">
            Negócios que apostam na visibilidade ganham mais
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto text-center">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-3xl md:text-4xl font-extrabold text-primary">
                  {s.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMO FUNCIONA ─── */}
      <section className="py-16">
        <div className="container max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">
              Do registo ao primeiro cliente
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="text-center space-y-3">
                  <div className="relative mx-auto">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── PLANOS E PREÇOS ─── */}
      <section className="py-16 bg-secondary/30">
        <div className="container max-w-3xl text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold">Planos e preços</h2>
          <p className="text-muted-foreground">
            Começa grátis. Cresce quando quiseres.
          </p>
          <p className="text-sm text-muted-foreground">
            Planos pagos a partir de
          </p>
          <p className="text-4xl md:text-5xl font-extrabold text-primary">
            €9,90<span className="text-lg font-normal text-muted-foreground">/mês</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Plano gratuito sempre disponível · Sem cartão de crédito
          </p>
          <div className="max-w-md mx-auto text-left space-y-2">
            {PLAN_FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>
          <Link to="/pricing">
            <Button
              variant="outline"
              size="lg"
              className="text-base px-8 mt-4"
            >
              Ver planos e preços detalhados <ArrowRight className="ml-1 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-16">
        <div className="container max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            Perguntas frequentes
          </h2>
          <Accordion type="single" collapsible className="space-y-2">
            {FAQ.map((item, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border rounded-lg px-4 bg-card"
              >
                <AccordionTrigger className="text-left font-medium">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section className="py-20 bg-primary/5">
        <div className="container max-w-3xl text-center space-y-6">
          <span className="text-5xl">💼</span>
          <h2 className="text-2xl md:text-3xl font-bold">
            Um cliente novo já paga
            <br />o plano inteiro.
          </h2>
          <p className="text-muted-foreground">
            Regista o teu negócio hoje. Começa grátis e faz upgrade quando
            estiveres pronto. Sem riscos, sem contratos, sem comissões.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
            {TRUST_ITEMS.map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" /> {t}
              </span>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <Link to="/registar-negocio">
              <Button
                size="lg"
                className="text-base px-8 bg-[hsl(var(--cta))] hover:bg-[hsl(var(--cta-hover))] text-[hsl(var(--cta-foreground))] shadow-[var(--shadow-cta)]"
              >
                Registar o meu negócio <ArrowRight className="ml-1 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button variant="outline" size="lg" className="text-base px-8">
                Ver planos e preços
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default BusinessLandingPage;
