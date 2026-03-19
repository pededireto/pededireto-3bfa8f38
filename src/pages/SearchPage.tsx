import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, Loader2, MapPin, Star, ArrowRight, Share2, ChevronDown, Lightbulb } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SmartSearchBanner from "@/components/SmartSearchBanner";
import ShareButton from "@/components/ShareButton";
import { useSmartSearch } from "@/hooks/useSmartSearch";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/hooks/useAuth";
import type { SmartBusiness } from "@/hooks/useSmartSearch";

const BASE_URL = "https://pededireto.pt";
const RESULTS_LIMIT = 5;

const QUICK_SUGGESTIONS = [
  "canalizador", "eletricista", "pintor", "restaurante", "cabeleireiro",
  "dentista", "mecânico", "advogado", "contabilista", "remodelação",
];

const SearchPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const urlCity = searchParams.get("cidade") ?? "";
  const [inputValue, setInputValue] = useState(urlQuery);
  const [cityFilter, setCityFilter] = useState(urlCity);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const debouncedTerm = useDebounce(inputValue, 400);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: result, isPending } = useSmartSearch(debouncedTerm, cityFilter || null);

  // Sync from URL
  useEffect(() => {
    setInputValue(searchParams.get("q") ?? "");
    setCityFilter(searchParams.get("cidade") ?? "");
  }, [searchParams]);

  // Sync to URL
  useEffect(() => {
    const currentQ = searchParams.get("q") ?? "";
    const currentCity = searchParams.get("cidade") ?? "";
    if (debouncedTerm !== currentQ || cityFilter !== currentCity) {
      const params: Record<string, string> = {};
      if (debouncedTerm) params.q = debouncedTerm;
      if (cityFilter) params.cidade = cityFilter;
      setSearchParams(params, { replace: true });
    }
  }, [debouncedTerm, cityFilter]);

  const handleComplementaryClick = (service: string) => {
    setInputValue(service);
    setSearchParams({ q: service, ...(cityFilter ? { cidade: cityFilter } : {}) });
    inputRef.current?.focus();
  };

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const showResults = debouncedTerm.length >= 2;
  const businessGroups = result?.businessGroups ?? [];
  const totalFound = result?.totalFound ?? 0;
  const complementaryServices = result?.complementaryServices ?? [];
  const suggestionGroups = result?.suggestionGroups ?? [];

  const firstBusiness = businessGroups[0]?.businesses[0] ?? null;
  const categorySlug = firstBusiness?.category_slug ?? null;
  const categoryName = firstBusiness?.category_name ?? null;

  const currentUrl = `${BASE_URL}/pesquisa${debouncedTerm ? `?q=${encodeURIComponent(debouncedTerm)}` : ""}${cityFilter ? `${debouncedTerm ? "&" : "?"}cidade=${encodeURIComponent(cityFilter)}` : ""}`;

  // Dynamic SEO based on parameters
  const seoTitle = debouncedTerm && cityFilter
    ? `${debouncedTerm} em ${cityFilter} — PedeDireto`
    : debouncedTerm
    ? `Resultados para "${debouncedTerm}" — PedeDireto`
    : cityFilter
    ? `Negócios em ${cityFilter} — PedeDireto`
    : "Pesquisa de Negócios — PedeDireto";

  const seoDescription = debouncedTerm && cityFilter
    ? `Encontrámos ${totalFound} profissionais de ${debouncedTerm} em ${cityFilter}. Contacte directamente.`
    : debouncedTerm
    ? `Encontrámos ${totalFound} profissionais de ${debouncedTerm} em Portugal. Contacte directamente.`
    : cityFilter
    ? `Encontra os melhores negócios em ${cityFilter}. Contacto directo, sem intermediários.`
    : "Pesquise profissionais e serviços locais em Portugal.";

  const canonicalUrl = cityFilter && !debouncedTerm
    ? `${BASE_URL}/pesquisa?cidade=${encodeURIComponent(cityFilter)}`
    : debouncedTerm
    ? undefined // noindex for search queries
    : `${BASE_URL}/pesquisa`;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
        {!cityFilter && <meta name="robots" content="noindex, follow" />}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={currentUrl} />
      </Helmet>

      <Header />

      {/* Sticky search bar */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container py-3">
          <div className="flex gap-2 max-w-3xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="O que procura? (ex: canalizador, fuga de água, restaurante...)"
                className="search-input-hero pl-12 pr-4 w-full"
                autoFocus
              />
            </div>
          </div>

          {/* City filter always visible */}
          <div className="max-w-3xl mx-auto mt-2">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                placeholder="Filtrar por cidade (ex: Lisboa, Porto...)"
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {cityFilter && (
                <button
                  onClick={() => setCityFilter("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                >
                  ✕ limpar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container flex-1 py-6">
        {/* Empty state */}
        {!showResults && (
          <div className="text-center py-16">
            <Search className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">O que precisa hoje?</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Escreva o que procura ou escolha uma sugestão abaixo
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
              {QUICK_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleComplementaryClick(s)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border border-border bg-card hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-colors"
                >
                  <Search className="h-3 w-3" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {showResults && isPending && (
          <div className="py-16 flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">A procurar...</p>
          </div>
        )}

        {/* Results */}
        {showResults && !isPending && result && (
          <>
            <SmartSearchBanner
              result={result}
              userCity={cityFilter || null}
              onComplementaryClick={handleComplementaryClick}
            />

            {businessGroups.length > 0 && (
              <>
                {/* Counter + share */}
                <div className="flex items-center justify-between mb-6">
                  <p className="text-sm text-muted-foreground">
                    {totalFound} resultado{totalFound !== 1 ? "s" : ""}
                    {cityFilter && (
                      <span className="ml-1">
                        em <span className="font-medium text-foreground">{cityFilter}</span>
                        <button onClick={() => setCityFilter("")} className="ml-1 text-primary hover:underline text-xs">(limpar)</button>
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-2">
                    <ShareButton url={currentUrl} title={`Pesquisa: ${debouncedTerm}`} variant="outline" />
                    {totalFound >= 10 && categorySlug && categoryName && (
                      <Link to={`/categoria/${categorySlug}`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                        Ver todos em {categoryName}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Groups */}
                <div className="space-y-10">
                  {businessGroups.map((group) => {
                    const isExpanded = expandedGroups.has(group.label);
                    const visibleBiz = isExpanded ? group.businesses : group.businesses.slice(0, RESULTS_LIMIT);
                    const hasMore = group.businesses.length > RESULTS_LIMIT;

                    return (
                      <div key={group.label}>
                        {businessGroups.length > 1 && (
                          <div className="flex items-center gap-3 mb-4">
                            <h2 className="text-base font-semibold text-foreground capitalize">{group.label}</h2>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{group.businesses.length}</span>
                            <div className="flex-1 h-px bg-border" />
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {visibleBiz.map((biz) => (
                            <SearchResultCard key={biz.id} business={biz} searchTerm={debouncedTerm} cityFilter={cityFilter} isAuthenticated={!!user} />
                          ))}
                        </div>

                        {hasMore && !isExpanded && (
                          <div className="mt-4 text-center">
                            <Button variant="outline" size="sm" className="gap-2" onClick={() => toggleGroup(group.label)}>
                              <ChevronDown className="h-4 w-4" />
                              Ver mais {group.businesses.length - RESULTS_LIMIT} profissionais
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Complementary section after results */}
                {complementaryServices.length > 0 && (
                  <div className="mt-10 rounded-2xl border border-border bg-muted/30 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium text-muted-foreground">Também pode precisar de:</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {complementaryServices.map((service) => (
                        <button
                          key={service}
                          onClick={() => handleComplementaryClick(service)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border border-border bg-background hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-colors"
                        >
                          <Search className="h-3 w-3" />
                          {service}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fallback popular categories when no complementary */}
                {complementaryServices.length === 0 && totalFound > 0 && (
                  <div className="mt-10 rounded-2xl border border-border bg-muted/30 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium text-muted-foreground">Categorias populares:</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {["canalizador", "eletricista", "pintor", "restaurante", "cabeleireiro"].map((s) => (
                        <button key={s} onClick={() => handleComplementaryClick(s)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border border-border bg-background hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-colors">
                          <Search className="h-3 w-3" />{s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestion groups from related subcategories */}
                {suggestionGroups.length > 0 && (
                  <div className="mt-10 space-y-8">
                    <div className="flex items-center gap-3">
                      <Lightbulb className="h-5 w-5 text-primary" />
                      <h2 className="text-lg font-semibold text-foreground">Também pode interessar</h2>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    {suggestionGroups.map((sg) => {
                      const isExpanded = expandedGroups.has(`suggestion-${sg.label}`);
                      const visibleBiz = isExpanded ? sg.businesses : sg.businesses.slice(0, 3);
                      const hasMore = sg.businesses.length > 3;

                      return (
                        <div key={sg.label}>
                          <div className="flex items-center gap-3 mb-4">
                            <Link
                              to={`/categoria/${sg.categorySlug}/${sg.subcategorySlug}`}
                              className="text-base font-medium text-primary hover:underline capitalize"
                            >
                              {sg.label}
                            </Link>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{sg.businesses.length}</span>
                            <Badge variant="outline" className="text-xs capitalize">{sg.relationType === 'suggestion' ? 'Sugestão' : sg.relationType === 'complement' ? 'Complementar' : 'Alternativa'}</Badge>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {visibleBiz.map((biz) => (
                              <SearchResultCard key={biz.id} business={biz} searchTerm={debouncedTerm} cityFilter={cityFilter} isAuthenticated={!!user} />
                            ))}
                          </div>
                          {hasMore && !isExpanded && (
                            <div className="mt-3 text-center">
                              <Button variant="outline" size="sm" className="gap-2" onClick={() => toggleGroup(`suggestion-${sg.label}`)}>
                                <ChevronDown className="h-4 w-4" />
                                Ver mais {sg.businesses.length - 3} resultados
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {categorySlug && categoryName && (
                  <div className="mt-8 text-center">
                    <Link
                      to={`/categoria/${categorySlug}`}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-primary/30 bg-primary/5 text-primary font-medium hover:bg-primary/10 transition-colors"
                    >
                      Ver todos os negócios em {categoryName}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

// ── Result Card ───────────────────────────────────────────────────────────────

function SearchResultCard({ business, searchTerm, cityFilter, isAuthenticated }: { business: SmartBusiness; searchTerm: string; cityFilter: string; isAuthenticated: boolean }) {
  const redirectUrl = `/pesquisa?q=${encodeURIComponent(searchTerm)}${cityFilter ? `&cidade=${encodeURIComponent(cityFilter)}` : ""}`;

  return (
    <div className="space-y-0">
      <Link
        to={`/negocio/${business.slug}`}
        className="group flex gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all"
      >
        <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
          {business.logo_url ? (
            <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <span className="text-xs font-bold text-primary/40 text-center leading-tight line-clamp-2 px-1">{business.name}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {business.name}
            </h3>
            {business.is_premium && (
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-[10px] px-1.5 py-0 shrink-0">
                <Star className="h-2.5 w-2.5 mr-0.5" />
                Premium
              </Badge>
            )}
          </div>
          {(business.subcategory_name || business.category_name) && (
            <p className="text-xs text-primary font-medium truncate">
              {business.subcategory_name ?? business.category_name}
            </p>
          )}
          {business.city && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              {business.city}
            </p>
          )}
        </div>
        <div className="flex items-start" onClick={(e) => e.preventDefault()}>
          <ShareButton
            url={`${BASE_URL}/negocio/${business.slug}`}
            title={business.name}
            description={`${business.subcategory_name ?? business.category_name ?? ""} em ${business.city ?? "Portugal"}`}
            variant="icon"
          />
        </div>
      </Link>

      {/* CTA registo para não autenticados */}
      {!isAuthenticated && (
        <div className="px-4 pb-2 pt-1">
          <Link
            to={`/registar/consumidor?redirect=${encodeURIComponent(redirectUrl)}`}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            💬 Quer pedir orçamento directamente? <span className="underline">Registe-se gratuitamente →</span>
          </Link>
        </div>
      )}
    </div>
  );
}

export default SearchPage;
