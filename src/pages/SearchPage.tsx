import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, Loader2, MapPin, Star, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SmartSearchBanner from "@/components/SmartSearchBanner";
import { useSmartSearch } from "@/hooks/useSmartSearch";
import { useDebounce } from "@/hooks/useDebounce";
import type { SmartBusiness } from "@/hooks/useSmartSearch";

const QUICK_SUGGESTIONS = [
  "canalizador",
  "eletricista",
  "pintor",
  "restaurante",
  "cabeleireiro",
  "dentista",
  "mecânico",
  "advogado",
  "contabilista",
  "remodelação",
];

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [inputValue, setInputValue] = useState(urlQuery);
  const debouncedTerm = useDebounce(inputValue, 400);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: result, isPending } = useSmartSearch(debouncedTerm);

  // Sync URL → input (when navigating via complementary chips)
  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    setInputValue(q);
  }, [searchParams]);

  // Sync debounced input → URL
  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (debouncedTerm !== current) {
      if (debouncedTerm) {
        setSearchParams({ q: debouncedTerm }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    }
  }, [debouncedTerm]);

  const handleComplementaryClick = (service: string) => {
    setInputValue(service);
    setSearchParams({ q: service });
    inputRef.current?.focus();
  };

  const showResults = debouncedTerm.length >= 2;
  const businesses = result?.businesses ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Sticky search bar */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container py-3">
          <div className="relative max-w-2xl mx-auto">
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
      </div>

      <div className="container flex-1 py-6">
        {/* Empty state — no query */}
        {!showResults && (
          <div className="text-center py-16">
            <Search className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              O que precisa hoje?
            </h2>
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
            {/* Smart banner */}
            <SmartSearchBanner
              result={result}
              onComplementaryClick={handleComplementaryClick}
            />

            {/* Results grid */}
            {businesses.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    {result.totalFound} resultado{result.totalFound !== 1 ? "s" : ""}
                  </p>
                  <Button variant="outline" size="sm" disabled className="gap-1.5">
                    <Filter className="h-4 w-4" />
                    Filtrar
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {businesses.map((biz) => (
                    <SearchResultCard key={biz.id} business={biz} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

// ── Result Card ──────────────────────────────────────────────────────────────

function SearchResultCard({ business }: { business: SmartBusiness }) {
  return (
    <Link
      to={`/negocio/${business.slug}`}
      className="group flex gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all"
    >
      {/* Logo */}
      <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
        {business.logo_url ? (
          <img
            src={business.logo_url}
            alt={business.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-xl font-bold text-primary/40">
            {business.name.charAt(0)}
          </span>
        )}
      </div>

      {/* Info */}
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
    </Link>
  );
}

export default SearchPage;
