import { useState, useEffect } from "react";
import { zones, Zone, getRestaurantsByZone, getFeaturedRestaurants } from "@/data/mockData";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import FeaturedSection from "@/components/FeaturedSection";
import RestaurantGrid from "@/components/RestaurantGrid";

const Index = () => {
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

  // Default to Porto on first load
  useEffect(() => {
    if (!selectedZone) {
      setSelectedZone(zones[0]);
    }
  }, []);

  const featuredRestaurants = selectedZone 
    ? getFeaturedRestaurants(selectedZone.id)
    : getFeaturedRestaurants();

  const allRestaurants = selectedZone 
    ? getRestaurantsByZone(selectedZone.id).filter(r => !r.isFeatured)
    : [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <HeroSection 
          selectedZone={selectedZone} 
          onSelectZone={setSelectedZone} 
        />

        {selectedZone && (
          <>
            <FeaturedSection restaurants={featuredRestaurants} />
            
            <RestaurantGrid 
              restaurants={allRestaurants}
              title={`Mais restaurantes em ${selectedZone.name}`}
            />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
