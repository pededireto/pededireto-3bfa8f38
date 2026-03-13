import { useParams, Link, useNavigate } from "react-router-dom";
import { useBusiness } from "@/hooks/useBusinesses";
import { useTrackEvent } from "@/hooks/useAnalytics";
import { useActiveBusinessModules, useBusinessModuleValues } from "@/hooks/useBusinessModules";
import { useBusinessNavigation } from "@/hooks/useCategoryBusinesses";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBusinessTopPosition } from "@/hooks/useTopRanking";
import { useBusinessResponseTime } from "@/hooks/useBusinessResponseTime";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FavoriteButton from "@/components/FavoriteButton";
import ShareButton from "@/components/ShareButton";
import { UnclaimedBusinessBanner } from "@/components/business/UnclaimedBusinessBanner";
import { ReviewSection } from "@/components/business/ReviewSection";
import BusinessNavigation from "@/components/BusinessNavigation";
import BusinessSuggestionForm from "@/components/BusinessSuggestionForm";
import { GoogleMapsLink } from "@/components/business/GoogleMapsLink";
import VideoPlayer from "@/components/business/VideoPlayer";
import { Button } from "@/components/ui/button";

import {
  ArrowLeft,
  MapPin,
  Globe,
  Phone,
  MessageCircle,
  ExternalLink,
  Mail,
  Clock,
  Star,
  Settings,
  ShieldCheck,
  Trophy,
  Zap,
  Medal,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Instagram,
  Facebook,
  CalendarCheck,
  ShoppingBag,
} from "lucide-react";

const BASE_URL = "https://pededireto.pt";

// ─────────────────────────────────────────────
// Lightbox Component
// ─────────────────────────────────────────────
interface LightboxProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

