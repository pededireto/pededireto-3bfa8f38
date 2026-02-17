import { useState } from "react";
import { Star, MessageSquare, Send, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  useBusinessReviews,
  useBusinessReviewStats,
  useRespondToReview,
  type BusinessReview,
} from "@/hooks/useBusinessReviews";

interface BusinessReviewsPanelProps {
  businessId: string;
}

const BusinessReviewsPanel = ({ businessId }: BusinessReviewsPanelProps) => {
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");

  const { data: reviews = [], isPending: reviewsLoading } = useBusinessReviews(businessId);
  const { data: stats } = useBusinessReviewStats(businessId);
  const respondToReview = useRespondToReview();

  const pendingResponseCount = reviews.filter(r => !r.business_response).length;

  const handleRespond = async (reviewId: string) => {
    if (!responseText.trim()) return;
    try {
      await respondToReview.mutateAsync({ review_id: reviewId, response: responseText.trim() });
      toast.success("Resposta enviada com sucesso");
      setRespondingTo(null);
      setResponseText("");
    } catch {
      toast.error("Erro ao enviar resposta");
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`h-4 w-4 ${i <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );

  if (reviewsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">As Minhas Avaliações</h2>
        <p className="text-muted-foreground">Veja e responda às avaliações dos seus clientes</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="text-2xl font-bold">{stats?.average_rating?.toFixed(1) || "—"}</span>
            </div>
            <p className="text-xs text-muted-foreground">Média</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats?.total_reviews || 0}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats?.verified_reviews_count || 0}</p>
            <p className="text-xs text-muted-foreground">Verificadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{pendingResponseCount}</p>
            <p className="text-xs text-muted-foreground">Sem resposta</p>
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution */}
      {stats && stats.total_reviews > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Distribuição de Avaliações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[5, 4, 3, 2, 1].map(rating => {
              const count = (stats as any)?.[`rating_${rating}_count`] || 0;
              const percent = (stats as any)?.[`rating_${rating}_percent`] || 0;
              return (
                <div key={rating} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-8">{rating}★</span>
                  <Progress value={percent} className="flex-1 h-2" />
                  <span className="text-sm text-muted-foreground w-16 text-right">{count} ({Math.round(percent)}%)</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Pending Responses Alert */}
      {pendingResponseCount > 0 && (
        <Card className="border-yellow-300 dark:border-yellow-700 bg-yellow-50/50 dark:bg-yellow-900/10">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0" />
            <div>
              <p className="font-medium text-sm">{pendingResponseCount} avaliações aguardam resposta</p>
              <p className="text-xs text-muted-foreground">Responder às avaliações aumenta a confiança dos clientes.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Ainda não tem avaliações.</p>
            </CardContent>
          </Card>
        ) : (
          reviews.map(review => (
            <Card key={review.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating)}
                      {review.is_verified && <Badge variant="outline" className="text-xs">✓ Verificada</Badge>}
                    </div>
                    {review.title && <p className="font-semibold">{review.title}</p>}
                    {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>

                {/* Business Response */}
                {review.business_response ? (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">A sua resposta:</p>
                    <p className="text-sm">{review.business_response}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {review.business_response_at && new Date(review.business_response_at).toLocaleDateString("pt-PT")}
                    </p>
                  </div>
                ) : (
                  <div>
                    {respondingTo === review.id ? (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Escreva a sua resposta..."
                          value={responseText}
                          onChange={e => setResponseText(e.target.value)}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleRespond(review.id)} disabled={!responseText.trim() || respondToReview.isPending}>
                            <Send className="h-4 w-4 mr-1" /> Enviar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setRespondingTo(null); setResponseText(""); }}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setRespondingTo(review.id)}>
                        <MessageSquare className="h-4 w-4 mr-1" /> Responder
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default BusinessReviewsPanel;
