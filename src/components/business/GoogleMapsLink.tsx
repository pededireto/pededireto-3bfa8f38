import { MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTrackEvent } from "@/hooks/useAnalytics";

interface GoogleMapsLinkProps {
  address: string;
  businessName?: string;
  variant?: "button" | "link" | "inline";
  businessId?: string;
  categoryId?: string;
  city?: string;
}

export const GoogleMapsLink = ({ address, businessName, variant = "button", businessId, categoryId, city }: GoogleMapsLinkProps) => {
  const trackEvent = useTrackEvent();
  if (!address?.trim()) return null;

  const handleClick = () => {
    if (businessId) {
      trackEvent.mutate({
        event_type: "click_address" as any,
        business_id: businessId,
        category_id: categoryId || undefined,
        city: city || undefined,
      });
    }
  };

  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    businessName ? `${businessName}, ${address}` : address
  )}`;

  if (variant === "button") {
    return (
      <Button variant="outline" size="sm" asChild onClick={handleClick}>
        <a href={url} target="_blank" rel="noopener noreferrer" onClick={handleClick}>
          <MapPin className="w-4 h-4" />
          Ver no Google Maps
          <ExternalLink className="w-3 h-3" />
        </a>
      </Button>
    );
  }

  if (variant === "link") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        onClick={handleClick}
      >
        <MapPin className="w-4 h-4" />
        {address}
        <ExternalLink className="w-3 h-3" />
      </a>
    );
  }

  // inline
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center text-primary hover:text-primary/80"
      title="Ver no Google Maps"
        onClick={handleClick}
    >
      <MapPin className="w-4 h-4" />
    </a>
  );
};