const Lightbox = ({ images, initialIndex, onClose }: LightboxProps) => {
  const [current, setCurrent] = useState(initialIndex);

  const prev = useCallback(() => {
    setCurrent((i) => (i === 0 ? images.length - 1 : i - 1));
  }, [images.length]);

  const next = useCallback(() => {
    setCurrent((i) => (i === images.length - 1 ? 0 : i + 1));
  }, [images.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, prev, next]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm" onClick={onClose}>
      <button
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </button>

      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-white/10 text-white text-sm font-medium">
          {current + 1} / {images.length}
        </div>
      )}

      {images.length > 1 && (
        <button
          className="absolute left-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      <div
        className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          key={current}
          src={images[current]}
          alt={`Imagem ${current + 1}`}
          className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
          style={{ animation: "fadeIn 0.2s ease" }}
        />
      </div>

      {images.length > 1 && (
        <button
          className="absolute right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2 rounded-2xl bg-black/40 backdrop-blur-sm">
          {images.map((url, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setCurrent(i);
              }}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                i === current ? "border-white scale-110" : "border-white/30 opacity-60 hover:opacity-90"
              }`}
            >
              <img src={url} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

// ─────────────────────────────────────────────
// Gallery Grid Component
// ─────────────────────────────────────────────
interface GalleryGridProps {
  images: string[];
  label?: string;
}

const GalleryGrid = ({ images, label }: GalleryGridProps) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  return (
    <div>
      {label && <span className="text-sm font-medium block mb-2">{label}</span>}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {images.map((url, i) => (
          <button
            key={i}
            onClick={() => setLightboxIndex(i)}
            className="group relative aspect-square rounded-lg overflow-hidden bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <img
              src={url}
              alt={`Foto ${i + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
              <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 drop-shadow-lg" />
            </div>
          </button>
        ))}
      </div>
      {lightboxIndex !== null && (
        <Lightbox images={images} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// Hook para buscar badges públicos do negócio
// ─────────────────────────────────────────────
const usePublicBadges = (businessId: string | undefined) => {
  return useQuery({
    queryKey: ["public-badges", businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const { data, error } = await supabase.rpc("get_business_public_badges" as any, { p_business_id: businessId });
      if (error) throw error;
      return (data || []) as { badge_name: string; badge_slug: string }[];
    },
    enabled: !!businessId,
  });
};

const BADGE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  verified: {
    icon: ShieldCheck,
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-100 dark:bg-emerald-900/50 border-emerald-400 dark:border-emerald-600",
    label: "Verificado",
  },
  "lider-local": {
    icon: Trophy,
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-100 dark:bg-amber-900/50 border-amber-400 dark:border-amber-600",
    label: "Líder Local",
  },
  "top-avaliado": {
    icon: Star,
    color: "text-yellow-700 dark:text-yellow-300",
    bg: "bg-yellow-100 dark:bg-yellow-900/50 border-yellow-400 dark:border-yellow-600",
    label: "Top Avaliado",
  },
  "resposta-rapida": {
    icon: Zap,
    color: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-100 dark:bg-blue-900/50 border-blue-400 dark:border-blue-600",
    label: "Resposta Rápida",
  },
  "founding-member": {
    icon: Medal,
    color: "text-white",
    bg: "bg-gradient-to-r from-violet-600 to-indigo-600 border-violet-500",
    label: "Membro Fundador",
  },
};

const NAME_BADGE_SLUGS = ["verified", "lider-local", "top-avaliado"];
const SIDEBAR_BADGE_SLUGS = ["resposta-rapida"];
const RIBBON_BADGE_SLUGS = ["founding-member"];

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
const BusinessPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: business, isLoading } = useBusiness(slug);
  const { user } = useAuth();
  const navigate = useNavigate();
  const trackEvent = useTrackEvent();
  const { data: activeModules = [] } = useActiveBusinessModules();
  const { data: moduleValues = [] } = useBusinessModuleValues(business?.id);
  const { data: publicBadges = [] } = usePublicBadges(business?.id);
  const { data: topPosition } = useBusinessTopPosition(business?.id);
  const { data: responseTime } = useBusinessResponseTime(business?.id);

  const [showSuggestionForm, setShowSuggestionForm] = useState(false);

  const cityFilter = business?.city || null;

  const { previousBusiness, nextBusiness, isLastBusiness, currentPosition, totalBusinesses, hasFilter } =
    useBusinessNavigation(business?.category_id, slug, cityFilter);

  const badgesBySlug = new Set(publicBadges.map((b) => b.badge_slug));
  const nameBadges = NAME_BADGE_SLUGS.filter((s) => badgesBySlug.has(s));
  const sidebarBadges = SIDEBAR_BADGE_SLUGS.filter((s) => badgesBySlug.has(s));
  const ribbonBadges = RIBBON_BADGE_SLUGS.filter((s) => badgesBySlug.has(s));

  // ── Redes sociais ──
  const instagramUrl = (business as any)?.instagram_url || "";
  const facebookUrl = (business as any)?.facebook_url || "";
  const showSocial = (business as any)?.show_social !== false;
  const hasSocialLinks = showSocial && (instagramUrl || facebookUrl);

  // ── CTAs de acção directa ──
  const ctaBookingUrl = (business as any)?.cta_booking_url || "";
  const ctaOrderUrl = (business as any)?.cta_order_url || "";

  // ── Vídeo VSL ──
  const videoUrl = (() => {
    if (!business) return "";
    // Primeiro tenta campo directo de vídeo no negócio
    const directVideo = (business as any)?.video_url || "";
    if (directVideo) return directVideo;
    // Depois tenta módulos dinâmicos de tipo vídeo
    const videoModule = activeModules.find((m) => m.type === "video" && m.is_public_default);
    if (videoModule) {
      const val = moduleValues.find((v) => v.module_id === videoModule.id);
      return val?.value || "";
    }
    return "";
  })();
  const hasVideo = !!videoUrl;

  useEffect(() => {
    if (business) {
      trackEvent.mutate({
        event_type: "view",
        business_id: business.id,
        category_id: business.category_id || undefined,
        city: business.city || undefined,
      });
    }
  }, [business?.id]);

  const handleCtaClick = (type: "whatsapp" | "phone" | "website" | "email" | "app" | "instagram" | "facebook" | "reservation" | "order") => {
    if (!business) return;
    trackEvent.mutate({
      event_type: `click_${type}` as any,
      business_id: business.id,
      category_id: business.category_id || undefined,
      city: business.city || undefined,
    });
  };

  const trackGA4Lead = (contactType: string) => {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "generate_lead", {
        contact_type: contactType,
        business_id: business?.id,
        business_name: business?.name,
        business_category: business?.categories?.name,
        business_city: business?.city,
      });
    }
  };

  const getAlcanceLabel = () => {
    if (!business) return "";
    switch (business.alcance) {
      case "nacional":
        return "Entrega em todo o país";
      case "local":
        return business.city ? `Atende em ${business.city}` : "Atendimento local";
      case "hibrido":
        return business.city ? `${business.city} + envios nacionais` : "Local + envios nacionais";
      default:
        return "";
    }
  };

  const userIsOwner = user?.id === (business as any)?.owner_id;

  const pageTitle = business
    ? `${business.name} em ${business.city || "Portugal"} | ${business.categories?.name || "Negócio"}`
    : "Negócio | Pede Direto";
  const pageDescription = business?.description
    ? business.description.slice(0, 155)
    : "Encontre serviços e profissionais diretamente no Pede Direto.";
  const pageUrl = `${BASE_URL}/negocio/${business?.slug}`;
  const pageImage = business?.logo_url || `${BASE_URL}/og-default.jpg`;

  const schemaData = business
    ? {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: business.name,
        image: pageImage,
        description: pageDescription,
        address: {
          "@type": "PostalAddress",
          streetAddress: business.public_address || "",
          addressLocality: business.city || "",
          addressCountry: "PT",
        },
        telephone: business.cta_phone || "",
        url: pageUrl,
      }
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="h-8 bg-muted rounded w-48 mx-auto mb-4" />
            <div className="h-4 bg-muted rounded w-64 mx-auto" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Negócio não encontrado</h1>
            <Link to="/">
              <Button>Voltar ao início</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const businessImages: string[] = Array.isArray((business as any).images)
    ? (business as any).images.filter((u: string) => u?.trim())
    : [];

  // ── Horário ──
  const scheduleWeekdays = business.schedule_weekdays || "";
  const scheduleWeekend = business.schedule_weekend || "";
  const scheduleClosed = (business as any).schedule_closed || "";
  const hasSchedule =
    !!(scheduleWeekdays || scheduleWeekend || scheduleClosed) && (business as any).show_schedule !== false;

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:type" content="business.business" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={pageImage} />
        <meta property="og:url" content={pageUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={pageImage} />
        {schemaData && <script type="application/ld+json">{JSON.stringify(schemaData)}</script>}
      </Helmet>

      <Header />

      {userIsOwner && business.claim_status === "verified" && (
        <div className="bg-primary/10 border-b border-primary/20">
          <div className="container py-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-primary">Você já está associado a este negócio.</p>
                  <p className="text-sm text-muted-foreground">Clique para gerir.</p>
                </div>
              </div>
              <Link to={`/dashboard/negocio/${business.id}`}>
                <Button size="sm" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Gerir Negócio
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {!(business as any).is_claimed && !(business.claim_status === "verified" && userIsOwner) && (
        <UnclaimedBusinessBanner
          businessId={business.id}
          claimStatus={business.claim_status}
          isClaimed={(business as any).is_claimed}
        />
      )}

      <main className="flex-1">
        <section className="section-hero py-8">
          <div className="container">
            {business.categories && (
              <Link
                to={`/categoria/${business.categories.slug}`}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar a {business.categories.name}
              </Link>
            )}
          </div>
        </section>

        <section className="pb-12">
          <div className="container">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* ── HERO: Vídeo VSL (se tiver) ou Banner com logo ── */}
                {hasVideo ? (
                  // ── COM VÍDEO: VSL ocupa o hero, logo pequeno sobreposto ──
                  <div className="relative rounded-2xl overflow-hidden bg-black">
                    {/* Vídeo principal */}
                    <div className="aspect-[16/9]">
                      <VideoPlayer url={videoUrl} />
                    </div>
                    {/* Logo pequeno sobreposto no canto inferior direito */}
                    {business.logo_url && (
                      <div className="absolute bottom-3 right-3 z-10">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center drop-shadow-xl">
                          <img src={business.logo_url} alt={business.name} className="w-full h-full object-contain" />
                        </div>
                      </div>
                    )}
                    {/* Badges e acções no canto superior direito */}
                    <div className="absolute top-4 right-4 flex gap-2 items-center z-10">
                      {business.is_featured && (
                        <span className="badge-featured">
                          <Star className="w-3 h-3" />
                          Destaque
                        </span>
                      )}
                      {business.is_premium && !business.is_featured && <span className="badge-premium">Premium</span>}
                      <ShareButton
                        url={pageUrl}
                        title={business.name}
                        description={`${business.categories?.name ?? ""} em ${business.city ?? "Portugal"}`}
                        variant="icon"
                        className="bg-card/80 backdrop-blur-sm hover:bg-card shadow-md"
                      />
                      <FavoriteButton
                        businessId={business.id}
                        className="bg-card/80 backdrop-blur-sm hover:bg-card shadow-md"
                      />
                    </div>
                    {/* Ribbon badges */}
                    {ribbonBadges.map((slug) => {
                      const cfg = BADGE_CONFIG[slug];
                      if (!cfg) return null;
                      const Icon = cfg.icon;
                      return (
                        <span
                          key={slug}
                          className={`absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border-2 shadow-sm backdrop-blur-sm z-10 ${cfg.bg} ${cfg.color}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {cfg.label}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  // ── SEM VÍDEO: banner com logo (comportamento original) ──
                  <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-muted flex items-center justify-center">
                    {business.logo_url ? (
                      <>
                        <img
                          src={business.logo_url}
                          alt=""
                          aria-hidden
                          className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-40 pointer-events-none"
                        />
                        <img
                          src={business.logo_url}
                          alt={business.name}
                          className="relative z-10 max-w-full max-h-full object-contain drop-shadow-xl"
                        />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10 p-4">
                        <span className="text-2xl md:text-4xl font-bold text-primary/30 text-center leading-tight">{business.name}</span>
                      </div>
                    )}
                    {ribbonBadges.map((slug) => {
                      const cfg = BADGE_CONFIG[slug];
                      if (!cfg) return null;
                      const Icon = cfg.icon;
                      return (
                        <span
                          key={slug}
                          className={`absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border-2 shadow-sm backdrop-blur-sm ${cfg.bg} ${cfg.color}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {cfg.label}
                        </span>
                      );
                    })}
                    <div className="absolute top-4 right-4 flex gap-2 items-center">
                      {business.is_featured && (
                        <span className="badge-featured">
                          <Star className="w-3 h-3" />
                          Destaque
                        </span>
                      )}
                      {business.is_premium && !business.is_featured && <span className="badge-premium">Premium</span>}
                      <ShareButton
                        url={pageUrl}
                        title={business.name}
                        description={`${business.categories?.name ?? ""} em ${business.city ?? "Portugal"}`}
                        variant="icon"
                        className="bg-card/80 backdrop-blur-sm hover:bg-card shadow-md"
                      />
                      <FavoriteButton
                        businessId={business.id}
                        className="bg-card/80 backdrop-blur-sm hover:bg-card shadow-md"
                      />
                    </div>
                  </div>
                )}

                {/* Galeria principal */}
                {businessImages.length > 0 && (business as any).show_gallery !== false && (
                  <GalleryGrid images={businessImages} label="Galeria" />
                )}

                {/* Info */}
                <div className="space-y-4">
                  {business.categories && (
                    <span className="text-sm font-medium text-primary uppercase tracking-wide">
                      {business.categories.name}
                    </span>
                  )}
                  <h1 className="text-3xl md:text-4xl font-bold">{business.name}</h1>

                  {nameBadges.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {nameBadges.map((slug) => {
                        const cfg = BADGE_CONFIG[slug];
                        if (!cfg) return null;
                        const Icon = cfg.icon;
                        return (
                          <span
                            key={slug}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border-2 shadow-sm ${cfg.bg} ${cfg.color}`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {cfg.label}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Top ranking badge */}
                  {topPosition && (
                    <Link
                      to={
                        topPosition.citySlug
                          ? `/top/${topPosition.subcategorySlug}/${topPosition.citySlug}`
                          : `/top/${topPosition.subcategorySlug}`
                      }
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border-2 border-amber-400 dark:border-amber-600 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 shadow-sm hover:bg-amber-200 dark:hover:bg-amber-900/70 transition-colors"
                    >
                      <Trophy className="w-3.5 h-3.5" />#{topPosition.position} {topPosition.subcategoryName}
                      {topPosition.city ? ` em ${topPosition.city}` : ""}
                    </Link>
                  )}

                  {/* WhatsApp Share CTA */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Conheça ${business.name} no Pede Direto 👉 ${BASE_URL}/p/${business.slug}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        trackEvent.mutate({
                          event_type: "view" as any,
                          business_id: business.id,
                          category_id: business.category_id || undefined,
                          city: business.city || undefined,
                        });
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-[#25D366] hover:bg-[#20BD5A] text-white shadow-sm transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Partilhar no WhatsApp
                    </a>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    {business.alcance === "nacional" ? <Globe className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                    <span>{getAlcanceLabel()}</span>
                  </div>

                  {business.public_address && (
                    <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="font-medium block mb-1">Morada</span>
                          <p className="text-sm text-muted-foreground mb-2">{business.public_address}</p>
                          <GoogleMapsLink
                            address={business.public_address}
                            businessName={business.name}
                            variant="button"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── DESCRIÇÃO COM PARÁGRAFOS ── */}
                  {business.description && (
                    <div className="text-lg text-muted-foreground leading-relaxed space-y-4">
                      {business.description
                        .split("\n")
                        .filter((p: string) => p.trim())
                        .map((paragraph: string, i: number) => (
                          <p key={i}>{paragraph}</p>
                        ))}
                    </div>
                  )}

                  {/* ── HORÁRIO ESTRUTURADO ── */}
                  {hasSchedule && (
                    <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 font-medium">
                        <Clock className="w-5 h-5 text-primary" />
                        Horário
                      </div>

                      {scheduleWeekdays && (
                        <div className="text-sm">
                          <span className="font-medium text-foreground flex items-center gap-1.5 mb-1">
                            📅 Dias úteis
                          </span>
                          <div className="text-muted-foreground space-y-0.5 pl-5">
                            {scheduleWeekdays
                              .split("\n")
                              .filter((l: string) => l.trim())
                              .map((line: string, i: number) => (
                                <p key={i}>{line}</p>
                              ))}
                          </div>
                        </div>
                      )}

                      {scheduleWeekend && (
                        <div className="text-sm">
                          <span className="font-medium text-foreground flex items-center gap-1.5 mb-1">
                            🗓 Fim de semana
                          </span>
                          <div className="text-muted-foreground space-y-0.5 pl-5">
                            {scheduleWeekend
                              .split("\n")
                              .filter((l: string) => l.trim())
                              .map((line: string, i: number) => (
                                <p key={i}>{line}</p>
                              ))}
                          </div>
                        </div>
                      )}

                      {scheduleClosed && (
                        <div className="text-sm">
                          <span className="font-medium text-foreground flex items-center gap-1.5 mb-1">
                            🔴 Encerrado
                          </span>
                          <p className="text-muted-foreground pl-5">{scheduleClosed}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dynamic Module Values */}
                  {(() => {
                    const publicModules = activeModules.filter(
                      (m) => m.is_public_default && m.section === "presenca_publica",
                    );
                    const valuesMap = new Map(moduleValues.map((v) => [v.module_id, v]));
                    const filledModules = publicModules.filter((m) => {
                      const v = valuesMap.get(m.id);
                      return v && (v.value || v.value_json);
                    });
                    if (filledModules.length === 0) return null;
                    return (
                      <div className="space-y-3">
                        {filledModules.map((mod) => {
                          const v = valuesMap.get(mod.id)!;
                          return (
                            <div key={mod.id}>
                              {mod.type === "url" && v.value && (
                                <a
                                  href={v.value}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-primary hover:underline"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  {mod.label}
                                </a>
                              )}
                              {(mod.type === "text" || mod.type === "textarea") && v.value && (
                                <div>
                                  <span className="text-sm font-medium">{mod.label}:</span>
                                  <div className="text-muted-foreground space-y-2 mt-1">
                                    {v.value
                                      .split("\n")
                                      .filter((p: string) => p.trim())
                                      .map((paragraph: string, i: number) => (
                                        <p key={i}>{paragraph}</p>
                                      ))}
                                  </div>
                                </div>
                              )}
                              {mod.type === "image" && v.value && (
                                <div>
                                  <span className="text-sm font-medium block mb-1">{mod.label}</span>
                                  <img
                                    src={v.value}
                                    alt={mod.label}
                                    className="rounded-lg max-w-full max-h-64 object-contain"
                                  />
                                </div>
                              )}
                              {mod.type === "gallery" &&
                                (business as any).show_gallery !== false &&
                                Array.isArray(v.value_json) &&
                                v.value_json.length > 0 && <GalleryGrid images={v.value_json} label={mod.label} />}
                              {/* Vídeo dos módulos dinâmicos: só renderiza se NÃO foi já usado no hero */}
                              {mod.type === "video" && v.value && !hasVideo && (
                                <VideoPlayer url={v.value} label={mod.label} />
                              )}
                              {mod.type === "boolean" && v.value === "true" && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-sm">
                                  {mod.label}
                                </span>
                              )}
                              {mod.type === "select" && v.value && (
                                <div>
                                  <span className="text-sm font-medium">{mod.label}:</span>{" "}
                                  <span className="text-muted-foreground">{v.value}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Reviews Section */}
                <ReviewSection businessId={business.id} businessName={business.name} isOwner={userIsOwner} />
              </div>

              {/* ── SIDEBAR ── */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 bg-card rounded-2xl p-6 shadow-card space-y-4">
                  <h3 className="text-xl font-bold">Resolva hoje o seu problema</h3>
                  <p className="text-sm text-muted-foreground">Contacte diretamente — sem intermediários!</p>

                  {/* Response Time Badge */}
                  {responseTime && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-primary/20 bg-primary/5 text-sm font-medium text-primary">
                      <Zap className="w-4 h-4 shrink-0" />
                      Responde em média em {responseTime.label}
                    </div>
                  )}

                  <div className="space-y-3 pt-2">
                    {sidebarBadges.map((slug) => {
                      const cfg = BADGE_CONFIG[slug];
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

                    {/* CTAs principais — ordem por intenção */}
                    {ctaBookingUrl && (
                      <Button
                        variant="outline"
                        className="w-full justify-center text-base hover:border-primary hover:text-primary transition-colors"
                        onClick={() => {
                          handleCtaClick("reservation");
                          trackGA4Lead("booking");
                          window.open(ctaBookingUrl, "_blank");
                        }}
                      >
                        <CalendarCheck className="w-5 h-5" />
                        Reservar Agora
                      </Button>
                    )}
                    {ctaOrderUrl && (
                      <Button
                        variant="outline"
                        className="w-full justify-center text-base hover:border-orange-500 hover:text-orange-500 transition-colors"
                        onClick={() => {
                          handleCtaClick("order");
                          trackGA4Lead("order");
                          window.open(ctaOrderUrl, "_blank");
                        }}
                      >
                        <ShoppingBag className="w-5 h-5" />
                        Pedir Online
                      </Button>
                    )}
                    {business.cta_whatsapp && (business as any).show_whatsapp !== false && (
                      <Button
                        className="btn-cta-whatsapp w-full justify-center text-base"
                        onClick={() => {
                          handleCtaClick("whatsapp");
                          trackGA4Lead("whatsapp");
                          window.open(`https://wa.me/${business.cta_whatsapp!.replace(/\D/g, "")}`, "_blank");
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
                          handleCtaClick("phone");
                          trackGA4Lead("phone");
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
                          handleCtaClick("email");
                          trackGA4Lead("email");
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
                          handleCtaClick("website");
                          trackGA4Lead("website");
                          window.open(business.cta_website!, "_blank");
                        }}
                      >
                        <ExternalLink className="w-5 h-5" />
                        Ver Website
                      </Button>
                    )}

                    {/* ── Redes Sociais no painel CTA ── */}
                    {hasSocialLinks && (
                      <>
                        <div className="border-t border-border pt-1" />
                        {instagramUrl && (
                          <Button
                            variant="outline"
                            className="w-full justify-center text-base hover:border-[#E1306C] hover:text-[#E1306C] transition-colors"
                            onClick={() => window.open(instagramUrl, "_blank")}
                          >
                            <Instagram className="w-5 h-5" />
                            Ver Instagram
                          </Button>
                        )}
                        {facebookUrl && (
                          <Button
                            variant="outline"
                            className="w-full justify-center text-base hover:border-[#1877F2] hover:text-[#1877F2] transition-colors"
                            onClick={() => window.open(facebookUrl, "_blank")}
                          >
                            <Facebook className="w-5 h-5" />
                            Ver Facebook
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <BusinessNavigation
        previousBusiness={previousBusiness}
        nextBusiness={nextBusiness}
        isLastBusiness={isLastBusiness}
        currentPosition={currentPosition}
        totalBusinesses={totalBusinesses}
        hasFilter={hasFilter}
        cityFilter={cityFilter}
        onShowSuggestionForm={() => setShowSuggestionForm(true)}
      />

      {showSuggestionForm && (
        <div className="border-t bg-muted/10">
          <div className="container py-8">
            <BusinessSuggestionForm categoryName={business?.categories?.name} cityName={cityFilter} />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default BusinessPage;
