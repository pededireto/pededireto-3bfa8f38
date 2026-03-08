import { ClipboardList, MessageCircle, Heart, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ConsumerMetricsBarProps {
  requestsCount: number;
  unreadCount: number;
  favoritesCount: number;
  reviewsCount: number;
}

const metrics = [
  { key: "requests", icon: ClipboardList, label: "Pedidos" },
  { key: "unread", icon: MessageCircle, label: "Não lidas" },
  { key: "favorites", icon: Heart, label: "Favoritos" },
  { key: "reviews", icon: Star, label: "Avaliações" },
] as const;

const ConsumerMetricsBar = ({
  requestsCount,
  unreadCount,
  favoritesCount,
  reviewsCount,
}: ConsumerMetricsBarProps) => {
  const values: Record<string, number> = {
    requests: requestsCount,
    unread: unreadCount,
    favorites: favoritesCount,
    reviews: reviewsCount,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {metrics.map(({ key, icon: Icon, label }) => (
        <Card key={key} className="bg-card border">
          <CardContent className="flex items-center gap-3 py-4 px-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground leading-none">
                {values[key]}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ConsumerMetricsBar;
