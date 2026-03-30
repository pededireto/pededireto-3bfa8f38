import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CommercialBenchmarkData } from "@/hooks/useCommercialBenchmark";

interface Props {
  data: CommercialBenchmarkData;
  subcategory: string;
}

// Extrai a primeira frase curta de um texto longo
const firstShortSentence = (text: string, maxChars = 120): string => {
  if (!text) return "";
  // Tenta primeiro até ao " — " (travessão com espaços)
  const dashIdx = text.indexOf(" — ");
  if (dashIdx > 10 && dashIdx < maxChars) return text.slice(0, dashIdx).trim();
  // Depois até ao primeiro ";"
  const semiIdx = text.indexOf(";");
  if (semiIdx > 10 && semiIdx < maxChars) return text.slice(0, semiIdx).trim();
  // Depois até ao primeiro "."
  const dotIdx = text.indexOf(".");
  if (dotIdx > 10 && dotIdx < maxChars) return text.slice(0, dotIdx).trim();
  // Fallback: truncar em maxChars
  return text.slice(0, maxChars).trim() + (text.length > maxChars ? "..." : "");
};

// Extrai apenas o primeiro valor de preço de um ticket_medio longo
// Ex: "11€ a 16€/noite por cão em canil; 12€ a 30€..." → "11€ a 16€/noite"
const extractTicketValue = (ticket: string): string => {
  if (!ticket) return "";
  // Pega texto até ao primeiro ";"
  const part = ticket.split(";")[0].trim();
  // Se ainda for longo (>70 chars), corta na primeira vírgula ou parêntese
  if (part.length > 70) {
    const commaIdx = part.indexOf(",");
    const parenIdx = part.indexOf("(");
    const candidates = [commaIdx, parenIdx].filter((i) => i > 5);
    if (candidates.length > 0) return part.slice(0, Math.min(...candidates)).trim();
    return part.slice(0, 67).trim() + "...";
  }
  return part;
};

// Extrai a primeira frase da benchmark_avaliacoes (até ao primeiro " — " ou ".")
const extractFirstAvaliacao = (text: string): string => {
  if (!text) return "";
  // Pega até ao primeiro " — " que geralmente separa nota da explicação
  const dashIdx = text.indexOf(" — ");
  if (dashIdx > 5 && dashIdx < 80) {
    // Inclui o que vem a seguir até ao próximo separador
    const after = text.slice(dashIdx + 3);
    const nextSemi = after.indexOf(";");
    if (nextSemi > 0 && nextSemi < 100) {
      return text.slice(0, dashIdx + 3 + nextSemi).trim();
    }
  }
  // Fallback: primeira frase até ao ";"
  const semiIdx = text.indexOf(";");
  if (semiIdx > 0 && semiIdx < 150) return text.slice(0, semiIdx).trim();
  return text.slice(0, 140).trim() + (text.length > 140 ? "..." : "");
};

const CopyCard = ({ title, icon, label, content }: { title: string; icon: string; label: string; content: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback silencioso
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
      <Button variant="outline" size="sm" className="w-full h-7 text-xs mt-auto" onClick={handleCopy}>
        {copied ? (
          <>
            <Check className="h-3 w-3 mr-1 text-success" /> Copiado
          </>
        ) : (
          <>
            <Copy className="h-3 w-3 mr-1" /> Copiar frase
          </>
        )}
      </Button>
    </div>
  );
};

const ConversationCards = ({ data, subcategory }: Props) => {
  const cards: {
    title: string;
    icon: string;
    label: string;
    content: string;
  }[] = [];

  // Cartão 1 — Abertura: apenas a primeira frase curta da tendencia_2025
  if (data.tendencia_2025) {
    const opening = firstShortSentence(data.tendencia_2025, 120);
    if (opening) {
      cards.push({
        title: "Frase de Abertura",
        icon: "🗣️",
        label: "Começa assim a conversa:",
        content: opening.endsWith(".") || opening.endsWith("?") ? opening : `${opening}.`,
      });
    }
  }

  // Cartão 2 — Prova Social: apenas a primeira ideia da benchmark_avaliacoes
  if (data.benchmark_avaliacoes) {
    const avaliacao = extractFirstAvaliacao(data.benchmark_avaliacoes);
    if (avaliacao) {
      cards.push({
        title: "Prova Social",
        icon: "📊",
        label: "Quando precisares de mostrar resultados reais:",
        content: avaliacao,
      });
    }
  }

  // Cartão 3 — Urgência: primeira frase da tendencia + frase fixa
  if (data.tendencia_2025) {
    const trend = firstShortSentence(data.tendencia_2025, 80);
    if (trend) {
      cards.push({
        title: "Criar Urgência",
        icon: "⚡",
        label: "Para criar sentido de urgência:",
        content: `O mercado de ${subcategory} está a mudar — ${trend}. Quem aparecer agora na Pede Direto tem vantagem sobre quem aparecer daqui a 6 meses.`,
      });
    }
  }

  // Cartão 4 — Objecção de Preço: apenas o primeiro valor do ticket_medio
  if (data.ticket_medio) {
    const ticketValor = extractTicketValue(data.ticket_medio);
    if (ticketValor) {
      cards.push({
        title: "Objecção de Preço",
        icon: "💰",
        label: "Quando disserem que 9,90€ é caro:",
        content: `Um cliente novo neste sector vale em média ${ticketValor}. A mensalidade da Pede Direto é menos do que uma única transacção. O retorno é imediato.`,
      });
    }
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
