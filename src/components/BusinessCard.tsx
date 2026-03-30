import { useNavigate } from "react-router-dom";
import { BusinessWithCategory } from "@/hooks/useBusinesses";
import { PublicBusinessWithCategory } from "@/hooks/usePublicBusinesses";
import { useTrackEvent } from "@/hooks/useAnalytics";
import { PublicBadge } from "@/hooks/usePublicBadges";
import { BusinessCity } from "@/hooks/useBusinessCities";
import { MapPin, Globe, Phone, MessageCircle, ExternalLink, Star as StarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import FavoriteButton from "@/components/FavoriteButton";
import BadgePills from "@/components/BadgePills";

interface BusinessCardProps {
  business: BusinessWithCategory | PublicBusinessWithCategory;
  /** Pré-carregados pelo componente pai via useBatchPublicBadges */
  badges?: PublicBadge[];
  /** Pré-carregadas pelo componente pai via useBusinessCityNamesBatch */
  cities?: BusinessCity[];
}

const StarRating = ({ rating, count }: { rating: number; count: number }) => (
  <div className="flex items-center gap-1.5 mb-3">
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          className="w-4 h-4"
          fill={star <= Math.round(rating) ? "#f59e0b" : "none"}
          stroke={star <= Math.round(rating) ? "#f59e0b" : "currentColor"}
          strokeWidth={1.5}
        />
      ))}
    </div>
    <span className="text-sm font-semibold text-foreground">{rating.toFixed(1)}</span>
    <span className="text-xs text-muted-foreground">({count})</span>
  </div>
);

const BusinessCard = ({ business, badges = [], cities = [] }: BusinessCardProps) => {
  const trackEvent = useTrackEvent();
  const navigate = useNavigate();

  // Hooks removidos daqui — dados chegam via props do componente pai (batch)
  const stats = (business as any).business_review_stats;

  const handleCtaClick = (
    type: "whatsapp" | "phone" | "website" | "email" | "app" | "instagram" | "facebook" | "reservation" | "order",
  ) => {
    trackEvent.mutate({
      event_type: `click_${type}` as any,
      business_id: business.id,
      category_id: business.category_id || undefined,
      city: business.city || undefined,
    });
  };

  const getAlcanceLabel = () => {
    const cityNames = cities.length > 1 ? cities.map((c) => c.city_name).join(", ") : null;

    switch (business.alcance) {
      case "nacional":
        return "Entrega em todo o país";
      case "local":
        return cityNames
          ? `Atende em ${cityNames}`
          : business.city
            ? `Atende em ${business.city}`
            : "Atendimento local";
      case "hibrido":
        return cityNames
          ? `${cityNames} + envios nacionais`
          : business.city
            ? `${business.city} + envios nacionais`
            : "Local + envios nacionais";
      default:
        return null;
    }
  };

  const handleCardClick = () => {
    navigate(`/negocio/${business.slug}`);
  };

  return (
    <div
      className={`card-business cursor-pointer transition-shadow hover:shadow-md ${
        business.is_featured ? "card-featured" : ""
      }`}
      onClick={handleCardClick}
    >
      {/* Featured Badge */}
      {business.is_featured && (
        <div className="absolute top-3 right-3 z-10">
          <span className="badge-featured">
            <StarIcon className="w-3 h-3" />
            Destaque
          </span>
        </div>
      )}

      {/* Premium Badge */}
      {business.is_premium && !business.is_featured && (
        <div className="absolute top-3 right-3 z-10">
          <span className="badge-premium">Premium</span>
        </div>
      )}

      {/* Favorito */}
      <div className="absolute top-3 left-3 z-20" onClick={(e) => e.stopPropagation()}>
        <FavoriteButton businessId={business.id} className="bg-card/80 backdrop-blur-sm hover:bg-card shadow-sm" />
      </div>

      {/* Image/Logo */}
      <div className="relative aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden">
        {business.logo_url ? (
          <img
            src={business.logo_url}
            alt={business.name}
            className="max-w-full max-h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/10 p-3">
            <span className="text-base font-bold text-primary/40 text-center leading-tight line-clamp-3">
              {business.name}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Category */}
        {business.categories && (
          <span className="text-xs font-medium text-primary uppercase tracking-wide">{business.categories.name}</span>
        )}

        {/* Name */}
        <h3 className="font-bold text-lg mt-1 mb-1 group-hover:text-primary transition-colors line-clamp-1">
          {business.name}
        </h3>

        {/* Earned Badges */}
        {badges.length > 0 && (
          <div className="mb-2">
            <BadgePills badges={badges} max={2} />
          </div>
        )}

        {/* Description */}
        {business.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{business.description}</p>
        )}

        {/* Rating Stars */}
        {stats && stats.total_reviews > 0 && <StarRating rating={stats.average_rating} count={stats.total_reviews} />}

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          {business.alcance === "nacional" ? <Globe className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
          <span className="truncate">{getAlcanceLabel()}</span>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
          {business.cta_whatsapp && (business as any).show_whatsapp !== false && (
            <Button
              size="sm"
              className="btn-cta-whatsapp flex-1 min-w-[100px]"
              onClick={() => {
                handleCtaClick("whatsapp");
                window.open(`https://wa.me/${business.cta_whatsapp?.replace(/\D/g, "")}`, "_blank");
              }}
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </Button>
          )}

          {business.cta_phone && (
            <Button
              size="sm"
              className="btn-cta-phone flex-1 min-w-[100px]"
              onClick={() => {
                handleCtaClick("phone");
                window.open(`tel:${business.cta_phone}`, "_blank");
              }}
            >
              <Phone className="w-4 h-4" />
              Ligar
            </Button>
          )}

          {business.cta_website && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 min-w-[100px]"
              onClick={() => {
                handleCtaClick("website");
                window.open(business.cta_website!, "_blank");
              }}
            >
              <ExternalLink className="w-4 h-4" />
              Site
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessCard;
