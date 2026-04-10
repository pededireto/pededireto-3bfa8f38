import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin,
  Bell,
  ArrowRight,
  Star,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { RequestReviewInfo } from "@/hooks/useServiceRequests";
import RequestProgressBar, { type ProgressData } from "./RequestProgressBar";
import RequestActivityPulse from "./RequestActivityPulse";

interface RequestMeta {
  responses: number;
  hasUnread: boolean;
  hasPending: boolean;
  notified: number;
  viewed: number;
  responded: number;
  hasMessages: boolean;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  aberto: { label: "Aberto", variant: "secondary" },
  em_conversa: { label: "Em Conversa", variant: "outline" },
  propostas_recebidas: { label: "Propostas Recebidas", variant: "default" },
  em_negociacao: { label: "Em Negociação", variant: "outline" },
  fechado: { label: "Concluído", variant: "default" },
  cancelado: { label: "Cancelado", variant: "destructive" },
  expirado: { label: "Expirado", variant: "destructive" },
};

const REPEATABLE_STATUSES = ["fechado", "cancelado", "expirado"];
const RESOLVED_STATUSES = ["fechado"];

// ── Star Rating Selector ─────────────────────────────────
const StarRatingSelector = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`h-8 w-8 transition-colors ${
              star <= (hovered || value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
};

interface ConsumerRequestCardProps {
  req: any;
  meta?: RequestMeta;
  reviews: RequestReviewInfo[];
}

const ConsumerRequestCard = ({ req, meta, reviews }: ConsumerRequestCardProps) => {
  const [responseOpen, setResponseOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [modalRating, setModalRating] = useState(0);
  const [modalComment, setModalComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  const cfg = statusConfig[req.status] || { label: req.status, variant: "secondary" as const };
  const canRepeat = REPEATABLE_STATUSES.includes(req.status);
  const isResolved = RESOLVED_STATUSES.includes(req.status);
  const hasReview = reviews.length > 0;

  const handleRepeat = () => {
    navigate("/pedir-servico", {
      state: {
        repeat: {
          description: req.description,
          location_city: req.location_city,
          urgency: req.urgency,
        },
      },
    });
  };

  // Submit rating from the card-level modal
  const handleSubmitRating = async () => {
    if (!user || modalRating === 0) return;
    setSubmittingRating(true);
    try {
      // Get the accepted matches for this request to rate
      const { data: matches } = await supabase
        .from("request_business_matches" as any)
        .select("id, business_id")
        .eq("request_id", req.id)
        .eq("status", "aceite");

      if (!matches || matches.length === 0) {
        toast({ title: "Nenhum negócio aceite para avaliar", variant: "destructive" });
        return;
      }

      const toInsert = (matches as any[]).map((m: any) => ({
        request_id: req.id,
        match_id: m.id,
        business_id: m.business_id,
        consumer_id: user.id,
        rating: modalRating,
        comment: modalComment.trim() || null,
      }));

      const { error } = await supabase.from("request_ratings" as any).insert(toInsert as any);
      if (error) throw error;

      toast({ title: "Obrigado pela tua avaliação!" });
      setShowRatingModal(false);
      setModalRating(0);
      setModalComment("");
      qc.invalidateQueries({ queryKey: ["consumer-request-reviews"] });
    } catch {
      toast({ title: "Erro ao guardar avaliação", variant: "destructive" });
    } finally {
      setSubmittingRating(false);
    }
  };

  const progressData: ProgressData | null = meta
    ? {
        requestStatus: req.status,
        matchesTotal: meta.notified,
        matchesViewed: meta.viewed,
        matchesResponded: meta.responded,
        hasMessages: meta.hasMessages,
      }
    : null;

  // Average rating from reviews
  const avgRating = hasReview
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <>
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
              {/* Show actual rating only if there IS a review */}
              {hasReview && (
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800 gap-1"
                >
                  <Star className="h-3 w-3 fill-current" />
                  {avgRating.toFixed(1)} Avaliado
                </Badge>
              )}
              {/* Show "Avaliar" button if resolved + no review */}
              {isResolved && !hasReview && (
                <Badge
                  variant="outline"
                  className="bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-700 gap-1 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-950/50 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRatingModal(true);
                  }}
                >
                  <Star className="h-3 w-3" />
                  Avaliar este pedido
                </Badge>
              )}
              <Badge variant={cfg.variant}>{cfg.label}</Badge>
            </div>
          </div>

          {/* Progress Bar */}
          {progressData && (
            <div className="pt-1">
              <RequestProgressBar data={progressData} />
            </div>
          )}

          {/* Activity Pulse */}
          {meta && meta.notified > 0 && (
            <RequestActivityPulse
              notified={meta.notified}
              viewed={meta.viewed}
              responded={meta.responded}
            />
          )}

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
            {meta?.hasUnread && (
              <span className="flex items-center gap-1 text-primary font-semibold animate-pulse">
                <Bell className="h-3.5 w-3.5" />
                Nova mensagem
              </span>
            )}
          </div>

          {/* Review comment display */}
          {hasReview && reviews.some((r) => r.comment) && (
            <div className="bg-muted/50 rounded-lg p-3 border border-border text-sm">
              <p className="text-xs font-semibold text-muted-foreground mb-1">A tua avaliação</p>
              {reviews.filter(r => r.comment).map((r, i) => (
                <p key={i} className="text-foreground text-sm">
                  <span className="font-medium">{r.businessName}:</span> {r.comment}
                </p>
              ))}
            </div>
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

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="text-center">
              <Star className="h-10 w-10 text-yellow-400 mx-auto mb-2" />
              <h2 className="text-xl font-bold">Como correu o serviço?</h2>
              <p className="text-sm text-muted-foreground mt-1">Avalia a tua experiência com este pedido</p>
            </div>
            <div className="flex justify-center">
              <StarRatingSelector value={modalRating} onChange={setModalRating} />
            </div>
            {modalRating > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                {modalRating === 1 && "Muito Mau"}
                {modalRating === 2 && "Mau"}
                {modalRating === 3 && "Aceitável"}
                {modalRating === 4 && "Bom"}
                {modalRating === 5 && "Excelente"}
              </p>
            )}
            <Textarea
              placeholder="Deixa um comentário (opcional)..."
              className="resize-none min-h-[80px] text-sm"
              value={modalComment}
              onChange={(e) => setModalComment(e.target.value)}
            />
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowRatingModal(false);
                  setModalRating(0);
                  setModalComment("");
                }}
                disabled={submittingRating}
              >
                Agora não
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmitRating}
                disabled={submittingRating || modalRating === 0}
              >
                {submittingRating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submeter avaliação"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ConsumerRequestCard;