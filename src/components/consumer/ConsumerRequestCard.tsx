import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  MapPin,
  MessageCircle,
  Bell,
  ArrowRight,
  Star,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react";
import type { RequestReviewInfo } from "@/hooks/useServiceRequests";

interface RequestMeta {
  responses: number;
  hasUnread: boolean;
  hasPending: boolean;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  novo: { label: "Novo", variant: "secondary" },
  em_contacto: { label: "Em Contacto", variant: "outline" },
  encaminhado: { label: "Encaminhado", variant: "default" },
  concluido: { label: "Concluído", variant: "default" },
  cancelado: { label: "Cancelado", variant: "destructive" },
};

const REPEATABLE_STATUSES = ["concluido", "cancelado"];

interface ConsumerRequestCardProps {
  req: any;
  meta?: RequestMeta;
  reviews: RequestReviewInfo[];
}

const ConsumerRequestCard = ({ req, meta, reviews }: ConsumerRequestCardProps) => {
  const [responseOpen, setResponseOpen] = useState(false);
  const navigate = useNavigate();
  const cfg = statusConfig[req.status] || { label: req.status, variant: "secondary" as const };
  const canRepeat = REPEATABLE_STATUSES.includes(req.status);

  const handleRepeat = () => {
    navigate("/pedir-servico", {
      state: {
        repeat: {
          category_id: req.categories ? undefined : undefined, // category resolved by name in form
          description: req.description,
          location_city: req.location_city,
          urgency: req.urgency,
        },
      },
    });
  };

  return (
    <Card
      className={`transition-colors ${
        meta?.hasUnread ? "border-primary/50 bg-primary/[0.02] dark:bg-primary/[0.04]" : ""
      }`}
    >
      <CardContent className="py-4 px-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-primary uppercase tracking-wide">
              {req.categories?.name || "Sem categoria"}
              {req.subcategories?.name ? ` • ${req.subcategories.name}` : ""}
            </p>
            <p className="font-medium text-foreground mt-1 line-clamp-2">
              {req.description
                ? req.description.length > 120
                  ? req.description.slice(0, 120) + "…"
                  : req.description
                : "Sem descrição"}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {reviews.length > 0 && (
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800 gap-1"
              >
                <Star className="h-3 w-3 fill-current" />
                {reviews[0].rating.toFixed(1)} Avaliado
              </Badge>
            )}
            <Badge variant={cfg.variant}>{cfg.label}</Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {req.location_city && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {req.location_city}
            </span>
          )}
          {req.urgency === "urgent" && (
            <span className="text-destructive font-semibold">⚠ Urgente</span>
          )}
          <span>
            {new Date(req.created_at).toLocaleDateString("pt-PT", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
          {meta && meta.responses > 0 && (
            <span className="flex items-center gap-1 text-foreground font-medium">
              <MessageCircle className="h-3.5 w-3.5 text-primary" />
              {meta.responses} {meta.responses === 1 ? "resposta" : "respostas"}
            </span>
          )}
          {meta?.hasUnread && (
            <span className="flex items-center gap-1 text-primary font-semibold animate-pulse">
              <Bell className="h-3.5 w-3.5" />
              Nova mensagem
            </span>
          )}
        </div>

        {/* Business response to review */}
        {reviews.some((r) => r.businessResponse) && (
          <Collapsible open={responseOpen} onOpenChange={setResponseOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors w-full">
              <MessageCircle className="h-3.5 w-3.5" />
              O negócio respondeu à sua avaliação
              {responseOpen ? (
                <ChevronUp className="h-3 w-3 ml-auto" />
              ) : (
                <ChevronDown className="h-3 w-3 ml-auto" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              {reviews
                .filter((r) => r.businessResponse)
                .map((r, i) => (
                  <div key={i} className="bg-muted/50 rounded-lg p-3 border border-border text-sm">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      {r.businessName}
                      {r.businessResponseAt && (
                        <span className="font-normal ml-2">
                          {new Date(r.businessResponseAt).toLocaleDateString("pt-PT", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </p>
                    <p className="text-foreground">{r.businessResponse}</p>
                  </div>
                ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        <div className="flex justify-end gap-2 pt-1">
          {canRepeat && (
            <Button size="sm" variant="ghost" onClick={handleRepeat} className="gap-1.5 text-muted-foreground">
              <RotateCcw className="h-3.5 w-3.5" />
              Repetir
            </Button>
          )}
          <Button asChild size="sm" variant={meta?.hasUnread ? "default" : "outline"}>
            <Link to={`/pedido/${req.id}`} className="flex items-center gap-1.5">
              Ver Conversa
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConsumerRequestCard;
