import { useState } from "react";
import { Star } from "lucide-react";
import { useCreateReview, useUpdateReview, type BusinessReview } from "@/hooks/useBusinessReviews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface ReviewFormProps {
  businessId: string;
  existingReview?: BusinessReview;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ReviewForm = ({ businessId, existingReview, onSuccess, onCancel }: ReviewFormProps) => {
  const { toast } = useToast();
  const createReview = useCreateReview();
  const updateReview = useUpdateReview();

  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState(existingReview?.title || "");
  const [comment, setComment] = useState(existingReview?.comment || "");

  const isEditing = !!existingReview;
  const isSubmitting = createReview.isPending || updateReview.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast({ title: "Por favor, selecione uma classificação", variant: "destructive" });
      return;
    }

    if (!title.trim() && !comment.trim()) {
      toast({ title: "Por favor, adicione um título ou comentário", variant: "destructive" });
      return;
    }

    try {
      if (isEditing) {
        await updateReview.mutateAsync({
          id: existingReview.id,
          rating,
          title: title.trim() || undefined,
          comment: comment.trim() || undefined,
        });
        toast({ title: "Avaliação atualizada com sucesso!" });
      } else {
        await createReview.mutateAsync({
          business_id: businessId,
          rating,
          title: title.trim() || undefined,
          comment: comment.trim() || undefined,
        });
        toast({ title: "Avaliação publicada com sucesso!", description: "Obrigado pelo seu feedback!" });
      }

      // Reset form
      setRating(0);
      setTitle("");
      setComment("");

      onSuccess?.();
    } catch (error) {
      toast({
        title: "Erro ao publicar avaliação",
        description: "Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Rating Stars */}
      <div className="space-y-2">
        <Label>Classificação *</Label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  star <= (hoverRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-muted-foreground">
              {rating === 1 && "Muito Mau"}
              {rating === 2 && "Mau"}
              {rating === 3 && "Aceitável"}
              {rating === 4 && "Bom"}
              {rating === 5 && "Excelente"}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label>Título da Avaliação</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Resuma a sua experiência..."
          maxLength={200}
        />
        <p className="text-xs text-muted-foreground">
          {title.length}/200 caracteres
        </p>
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <Label>Comentário</Label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Partilhe mais detalhes sobre a sua experiência..."
          rows={5}
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground">
          {comment.length}/1000 caracteres
        </p>
      </div>

      {/* Photo Upload (placeholder - implementar upload depois) */}
      {/* <div className="space-y-2">
        <Label>Fotos (opcional)</Label>
        <p className="text-xs text-muted-foreground">
          Adicione até 5 fotos da sua experiência
        </p>
        // TODO: Implementar upload de fotos
      </div> */}

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting || rating === 0}>
          {isSubmitting ? "A guardar..." : isEditing ? "Atualizar Avaliação" : "Publicar Avaliação"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>

      {/* Guidelines */}
      <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
        <p className="font-semibold">Diretrizes para Avaliações:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Seja honesto e objetivo</li>
          <li>Descreva a sua experiência pessoal</li>
          <li>Evite linguagem ofensiva ou discriminatória</li>
          <li>Não partilhe informações pessoais</li>
        </ul>
      </div>
    </form>
  );
};
