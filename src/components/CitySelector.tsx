import { MapPin } from "lucide-react";
import { zones, Zone } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface CitySelectorProps {
  selectedZone: Zone | null;
  onSelectZone: (zone: Zone) => void;
}

const CitySelector = ({ selectedZone, onSelectZone }: CitySelectorProps) => {
  return (
    <div className="flex flex-wrap gap-2 items-center justify-center">
      <div className="flex items-center gap-1.5 text-muted-foreground mr-2">
        <MapPin className="h-4 w-4" />
        <span className="text-sm font-medium">Onde?</span>
      </div>
      {zones.map((zone) => (
        <button
          key={zone.id}
          onClick={() => onSelectZone(zone)}
          className={cn(
            "city-chip",
            selectedZone?.id === zone.id && "city-chip-active"
          )}
        >
          {zone.name}
        </button>
      ))}
    </div>
  );
};

export default CitySelector;
