import { useState } from "react";
import { BarChart2, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { CommercialBenchmarkData } from "@/hooks/useCommercialBenchmark";

interface Props {
  data: CommercialBenchmarkData;
  subcategory: string;
}

// Extrai apenas o primeiro valor de preço de um ticket_medio longo
const extractShortTicket = (ticket: string): string => {
  if (!ticket) return "—";
  const untilSemicolon = ticket.split(";")[0].trim();
  if (untilSemicolon.length <= 80) return untilSemicolon;
  return untilSemicolon.slice(0, 77) + "...";
};

// Extrai a primeira ideia curta de um texto longo
const extractFirstIdea = (text: string, maxChars = 100): string => {
  if (!text) return "";
  const dashIdx = text.indexOf(" — ");
  const semiIdx = text.indexOf(";");
  const dotIdx = text.indexOf(".");
  const candidates = [dashIdx, semiIdx, dotIdx].filter((i) => i > 10);
  const cutAt = candidates.length > 0 ? Math.min(...candidates) : maxChars;
  return text.slice(0, Math.min(cutAt, maxChars)).trim();
};

// Divide a dica de ouro em pontos numerados para leitura fácil
const parseDicaOuro = (text: string): string[] => {
  if (!text) return [];
  // A dica de ouro está formatada com "1. TÍTULO — conteúdo\n\n2. TÍTULO..."
  const points = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
  if (points.length > 1) return points;
  // Fallback: divide por número seguido de ponto
  const byNumber = text.split(/(?=\d+\.\s+[A-ZÁÉÍÓÚÃÕÇÀÂÊÔÜ])/).filter((p) => p.trim().length > 0);
  if (byNumber.length > 1) return byNumber;
  // Último fallback: texto como está
  return [text];
};

// Card individual de uma secção
const SectionCard = ({
  icon,
  title,
  label,
  content,
  hint,
  accentColor = "border-border",
}: {
  icon: string;
  title: string;
  label: string;
  content: string;
  hint: string;
  accentColor?: string;
}) => {
  const [expanded, setExpanded] = useState(false);
  const SHORT_LIMIT = 180;
  const isLong = content.length > SHORT_LIMIT;

  return (
    <div className={`rounded-xl border-l-4 ${accentColor} bg-card border border-border p-4 space-y-3`}>
      {/* Header da secção */}
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="text-[11px] text-muted-foreground">{label}</p>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="pl-1">
        <p className="text-sm leading-relaxed text-foreground">
          {isLong && !expanded ? `${content.slice(0, SHORT_LIMIT)}…` : content}
        </p>
        {isLong && (
          <button className="mt-1 text-xs text-primary hover:underline" onClick={() => setExpanded(!expanded)}>
            {expanded ? "▲ Ver menos" : "▼ Ver mais"}
          </button>
        )}
      </div>

      {/* Dica de uso — sempre visível mas visualmente separada */}
      <div className="bg-muted/40 rounded-lg px-3 py-2 border-t border-border">
        <p className="text-[11px] italic text-muted-foreground leading-relaxed">{hint}</p>
      </div>
    </div>
  );
};

// Card especial para a Dica de Ouro — mostra ponto a ponto
const DicaOuroCard = ({ text }: { text: string }) => {
  const [expandedPoints, setExpandedPoints] = useState<Set<number>>(new Set());
  const points = parseDicaOuro(text);

  const togglePoint = (idx: number) => {
    setExpandedPoints((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div className="rounded-xl border-l-4 border-success bg-success/5 border border-success/20 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-lg">🔑</span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-success">Dica de Ouro do Sector</p>
          <p className="text-[11px] text-muted-foreground">Teu manual interno — não mostres ao cliente</p>
        </div>
      </div>

      {/* Pontos da dica — cada um colapsável */}
      <div className="space-y-2 pl-1">
        {points.map((point, idx) => {
          const isExpanded = expandedPoints.has(idx);
          const SHORT = 120;
          const isLong = point.length > SHORT;
          // Extrai título do ponto (ex: "1. COMUNICAÇÃO DIÁRIA...")
          const titleMatch = point.match(/^(\d+\.\s+[^—\n]+)/);
          const pointTitle = titleMatch ? titleMatch[1].trim() : `Ponto ${idx + 1}`;
          const pointBody = titleMatch
            ? point
                .slice(titleMatch[1].length)
                .replace(/^[\s—]+/, "")
                .trim()
            : point;

          return (
            <div key={idx} className="bg-card rounded-lg p-3 border border-success/10 space-y-1">
              <p className="text-xs font-semibold text-success">{pointTitle}</p>
              {pointBody && (
                <>
                  <p className="text-xs leading-relaxed text-foreground">
                    {isLong && !isExpanded ? `${pointBody.slice(0, SHORT)}…` : pointBody}
                  </p>
                  {isLong && (
                    <button className="text-[10px] text-primary hover:underline" onClick={() => togglePoint(idx)}>
                      {isExpanded ? "▲ Ver menos" : "▼ Ver mais"}
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Nota de uso */}
      <div className="bg-muted/40 rounded-lg px-3 py-2 border-t border-success/10">
        <p className="text-[11px] italic text-muted-foreground leading-relaxed">
          💬 Usa estes pontos para fazer perguntas inteligentes. O cliente vai perguntar-se: como é que ele sabe tanto
          sobre o meu negócio?
        </p>
      </div>
    </div>
  );
};

const MarketExpertPanel = ({ data, subcategory }: Props) => {
  const [open, setOpen] = useState(false);

  const ticketCurto = extractShortTicket(data.ticket_medio || "");
  const tendenciaCurta = extractFirstIdea(data.tendencia_2025 || "");
  const diferencialCurto = extractFirstIdea(data.diferencial_competitivo || "", 60);

  const sections = [
    {
      id: "ticket",
      icon: "💰",
      title: "O que este negócio pode ganhar",
      label: "Ticket médio do sector",
      field: data.ticket_medio,
      hint: `Ex: "Sabes que um ${subcategory} em Portugal cobra em média ${ticketCurto}? A Pede Direto ajuda-te a aparecer a esses clientes."`,
      accent: "border-amber-400",
    },
    {
      id: "canal",
      icon: "🎯",
      title: "Como chegam os clientes",
      label: "Canal principal de aquisição",
      field: data.canal_aquisicao_principal,
      hint: "Pergunta como chegam os clientes novos. Quando ele responder, complementa com o que a Pede Direto acrescenta.",
      accent: "border-blue-400",
    },
    {
      id: "tendencia",
      icon: "⚡",
      title: "Tendências 2025",
      label: "O que está a mudar neste mercado",
      field: data.tendencia_2025,
      hint: tendenciaCurta
        ? `Ex: "Sabes que ${tendenciaCurta}...?" — abre com isto. Mostra que és consultor, não vendedor.`
        : "Abre a conversa com uma tendência do sector.",
      accent: "border-orange-400",
    },
    {
      id: "diferencial",
      icon: "🏆",
      title: "O que os melhores fazem",
      label: "Diferencial dos líderes do sector",
      field: data.diferencial_competitivo,
      hint: diferencialCurto
        ? `Ex: "Os melhores ${subcategory} fazem ${diferencialCurto}... — a Pede Direto ajuda-te a chegar lá."`
        : "Faz o negócio sonhar com o que pode ser.",
      accent: "border-purple-400",
    },
    {
      id: "avaliacoes",
      icon: "⭐",
      title: "Benchmark de avaliações",
      label: "O que dizem os clientes do sector",
      field: data.benchmark_avaliacoes,
      hint: "Mostra que avaliações reais são o motor de crescimento. A Pede Direto dá-lhe esse sistema verificado.",
      accent: "border-yellow-400",
    },
  ].filter((s) => s.field);

  const hasDicaOuro = !!data.dica_ouro;
  const hasAnySections = sections.length > 0 || hasDicaOuro;

  if (!hasAnySections) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Header — clica para abrir/fechar tudo */}
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <BarChart2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Especialista de Mercado — {subcategory}</h3>
                <p className="text-xs text-muted-foreground">
                  {open ? "Clica para fechar o briefing" : "Clica para ver o briefing completo"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="secondary" className="bg-success/10 text-success text-[10px]">
                Dados actualizados
              </Badge>
              {open ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        {/* Briefing — cards empilhados verticalmente com espaço entre eles */}
        <CollapsibleContent>
          <div className="px-4 pb-6 pt-2 space-y-3">
            {/* Cada secção é um card separado */}
            {sections.map((section) => (
              <SectionCard
                key={section.id}
                icon={section.icon}
                title={section.title}
                label={section.label}
                content={section.field!}
                hint={section.hint}
                accentColor={section.accent}
              />
            ))}

            {/* Separador visual antes da Dica de Ouro */}
            {hasDicaOuro && sections.length > 0 && (
              <div className="flex items-center gap-2 py-1">
                <div className="flex-1 border-t border-border" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Estratégia interna</span>
                <div className="flex-1 border-t border-border" />
              </div>
            )}

            {/* Dica de Ouro como card especial */}
            {hasDicaOuro && <DicaOuroCard text={data.dica_ouro!} />}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default MarketExpertPanel;
