import { Link } from "react-router-dom";
import { BusinessWithCategory } from "@/hooks/useBusinesses";
import { useTrackEvent } from "@/hooks/useAnalytics";
import { 
  MapPin, 
  Globe, 
  Phone, 
  MessageCircle, 
  ExternalLink,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import FavoriteButton from "@/components/FavoriteButton";

interface BusinessCardProps {
  business: BusinessWithCategory;
}

const BusinessCard = ({ business }: BusinessCardProps) => {
  const trackEvent = useTrackEvent();

  const handleCtaClick = (type: "whatsapp" | "phone" | "website" | "email" | "app") => {
    trackEvent.mutate({
      event_type: `click_${type}` as any,
      business_id: business.id,
      category_id: business.category_id || undefined,
      city: business.city || undefined,
    });
  };

  const getAlcanceLabel = () => {
    switch (business.alcance) {
      case "nacional":
        return "Entrega em todo o país";
      case "local":
        return business.city ? `Atende em ${business.city}` : "Atendimento local";
      case "hibrido":
        return business.city ? `${business.city} + envios nacionais` : "Local + envios nacionais";
      default:
        return null;
    }
  };

  return (
    <div className={`card-business ${business.is_featured ? "card-featured" : ""}`}>
      {/* Featured Badge */}
      {business.is_featured && (
        <div className="absolute top-3 right-3 z-10">
          <span className="badge-featured">
            <Star className="w-3 h-3" />
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

      {/* Favorite Button */}
      <div className="absolute top-3 left-3 z-10">
        <FavoriteButton businessId={business.id} className="bg-card/80 backdrop-blur-sm hover:bg-card" />
      </div>

      {/* Image/Logo */}
      <div className="relative aspect-[4/3] bg-muted flex items-center justify-center">
        {business.logo_url ? (
          <img
            src={business.logo_url}
            alt={business.name}
            className="max-w-full max-h-full object-contain p-2"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/10">
            <span className="text-4xl font-bold text-primary/40">
              {business.name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Category */}
        {business.categories && (
          <span className="text-xs font-medium text-primary uppercase tracking-wide">
            {business.categories.name}
          </span>
        )}

        {/* Name */}
        <h3 className="font-bold text-lg mt-1 mb-2">
          <Link 
            to={`/negocio/${business.slug}`}
            className="hover:text-primary transition-colors"
          >
            {business.name}
          </Link>
        </h3>

        {/* Description */}
        {business.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {business.description}
          </p>
        )}

        {/* Location Badge */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          {business.alcance === "nacional" ? (
            <Globe className="w-4 h-4" />
          ) : (
            <MapPin className="w-4 h-4" />
          )}
          <span>{getAlcanceLabel()}</span>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap gap-2">
          {business.cta_whatsapp && (business as any).show_whatsapp !== false && (
            <Button
              size="sm"
              className="btn-cta-whatsapp flex-1"
              onClick={() => {
                handleCtaClick("whatsapp");
                window.open(`https://wa.me/${business.cta_whatsapp.replace(/\D/g, "")}`, "_blank");
              }}
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </Button>
          )}
          
          {business.cta_phone && (
            <Button
              size="sm"
              className="btn-cta-phone flex-1"
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
              className="flex-1"
              onClick={() => {
                handleCtaClick("website");
                window.open(business.cta_website!, "_blank");
              }}
            >
              <ExternalLink className="w-4 h-4" />
              Website
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessCard;
