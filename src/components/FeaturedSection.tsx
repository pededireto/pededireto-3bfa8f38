import { Restaurant } from "@/data/mockData";
import RestaurantCard from "./RestaurantCard";
import { Sparkles } from "lucide-react";

interface FeaturedSectionProps {
  restaurants: Restaurant[];
}

const FeaturedSection = ({ restaurants }: FeaturedSectionProps) => {
  if (restaurants.length === 0) return null;

  return (
    <section className="py-8 md:py-12">
      <div className="container">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            Restaurantes em Destaque
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {restaurants.slice(0, 4).map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              variant="featured"
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedSection;
