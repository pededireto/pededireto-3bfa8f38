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

  const sections = [
    {
      id: "ticket",
      icon: "💰",
      title: "O QUE ESTE NEGÓCIO PODE GANHAR",
      field: data.ticket_medio,
      label: "Ticket médio neste sector:",
      hint: `💬 Como usar: Menciona estes valores para mostrar que conheces o mercado deles. Ex: Sabes que um ${subcategory} em Portugal cobra em média ${data.ticket_medio || "—"}? A Pede Direto ajuda-te a aparecer a esses clientes.`,
    },
    {
      id: "canal",
      icon: "🎯",
      title: "COMO CHEGAM OS CLIENTES",
      field: data.canal_aquisicao_principal,
      label: "Canal principal de aquisição:",
      hint: "💬 Como usar: Pergunta ao negócio como chegam os clientes novos. Quando ele responder, tens aqui o contexto para complementar com o que a Pede Direto adiciona a esses canais.",
    },
    {
      id: "tendencia",
      icon: "⚡",
      title: "TENDÊNCIAS 2025",
      field: data.tendencia_2025,
      label: "O que está a mudar neste mercado:",
      hint: "💬 Como usar: Abre a conversa com uma tendência do sector. Posiciona a Pede Direto como a resposta a essa tendência. Mostra que estás informado — não és um vendedor, és um consultor.",
    },
    {
      id: "diferencial",
      icon: "🏆",
      title: "O QUE OS MELHORES FAZEM",
      field: data.diferencial_competitivo,
      label: "O que diferencia os líderes do sector:",
      hint: `💬 Como usar: Usa este ponto para fazer o negócio sonhar com o que pode ser. Ex: Os melhores ${subcategory} em Portugal fazem isto — a Pede Direto ajuda-te a chegar lá.`,
    },
    {
      id: "avaliacoes",
      icon: "⭐",
      title: "BENCHMARK DE AVALIAÇÕES",
      field: data.benchmark_avaliacoes,
      label: "O que dizem os clientes neste sector:",
      hint: "💬 Como usar: Mostra que as avaliações reais de clientes são o motor de crescimento do sector. A Pede Direto dá-lhe esse sistema de avaliações verificadas que os melhores já usam.",
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
                    <p className="text-sm font-medium">{section.field}</p>
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
