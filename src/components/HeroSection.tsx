import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearch } from "@/hooks/useSearch";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useAutoSaveSearch } from "@/hooks/useSavedSearches";
import SearchResults from "@/components/SearchResults";
import pedeDiretoMascot from "@/assets/pede-direto-mascot.png";

interface HeroSectionProps {
  onSearch?: (term: string) => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

const HeroSection = ({ onSearch, searchTerm = "", onSearchChange }: HeroSectionProps) => {
  const [showResults, setShowResults] = useState(false);
  const { data: searchResults = [], isLoading: searchLoading } = useSearch(searchTerm);
  const { data: settings } = useSiteSettings();
  const autoSaveSearch = useAutoSaveSearch();
  const searchRef = useRef<HTMLDivElement>(null);

  const heroTitle = settings?.hero_title || "Tem um problema? Nós mostramos quem resolve.";
  const heroSubtitle = settings?.hero_subtitle || "Restaurantes, serviços, lojas e profissionais — tudo num só sítio.";
  const mascotUrl = settings?.mascot_url;
  const mascotEnabled = settings?.mascot_enabled === "true";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim().length >= 2) {
      autoSaveSearch.mutate({ searchQuery: searchTerm.trim() });
    }
    onSearch?.(searchTerm);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const scrollToCategorias = () => {
    const el = document.getElementById("categorias");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      (el as HTMLElement).focus?.();
    }
  };

  return (
    <section className="section-hero py-12 md:py-20" aria-labelledby="hero-heading">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <h1
              id="hero-heading"
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-foreground"
            >
              {heroTitle.includes("?") ? (
                <>
                  {heroTitle.split("?")[0]}?{" "}
                  <span className="text-gradient-primary">{heroTitle.split("?").slice(1).join("?").trim()}</span>
                </>
              ) : (
                <span className="text-gradient-primary">{heroTitle}</span>
              )}
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-lg">{heroSubtitle}</p>

            {/* Search Box */}
            <form onSubmit={handleSubmit} className="max-w-lg" role="search">
              <label htmlFor="hero-search" className="sr-only">
                Pesquisar serviços ou negócios
              </label>

              <div className="relative" ref={searchRef}>
                <Search
                  aria-hidden="true"
                  focusable="false"
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
                />

                <input
                  id="hero-search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    onSearchChange?.(e.target.value);
                    setShowResults(true);
                  }}
                  onFocus={() => setShowResults(true)}
                  placeholder="O que procura? (ex: canalizador, pizza, barbearia...)"
                  className="search-input-hero pl-12 pr-4"
                  aria-autocomplete="list"
                  aria-expanded={showResults}
                  aria-controls="search-results"
                />

                {showResults && searchTerm.length >= 2 && (
                  <div id="search-results" aria-live="polite">
                    <SearchResults
                      results={searchResults}
                      isLoading={searchLoading}
                      searchTerm={searchTerm}
                      onSelect={(result) => {
                        setShowResults(false);
                        if (result?.result_name) {
                          autoSaveSearch.mutate({
                            searchQuery: result.result_name,
                          });
                        } else if (searchTerm.trim().length >= 2) {
                          autoSaveSearch.mutate({
                            searchQuery: searchTerm.trim(),
                          });
                        }
                        onSearchChange?.("");
                      }}
                    />
                  </div>
                )}
              </div>
            </form>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Button className="btn-cta-primary text-base" onClick={scrollToCategorias}>
                Encontrar quem resolve
              </Button>

              <Button variant="outline" className="btn-cta-outline text-base" onClick={scrollToCategorias}>
                Ver categorias
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-3 pt-4">
              <span className="trust-badge">✓ Contactos diretos</span>
              <span className="trust-badge">✓ Sem intermediários</span>
              <span className="trust-badge">✓ Resposta rápida</span>
            </div>
          </div>

          {mascotEnabled && mascotUrl && (
            <div className="hidden md:flex justify-center items-center relative" aria-hidden="true">
              <div className="relative animate-float">
                <img src={mascotUrl} alt="Mascote do Pede Direto" className="w-72 lg:w-96 drop-shadow-2xl" />
                <div className="absolute -top-4 -right-4 bg-card rounded-2xl p-4 shadow-lg border border-border max-w-[200px]">
                  <p className="text-sm font-medium text-foreground">Eu ajudo-te a encontrar quem resolve!</p>
                </div>
              </div>
            </div>
          )}

          {(!mascotEnabled || !mascotUrl) && (
            <div className="hidden md:flex justify-center items-center relative" aria-hidden="true">
              <div className="relative animate-float">
                <img src={pedeDiretoMascot} alt="Logótipo do Pede Direto" className="w-72 lg:w-96 drop-shadow-2xl" />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
