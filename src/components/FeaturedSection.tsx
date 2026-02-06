import { BusinessWithCategory } from "@/hooks/useBusinesses";
import BusinessCard from "./BusinessCard";
import { Star } from "lucide-react";

interface FeaturedSectionProps {
  businesses: BusinessWithCategory[];
  isLoading?: boolean;
}

const FeaturedSection = ({ businesses, isLoading }: FeaturedSectionProps) => {
  if (isLoading) {
    return (
      <section className="py-12 bg-primary/5">
        <div className="container">
          <div className="flex items-center gap-3 mb-8">
            <Star className="w-6 h-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">Destaques</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card-business animate-pulse">
                <div className="h-40 bg-muted" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-muted rounded w-20" />
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (businesses.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-primary/5">
      <div className="container">
        <div className="flex items-center gap-3 mb-8">
          <Star className="w-6 h-6 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold">Destaques</h2>
          <span className="text-muted-foreground">Negócios recomendados</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((business) => (
            <BusinessCard key={business.id} business={business} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedSection;
