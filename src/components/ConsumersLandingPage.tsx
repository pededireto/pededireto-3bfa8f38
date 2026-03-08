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
  Heart,
  Search,
  MessageCircle,
  FileText,
  Star,
  Bell,
  BarChart3,
  Clock,
  Users,
  Trophy,
  Mail,
  History,
  Image,
  Settings,
  CheckCircle2,
  ArrowRight,
  Shield,
  Zap,
  Gift,
  Rocket,
  ClipboardList,
} from "lucide-react";

/* ═══════════════════════════════════════════
   STATIC DATA
   ═══════════════════════════════════════════ */

const STATS = [
  { value: "2 300+", label: "Negócios listados" },
  { value: "190", label: "Cidades cobertas" },
  { value: "15+", label: "Categorias" },
];

const CATEGORIES = [
  "🍽️ Restaurantes",
  "🔧 Canalizadores",
  "⚡ Electricistas",
  "📚 Explicadores",
  "📷 Fotógrafos",
  "🏠 Reparações",
  "🌿 Jardinagem",
  "💇 Cabeleireiros",
  "🏋️ Personal Trainers",
  "🚚 Transportes",
];

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  isNew?: boolean;
}

const FEATURES: Feature[] = [
  { icon: Heart, title: "Favoritos", description: "Guarda os negócios que adoras e volta a encontrá-los em segundos." },
  { icon: Search, title: "Histórico de pesquisas", description: "Acedes rapidamente ao que já pesquisaste antes. Menos cliques, mais comodidade." },
  { icon: MessageCircle, title: "Contacto direto", description: "Contacta negócios directamente — sem sair da app, sem partilhar o teu número." },
  { icon: FileText, title: "Pedidos de orçamento", description: "Descreve o que precisas, envia para vários negócios de uma vez e compara as respostas." },
  { icon: Star, title: "Avaliações verificadas", description: "Deixa a tua opinião e ajuda outros utilizadores a escolher com confiança." },
  { icon: Bell, title: "Notificações em tempo real", description: "Recebe notificações instantâneas quando um negócio aceita, envia mensagem ou responde.", isNew: true },
  { icon: BarChart3, title: "Dashboard pessoal com insights", description: "Acompanha pedidos, respostas, avaliações e favoritos com gráficos semanais.", isNew: true },
  { icon: Clock, title: "Acompanhamento do pedido", description: "Vê em que fase está o teu pedido: enviado → notificados → respostas → concluído.", isNew: true },
  { icon: Users, title: "Prova social em tempo real", description: "Vê quantos profissionais foram notificados e quantos já responderam ao teu pedido.", isNew: true },
  { icon: Trophy, title: "Gamificação e badges", description: "Conquista badges — Primeiro Pedido, Avaliador, Explorador e mais. Vê o progresso no dashboard.", isNew: true },
  { icon: Mail, title: "Resumo semanal por email", description: "Todas as segundas recebe um email com o resumo — pedidos, badges, favoritos e dicas.", isNew: true },
  { icon: History, title: "Timeline de actividade", description: "Consulta o histórico completo num único fio cronológico — pedidos, respostas, avaliações.", isNew: true },
  { icon: Image, title: "Perfil com foto", description: "Personaliza o teu perfil com uma foto. Os negócios reconhecem-te mais facilmente.", isNew: true },
  { icon: Settings, title: "Preferências de notificação", description: "Escolhe o que queres receber — cada tipo de notificação tem o seu toggle independente.", isNew: true },
];

const STEPS = [
  { icon: Search, title: "Pesquisa o que precisas", description: "Escreve \"canalizador urgente Lisboa\" ou \"restaurante italiano Braga\" — o sistema percebe o que queres." },
  { icon: ClipboardList, title: "Envia o pedido", description: "Descreve o teu problema. O sistema notifica automaticamente os profissionais certos na tua zona." },
  { icon: MessageCircle, title: "Recebe respostas", description: "Os profissionais respondem directamente. Vês em tempo real quantos viram e responderam." },
  { icon: CheckCircle2, title: "Escolhe e resolve", description: "Compara, escolhe o melhor, fala por WhatsApp ou telefone. Sem intermediários, sem comissões." },
];

const WHY_NOW = [
  { icon: Gift, emoji: "🎁", title: "Gratuito para sempre.", description: "A conta de consumidor não tem custos — nunca. Sem cartão de crédito." },
  { icon: Zap, emoji: "⚡", title: "Pronto em 30 segundos.", description: "Registo rápido, sem complicações. Sem formulários intermináveis." },
  { icon: Rocket, emoji: "🚀", title: "Novidades todos os meses.", description: "Notificações, badges, insights e resumo semanal — acesso imediato a cada novidade." },
  { icon: Shield, emoji: "🛡️", title: "Privacidade garantida.", description: "Não partilhamos os teus dados com terceiros nem os usamos para publicidade." },
];

