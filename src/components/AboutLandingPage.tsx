import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Phone,
  MapPin,
  Zap,
  Trophy,
  Shield,
  Search,
  ClipboardList,
  Star,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  XCircle,
} from "lucide-react";

/* ═══════════════════════════════════════════
   STATIC DATA
   ═══════════════════════════════════════════ */

const PAIN_POINTS = [
  "🔒 Contactos escondidos atrás de formulários intermináveis",
  "🧱 Intermediários desnecessários a dificultar o contacto direto",
  "📢 PopUps publicitários a cada 5 segundos",
  "⏳ Decisões difíceis quando o tempo é curto",
];

interface Belief {
  emoji: string;
  title: string;
  description: string;
}

const BELIEFS: Belief[] = [
  {
    emoji: "📞",
    title: "O contacto direto é essencial",
    description:
      "Sem barreiras entre quem precisa e quem resolve. O cliente fala directamente com o negócio — sem intermediários, sem comissões.",
  },
  {
    emoji: "📍",
    title: "A proximidade faz a diferença",
    description:
      "O negócio certo, perto de si, quando precisa. A distância geográfica importa na vida real — e a nossa plataforma foi construída com isso em mente.",
  },
  {
    emoji: "⚡",
    title: "Rapidez vale mais do que excesso de opções",
    description:
      "Sem burocracias. Sem comissões escondidas. Sem perder tempo. Quando o tempo conta, a clareza é a melhor funcionalidade.",
  },
  {
    emoji: "🏆",
    title: "O mérito deve ser visível",
    description:
      "Os negócios que respondem bem, têm boas avaliações e perfis completos merecem aparecer primeiro. O nosso ranking é calculado por mérito — não por quem paga mais.",
  },
  {
    emoji: "🛡️",
    title: "Transparência não é opcional",
    description:
      "Avaliações moderadas, identidade real dos avaliadores, algoritmo de ranking claro. Construímos confiança com regras que toda a gente pode ver.",
  },
];

const MISSION_CONTEXTS = [
  {
    emoji: "🏠",
    title: "No dia a dia",
    description: "Quando alguém procura um restaurante, um serviço ou um profissional local.",
  },
  {
    emoji: "🚨",
    title: "Em situações urgentes",
    description: "Quando encontrar quem resolve é prioritário e o tempo não espera.",
  },
  {
    emoji: "🏥",
    title: "Em momentos sensíveis",
    description: "Quando serviços essenciais fazem verdadeiramente a diferença.",
  },
];

const STATS = [
  { value: "2 300+", label: "Negócios indexados" },
  { value: "190", label: "Cidades cobertas" },
  { value: "127", label: "Funcionalidades construídas" },
  { value: "18", label: "Edge Functions activas" },
];

const HOW_IT_WORKS = [
  {
    emoji: "🔍",
    title: "Pesquisa inteligente em 4 camadas",
    description:
      "O motor de pesquisa reconhece padrões, sinónimos, urgência e negócios directamente — sem precisar da palavra exacta.",
  },
  {
    emoji: "📋",
    title: "Pedidos de orçamento com matching automático",
    description:
      "O consumidor descreve o que precisa — a plataforma notifica os negócios certos na sua zona automaticamente.",
  },
  {
    emoji: "⭐",
    title: "Avaliações verificadas com moderação",
    description:
      "As avaliações têm identidade real, moderação automática para ≥3★ e revisão humana para ≤2★. Os negócios podem responder publicamente.",
  },
  {
    emoji: "📊",
    title: "Analytics e Intelligence para os negócios",
    description:
      "Cada negócio tem acesso a dados reais — visitas, canais de contacto, benchmarking vs. concorrência e relatório semanal.",
  },
  {
    emoji: "🏆",
    title: "Ranking por mérito, não por pagamento",
    description:
      "A posição de cada negócio é calculada com base em completude do perfil (25%), avaliações (30%), tempo de resposta (20%) e engagement (25%).",
  },
];

const WE_ARE = [
  "Um diretório prático focado em necessidades reais",
  "Contacto direto entre pessoas e negócios — sem intermediários",
  "Uma plataforma transparente, sem comissões escondidas",
  "Um sistema de ranking baseado em mérito e confiança",
  "Uma ferramenta com dados reais para os negócios crescerem",
];

const WE_ARE_NOT = [
  "Uma plataforma de intermediação com barreiras e formulários",
  "Um marketplace que fica com comissão das tuas vendas",
  "Uma lista infinita sem contexto nem utilidade real",
  "Uma plataforma de pay-to-win onde só vence quem paga mais",
];

const ROADMAP = [
  { done: true, text: "Notificações em tempo real já activas" },
  { done: true, text: "Gamificação para consumidores e negócios lançada" },
  { done: true, text: "Intelligence Center com benchmarking disponível" },
  { done: true, text: "Progress Engine e prova social nos pedidos implementados" },
  { done: false, text: "Página de preços pública — em breve" },
  { done: false, text: "Checklist de onboarding guiado — em breve" },
];

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */

