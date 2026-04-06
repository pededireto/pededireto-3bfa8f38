import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  Phone,
  Mail,
  ExternalLink,
  Instagram,
  Facebook,
  CalendarCheck,
  ShoppingBag,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BusinessCTAPanelProps {
  business: any;
  responseTime?: { label: string } | null;
  sidebarBadges?: string[];
  badgeConfig?: Record<string, any>;
  onCtaClick: (type: string) => void;
  onGA4Lead: (type: string) => void;
  className?: string;
}

const BusinessCTAPanel = ({
  business,
  responseTime,
  sidebarBadges = [],
  badgeConfig = {},
  onCtaClick,
  onGA4Lead,
  className,
}: BusinessCTAPanelProps) => {
  const instagramUrl = business?.instagram_url || "";
  const facebookUrl = business?.facebook_url || "";
  const showSocial = business?.show_social !== false;
  const hasSocialLinks = showSocial && (instagramUrl || facebookUrl);
  const ctaBookingUrl = business?.cta_booking_url || "";
  const ctaOrderUrl = business?.cta_order_url || "";

  return (
    <div className={cn("bg-card rounded-2xl p-6 shadow-card space-y-4", className)}>
      <h3 className="text-xl font-bold">Resolva hoje o seu problema</h3>
      <p className="text-sm text-muted-foreground">Contacte diretamente — sem intermediários!</p>

      {responseTime && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-primary/20 bg-primary/5 text-sm font-medium text-primary">
          <Zap className="w-4 h-4 shrink-0" />
          Responde em média em {responseTime.label}
        </div>
      )}

      <div className="space-y-3 pt-2">
        {sidebarBadges.map((slug) => {
          const cfg = badgeConfig[slug];
          if (!cfg) return null;
          const Icon = cfg.icon;
          return (
            <div
              key={slug}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${cfg.bg} ${cfg.color}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {cfg.label} — responde em menos de 2h
            </div>
          );
        })}

        {ctaBookingUrl && (
          <Button
            variant="outline"
            className="w-full justify-center text-base hover:border-primary hover:text-primary transition-colors"
            onClick={() => {
              onCtaClick("reservation");
              onGA4Lead("booking");
              window.open(ctaBookingUrl, "_blank");
            }}
          >
            <CalendarCheck className="w-5 h-5" />
            Reservar/Agendar
          </Button>
        )}
        {ctaOrderUrl && (
          <Button
            variant="outline"
            className="w-full justify-center text-base hover:border-orange-500 hover:text-orange-500 transition-colors"
            onClick={() => {
              onCtaClick("order");
              onGA4Lead("order");
              window.open(ctaOrderUrl, "_blank");
            }}
          >
            <ShoppingBag className="w-5 h-5" />
            Pedir Online
          </Button>
        )}
        {business.cta_whatsapp && business.show_whatsapp !== false && (
          <Button
            className="btn-cta-whatsapp w-full justify-center text-base"
            onClick={() => {
              onCtaClick("whatsapp");
              onGA4Lead("whatsapp");
              window.open(`https://wa.me/${business.cta_whatsapp.replace(/\D/g, "")}`, "_blank");
            }}
          >
            <MessageCircle className="w-5 h-5" />
            WhatsApp
          </Button>
        )}
        {business.cta_phone && (
          <Button
            className="btn-cta-phone w-full justify-center text-base"
            onClick={() => {
              onCtaClick("phone");
              onGA4Lead("phone");
              window.open(`tel:${business.cta_phone}`, "_blank");
            }}
          >
            <Phone className="w-5 h-5" />
            Ligar Agora
          </Button>
        )}
        {business.cta_email && (
          <Button
            variant="outline"
            className="w-full justify-center text-base"
            onClick={() => {
              onCtaClick("email");
              onGA4Lead("email");
              window.open(`mailto:${business.cta_email}`, "_blank");
            }}
          >
            <Mail className="w-5 h-5" />
            Enviar Email
          </Button>
        )}
        {business.cta_website && (
          <Button
            variant="outline"
            className="w-full justify-center text-base"
            onClick={() => {
              onCtaClick("website");
              onGA4Lead("website");
              window.open(business.cta_website, "_blank");
            }}
          >
            <ExternalLink className="w-5 h-5" />
            Ver Website
          </Button>
        )}

        {hasSocialLinks && (
          <>
            <div className="border-t border-border pt-1" />
            {instagramUrl && (
              <Button
                variant="outline"
                className="w-full justify-center text-base hover:border-[#E1306C] hover:text-[#E1306C] transition-colors"
                onClick={() => {
                  onCtaClick("instagram");
                  window.open(instagramUrl, "_blank");
                }}
              >
                <Instagram className="w-5 h-5" />
                Ver Instagram
              </Button>
            )}
            {facebookUrl && (
              <Button
                variant="outline"
                className="w-full justify-center text-base hover:border-[#1877F2] hover:text-[#1877F2] transition-colors"
                onClick={() => {
                  onCtaClick("facebook");
                  window.open(facebookUrl, "_blank");
                }}
              >
                <Facebook className="w-5 h-5" />
                Ver Facebook
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BusinessCTAPanel;