const FAQ = [
  { q: "É mesmo grátis?", a: "Sim, sempre. A conta de consumidor no Pede Direto é e será sempre gratuita. Não pedimos cartão de crédito nem dados de pagamento." },
  { q: "Os meus dados estão seguros?", a: "Sim. Não partilhamos os teus dados com terceiros nem os usamos para publicidade. A tua privacidade é a nossa responsabilidade." },
  { q: "Já posso contactar negócios sem conta?", a: "Sim — podes pesquisar e ver contactos livremente. A conta dá-te acesso a favoritos, histórico, notificações, dashboard e todas as funcionalidades." },
  { q: "Posso desactivar os emails?", a: "Sim. Nas preferências de notificação do teu perfil podes controlar exactamente o que recebes — cada tipo tem o seu toggle independente." },
  { q: "O que são os badges?", a: "São conquistas que ganhas ao usar a plataforma — por exemplo \"Primeiro Pedido\", \"Avaliador\" ou \"Explorador\". São atribuídos automaticamente." },
];

const TRUST_ITEMS = ["Grátis", "Sem cartão", "Cancela quando quiseres", "Acesso a todas as novidades"];

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */

const ConsumersLandingPage = () => {
  return (
    <>
      {/* ─── HERO ─── */}
      <section className="section-hero py-16 md:py-24">
        <div className="container max-w-4xl text-center space-y-6">
          <Badge variant="secondary" className="text-sm px-4 py-1.5">
            Para Consumidores
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
            Encontra quem resolve<br className="hidden sm:block" /> o teu problema.{" "}
            <span className="text-primary">Agora.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Restaurantes, canalizadores, electricistas, explicadores, fotógrafos — tudo o que precisas, perto de ti, com contacto direto. Sem formulários. Sem esperas.
          </p>
          <div className="pt-2">
            <Link to="/registar">
              <Button size="lg" className="text-base px-8 bg-[hsl(var(--cta))] hover:bg-[hsl(var(--cta-hover))] text-[hsl(var(--cta-foreground))] shadow-[var(--shadow-cta)]">
                Criar conta gratuita <ArrowRight className="ml-1 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
            {["Grátis para sempre", "Sem cartão de crédito", "Pronto em 30 segundos"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="py-8 border-y border-border bg-card/50">
        <div className="container">
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto text-center">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-3xl md:text-4xl font-extrabold text-primary">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CATEGORIAS ─── */}
      <section className="py-16">
        <div className="container max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Exemplos do que podes encontrar
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {CATEGORIES.map((c) => (
              <Badge key={c} variant="outline" className="text-sm px-4 py-2 bg-card hover:bg-secondary transition-colors cursor-default">
                {c}
              </Badge>
            ))}
            <Badge variant="outline" className="text-sm px-4 py-2 bg-primary/10 text-primary border-primary/30">
              + muito mais →
            </Badge>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="py-16 bg-secondary/30">
        <div className="container max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">A tua conta gratuita</h2>
            <p className="text-lg text-muted-foreground mt-2">A tua vida fica mais fácil.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Pesquisar é grátis e aberto a todos. Com conta, tens muito mais — e continua completamente gratuito.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <Card key={f.title} className="relative overflow-hidden hover:shadow-[var(--shadow-card-hover)] transition-shadow">
                  {f.isNew && (
                    <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground text-[10px] px-2 py-0.5">
                      Novo
                    </Badge>
                  )}
                  <CardContent className="p-5 flex gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{f.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{f.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── COMO FUNCIONA ─── */}
      <section className="py-16">
        <div className="container max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">Como funciona</h2>
            <p className="text-lg text-muted-foreground mt-2">Simples como deve ser.</p>
            <p className="text-sm text-muted-foreground">Do problema à solução em menos de 2 minutos.</p>
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
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── PORQUÊ CRIAR CONTA ─── */}
      <section className="py-16 bg-secondary/30">
        <div className="container max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            Porquê criar conta agora?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {WHY_NOW.map((item) => (
              <Card key={item.title} className="hover:shadow-[var(--shadow-card-hover)] transition-shadow">
                <CardContent className="p-6 flex gap-4 items-start">
                  <span className="text-3xl flex-shrink-0">{item.emoji}</span>
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

      {/* ─── FAQ ─── */}
      <section className="py-16">
        <div className="container max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            Perguntas frequentes
          </h2>
          <Accordion type="single" collapsible className="space-y-2">
            {FAQ.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-left font-medium">{item.q}</AccordionTrigger>
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
          <span className="text-5xl">🙌</span>
          <h2 className="text-2xl md:text-3xl font-bold">
            Junta-te a quem já descobriu<br />a forma mais simples.
          </h2>
          <p className="text-muted-foreground">
            Encontrar o que precisas, perto de ti, de forma rápida e gratuita.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
            {TRUST_ITEMS.map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" /> {t}
              </span>
            ))}
          </div>
          <Link to="/registar">
            <Button size="lg" className="text-base px-8 bg-[hsl(var(--cta))] hover:bg-[hsl(var(--cta-hover))] text-[hsl(var(--cta-foreground))] shadow-[var(--shadow-cta)]">
              Criar a minha conta gratuita <ArrowRight className="ml-1 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
};

export default ConsumersLandingPage;
