import { BusinessWithCategory } from "@/hooks/useBusinesses";
import { PublicBusinessWithCategory } from "@/hooks/usePublicBusinesses";
import { useBatchPublicBadges } from "@/hooks/usePublicBadges";
import { useBusinessCityNamesBatch } from "@/hooks/useBusinessCities";
import BusinessCard from "@/components/BusinessCard";
import { Loader2 } from "lucide-react";

interface BusinessGridProps {
  businesses: (BusinessWithCategory | PublicBusinessWithCategory)[];
  title?: string;
  subtitle?: string;
  isLoading?: boolean;
  emptyMessage?: string;
}

const BusinessGrid = ({
  businesses,
  title,
  subtitle,
  isLoading,
  emptyMessage = "Nenhum negócio encontrado",
}: BusinessGridProps) => {
  // ── Batch queries — UMA query por tipo para toda a lista ──────────────────
  const businessIds = businesses.map((b) => b.id);
  const { data: badgesMap = new Map() } = useBatchPublicBadges(businessIds);
  const { data: citiesMap = new Map() } = useBusinessCityNamesBatch(businessIds);
  // ─────────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <section className="py-12">
        <div className="container">
          {title && (
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
              {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
            </div>
          )}
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (businesses.length === 0) {
    return (
      <section className="py-12">
        <div className="container">
          {title && (
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
              {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
            </div>
          )}
          <div className="text-center py-12 bg-muted/50 rounded-2xl">
            <p className="text-muted-foreground">{emptyMessage}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <div className="container">
        {title && (
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
            {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {businesses.map((business) => (
            <BusinessCard
              key={business.id}
              business={business}
              badges={badgesMap.get(business.id) ?? []}
              cities={citiesMap.get(business.id) ?? []}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default BusinessGrid;
