import { useState, useEffect } from "react";
 import { useZones, Zone } from "@/hooks/useZones";
 import { useRestaurants, useFeaturedRestaurants } from "@/hooks/useRestaurants";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import FeaturedSection from "@/components/FeaturedSection";
import RestaurantGrid from "@/components/RestaurantGrid";
 import SuggestionForm from "@/components/SuggestionForm";
 import { Loader2 } from "lucide-react";

 const STORAGE_KEY = "pededireto_selected_zone";

const Index = () => {
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
   
   const { data: zones = [], isLoading: zonesLoading } = useZones();
   const { data: featuredRestaurants = [], isLoading: featuredLoading } = useFeaturedRestaurants(selectedZone?.id);
   const { data: allRestaurants = [], isLoading: restaurantsLoading } = useRestaurants(selectedZone?.id);

   // Load saved zone from localStorage on mount
  useEffect(() => {
     const savedZoneSlug = localStorage.getItem(STORAGE_KEY);
     if (savedZoneSlug && zones.length > 0) {
       const savedZone = zones.find(z => z.slug === savedZoneSlug);
       if (savedZone) {
         setSelectedZone(savedZone);
         return;
       }
     }
     // Default to first zone if no saved zone
     if (!selectedZone && zones.length > 0) {
       setSelectedZone(zones[0]);
     }
   }, [zones]);
 
   // Save selected zone to localStorage
   const handleSelectZone = (zone: Zone | null) => {
     setSelectedZone(zone);
     if (zone) {
       localStorage.setItem(STORAGE_KEY, zone.slug);
     } else {
       localStorage.removeItem(STORAGE_KEY);
    }
   };

   // Filter out featured restaurants from the main grid
   const nonFeaturedRestaurants = allRestaurants.filter(r => !r.is_featured);

   const isLoading = zonesLoading || featuredLoading || restaurantsLoading;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
         <HeroSection
           zones={zones}
           selectedZone={selectedZone}
           onSelectZone={handleSelectZone}
           isLoading={zonesLoading}
        />

         {zonesLoading ? (
           <div className="py-16 text-center">
             <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
             <p className="text-muted-foreground">A carregar zonas...</p>
           </div>
         ) : selectedZone && (
          <>
            <FeaturedSection restaurants={featuredRestaurants} />
            
             <RestaurantGrid
               restaurants={nonFeaturedRestaurants}
              title={`Mais restaurantes em ${selectedZone.name}`}
            />

             {/* Show suggestion form if no restaurants in zone */}
             {allRestaurants.length === 0 && !isLoading && (
               <div className="container pb-12">
                 <SuggestionForm searchTerm={selectedZone.name} />
               </div>
             )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
