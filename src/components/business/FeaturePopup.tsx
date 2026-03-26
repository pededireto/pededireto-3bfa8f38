import { useState, useEffect, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export interface FeatureStep {
  icon: ReactNode;
  text: string;
}

export interface FeaturePopupProps {
  id: string;
  trigger?: "onload" | "manual";
  title: string;
  subtitle: string;
  accentColor: string; // tailwind bg class e.g. "bg-primary", "bg-cta"
  icon: ReactNode;
  steps: FeatureStep[];
  tip?: string;
  ctaLabel: string;
  ctaHref?: string;
  ctaAction?: () => void;
  secondaryLabel?: string;
  secondaryHref?: string;
  forceOpen?: boolean;
  onClose?: () => void;
}

const STORAGE_PREFIX = "popup_seen_";

const FeaturePopup = ({
  id,
  trigger = "onload",
  title,
  subtitle,
  accentColor,
  icon,
  steps,
  tip,
  ctaLabel,
  ctaHref,
  ctaAction,
  secondaryLabel,
  secondaryHref,
  forceOpen,
  onClose,
}: FeaturePopupProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
      return;
    }
    if (trigger === "onload") {
      const seen = localStorage.getItem(`${STORAGE_PREFIX}${id}`);
      if (!seen) {
        // Delay to not interrupt page load
        const timer = setTimeout(() => setOpen(true), 800);
        return () => clearTimeout(timer);
      }
    }
  }, [id, trigger, forceOpen]);

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem(`${STORAGE_PREFIX}${id}`, "true");
    onClose?.();
  };

  const handleCta = () => {
    if (ctaAction) ctaAction();
    else if (ctaHref) window.location.href = ctaHref;
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 gap-0">
        {/* Colored header */}
        <div className={`${accentColor} px-6 pt-8 pb-6 text-white relative`}>
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl">
              {icon}
            </div>
          </div>
          <h2 className="text-xl font-bold text-center">{title}</h2>
          <p className="text-sm text-white/80 text-center mt-1">{subtitle}</p>
        </div>

        {/* Steps */}
        <div className="px-6 py-5 space-y-3">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
            >
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-lg shrink-0">
                {step.icon}
              </div>
              <span className="text-sm text-foreground">{step.text}</span>
            </div>
          ))}

          {tip && (
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 p-3 mt-2">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <span className="font-medium">💡 Dica:</span> {tip}
              </p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="px-6 pb-6 space-y-2">
          <Button
            className={`w-full ${accentColor} hover:opacity-90 text-white`}
            onClick={handleCta}
          >
            {ctaLabel}
          </Button>
          {secondaryLabel && (
            <button
              onClick={() => {
                if (secondaryHref) window.location.href = secondaryHref;
                handleClose();
              }}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeaturePopup;

/* ── Pre-configured popups ───────────────────────────────── */

export const BUSINESS_POPUPS = [
  {
    id: "feature_indicacoes",
    title: "Ganha com as tuas Indicações",
    subtitle: "Indica parceiros e clientes, acumula pontos!",
    accentColor: "bg-primary",
    icon: "🎁",
    steps: [
      { icon: "🔗", text: "Partilha o teu link de indicação único" },
      { icon: "👥", text: "Ganha pontos por cada negócio que se subscreve" },
      { icon: "⭐", text: "Ganha pontos por pedidos de clientes que indicaste" },
      { icon: "🎁", text: "Acumula pontos e desbloqueia 1 mês grátis!" },
    ],
    tip: "Partilha em grupos de WhatsApp, redes sociais e com os teus contactos profissionais para ganhar mais rápido!",
    ctaLabel: "Aceder às Indicações →",
    ctaTab: "affiliates",
    secondaryLabel: "Saber como funciona",
  },
  {
    id: "feature_marketing_ai",
    title: "Cria conteúdo profissional com IA",
    subtitle: "Reels, posts e campanhas prontos em segundos",
    accentColor: "bg-cta",
    icon: "🤖",
    steps: [
      { icon: "🎬", text: "Gera scripts de Reels em 5 cenas prontos para gravar" },
      { icon: "🖼️", text: "Cria prompts de imagem para campanhas visuais" },
      { icon: "📱", text: "Otimizado para Instagram, TikTok e YouTube Shorts" },
      { icon: "✏️", text: "Personaliza o tom, estilo e tipo de negócio" },
    ],
    tip: "Usa o Marketing AI antes de cada promoção ou época especial — poupa horas de trabalho criativo!",
    ctaLabel: "Experimentar o Marketing AI →",
    ctaHref: "/app/reel",
    secondaryLabel: "Ver exemplos de conteúdo",
  },
  {
    id: "feature_orcamentos",
    title: "Envia Orçamentos com a tua marca",
    subtitle: "PDFs profissionais diretamente da plataforma",
    accentColor: "bg-blue-500",
    icon: "📄",
    steps: [
      { icon: "🏷️", text: "Logo, NIF e dados da empresa incluídos automaticamente" },
      { icon: "🧮", text: "IVA calculado automaticamente (23% ou personalizado)" },
      { icon: "📧", text: "Envia por email ou partilha link direto com o cliente" },
      { icon: "✅", text: "Regista orçamentos aceites e acompanha o histórico" },
    ],
    tip: "Orçamentos com marca própria transmitem mais confiança — e aumentam a taxa de conversão!",
    ctaLabel: "Criar o meu primeiro orçamento →",
    ctaTab: "quotes",
    secondaryLabel: "Ver exemplo de PDF",
  },
  {
    id: "feature_ranking",
    title: "O teu lugar é ganho, não comprado",
    subtitle: "Sobe nas pesquisas respondendo bem e depressa",
    accentColor: "bg-amber-500",
    icon: "🏆",
    steps: [
      { icon: "✅", text: "Perfil completo vale 25% do teu score de ranking" },
      { icon: "⭐", text: "Avaliações dos clientes valem 30% — cada resposta conta" },
      { icon: "⚡", text: "Tempo de resposta rápido vale 20% — responde em menos de 1h" },
      { icon: "💬", text: "Engagement com pedidos vale 25% — não ignores leads" },
    ],
    tip: "Um perfil 100% completo com foto, vídeo e horário pode subir o teu ranking em 3 a 5 posições!",
    ctaLabel: "Ver o meu score →",
    ctaTab: "insights",
    secondaryLabel: "Perceber como melhorar",
  },
];

export const CONSUMER_POPUPS = [
  {
    id: "feature_pedidos_consumidor",
    title: "Pede orçamentos em segundos",
    subtitle: "Descreve o que precisas e recebe respostas rápidas",
    accentColor: "bg-primary",
    icon: "📋",
    steps: [
      { icon: "✏️", text: "Descreve o teu problema ou serviço em poucas palavras" },
      { icon: "📍", text: "Indica a tua localização — encontramos quem está perto" },
      { icon: "🔔", text: "Os profissionais certos são notificados automaticamente" },
      { icon: "💬", text: "Responde diretamente via chat — sem intermediários" },
    ],
    tip: "Pedidos marcados como URGENTE recebem respostas mais rápidas — usa quando o tempo conta!",
    ctaLabel: "Fazer o meu primeiro pedido →",
    ctaHref: "/pedir-servico",
    secondaryLabel: "Ver exemplos de pedidos",
  },
  {
    id: "feature_avaliacoes_consumidor",
    title: "Ajuda a comunidade a escolher melhor",
    subtitle: "As tuas avaliações fazem a diferença",
    accentColor: "bg-purple-500",
    icon: "⭐",
    steps: [
      { icon: "🛡️", text: "Avaliações verificadas — só quem usou o serviço avalia" },
      { icon: "🏆", text: "Ajudas bons negócios a subir no ranking" },
      { icon: "💬", text: "Os negócios respondem publicamente — vês o diálogo" },
      { icon: "🎖️", text: "Ganha o badge 'Avaliador' com a primeira avaliação" },
    ],
    tip: "Uma avaliação honesta ajuda outros utilizadores e motiva os melhores profissionais a continuar!",
    ctaLabel: "Avaliar um negócio →",
    ctaHref: "/",
    secondaryLabel: "Como funciona a moderação",
  },
];
