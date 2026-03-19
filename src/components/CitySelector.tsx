import { MapPin } from "lucide-react";
import { useCities, type CityOption } from "@/hooks/useCities";
import { cn } from "@/lib/utils";

interface CitySelectorProps {
  selectedCity: string | null;
  onSelectCity: (city: string) => void;
}

const CitySelector = ({ selectedCity, onSelectCity }: CitySelectorProps) => {
  const { data: cities = [] } = useCities(10);

  if (cities.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 items-center justify-center">
      <div className="flex items-center gap-1.5 text-muted-foreground mr-2">
        <MapPin className="h-4 w-4" />
        <span className="text-sm font-medium">Onde?</span>
      </div>
      {cities.map((city) => (
        <button
          key={city.name}
          onClick={() => onSelectCity(city.name)}
          className={cn(
            "city-chip",
            selectedCity === city.name && "city-chip-active"
          )}
        >
          {city.name}
        </button>
      ))}
    </div>
  );
};

export default CitySelector;
