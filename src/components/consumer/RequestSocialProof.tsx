import { Flame, Star, TrendingUp } from "lucide-react";
import type { SocialProof } from "@/hooks/useRequestSocialProof";

const RequestSocialProof = ({ data, city }: { data: SocialProof; city?: string | null }) => {
  if (data.similarRequests < 2 && !data.avgRating) return null;

  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
      {data.similarRequests >= 2 && (
        <span className="flex items-center gap-1.5">
          <Flame className="h-3.5 w-3.5 text-orange-500" />
          <span>
            <strong className="text-foreground">{data.similarRequests}</strong> pedidos semelhantes
            {city ? ` em ${city}` : ""} esta semana
          </span>
        </span>
      )}
      {data.avgRating && data.avgRating > 0 && (
        <span className="flex items-center gap-1.5">
          <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
          <span>
            Profissionais com média de{" "}
            <strong className="text-foreground">{data.avgRating.toFixed(1)}</strong> estrelas
          </span>
        </span>
      )}
      {data.similarRequests >= 5 && (
        <span className="flex items-center gap-1.5 text-primary font-medium">
          <TrendingUp className="h-3.5 w-3.5" />
          Serviço popular na sua zona
        </span>
      )}
    </div>
  );
};

export default RequestSocialProof;
