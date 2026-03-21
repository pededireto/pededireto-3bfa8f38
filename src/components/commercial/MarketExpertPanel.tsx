import { useState } from "react";
import { BarChart2, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { CommercialBenchmarkData } from "@/hooks/useCommercialBenchmark";

interface Props {
  data: CommercialBenchmarkData;
  subcategory: string;
}

// Extrai apenas o primeiro intervalo de preços de um texto longo
// Ex: "11€ a 16€/noite por cão em canil standard; 12€ a 30€..." → "11€ a 16€/noite por cão"
const extractShortTicket = (ticket: string): string => {
  if (!ticket) return "—";
  const untilSemicolon = ticket.split(";")[0].trim();
  if (untilSemicolon.length <= 80) return untilSemicolon;
  return untilSemicolon.slice(0, 77) + "...";
};

// Extrai apenas a primeira ideia de um texto longo (até ao primeiro " — " ou ".")
const extractFirstIdea = (text: string, maxChars = 100): string => {
  if (!text) return "";
  const firstDash = text.indexOf(" — ");
  const firstPeriod = text.indexOf(".");
  const firstSemicolon = text.indexOf(";");
  const candidates = [firstDash, firstPeriod, firstSemicolon].filter((i) => i > 10);
  const cutAt = candidates.length > 0 ? Math.min(...candidates) : maxChars;
  return text.slice(0, Math.min(cutAt, maxChars)).trim();
};

const TruncatedText = ({ text, maxLength = 300 }: { text: string; maxLength?: number }) => {
  const [expanded, setExpanded] = useState(false);
  if (text.length <= maxLength) return <p className="text-sm">{text}</p>;
  return (
    <div>
      <p className="text-sm">{expanded ? text : `${text.slice(0, maxLength)}…`}</p>
      <Button
        variant="link"
        size="sm"
        className="h-auto p-0 text-xs text-primary"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? "Ver menos" : "Ver mais"}
      </Button>
    </div>
  );
};

const HintBox = ({ text }: { text: string }) => (
  <div className="mt-2 p-3 rounded-lg bg-muted/50 border border-border">
    <p className="text-xs italic text-muted-foreground">{text}</p>
  </div>
);

const MarketExpertPanel = ({ data, subcategory }: Props) => {
  const [open, setOpen] = useState(false);

  const ticketCurto = extractShortTicket(data.ticket_medio || "");
  const tendenciaCurta = extractFirstIdea(data.tendencia_2025 || "");
  const diferencialCurto = extractFirstIdea(data.diferencial_competitivo || "", 60);

  const sections = [
    {
      id: "ticket",
      icon: "💰",
      title: "O QUE ESTE NEGÓCIO PODE GANHAR",
      field: data.ticket_medio,
      label: "Ticket médio neste sector:",
      hint: `💬 Como usar: Ex: "Sabes que um ${subcategory} em Portugal cobra em média ${ticketCurto}? A Pede Direto ajuda-te a aparecer a esses clientes."`,
    },
    {
      id: "canal",
      icon: "🎯",
      title: "COMO CHEGAM OS CLIENTES",
      field: data.canal_aquisicao_principal,
      label: "Canal principal de aquisição:",
      hint: "💬 Como usar: Pergunta como chegam os clientes novos. Quando ele responder, complementa com o que a Pede Direto acrescenta a esses canais.",
    },
    {
      id: "tendencia",
      icon: "⚡",
      title: "TENDÊNCIAS 2025",
      field: data.tendencia_2025,
      label: "O que está a mudar neste mercado:",
      hint: tendenciaCurta
        ? `💬 Como usar: Ex: "Sabes que ${tendenciaCurta}...?" — abre com isto e posiciona a Pede Direto como a resposta.`
        : "💬 Como usar: Abre a conversa com uma tendência. Mostra que és consultor, não vendedor.",
    },
    {
      id: "diferencial",
      icon: "🏆",
      title: "O QUE OS MELHORES FAZEM",
      field: data.diferencial_competitivo,
      label: "O que diferencia os líderes do sector:",
      hint: diferencialCurto
        ? `💬 Como usar: Ex: "Os melhores ${subcategory} fazem ${diferencialCurto}... — a Pede Direto ajuda-te a chegar lá."`
        : `💬 Como usar: Faz o negócio sonhar com o que pode ser. A Pede Direto é o caminho.`,
    },
    {
      id: "avaliacoes",
      icon: "⭐",
      title: "BENCHMARK DE AVALIAÇÕES",
      field: data.benchmark_avaliacoes,
      label: "O que dizem os clientes neste sector:",
      hint: "💬 Como usar: Mostra que avaliações reais são o motor de crescimento do sector. A Pede Direto dá-lhe esse sistema verificado que os líderes já usam.",
    },
  ].filter((s) => s.field);

  const hasDicaOuro = !!data.dica_ouro;
  const hasAnySections = sections.length > 0 || hasDicaOuro;

  if (!hasAnySections) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Especialista de Mercado — {subcategory}</h3>
                <p className="text-xs text-muted-foreground">O que saber antes de ligar ou visitar</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
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

        <CollapsibleContent>
          <div className="px-4 pb-4">
            <Accordion type="multiple" className="space-y-1">
              {sections.map((section) => (
                <AccordionItem key={section.id} value={section.id} className="border rounded-lg px-3">
                  <AccordionTrigger className="text-sm py-3 hover:no-underline">
                    <span className="flex items-center gap-2">
                      <span>{section.icon}</span>
                      <span className="font-medium">{section.title}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">{section.label}</p>
                    <p className="text-sm">{section.field}</p>
                    <HintBox text={section.hint} />
                  </AccordionContent>
                </AccordionItem>
              ))}

              {hasDicaOuro && (
                <AccordionItem value="dica-ouro" className="border-2 border-success/30 rounded-lg px-3 bg-success/5">
                  <AccordionTrigger className="text-sm py-3 hover:no-underline">
                    <span className="flex items-center gap-2">
                      <span>🔑</span>
                      <span className="font-medium text-success">DICA DE OURO DO SECTOR</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Estratégia completa para este sector
                    </p>
                    <TruncatedText text={data.dica_ouro!} maxLength={300} />
                    <HintBox text="💬 Como usar: NÃO mostres isto ao cliente — é o teu manual interno. Usa estes pontos para fazer perguntas inteligentes que mostrem que conheces o sector a fundo. O cliente vai perguntar-se: como é que ele sabe tanto sobre o meu negócio?" />
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default MarketExpertPanel;
