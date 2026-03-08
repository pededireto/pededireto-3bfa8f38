import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearch } from "@/hooks/useSearch";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useAutoSaveSearch } from "@/hooks/useSavedSearches";
import SearchResults from "@/components/SearchResults";
import pedeDiretoMascot from "@/assets/pede-direto-mascot.png";
import { getYouTubeEmbedUrl } from "@/utils/youtube";

interface HeroSectionProps {
  onSearch?: (term: string) => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

const PLACEHOLDER_WORDS = ["canalizador", "eletricista", "restaurante", "cabeleireiro", "mecânico", "clínica"];

const HeroSection = ({ onSearch, searchTerm = "", onSearchChange }: HeroSectionProps) => {
  const navigate = useNavigate();
  const [showResults, setShowResults] = useState(false);
  const [activeDescendant, setActiveDescendant] = useState<string | undefined>();
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const { data: searchResults = [], isLoading: searchLoading } = useSearch(searchTerm);
  const { data: settings } = useSiteSettings();
  const autoSaveSearch = useAutoSaveSearch();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const heroTitle = settings?.hero_title || "Encontre o profissional certo em segundos";
  const heroSubtitle = settings?.hero_subtitle || "Restaurantes, técnicos, lojas e serviços locais. Contacte diretamente — sem intermediários.";
  const mascotUrl = settings?.mascot_url;
  const mascotEnabled = settings?.mascot_enabled === "true";

  // Rotate placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim().length >= 2) {
      autoSaveSearch.mutate({ searchQuery: searchTerm.trim() });
      setShowResults(false);
      navigate(`/pesquisa?q=${encodeURIComponent(searchTerm.trim())}`);
    }
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

  // Split title to highlight keyword
  const renderTitle = () => {
    const highlightWord = settings?.hero_highlight_word || "profissional";
    if (heroTitle.includes(highlightWord)) {
      const parts = heroTitle.split(highlightWord);
      return (
        <>
          {parts[0]}
          <span className="text-gradient-primary">{highlightWord}</span>
          {parts.slice(1).join(highlightWord)}
        </>
      );
    }
    if (heroTitle.includes("?")) {
      return (
        <>
          {heroTitle.split("?")[0]}?{" "}
          <span className="text-gradient-primary">{heroTitle.split("?").slice(1).join("?").trim()}</span>
        </>
      );
    }
    return <span className="text-gradient-primary">{heroTitle}</span>;
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
              {renderTitle()}
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
                  ref={inputRef}
                  id="hero-search"
                  type="text"
                  value={searchTerm}
                  placeholder={`Procurar ${PLACEHOLDER_WORDS[placeholderIndex]}...`}
                  className="search-input-hero pl-12 pr-4"
                  aria-autocomplete="list"
                  aria-expanded={showResults}
                  aria-controls="search-results"
                  aria-activedescendant={activeDescendant}
                  autoComplete="off"
                  onChange={(e) => {
                    onSearchChange?.(e.target.value);
                    setShowResults(true);
                  }}
                  onFocus={() => {
                    if (searchTerm.length >= 2) {
                      setShowResults(true);
                    }
                  }}
                />

                {showResults && searchTerm.length >= 2 && (
                  <div id="search-results">
                    <SearchResults
                      results={searchResults}
                      isLoading={searchLoading}
                      searchTerm={searchTerm}
                      onSelect={(result) => {
                        setShowResults(false);
                        if (result?.result_name) {
                          autoSaveSearch.mutate({ searchQuery: result.result_name });
                        }
                        onSearchChange?.("");
                        inputRef.current?.focus();
                      }}
                    />
                  </div>
                )}
              </div>
            </form>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Button className="btn-cta-primary text-base" onClick={scrollToCategorias}>
                Pesquisar
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
