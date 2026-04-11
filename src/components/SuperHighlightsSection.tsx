import { useSuperHighlights } from "@/hooks/useSuperHighlights";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Crown, MessageCircle, Phone, ExternalLink } from "lucide-react";

interface SuperHighlightsSectionProps {
  config?: Record<string, any> | null;
}

const SuperHighlightsSection = ({ config }: SuperHighlightsSectionProps) => {
  const { data: settings } = useSiteSettings();
  const enabled = settings?.super_highlights_enabled !== "false";
  const limit = config?.max_items || parseInt(settings?.super_highlights_limit || "6", 10);
  const titulo = config?.titulo || "Super Destaques";
  const mostrarBadge = config?.mostrar_badge !== false;
  const { data: highlights = [], isLoading } = useSuperHighlights(limit);

  if (!enabled || (!isLoading && highlights.length === 0)) return null;

  if (isLoading) {
    return (
      <section className="py-12 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container">
          <div className="flex items-center gap-3 mb-8">
            <Crown className="w-6 h-6 text-accent" />
            <h2 className="text-2xl md:text-3xl font-bold">Super Destaques</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card-business animate-pulse">
                <div className="h-40 bg-muted" />
                <div className="p-5 space-y-3">
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

  return (
    <section className="py-12 bg-gradient-to-b from-primary/5 to-transparent">
      <div className="container">
        <div className="flex items-center gap-3 mb-8">
          <Crown className="w-6 h-6 text-accent" />
          <h2 className="text-2xl md:text-3xl font-bold">Super Destaques</h2>
          <span className="text-muted-foreground">Os melhores da plataforma</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {highlights.map((business) => (
            <div key={business.id} className="card-business card-featured border-2 border-accent/30 relative overflow-hidden">
              {/* Premium badge */}
              <div className="absolute top-3 right-3 z-10">
                <span className="badge-premium">
                  <Crown className="w-3 h-3" />
                  Super Destaque
                </span>
              </div>

              {/* Logo */}
              <div className="aspect-[4/3] bg-muted relative flex items-center justify-center">
                {business.logo_url ? (
                  <img src={business.logo_url} alt={business.name} className="max-w-full max-h-full object-contain p-2" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 p-3">
                    <span className="text-base font-bold text-primary/40 text-center leading-tight line-clamp-3">{business.name}</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                {business.categories && (
                  <span className="text-xs font-medium text-primary uppercase tracking-wide">
                    {business.categories.name}
                  </span>
                )}
                <h3 className="font-bold text-lg mt-1 mb-2">
                  <Link to={`/negocio/${business.slug}`} className="hover:text-primary transition-colors">
                    {business.name}
                  </Link>
                </h3>
                {business.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{business.description}</p>
                )}

                {/* Quick CTA */}
                <div className="flex gap-2">
                  {business.cta_whatsapp && (
                    <Button size="sm" className="btn-cta-whatsapp flex-1" onClick={() => window.open(`https://wa.me/${business.cta_whatsapp!.replace(/\D/g, "")}`, "_blank")}>
                      <MessageCircle className="w-4 h-4" /> WhatsApp
                    </Button>
                  )}
                  {business.cta_phone && !business.cta_whatsapp && (
                    <Button size="sm" className="btn-cta-phone flex-1" onClick={() => window.open(`tel:${business.cta_phone}`, "_blank")}>
                      <Phone className="w-4 h-4" /> Ligar
                    </Button>
                  )}
                  {business.cta_website && (
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => window.open(business.cta_website!, "_blank")}>
                      <ExternalLink className="w-4 h-4" /> Website
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SuperHighlightsSection;
