import { CheckCircle2, Circle, Loader2 } from "lucide-react";

export interface ProgressData {
  requestStatus: string;
  matchesTotal: number;
  matchesViewed: number;
  matchesResponded: number;
  hasMessages: boolean;
}

interface Step {
  label: string;
  done: boolean;
  active: boolean;
}

function computeSteps(d: ProgressData): Step[] {
  const isClosed = d.requestStatus === "fechado" || d.requestStatus === "cancelado" || d.requestStatus === "expirado";
  const hasConversation = d.requestStatus === "em_conversa" || d.requestStatus === "em_negociacao" || d.hasMessages;

  return [
    {
      label: "Pedido enviado",
      done: true,
      active: false,
    },
    {
      label: d.matchesTotal > 0
        ? `${d.matchesTotal} profissiona${d.matchesTotal === 1 ? "l" : "is"} notificado${d.matchesTotal === 1 ? "" : "s"}`
        : "Profissionais notificados",
      done: d.matchesTotal > 0,
      active: d.matchesTotal === 0 && !isClosed,
    },
    {
      label: d.matchesResponded > 0
        ? `${d.matchesResponded} resposta${d.matchesResponded === 1 ? "" : "s"} recebida${d.matchesResponded === 1 ? "" : "s"}`
        : "A receber respostas",
      done: d.matchesResponded > 0,
      active: d.matchesTotal > 0 && d.matchesResponded === 0 && !isClosed,
    },
    {
      label: "Conversa iniciada",
      done: hasConversation,
      active: d.matchesResponded > 0 && !hasConversation && !isClosed,
    },
    {
      label: isClosed
        ? d.requestStatus === "cancelado" ? "Cancelado" : "Concluído"
        : "Pedido concluído",
      done: isClosed,
      active: false,
    },
  ];
}

const RequestProgressBar = ({ data }: { data: ProgressData }) => {
  const steps = computeSteps(data);

  return (
    <div className="flex items-start gap-0 w-full overflow-x-auto pb-1">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center min-w-0 flex-1">
          <div className="flex flex-col items-center text-center gap-1 min-w-[60px]">
            {step.done ? (
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
            ) : step.active ? (
              <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground/30 shrink-0" />
            )}
            <span
              className={`text-[11px] leading-tight max-w-[90px] ${
                step.done
                  ? "text-foreground font-medium"
                  : step.active
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`h-0.5 flex-1 min-w-[12px] mt-2.5 -translate-y-1/2 ${
                step.done ? "bg-primary" : "bg-muted-foreground/20"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default RequestProgressBar;
