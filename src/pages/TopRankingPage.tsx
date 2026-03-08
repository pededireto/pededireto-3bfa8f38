import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useTopRanking } from "@/hooks/useTopRanking";
import { useBatchPublicBadges } from "@/hooks/usePublicBadges";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BadgePills from "@/components/BadgePills";
import { Button } from "@/components/ui/button";
import { Star, MapPin, ArrowLeft, Trophy, CheckCircle, MessageSquare, UserPlus } from "lucide-react";

const BASE_URL = "https://pededireto.pt";

const PositionBadge = ({ position }: { position: number }) => {
  if (position === 1)
    return <span className="text-3xl">🥇</span>;
  if (position === 2)
    return <span className="text-3xl">🥈</span>;
  if (position === 3)
    return <span className="text-3xl">🥉</span>;

  return (
    <span className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
      #{position}
    </span>
  );
};

const StarRating = ({ rating, count }: { rating: number; count: number }) => (
  <div className="flex items-center gap-1">
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className="w-3.5 h-3.5"
          fill={star <= Math.round(rating) ? "#f59e0b" : "none"}
          stroke={star <= Math.round(rating) ? "#f59e0b" : "currentColor"}
          strokeWidth={1.5}
        />
      ))}
    </div>
    <span className="text-xs font-semibold text-foreground">{rating.toFixed(1)}</span>
    <span className="text-xs text-muted-foreground">({count})</span>
  </div>
);

const getCardBg = (position: number) => {
  switch (position) {
    case 1: return "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800";
    case 2: return "bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700";
    case 3: return "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800";
    default: return "bg-card border-border";
  }
};

const TopRankingPage = () => {
  const { subcategorySlug, citySlug } = useParams<{ subcategorySlug: string; citySlug?: string }>();
  const { data, isLoading } = useTopRanking(subcategorySlug, citySlug);
  const businessIds = (data?.businesses || []).map((b) => b.id);
  const { data: badgesMap = new Map() } = useBatchPublicBadges(businessIds);

  const subcatName = data?.subcategory?.name || "";
  const catName = data?.subcategory?.categories?.name || "";
  const catSlug = data?.subcategory?.categories?.slug || "";
  const cityName = data?.cityName;
  const locationLabel = cityName || "Portugal";

  const pageTitle = `Top ${subcatName} em ${locationLabel} | Pede Direto`;
  const pageDescription = `Os ${data?.businesses?.length || 0} melhores ${subcatName.toLowerCase()} em ${locationLabel}, ordenados por avaliações e popularidade. Contacte diretamente, sem intermediários.`;
  const pageUrl = citySlug
    ? `${BASE_URL}/top/${subcategorySlug}/${citySlug}`
    : `${BASE_URL}/top/${subcategorySlug}`;

  const jsonLd = data?.businesses ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Top ${subcatName} em ${locationLabel}`,
    numberOfItems: Math.min(data.businesses.length, 10),
    itemListElement: data.businesses.slice(0, 10).map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "LocalBusiness",
        name: b.name,
        url: `${BASE_URL}/negocio/${b.slug}`,
        ...(b.city && { address: { "@type": "PostalAddress", addressLocality: b.city } }),
        ...(b.avg_rating > 0 && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: b.avg_rating,
            reviewCount: b.total_reviews,
          },
        }),
      },
    })),
  } : null;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Top", item: `${BASE_URL}/top` },
      { "@type": "ListItem", position: 3, name: subcatName, item: `${BASE_URL}/top/${subcategorySlug}` },
      ...(citySlug ? [{ "@type": "ListItem", position: 4, name: cityName, item: pageUrl }] : []),
    ],
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="h-8 bg-muted rounded w-64 mx-auto mb-4" />
            <div className="h-4 bg-muted rounded w-48 mx-auto" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!data?.subcategory) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Subcategoria não encontrada</h1>
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
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={pageUrl} />
        {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      </Helmet>

      <Header />

      <main className="flex-1">
        <section className="py-8 md:py-12">
          <div className="container max-w-4xl">
            {/* Breadcrumb / Back */}
            {citySlug && (
              <Link
                to={`/top/${subcategorySlug}`}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Ver Top {subcatName} em Portugal
              </Link>
            )}
            {!citySlug && catSlug && (
              <Link
                to={`/categoria/${catSlug}`}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar a {catName}
              </Link>
            )}

            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-8 h-8 text-primary" />
                <h1 className="text-3xl md:text-4xl font-bold">
                  Top {subcatName} em {locationLabel}
                </h1>
              </div>
              <p className="text-muted-foreground text-lg">
                Os profissionais mais contactados e melhor avaliados em {locationLabel}
              </p>
            </div>

            {/* City chips */}
            {data.cityCounts && data.cityCounts.length > 1 && (
              <div className="mb-8">
                <p className="text-sm font-medium text-muted-foreground mb-3">Ver por cidade:</p>
                <div className="flex flex-wrap gap-2">
                  <Link to={`/top/${subcategorySlug}`}>
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${!citySlug ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-foreground border-border hover:bg-accent"}`}>
                      Todas
                    </span>
                  </Link>
                  {data.cityCounts.filter(c => c.count >= 2).map((c) => (
                    <Link key={c.citySlug} to={`/top/${subcategorySlug}/${c.citySlug}`}>
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${citySlug === c.citySlug ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-foreground border-border hover:bg-accent"}`}>
                        {c.city} ({c.count})
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Ranking list */}
            {data.businesses.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Trophy className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="font-medium">Ainda sem negócios nesta categoria</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.businesses.map((biz, i) => {
                  const position = i + 1;
                  const cardBg = getCardBg(position);

                  return (
                    <div
                      key={biz.id}
                      className={`rounded-xl border p-4 md:p-5 flex items-center gap-4 transition-shadow hover:shadow-md ${cardBg}`}
                    >
                      {/* Position badge */}
                      <div className="flex-shrink-0 w-12 flex justify-center">
                        <PositionBadge position={position} />
                      </div>

                      {/* Logo */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                        {biz.logo_url ? (
                          <img src={biz.logo_url} alt={biz.name} className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-lg font-bold text-primary/40">{biz.name.charAt(0)}</span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground truncate">{biz.name}</h3>
                          {(biz.is_premium || biz.is_featured) && (
                            <span className="badge-premium text-[10px] px-1.5 py-0.5">Premium</span>
                          )}
                        </div>
                        {biz.city && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {biz.city}
                          </div>
                        )}
                        {biz.total_reviews > 0 && (
                          <div className="mt-1">
                            <StarRating rating={biz.avg_rating} count={biz.total_reviews} />
                          </div>
                        )}
                      </div>

                      {/* CTA */}
                      <div className="flex-shrink-0">
                        <Link to={`/negocio/${biz.slug}`}>
                          <Button size="sm" variant="outline" className="text-xs">
                            Ver perfil
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* How to climb section */}
            <div className="mt-12 bg-muted/50 rounded-2xl p-6 md:p-8 border">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Como subir no ranking?
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Complete o seu perfil</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Logo, descrição, contactos completos — cada detalhe conta pontos
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Star className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Peça avaliações aos seus clientes</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Boas avaliações aumentam a confiança e a sua posição
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Seja contactado</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cada interação com clientes conta para o ranking
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Link to="/register/business">
                  <Button className="min-h-[48px] text-base gap-2">
                    <UserPlus className="w-5 h-5" />
                    Registar o meu negócio
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default TopRankingPage;
