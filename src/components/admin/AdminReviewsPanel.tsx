import { useState } from "react";
import { Star, Shield, Flag, CheckCircle, XCircle, Search, Filter, Loader2, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAllReviews, useModerateReview, useDeleteReview, type BusinessReview } from "@/hooks/useBusinessReviews";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const AdminReviewsPanel = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedReview, setSelectedReview] = useState<BusinessReview | null>(null);
  const [responseText, setResponseText] = useState("");

  const { data: reviews = [], isPending } = useAllReviews({ status: statusFilter });
  const moderateReview = useModerateReview();
  const deleteReview = useDeleteReview();

  // Fetch business names for display
  const businessIds = [...new Set(reviews.map(r => r.business_id))];
  const { data: businesses = [] } = useQuery({
    queryKey: ["review-businesses", businessIds],
    queryFn: async () => {
      if (businessIds.length === 0) return [];
      const { data } = await supabase
        .from("businesses")
        .select("id, name")
        .in("id", businessIds);
      return data || [];
    },
    enabled: businessIds.length > 0,
  });

  const businessMap = Object.fromEntries(businesses.map(b => [b.id, b.name]));

  const filteredReviews = reviews.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.title?.toLowerCase().includes(s) ||
      r.comment?.toLowerCase().includes(s) ||
      businessMap[r.business_id]?.toLowerCase().includes(s)
    );
  });

  const totalCount = reviews.length;
  const pendingCount = reviews.filter(r => r.moderation_status === "pending").length;
  const flaggedCount = reviews.filter(r => r.is_flagged).length;
  const avgRating = totalCount > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalCount).toFixed(1) : "—";

  const handleModerate = async (reviewId: string, status: "approved" | "rejected") => {
    try {
      await moderateReview.mutateAsync({ reviewId, status });
      toast.success(status === "approved" ? "Review aprovada" : "Review rejeitada");
    } catch {
      toast.error("Erro ao moderar review");
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Tens a certeza que queres apagar esta avaliação?")) return;
    try {
      await deleteReview.mutateAsync(reviewId);
      toast.success("Review apagada");
    } catch {
      toast.error("Erro ao apagar review");
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`h-4 w-4 ${i <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );

  const statusBadge = (status: string) => {
    const variants: Record<string, string> = {
      approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    };
    return <Badge className={variants[status] || ""}>{status}</Badge>;
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gestão de Avaliações</h2>
        <p className="text-muted-foreground">Moderar e gerir avaliações da plataforma</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalCount}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{flaggedCount}</p>
                <p className="text-xs text-muted-foreground">Denunciadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold">{avgRating}</p>
                <p className="text-xs text-muted-foreground">Média</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Pesquisar por título, comentário ou negócio..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="approved">Aprovadas</SelectItem>
            <SelectItem value="rejected">Rejeitadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhuma avaliação encontrada.</p>
            </CardContent>
          </Card>
        ) : (
          filteredReviews.map(review => (
            <Card key={review.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {renderStars(review.rating)}
                      {statusBadge(review.moderation_status)}
                      {review.is_flagged && <Badge variant="destructive" className="text-xs">🚩 Denunciada</Badge>}
                      {review.is_verified && <Badge variant="outline" className="text-xs">✓ Verificada</Badge>}
                    </div>
                    <p className="font-medium text-sm">{businessMap[review.business_id] || "Negócio desconhecido"}</p>
                    {review.title && <p className="font-semibold">{review.title}</p>}
                    {review.comment && <p className="text-sm text-muted-foreground line-clamp-2">{review.comment}</p>}
                    {review.business_response && (
                      <div className="bg-muted/50 rounded-lg p-3 mt-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Resposta do negócio:</p>
                        <p className="text-sm">{review.business_response}</p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {review.moderation_status === "pending" && (
                      <>
                        <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleModerate(review.id, "approved")}>
                          <CheckCircle className="h-4 w-4 mr-1" /> Aprovar
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleModerate(review.id, "rejected")}>
                          <XCircle className="h-4 w-4 mr-1" /> Rejeitar
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(review.id)}>
                      Apagar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminReviewsPanel;
