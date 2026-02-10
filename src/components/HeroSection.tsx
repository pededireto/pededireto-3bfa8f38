import { useState, useRef, useEffect } from "react";
import { Search, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearch } from "@/hooks/useSearch";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useAuth } from "@/hooks/useAuth";
import { useSaveSearch } from "@/hooks/useSavedSearches";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
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
  const { user } = useAuth();
  const saveSearch = useSaveSearch();
  const { toast } = useToast();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  const heroTitle = settings?.hero_title || "Tem um problema? Nós mostramos quem resolve.";
  const heroSubtitle = settings?.hero_subtitle || "Restaurantes, serviços, lojas e profissionais — tudo num só sítio.";
  const mascotUrl = settings?.mascot_url;
  const mascotEnabled = settings?.mascot_enabled === "true";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchTerm);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <section className="section-hero py-12 md:py-20">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-foreground">
              {heroTitle.includes("?") ? (
                <>
                  {heroTitle.split("?")[0]}?{" "}
                  <span className="text-gradient-primary">{heroTitle.split("?").slice(1).join("?").trim()}</span>
                </>
              ) : (
                <span className="text-gradient-primary">{heroTitle}</span>
              )}
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-lg">
              {heroSubtitle}
            </p>

            {/* Search Box */}
            <form onSubmit={handleSubmit} className="max-w-lg">
              <div className="relative" ref={searchRef}>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="O que procura? (ex: canalizador, pizza, barbearia...)"
                  value={searchTerm}
                  onChange={(e) => {
                    onSearchChange?.(e.target.value);
                    setShowResults(true);
                  }}
                  onFocus={() => setShowResults(true)}
                  className="search-input-hero pl-12 pr-4"
                />

                {showResults && searchTerm.length >= 2 && (
                  <SearchResults
                    results={searchResults}
                    isLoading={searchLoading}
                    searchTerm={searchTerm}
                    onSelect={() => {
                      setShowResults(false);
                      onSearchChange?.("");
                    }}
                  />
                )}
                {searchTerm.length >= 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 gap-1 text-muted-foreground hover:text-primary"
                    onClick={() => {
                      if (!user) {
                        navigate("/login");
                        return;
                      }
                      saveSearch.mutate(
                        { searchQuery: searchTerm },
                        {
                          onSuccess: () => toast({ title: "Pesquisa guardada!" }),
                        }
                      );
                    }}
                    title="Guardar pesquisa"
                  >
                    <Bookmark className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </form>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Button
                className="btn-cta-primary text-base"
                onClick={() => document.getElementById("categorias")?.scrollIntoView({ behavior: "smooth" })}
              >
                Encontrar quem resolve
              </Button>
              <Button
                variant="outline"
                className="btn-cta-outline text-base"
                onClick={() => document.getElementById("categorias")?.scrollIntoView({ behavior: "smooth" })}
              >
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

          {mascotEnabled && mascotUrl ? (
            <div className="hidden md:flex justify-center items-center relative">
              <div className="relative animate-float">
                <img
                  src={mascotUrl}
                  alt="Mascote do Pede Direto"
                  className="w-72 lg:w-96 drop-shadow-2xl"
                />
                <div className="absolute -top-4 -right-4 bg-card rounded-2xl p-4 shadow-lg border border-border max-w-[200px]">
                  <p className="text-sm font-medium text-foreground">
                    Eu ajudo-te a encontrar quem resolve! 💚
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex justify-center items-center relative">
              <div className="relative animate-float">
                <img
                  src={pedeDiretoMascot}
                  alt="Pede Direto - Logo"
                  className="w-72 lg:w-96 drop-shadow-2xl"
                />
                <div className="absolute -top-4 -right-4 bg-card rounded-2xl p-4 shadow-lg border border-border max-w-[200px]">
                  <p className="text-sm font-medium text-foreground">
                    Eu ajudo-te a encontrar quem resolve! 💚
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
