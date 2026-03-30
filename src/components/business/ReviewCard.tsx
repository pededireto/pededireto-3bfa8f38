import { useState } from "react";
import { Star, ThumbsUp, ThumbsDown, Flag, MoreVertical, ShieldCheck, User } from "lucide-react";
import { formatReviewerName } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useVoteReviewHelpfulness, useRemoveVote, useFlagReview, useUserVoteForReview, type BusinessReview } from "@/hooks/useBusinessReviews";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface ReviewCardProps {
  review: BusinessReview;
  onEdit?: () => void;
  onDelete?: () => void;
  showBusinessResponse?: boolean;
}

export const ReviewCard = ({ review, onEdit, onDelete, showBusinessResponse = true }: ReviewCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: userVote } = useUserVoteForReview(review.id);
  const voteHelpfulness = useVoteReviewHelpfulness();
  const removeVote = useRemoveVote();
  const flagReview = useFlagReview();

  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [flagReason, setFlagReason] = useState("");

  const isOwner = user?.id === review.user_id;
  const hasVotedHelpful = userVote?.is_helpful === true;
  const hasVotedNotHelpful = userVote?.is_helpful === false;

  const handleVote = async (isHelpful: boolean) => {
    if (!user) {
      toast({ title: "Faça login para votar", variant: "destructive" });
      return;
    }

    try {
      // Se já votou o mesmo, remove o voto
      if ((isHelpful && hasVotedHelpful) || (!isHelpful && hasVotedNotHelpful)) {
        await removeVote.mutateAsync(review.id);
      } else {
        await voteHelpfulness.mutateAsync({
          review_id: review.id,
          is_helpful: isHelpful,
        });
      }
    } catch (error: any) {
      const detail = error?.details || error?.hint || error?.message || "Erro desconhecido";
      toast({ title: "Erro ao votar", description: detail, variant: "destructive" });
      console.error("[ReviewCard] vote error:", error);
    }
  };

  const handleFlag = async () => {
    if (!flagReason.trim()) {
      toast({ title: "Por favor, descreva o motivo", variant: "destructive" });
      return;
    }

    try {
      await flagReview.mutateAsync({ reviewId: review.id, reason: flagReason });
      toast({ title: "Avaliação denunciada", description: "Iremos analisar o caso." });
      setShowFlagDialog(false);
      setFlagReason("");
    } catch (error: any) {
      const detail = error?.details || error?.hint || error?.message || "Erro desconhecido";
      toast({ title: "Erro ao denunciar", description: detail, variant: "destructive" });
      console.error("[ReviewCard] flag error:", error);
    }
  };

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Reviewer name */}
          <div className="flex items-center gap-2 mb-1">
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              {formatReviewerName((review as any).reviewer_full_name)}
            </span>
          </div>
          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= review.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            {review.is_verified && (
              <Badge variant="secondary" className="text-xs gap-1">
                <ShieldCheck className="w-3 h-3" />
                Verificada
              </Badge>
            )}
            {review.is_featured && (
              <Badge variant="default" className="text-xs">
                Destaque
              </Badge>
            )}
          </div>

          {/* Title */}
          {review.title && (
            <h4 className="font-semibold mt-2">{review.title}</h4>
          )}

          {/* Comment */}
          {review.comment && (
            <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
              {review.comment}
            </p>
          )}

          {/* Photos */}
          {review.photos && review.photos.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {review.photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Foto ${index + 1}`}
                  className="w-20 h-20 object-cover rounded border"
                />
              ))}
            </div>
          )}

          {/* Date */}
          <p className="text-xs text-muted-foreground mt-2">
            {new Date(review.created_at).toLocaleDateString("pt-PT", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Menu */}
        {(isOwner || user) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwner && (
                <>
                  {onEdit && (
                    <DropdownMenuItem onClick={onEdit}>
                      Editar avaliação
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem onClick={onDelete} className="text-destructive">
                      Apagar avaliação
                    </DropdownMenuItem>
                  )}
                </>
              )}
              {!isOwner && user && (
                <DropdownMenuItem onClick={() => setShowFlagDialog(true)}>
                  <Flag className="w-4 h-4 mr-2" />
                  Denunciar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Helpfulness Votes */}
      <div className="flex items-center gap-4 pt-2 border-t">
        <span className="text-xs text-muted-foreground">Foi útil?</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleVote(true)}
          disabled={voteHelpfulness.isPending || removeVote.isPending}
          className={hasVotedHelpful ? "text-primary" : ""}
        >
          <ThumbsUp className="w-4 h-4 mr-1" />
          {review.helpful_count}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleVote(false)}
          disabled={voteHelpfulness.isPending || removeVote.isPending}
          className={hasVotedNotHelpful ? "text-destructive" : ""}
        >
          <ThumbsDown className="w-4 h-4 mr-1" />
          {review.not_helpful_count}
        </Button>
      </div>

      {/* Business Response */}
      {showBusinessResponse && review.business_response && (
        <div className="mt-3 p-3 bg-muted/50 rounded-lg border-l-4 border-primary">
          <p className="text-xs font-semibold text-primary mb-1">
            Resposta do Negócio
          </p>
          <p className="text-sm whitespace-pre-wrap">{review.business_response}</p>
          {review.business_response_at && (
            <p className="text-xs text-muted-foreground mt-2">
              {new Date(review.business_response_at).toLocaleDateString("pt-PT", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      )}

      {/* Flag Dialog */}
      <Dialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Denunciar Avaliação</DialogTitle>
            <DialogDescription>
              Por favor, descreva o motivo da denúncia. Iremos analisar e tomar as medidas apropriadas.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={flagReason}
            onChange={(e) => setFlagReason(e.target.value)}
            placeholder="Exemplo: Conteúdo ofensivo, spam, informação falsa..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowFlagDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleFlag} disabled={flagReview.isPending}>
              Enviar Denúncia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
