import { Link } from "react-router-dom";
import { MapPin, Star } from "lucide-react";
import { Restaurant } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface RestaurantCardProps {
  restaurant: Restaurant;
  variant?: "default" | "featured";
}

const RestaurantCard = ({ restaurant, variant = "default" }: RestaurantCardProps) => {
  const isFeatured = variant === "featured" || restaurant.isFeatured;

  return (
    <Link
      to={`/restaurante/${restaurant.slug}`}
      className={cn(
        "card-restaurant group block",
        isFeatured && "card-featured ring-2 ring-primary/20"
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={restaurant.logo}
          alt={restaurant.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {isFeatured && (
          <div className="absolute top-3 left-3">
            <span className="badge-featured">
              <Star className="h-3 w-3 fill-current" />
              Destaque
            </span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className="badge-pede-direto">Pede Direto</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {restaurant.name}
          </h3>
        </div>
        
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-xs font-medium">
            {restaurant.category}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {restaurant.zoneName}
          </span>
        </div>

        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
          {restaurant.description}
        </p>
      </div>
    </Link>
  );
};

export default RestaurantCard;
