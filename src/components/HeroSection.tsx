import { Zone } from "@/data/mockData";
import CitySelector from "./CitySelector";

interface HeroSectionProps {
  selectedZone: Zone | null;
  onSelectZone: (zone: Zone) => void;
}

const HeroSection = ({ selectedZone, onSelectZone }: HeroSectionProps) => {
  return (
    <section className="section-hero py-12 md:py-20">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center animate-fade-in">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
            Pede Direto
          </h1>
          <p className="text-lg md:text-xl text-primary font-medium mb-2">
            Do restaurante para ti.
          </p>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Descobre restaurantes locais com canais próprios de entrega. 
            Normalmente mais barato do que apps de delivery.
          </p>

          <CitySelector 
            selectedZone={selectedZone} 
            onSelectZone={onSelectZone} 
          />

          {selectedZone && (
            <p className="mt-6 text-sm text-muted-foreground animate-fade-in">
              A mostrar restaurantes em <span className="font-semibold text-foreground">{selectedZone.name}</span>
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
