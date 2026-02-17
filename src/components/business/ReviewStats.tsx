import { Star } from "lucide-react";
import { useBusinessReviewStats } from "@/hooks/useBusinessReviews";
import { Progress } from "@/components/ui/progress";

interface ReviewStatsProps {
  businessId: string;
}

export const ReviewStats = ({ businessId }: ReviewStatsProps) => {
  const { data: stats, isLoading } = useBusinessReviewStats(businessId);

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-20 bg-muted rounded" />
        <div className="h-32 bg-muted rounded" />
      </div>
    );
  }

  if (!stats || stats.total_reviews === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Star className="w-12 h-12 mx-auto mb-2 opacity-20" />
        <p className="text-sm">Ainda sem avaliações</p>
        <p className="text-xs mt-1">Seja o primeiro a avaliar!</p>
      </div>
    );
  }

  const ratingData = [
    { stars: 5, count: stats.rating_5_count, percent: stats.rating_5_percent },
    { stars: 4, count: stats.rating_4_count, percent: stats.rating_4_percent },
    { stars: 3, count: stats.rating_3_count, percent: stats.rating_3_percent },
    { stars: 2, count: stats.rating_2_count, percent: stats.rating_2_percent },
    { stars: 1, count: stats.rating_1_count, percent: stats.rating_1_percent },
  ];

  return (
    <div className="space-y-6">
      {/* Resumo Geral */}
      <div className="flex items-center gap-6">
        <div className="text-center">
          <div className="text-5xl font-bold">{stats.average_rating.toFixed(1)}</div>
          <div className="flex items-center justify-center gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= Math.round(stats.average_rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {stats.total_reviews} {stats.total_reviews === 1 ? "avaliação" : "avaliações"}
          </div>
          {stats.verified_reviews_count > 0 && (
            <div className="text-xs text-primary mt-1">
              {stats.verified_reviews_count} verificadas
            </div>
          )}
        </div>

        {/* Gráfico de Barras */}
        <div className="flex-1 space-y-2">
          {ratingData.map((item) => (
            <div key={item.stars} className="flex items-center gap-2">
              <div className="flex items-center gap-1 w-12">
                <span className="text-sm">{item.stars}</span>
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              </div>
              <Progress value={item.percent} className="flex-1 h-2" />
              <span className="text-xs text-muted-foreground w-12 text-right">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
