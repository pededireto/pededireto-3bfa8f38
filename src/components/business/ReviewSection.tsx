import { useState } from "react";
import { Star, Plus, Filter, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBusinessReviews, useUserReviewForBusiness, useDeleteReview } from "@/hooks/useBusinessReviews";
import { ReviewStats } from "./ReviewStats";
import { ReviewCard } from "./ReviewCard";
import { ReviewForm } from "./ReviewForm";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface ReviewSectionProps {
  businessId: string;
  businessName?: string;
}

type OrderBy = "recent" | "rating_high" | "rating_low" | "helpful";
type FilterType = "all" | "verified" | "5_star" | "4_star" | "3_star" | "2_star" | "1_star";

export const ReviewSection = ({ businessId, businessName }: ReviewSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [orderBy, setOrderBy] = useState<OrderBy>("recent");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<any>(null);

  // Determinar filtros para a query
  const filters = {
    orderBy,
    verified: filterType === "verified",
    minRating: filterType.includes("star") ? parseInt(filterType[0]) : undefined,
  };

  const { data: reviews = [], isLoading } = useBusinessReviews(businessId, filters);
  const { data: userReview } = useUserReviewForBusiness(businessId);
  const deleteReview = useDeleteReview();

  const hasUserReview = !!userReview;

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Tem certeza que deseja apagar esta avaliação?")) return;

    try {
      await deleteReview.mutateAsync(reviewId);
      toast({ title: "Avaliação apagada com sucesso" });
    } catch (error) {
      toast({ title: "Erro ao apagar avaliação", variant: "destructive" });
    }
  };

  const handleEditReview = () => {
    setEditingReview(userReview);
    setShowReviewForm(true);
  };

  return (
    <div className="space-y-8">
      {/* Estatísticas */}
      <div className="bg-card rounded-2xl p-6 shadow-sm border">
        <h3 className="text-2xl font-bold mb-6">Avaliações</h3>
        <ReviewStats businessId={businessId} />
      </div>

      {/* Botão para Avaliar */}
      {user && !hasUserReview && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
          <Star className="w-12 h-12 mx-auto mb-3 text-primary" />
          <h4 className="font-semibold mb-2">Já usou este serviço?</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Partilhe a sua experiência e ajude outros clientes!
          </p>
          <Button onClick={() => setShowReviewForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Escrever Avaliação
          </Button>
        </div>
      )}

      {/* Se já tem avaliação */}
      {user && hasUserReview && (
        <div className="bg-muted/50 border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm">A Sua Avaliação</h4>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleEditReview}>
                Editar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDeleteReview(userReview.id)}
              >
                Apagar
              </Button>
            </div>
          </div>
          <ReviewCard review={userReview} showBusinessResponse={true} />
        </div>
      )}

      {/* Call to action para não autenticados */}
      {!user && (
        <div className="bg-muted/50 border rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Faça login para deixar uma avaliação
          </p>
          <Link to="/login">
            <Button variant="outline">Entrar</Button>
          </Link>
        </div>
      )}

      {/* Filtros e Ordenação */}
      <div className="flex items-center gap-4 flex-wrap">
        <Select value={orderBy} onValueChange={(v) => setOrderBy(v as OrderBy)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Mais Recentes</SelectItem>
            <SelectItem value="rating_high">Melhor Avaliadas</SelectItem>
            <SelectItem value="rating_low">Pior Avaliadas</SelectItem>
            <SelectItem value="helpful">Mais Úteis</SelectItem>
          </SelectContent>
        </Select>

        <Tabs value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="verified">Verificadas</TabsTrigger>
            <TabsTrigger value="5_star">5★</TabsTrigger>
            <TabsTrigger value="4_star">4★</TabsTrigger>
            <TabsTrigger value="3_star">3★</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Lista de Avaliações */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Star className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p>Nenhuma avaliação encontrada com estes filtros</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onEdit={review.user_id === user?.id ? handleEditReview : undefined}
              onDelete={review.user_id === user?.id ? () => handleDeleteReview(review.id) : undefined}
              showBusinessResponse={true}
            />
          ))}
        </div>
      )}

      {/* Dialog do Formulário */}
      <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingReview ? "Editar Avaliação" : "Escrever Avaliação"}
            </DialogTitle>
            <DialogDescription>
              {businessName ? `Avalie a sua experiência com ${businessName}` : "Partilhe a sua experiência"}
            </DialogDescription>
          </DialogHeader>
          <ReviewForm
            businessId={businessId}
            existingReview={editingReview}
            onSuccess={() => {
              setShowReviewForm(false);
              setEditingReview(null);
            }}
            onCancel={() => {
              setShowReviewForm(false);
              setEditingReview(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
