import { MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GoogleMapsLinkProps {
  address: string;
  businessName?: string;
  variant?: "button" | "link" | "inline";
}

export const GoogleMapsLink = ({ address, businessName, variant = "button" }: GoogleMapsLinkProps) => {
  if (!address?.trim()) return null;

  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    businessName ? `${businessName}, ${address}` : address
  )}`;

  if (variant === "button") {
    return (
      <Button variant="outline" size="sm" asChild>
        <a href={url} target="_blank" rel="noopener noreferrer">
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
    >
      <MapPin className="w-4 h-4" />
    </a>
  );
};