const AboutLandingPage = () => {
  return (
    <>
      {/* ─── HERO ─── */}
      <section className="section-hero py-16 md:py-24">
        <div className="container max-w-4xl text-center space-y-6">
          <Badge variant="secondary" className="text-sm px-4 py-1.5">
            Quem Somos
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
            Uma ideia simples.
            <br className="hidden sm:block" /> <span className="text-primary">E muito prática.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Ajudar as pessoas a encontrar rapidamente quem resolve. No dia a dia, quando alguém precisa de um serviço,
            um restaurante ou um profissional local, o que mais faz falta não é escolha infinita — é a pessoa certa, no
            momento certo, perto de si.
          </p>
        </div>
      </section>

      {/* ─── O PROBLEMA ─── */}
      <section className="py-16 bg-secondary/30">
        <div className="container max-w-3xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">O problema que vimos</h2>
            <p className="text-muted-foreground mt-2">
              Vivemos rodeados de plataformas digitais. Mas muitas delas criam uma certa distância:
            </p>
          </div>
          <div className="space-y-3 max-w-lg mx-auto">
            {PAIN_POINTS.map((p) => (
              <div key={p} className="flex items-start gap-2 text-sm">
                <span>{p}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center space-y-2 text-sm text-muted-foreground max-w-2xl mx-auto">
            <p>
              E quando surge um imprevisto — um problema em casa, um serviço urgente, uma necessidade local? As
              plataformas atuais por vezes tornam tudo mais complicado do que devia ser.
            </p>
            <p>
              Foi a partir dessa realidade, intensificada por períodos de tempestades e situações críticas em Portugal,
              que o Pede Direto começou a ganhar forma.
            </p>
          </div>
        </div>
      </section>

      {/* ─── O QUE ACREDITAMOS ─── */}
      <section className="py-16">
        <div className="container max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">O que acreditamos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BELIEFS.map((b) => (
              <Card key={b.title} className="hover:shadow-[var(--shadow-card-hover)] transition-shadow">
                <CardContent className="p-5 flex gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-xl">
                    {b.emoji}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{b.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{b.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MISSÃO ─── */}
      <section className="py-16 bg-secondary/30">
        <div className="container max-w-4xl">
          <div className="text-center mb-10 space-y-3">
            <span className="text-4xl">🎯</span>
            <h2 className="text-2xl md:text-3xl font-bold">A nossa missão</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ligar pessoas a negócios, serviços e profissionais locais, de forma simples, transparente e orientada a
              necessidades reais.
            </p>
            <p className="text-sm text-muted-foreground">Queremos ser úteis nos momentos que realmente importam.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {MISSION_CONTEXTS.map((m) => (
              <Card key={m.title} className="hover:shadow-[var(--shadow-card-hover)] transition-shadow">
                <CardContent className="p-6 text-center space-y-3">
                  <span className="text-4xl">{m.emoji}</span>
                  <h3 className="font-semibold">{m.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{m.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="py-12 border-y border-border bg-card/50">
        <div className="container max-w-4xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold">A plataforma hoje</h2>
            <p className="text-muted-foreground mt-2">
              Começámos com uma ideia. Hoje temos uma plataforma funcional, a crescer, com infraestrutura real.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-3xl md:text-4xl font-extrabold text-primary">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMO FUNCIONA ─── */}
      <section className="py-16">
        <div className="container max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Como funciona para os consumidores?</h2>
          <div className="space-y-4">
            {HOW_IT_WORKS.map((item) => (
              <Card key={item.title} className="hover:shadow-[var(--shadow-card-hover)] transition-shadow">
                <CardContent className="p-5 flex gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-2xl">
                    {item.emoji}
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SOMOS / NÃO SOMOS ─── */}
      <section className="py-16 bg-secondary/30">
        <div className="container max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">O que somos (e não somos)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6 space-y-3">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" /> Somos
                </h3>
                <div className="space-y-2">
                  {WE_ARE.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 space-y-3">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-destructive" /> Não somos
                </h3>
                <div className="space-y-2">
                  {WE_ARE_NOT.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-sm">
                      <XCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── ROADMAP ─── */}
      <section className="py-16">
        <div className="container max-w-3xl text-center space-y-6">
          <span className="text-4xl">🏗️</span>
          <h2 className="text-2xl md:text-3xl font-bold">Sempre a melhorar</h2>
          <p className="text-muted-foreground">
            Um projeto com os pés no chão. Estamos a construir o Pede Direto passo a passo, com foco na utilidade real,
            na confiança e no comércio local.
          </p>
          <div className="max-w-md mx-auto text-left space-y-2">
            {ROADMAP.map((r) => (
              <div key={r.text} className="flex items-start gap-2 text-sm">
                {r.done ? (
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                ) : (
                  <span className="h-4 w-4 flex-shrink-0 mt-0.5 text-muted-foreground">→</span>
                )}
                <span className={r.done ? "" : "text-muted-foreground"}>{r.text}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Sem promessas vazias. Cada funcionalidade só sai quando está bem feita.
          </p>
        </div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section className="py-20 bg-primary/5">
        <div className="container max-w-3xl text-center space-y-6">
          <span className="text-5xl">💚</span>
          <h2 className="text-2xl md:text-3xl font-bold">Porque existimos</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Porque acreditamos que quem resolve problemas reais deve ser fácil de encontrar.
          </p>
          <p className="text-sm text-muted-foreground">
            Num mundo cada vez mais complexo, encontrar ajuda não devia ser tão complicado.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <Link to="/registar/consumidor">
              <Button
                size="lg"
                className="text-base px-8 bg-[hsl(var(--cta))] hover:bg-[hsl(var(--cta-hover))] text-[hsl(var(--cta-foreground))] shadow-[var(--shadow-cta)]"
              >
                Criar conta gratuita <ArrowRight className="ml-1 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/claim-business">
              <Button variant="outline" size="lg" className="text-base px-8">
                Registar o meu negócio
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default AboutLandingPage;
