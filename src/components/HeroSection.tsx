import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, MapPin, ChevronDown, ArrowRight, Briefcase, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearch } from "@/hooks/useSearch";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useAutoSaveSearch } from "@/hooks/useSavedSearches";
import SearchResults from "@/components/SearchResults";
import { useCities } from "@/hooks/useCities";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useAuth } from "@/hooks/useAuth";

interface HeroSectionProps {
  onSearch?: (term: string) => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

const PLACEHOLDER_WORDS = ["canalizador", "eletricista", "restaurante", "cabeleireiro", "mecânico", "clínica"];

const HeroSection = ({ onSearch, searchTerm = "", onSearchChange }: HeroSectionProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showResults, setShowResults] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [selectedCity, setSelectedCity] = useState("");
  const [activeDescendant, setActiveDescendant] = useState<string | undefined>();

  const { data: searchResults = [], isLoading: searchLoading } = useSearch(searchTerm);
  const { data: settings } = useSiteSettings();
  const autoSaveSearch = useAutoSaveSearch();
  const { data: dynamicCities = [] } = useCities(15);
  const { city: detectedCity, isDetecting, hasAsked, detectLocation, setManualCity, clearCity } = useUserLocation();

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (detectedCity && !selectedCity) setSelectedCity(detectedCity);
  }, [detectedCity]);

  const heroTitle = settings?.hero_title || "Tem um Problema?\nResolve já.";
  const heroSubtitle = settings?.hero_subtitle || "Encontra profissionais locais de confiança. Canalizadores, eletricistas, restaurantes e muito mais — tudo num só sítio.";

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) setShowCityDropdown(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchTerm.trim();
    const hasTerm = trimmed.length >= 2;
    const hasCity = !!selectedCity;
    if (!hasTerm && !hasCity) return;
    setShowResults(false);
    const params = new URLSearchParams();
    if (hasTerm) {
      params.set("q", trimmed);
      autoSaveSearch.mutate({ searchQuery: trimmed });
    }
    if (hasCity) params.set("cidade", selectedCity);
    navigate(`/pesquisa?${params.toString()}`);
  };

  const handleCitySelect = (city: string) => {
    const newCity = city === selectedCity ? "" : city;
    setSelectedCity(newCity);
    if (newCity) setManualCity(newCity);
    else clearCity();
    setShowCityDropdown(false);
  };

  const handleSearchFocus = () => {
    if (!hasAsked) detectLocation();
  };

  const renderTitle = () => {
    const lines = heroTitle.split("\n").filter((l: string) => l.trim());
    if (lines.length > 1) {
      return (
        <>
          {lines[0]}
          <br />
          <span className="text-primary">{lines.slice(1).join(" ")}</span>
        </>
      );
    }
    const qIndex = heroTitle.indexOf("?");
    if (qIndex !== -1) {
      return (
        <>
          {heroTitle.slice(0, qIndex + 1)}
          <br />
          <span className="text-primary">{heroTitle.slice(qIndex + 1).trim()}</span>
        </>
      );
    }
    return heroTitle;
  };

  const quoteCTALink = user ? "/pedir-servico" : "/register";

  return (
    <section className="relative overflow-hidden py-16 md:py-24" style={{ background: "var(--gradient-hero)" }} aria-labelledby="hero-heading">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* LEFT */}
          <div className="space-y-6 max-w-xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-semibold text-primary tracking-wide uppercase">
                A plataforma nº1 para encontrar serviços
              </span>
            </div>

            <h1
              id="hero-heading"
              className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.1] text-foreground tracking-tight"
            >
              {renderTitle()}
            </h1>

            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">{heroSubtitle}</p>

            {/* Search bar */}
            <form onSubmit={handleSubmit} role="search" className="space-y-3">
              <div className="flex flex-col sm:flex-row bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
                {/* Search input */}
                <div className="relative flex-1" ref={searchRef}>
                  <Search aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    ref={inputRef}
                    id="hero-search"
                    type="text"
                    value={searchTerm}
                    placeholder={`Procurar ${PLACEHOLDER_WORDS[placeholderIndex]}...`}
                    className="w-full h-14 pl-12 pr-4 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-base"
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
                      if (searchTerm.length >= 2) setShowResults(true);
                      handleSearchFocus();
                    }}
                  />
                  {showResults && searchTerm.length >= 2 && (
                    <div id="search-results" className="absolute top-full left-0 right-0 z-50">
                      <SearchResults
                        results={searchResults}
                        isLoading={searchLoading}
                        searchTerm={searchTerm}
                        onSelect={(result) => {
                          setShowResults(false);
                          if (result?.result_name) autoSaveSearch.mutate({ searchQuery: result.result_name });
                          onSearchChange?.("");
                          inputRef.current?.focus();
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* City selector */}
                <div className="relative border-t sm:border-t-0 sm:border-l border-border" ref={cityRef}>
                  <button
                    type="button"
                    onClick={() => setShowCityDropdown((v) => !v)}
                    className="flex items-center gap-2 h-14 px-4 hover:bg-accent/30 transition-colors w-full sm:w-auto whitespace-nowrap"
                    aria-expanded={showCityDropdown}
                    aria-haspopup="listbox"
                  >
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <span className={`text-sm ${selectedCity ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {selectedCity || "Cidade"}
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${showCityDropdown ? "rotate-180" : ""}`} />
                  </button>

                  {showCityDropdown && (
                    <div className="absolute top-full right-0 mt-1 w-52 bg-card border border-border rounded-xl shadow-lg z-50 py-1 max-h-64 overflow-y-auto" role="listbox">
                      <button
                        type="button" role="option" aria-selected={!selectedCity}
                        onClick={() => handleCitySelect("")}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-accent/50 transition-colors text-muted-foreground"
                      >
                        Qualquer cidade
                      </button>
                      {dynamicCities.map(({ name: city }) => (
                        <button
                          key={city} type="button" role="option" aria-selected={selectedCity === city}
                          onClick={() => handleCitySelect(city)}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-accent/50 transition-colors ${selectedCity === city ? "text-primary font-medium" : "text-foreground"}`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit */}
                <Button type="submit" className="h-14 px-6 rounded-none sm:rounded-r-2xl sm:rounded-l-none bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base shrink-0">
                  Encontrar agora
                </Button>
              </div>
            </form>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> Contactos diretos</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> Sem intermediários</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> 100% grátis</span>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3 pt-1">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base px-6 rounded-xl shadow-md">
                <Link to={quoteCTALink}>
                  Pedir Orçamento Gratuito <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-2 border-foreground/20 text-foreground font-semibold text-base px-6 rounded-xl hover:bg-accent/50">
                <Link to="/claim-business">
                  <Briefcase className="mr-2 h-5 w-5" /> Sou profissional
                </Link>
              </Button>
            </div>
          </div>

          {/* RIGHT — image collage placeholder */}
          <div className="hidden lg:grid grid-cols-2 gap-4" aria-hidden="true">
            <div className="space-y-4">
              <div className="rounded-2xl bg-primary/10 aspect-[4/5] flex items-center justify-center overflow-hidden">
                <div className="text-center p-4">
                  <div className="text-5xl mb-2">🔧</div>
                  <p className="text-sm font-medium text-primary">Canalizador</p>
                </div>
              </div>
              <div className="rounded-2xl bg-accent/60 aspect-square flex items-center justify-center overflow-hidden">
                <div className="text-center p-4">
                  <div className="text-5xl mb-2">⚡</div>
                  <p className="text-sm font-medium text-accent-foreground">Eletricista</p>
                </div>
              </div>
            </div>
            <div className="space-y-4 pt-8">
              <div className="rounded-2xl bg-muted aspect-square flex items-center justify-center overflow-hidden">
                <div className="text-center p-4">
                  <div className="text-5xl mb-2">🍽️</div>
                  <p className="text-sm font-medium text-foreground">Restaurante</p>
                </div>
              </div>
              <div className="rounded-2xl bg-primary/5 border border-primary/20 aspect-[4/5] flex items-center justify-center overflow-hidden">
                <div className="text-center p-4">
                  <div className="text-5xl mb-2">🏠</div>
                  <p className="text-sm font-medium text-primary">Obras</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
