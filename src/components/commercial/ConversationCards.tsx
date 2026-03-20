import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CommercialBenchmarkData } from "@/hooks/useCommercialBenchmark";

interface Props {
  data: CommercialBenchmarkData;
  subcategory: string;
}

const CopyCard = ({ title, icon, label, content }: {
  title: string;
  icon: string;
  label: string;
  content: string;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="min-w-[220px] max-w-[260px] flex-shrink-0 rounded-lg border border-border bg-card p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <h4 className="text-xs font-semibold truncate">{title}</h4>
      </div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-xs leading-relaxed flex-1">"{content}"</p>
      <Button
        variant="outline"
        size="sm"
        className="w-full h-7 text-xs mt-auto"
        onClick={handleCopy}
      >
        {copied ? (
          <><Check className="h-3 w-3 mr-1 text-success" /> Copiado</>
        ) : (
          <><Copy className="h-3 w-3 mr-1" /> Copiar frase</>
        )}
      </Button>
    </div>
  );
};

const ConversationCards = ({ data, subcategory }: Props) => {
  // Generate card texts from benchmark data — no AI calls, pure string concatenation
  const cards: { title: string; icon: string; label: string; content: string }[] = [];

  // Card 1 — Opening (from tendencia_2025)
  if (data.tendencia_2025) {
    const sentences = data.tendencia_2025.split(/[.!?]+/).filter(s => s.trim().length > 5);
    const opening = sentences.slice(0, 2).join(". ").trim();
    if (opening) {
      cards.push({
        title: "Frase de Abertura",
        icon: "🗣️",
        label: "Começa assim a conversa:",
        content: opening.endsWith(".") ? opening : `${opening}.`,
      });
    }
  }

  // Card 2 — Social Proof (from benchmark_avaliacoes)
  if (data.benchmark_avaliacoes) {
    cards.push({
      title: "Prova Social",
      icon: "📊",
      label: "Quando precisares de mostrar resultados reais:",
      content: data.benchmark_avaliacoes,
    });
  }

  // Card 3 — Urgency (from tendencia_2025 tail)
  if (data.tendencia_2025) {
    const sentences = data.tendencia_2025.split(/[.!?]+/).filter(s => s.trim().length > 5);
    const trend = sentences.length > 0 ? sentences[sentences.length - 1].trim() : data.tendencia_2025.slice(0, 80);
    cards.push({
      title: "Criar Urgência",
      icon: "⚡",
      label: "Para criar sentido de urgência:",
      content: `O mercado de ${subcategory} está a mudar — ${trend}. Quem aparecer agora na Pede Direto tem vantagem sobre quem aparecer daqui a 6 meses.`,
    });
  }

  // Card 4 — Price objection (from ticket_medio)
  if (data.ticket_medio) {
    cards.push({
      title: "Objecção de Preço",
      icon: "💰",
      label: "Quando disserem que 9,90€ é caro:",
      content: `Um cliente novo neste sector vale em média ${data.ticket_medio}. A mensalidade da Pede Direto custa menos do que 10% de uma única venda. O retorno é imediato.`,
    });
  }

  if (cards.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Cartões de Conversa Rápida
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {cards.map((card, i) => (
          <CopyCard key={i} {...card} />
        ))}
      </div>
    </div>
  );
};

export default ConversationCards;
