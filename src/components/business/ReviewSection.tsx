import { useState } from "react";
import { Star, Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  useBusinessReviews,
  useUserReviewForBusiness,
  useDeleteReview,
  useBusinessReviewStats,
} from "@/hooks/useBusinessReviews";
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
  isOwner?: boolean;
}

type OrderBy = "recent" | "rating_high" | "rating_low" | "helpful";
type FilterType = "all" | "verified" | "5_star" | "4_star" | "3_star" | "2_star" | "1_star";

const REVIEWS_LIMIT = 5;

export const ReviewSection = ({ businessId, businessName, isOwner }: ReviewSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [orderBy, setOrderBy] = useState<OrderBy>("recent");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<any>(null);
  const [showAll, setShowAll] = useState(false);

  const filters = {
    orderBy,
    verified: filterType === "verified",
    minRating: filterType.includes("star") ? parseInt(filterType[0]) : undefined,
  };

  // ── reviews com filtros activos (para a lista) ──
  const { data: reviews = [], isLoading } = useBusinessReviews(businessId, filters);

  // ── reviews sem filtro (para saber se existem reviews no total) ──
  const { data: allReviews = [] } = useBusinessReviews(businessId, { orderBy: "recent" });

  const { data: stats } = useBusinessReviewStats(businessId);

  // ── review do utilizador actual (sem filtro de moderation_status) ──
  // Isto garante que mesmo com review "pending" o utilizador não vê o botão de avaliar
  const { data: userReview } = useUserReviewForBusiness(businessId);

  const deleteReview = useDeleteReview();

  // Utilizador já avaliou se tem qualquer review (aprovada ou pendente)
  const hasUserReview = !!userReview;

  const displayedReviews = showAll ? reviews : reviews.slice(0, REVIEWS_LIMIT);
  const hasMore = reviews.length > REVIEWS_LIMIT;

  // Total real de reviews aprovadas (independente do filtro activo)
  const totalApprovedReviews = stats?.total_reviews ?? allReviews.length;
  const hasAnyReviews = totalApprovedReviews > 0;

  // Filtros activos produzem resultados?
  const isFiltered = filterType !== "all" || orderBy !== "recent";
  const filteredIsEmpty = reviews.length === 0 && hasAnyReviews;

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

  // Pode avaliar: autenticado, não é dono, e ainda NÃO tem nenhuma review (nem pending)
  const canReview = !!user && !hasUserReview && !isOwner;

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="bg-card rounded-2xl p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold">Avaliações</h3>
          {stats && stats.total_reviews > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="text-xl font-bold">{stats.average_rating.toFixed(1)}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                ({stats.total_reviews} {stats.total_reviews === 1 ? "avaliação" : "avaliações"})
              </span>
            </div>
          )}
        </div>
        <ReviewStats businessId={businessId} />
      </div>

      {/* CTA para utilizador autenticado que ainda não avaliou */}
      {canReview && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
          <Star className="w-12 h-12 mx-auto mb-3 text-primary" />
          <h4 className="font-semibold mb-2">Já usou este serviço?</h4>
          <p className="text-sm text-muted-foreground mb-4">Partilhe a sua experiência e ajude outros clientes!</p>
          <Button onClick={() => setShowReviewForm(true)} className="min-h-[48px] text-base">
            <Plus className="w-4 h-4 mr-2" />
            Escrever Avaliação
          </Button>
        </div>
      )}

      {/* Review pendente do utilizador — aviso discreto */}
      {user && hasUserReview && userReview?.moderation_status === "pending" && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          ⏳ A sua avaliação está a aguardar moderação e será publicada em breve.
        </div>
      )}

      {/* Review aprovada do utilizador */}
      {user && hasUserReview && userReview?.moderation_status === "approved" && (
        <div className="bg-muted/50 border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm">A Sua Avaliação</h4>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleEditReview}>
                Editar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleDeleteReview(userReview.id)}>
                Apagar
              </Button>
            </div>
          </div>
          <ReviewCard review={userReview} showBusinessResponse={true} />
        </div>
      )}

      {/* CTA para utilizador não autenticado — só mostra se há reviews ou se é um negócio activo */}
      {!user && hasAnyReviews && (
        <div className="bg-muted/50 border rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">Faça login para deixar uma avaliação</p>
          <Link to="/login">
            <Button variant="outline">Entrar</Button>
          </Link>
        </div>
      )}

      {/* Filtros — só aparecem se existem reviews */}
      {hasAnyReviews && (
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
      )}

      {/* Lista de reviews */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !hasAnyReviews ? (
        // Empty state REAL — o negócio não tem nenhuma avaliação aprovada
        <div className="text-center py-12 text-muted-foreground">
          <Star className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="font-medium">Ainda sem avaliações.</p>
          {canReview && <p className="text-sm mt-1">Seja o primeiro a avaliar!</p>}
        </div>
      ) : filteredIsEmpty ? (
        // Filtro activo não tem resultados, mas o negócio TEM avaliações
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Nenhuma avaliação corresponde aos filtros seleccionados.</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => {
              setFilterType("all");
              setOrderBy("recent");
            }}
          >
            Limpar filtros
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onEdit={review.user_id === user?.id ? handleEditReview : undefined}
              onDelete={review.user_id === user?.id ? () => handleDeleteReview(review.id) : undefined}
              showBusinessResponse={true}
            />
          ))}

          {hasMore && !showAll && (
            <div className="text-center pt-2">
              <Button variant="outline" onClick={() => setShowAll(true)}>
                Ver todas as {reviews.length} avaliações
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Review Form Dialog */}
      <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingReview ? "Editar Avaliação" : "Escrever Avaliação"}</DialogTitle>
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
              toast({
                title: "Avaliação submetida!",
                description: editingReview ? "A sua avaliação foi atualizada." : "Obrigado pelo feedback!",
              });
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
