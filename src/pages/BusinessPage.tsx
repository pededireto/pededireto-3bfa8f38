import { useParams, Link, useNavigate } from "react-router-dom";
import { useBusiness } from "@/hooks/useBusinesses";
import { useTrackEvent } from "@/hooks/useAnalytics";
import { useActiveBusinessModules, useBusinessModuleValues } from "@/hooks/useBusinessModules";
import { useBusinessNavigation } from "@/hooks/useCategoryBusinesses";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FavoriteButton from "@/components/FavoriteButton";
import { UnclaimedBusinessBanner } from "@/components/business/UnclaimedBusinessBanner";
import BusinessNavigation from "@/components/BusinessNavigation";
import SuggestionForm from "@/components/SuggestionForm";
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
  Settings
} from "lucide-react";

const BusinessPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: business, isLoading } = useBusiness(slug);
  const { user } = useAuth();
  const navigate = useNavigate();
  const trackEvent = useTrackEvent();
  const { data: activeModules = [] } = useActiveBusinessModules();
  const { data: moduleValues = [] } = useBusinessModuleValues(business?.id);
  
  // Estado para controlar se mostra o formulário de sugestão
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);

  // Detectar se há filtro de cidade (do negócio atual ou da URL)
  // Quando o utilizador vem de uma página filtrada por cidade, usamos essa cidade
  const cityFilter = business?.city || null;

  // Hook de navegação entre negócios da mesma categoria (com filtro de cidade)
  const {
    previousBusiness,
    nextBusiness,
    isLastBusiness,
    currentPosition,
    totalBusinesses,
    hasFilter,
  } = useBusinessNavigation(business?.category_id, slug, cityFilter);

  // Track view on page load
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

  const handleCtaClick = (type: "whatsapp" | "phone" | "website" | "email" | "app") => {
    if (!business) return;
    trackEvent.mutate({
      event_type: `click_${type}` as any,
      business_id: business.id,
      category_id: business.category_id || undefined,
      city: business.city || undefined,
    });
  };

  // GA4 generate_lead tracking
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

  // Check if user is owner (usando owner_id)
  // NOTA: Se TypeScript reclamar sobre owner_id, use (business as any).owner_id
  const userIsOwner = user?.id === (business as any)?.owner_id;

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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Banner para utilizador já associado (verified + owner) */}
      {userIsOwner && business.claim_status === "verified" && (
        <div className="bg-primary/10 border-b border-primary/20">
          <div className="container py-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-primary">
                    Você já está associado a este negócio.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Clique para gerir.
                  </p>
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

      {/* Banner para negócios não reclamados ou pending */}
      {!(business.claim_status === "verified" && userIsOwner) && (
        <UnclaimedBusinessBanner
          businessId={business.id}
          claimStatus={business.claim_status}
        />
      )}
      
      <main className="flex-1">
        {/* Hero Section */}
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

        {/* Business Details */}
        <section className="pb-12">
          <div className="container">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Image */}
                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-muted flex items-center justify-center">
                  {business.logo_url ? (
                    <img
                      src={business.logo_url}
                      alt={business.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10">
                      <span className="text-8xl font-bold text-primary/30">
                        {business.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  
                  {/* Badges */}
                  <div className="absolute top-4 right-4 flex gap-2 items-center">
                    {business.is_featured && (
                      <span className="badge-featured">
                        <Star className="w-3 h-3" />
                        Destaque
                      </span>
                    )}
                    {business.is_premium && !business.is_featured && (
                      <span className="badge-premium">Premium</span>
                    )}
                    <FavoriteButton
                      businessId={business.id}
                      className="bg-card/80 backdrop-blur-sm hover:bg-card shadow-md"
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-4">
                  {business.categories && (
                    <span className="text-sm font-medium text-primary uppercase tracking-wide">
                      {business.categories.name}
                    </span>
                  )}
                  
                  <h1 className="text-3xl md:text-4xl font-bold">{business.name}</h1>
                  
                  {/* Location */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {business.alcance === "nacional" ? (
                      <Globe className="w-5 h-5" />
                    ) : (
                      <MapPin className="w-5 h-5" />
                    )}
                    <span>{getAlcanceLabel()}</span>
                  </div>

                  {/* Description */}
                  {business.description && (
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {business.description}
                    </p>
                  )}

                  {/* Schedule */}
                  {(business.schedule_weekdays || business.schedule_weekend) && (
                    <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2 font-medium">
                        <Clock className="w-5 h-5 text-primary" />
                        Horário
                      </div>
                      {business.schedule_weekdays && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Dias úteis:</span> {business.schedule_weekdays}
                        </p>
                      )}
                      {business.schedule_weekend && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Fim de semana:</span> {business.schedule_weekend}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Dynamic Module Values */}
                  {(() => {
                    const publicModules = activeModules.filter(
                      (m) => m.is_public_default && m.section === "presenca_publica"
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
                                <a href={v.value} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline">
                                  <ExternalLink className="w-4 h-4" />
                                  {mod.label}
                                </a>
                              )}
                              {(mod.type === "text" || mod.type === "textarea") && v.value && (
                                <div>
                                  <span className="text-sm font-medium">{mod.label}:</span>{" "}
                                  <span className="text-muted-foreground">{v.value}</span>
                                </div>
                              )}
                              {mod.type === "image" && v.value && (
                                <div>
                                  <span className="text-sm font-medium block mb-1">{mod.label}</span>
                                  <img src={v.value} alt={mod.label} className="rounded-lg max-w-full max-h-64 object-contain" />
                                </div>
                              )}
                              {mod.type === "gallery" && Array.isArray(v.value_json) && v.value_json.length > 0 && (
                                <div>
                                  <span className="text-sm font-medium block mb-2">{mod.label}</span>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {v.value_json.map((url: string, i: number) => (
                                      <img key={i} src={url} alt={`${mod.label} ${i + 1}`} className="rounded-lg w-full aspect-square object-cover" />
                                    ))}
                                  </div>
                                </div>
                              )}
                              {mod.type === "video" && v.value && (
                                <div>
                                  <span className="text-sm font-medium block mb-1">{mod.label}</span>
                                  <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                                    <iframe src={v.value.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")} className="w-full h-full" allowFullScreen title={mod.label} />
                                  </div>
                                </div>
                              )}
                              {mod.type === "boolean" && v.value === "true" && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-sm">{mod.label}</span>
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
              </div>

              {/* Sidebar - CTAs */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 bg-card rounded-2xl p-6 shadow-card space-y-4">
                  <h3 className="text-xl font-bold">Resolva hoje o seu problema</h3>
                  <p className="text-sm text-muted-foreground">
                    Contacte diretamente — sem intermediários!
                  </p>

                  <div className="space-y-3 pt-2">
                    {business.cta_whatsapp && (
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
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Navegação entre negócios */}
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

      {/* Formulário de sugestão (quando chega ao fim) */}
      {showSuggestionForm && (
        <div className="border-t bg-muted/10">
          <div className="container py-8">
            <SuggestionForm />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default BusinessPage;
