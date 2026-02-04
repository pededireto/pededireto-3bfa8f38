import { Restaurant } from "@/data/mockData";
import RestaurantCard from "./RestaurantCard";
import { UtensilsCrossed } from "lucide-react";

interface RestaurantGridProps {
  restaurants: Restaurant[];
  title?: string;
}

const RestaurantGrid = ({ restaurants, title = "Todos os Restaurantes" }: RestaurantGridProps) => {
  if (restaurants.length === 0) {
    return (
      <section className="py-8 md:py-12">
        <div className="container">
          <div className="text-center py-16">
            <UtensilsCrossed className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum restaurante encontrado
            </h3>
            <p className="text-muted-foreground">
              Ainda não temos restaurantes nesta zona. Em breve!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 md:py-12">
      <div className="container">
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">
          {title}
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {restaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RestaurantGrid;
