import { useNavigate } from "react-router-dom";
import { MapPin, ArrowRight } from "lucide-react";
import { useCities } from "@/hooks/useCities";
import { Skeleton } from "@/components/ui/skeleton";

const CityFilterBar = () => {
  const navigate = useNavigate();
  const { data: cities = [], isLoading } = useCities(20);

  const handleCityClick = (cityName: string) => {
    navigate(`/pesquisa?cidade=${encodeURIComponent(cityName)}`);
  };

  if (isLoading) {
    return (
      <section className="py-6 bg-muted/30 border-b border-border">
        <div className="container">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-5 w-64" />
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-full" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (cities.length === 0) return null;

  return (
    <section className="py-6 bg-muted/30 border-b border-border" aria-label="Filtrar por cidade">
      <div className="container">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Ver todos os negócios na sua cidade
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {cities.map((city) => (
            <button
              key={city.name}
              onClick={() => handleCityClick(city.name)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border border-border bg-card hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-colors group"
            >
              <MapPin className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
              {city.name}
              <span className="text-xs text-muted-foreground ml-0.5">({city.count})</span>
              <ArrowRight className="h-3 w-3 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CityFilterBar;
