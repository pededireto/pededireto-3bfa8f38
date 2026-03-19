import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearch } from "@/hooks/useSearch";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useAutoSaveSearch } from "@/hooks/useSavedSearches";
import SearchResults from "@/components/SearchResults";
import pedeDiretoMascot from "@/assets/pede-direto-mascot.png";
import { getYouTubeEmbedUrl } from "@/utils/youtube";
import { useCities } from "@/hooks/useCities";
import { useUserLocation } from "@/hooks/useUserLocation";

interface HeroSectionProps {
  onSearch?: (term: string) => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

const PLACEHOLDER_WORDS = ["canalizador", "eletricista", "restaurante", "cabeleireiro", "mecânico", "clínica"];

const HeroSection = ({ onSearch, searchTerm = "", onSearchChange }: HeroSectionProps) => {
  const navigate = useNavigate();
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

  // Pre-select detected city
  useEffect(() => {
    if (detectedCity && !selectedCity) {
      setSelectedCity(detectedCity);
    }
  }, [detectedCity]);

  const heroTitle = settings?.hero_title || "Tem um Problema?\nNós Mostramos quem Resolve";
  const heroSubtitle = settings?.hero_subtitle || "Restaurantes, serviços, lojas e profissionais — tudo num só sítio.";
  const mascotUrl = settings?.mascot_url;
  const mascotEnabled = settings?.mascot_enabled === "true";
  const heroMediaType = settings?.hero_media_type || "image";
  const heroVideoUrl = settings?.hero_video_url;
  const youtubeEmbedUrl = heroVideoUrl ? getYouTubeEmbedUrl(heroVideoUrl) : null;

  // Rotate placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim().length >= 2) {
      autoSaveSearch.mutate({ searchQuery: searchTerm.trim() });
      setShowResults(false);
      const cityParam = selectedCity ? `&cidade=${encodeURIComponent(selectedCity)}` : "";
      navigate(`/pesquisa?q=${encodeURIComponent(searchTerm.trim())}${cityParam}`);
    }
  };

  const handleCitySelect = (city: string) => {
    setSelectedCity(city === selectedCity ? "" : city);
    setShowCityDropdown(false);
  };

  const renderTitle = () => {
    const lines = heroTitle.split("\n");
    if (lines.length > 1) {
      return (
        <>
          {lines[0]}
          <br />
          <span className="text-primary">{lines[1]}</span>
        </>
      );
    }
    const highlightWord = settings?.hero_highlight_word || "Resolve";
    if (heroTitle.includes(highlightWord)) {
      const parts = heroTitle.split(highlightWord);
      return (
        <>
          {parts[0]}
          <span className="text-primary">{highlightWord}</span>
          {parts.slice(1).join(highlightWord)}
        </>
      );
    }
    return heroTitle;
  };

  return (
    <section className="section-hero py-12 md:py-20" aria-labelledby="hero-heading">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* LEFT — texto + pesquisa */}
          <div className="space-y-6">
            <h1
              id="hero-heading"
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-foreground"
            >
              {renderTitle()}
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-lg">{heroSubtitle}</p>

            {/* Search box */}
            <form onSubmit={handleSubmit} className="space-y-2 max-w-lg" role="search">
              <div className="relative" ref={searchRef}>
                <Search
                  aria-hidden="true"
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
                    if (searchTerm.length >= 2) setShowResults(true);
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

              {/* Filtro de cidade */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative" ref={cityRef}>
                  <button
                    type="button"
                    onClick={() => setShowCityDropdown((v) => !v)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-background hover:bg-accent/50 transition-colors text-sm font-medium"
                    aria-expanded={showCityDropdown}
                    aria-haspopup="listbox"
                  >
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span className={selectedCity ? "text-foreground" : "text-muted-foreground"}>
                      {selectedCity || "Qualquer cidade"}
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${showCityDropdown ? "rotate-180" : ""}`}
                    />
                  </button>

                  {showCityDropdown && (
                    <div
                      className="absolute top-full left-0 mt-1 w-48 bg-background border border-border rounded-xl shadow-lg z-50 py-1"
                      role="listbox"
                    >
                      <button
                        type="button"
                        role="option"
                        aria-selected={!selectedCity}
                        onClick={() => handleCitySelect("")}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-accent/50 transition-colors text-muted-foreground"
                      >
                        Qualquer cidade
                      </button>
                      {dynamicCities.map(({ name: city }) => (
                        <button
                          key={city}
                          type="button"
                          role="option"
                          aria-selected={selectedCity === city}
                          onClick={() => handleCitySelect(city)}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-accent/50 transition-colors ${
                            selectedCity === city ? "text-primary font-medium" : "text-foreground"
                          }`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedCity && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    <MapPin className="h-3 w-3" />
                    {selectedCity}
                    <button
                      type="button"
                      onClick={() => setSelectedCity("")}
                      className="ml-1 hover:text-primary/70"
                      aria-label="Remover cidade"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button type="submit" className="btn-cta-primary text-base">
                  Pesquisar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="btn-cta-outline text-base"
                  onClick={() => {
                    const el = document.getElementById("categorias");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Ver categorias
                </Button>
              </div>
            </form>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-3 pt-2">
              <span className="trust-badge">✓ Contactos diretos</span>
              <span className="trust-badge">✓ Sem intermediários</span>
              <span className="trust-badge">✓ Resposta rápida</span>
            </div>
          </div>

          {/* RIGHT — vídeo / mascote / logótipo (original) */}
          {heroMediaType === "video" && youtubeEmbedUrl ? (
            <div className="hidden md:flex justify-center items-center" aria-hidden="true">
              <div className="bg-card rounded-2xl shadow-card overflow-hidden w-full max-w-md aspect-video">
                <iframe src={youtubeEmbedUrl} className="w-full h-full" allowFullScreen title="Vídeo Pede Direto" />
              </div>
            </div>
          ) : mascotEnabled && mascotUrl ? (
            <div className="hidden md:flex justify-center items-center" aria-hidden="true">
              <div className="bg-card rounded-2xl shadow-card p-6 flex items-center justify-center w-full max-w-md">
                <img src={mascotUrl} alt="Mascote do Pede Direto" className="w-full h-auto max-h-80 object-contain" />
              </div>
            </div>
          ) : (
            <div className="hidden md:flex justify-center items-center" aria-hidden="true">
              <div className="bg-card rounded-2xl shadow-card p-6 flex items-center justify-center w-full max-w-md">
                <img
                  src={pedeDiretoMascot}
                  alt="Logótipo do Pede Direto"
                  className="w-full h-auto max-h-80 object-contain"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
