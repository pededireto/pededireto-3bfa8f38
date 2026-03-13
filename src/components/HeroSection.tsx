import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearch } from "@/hooks/useSearch";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useAutoSaveSearch } from "@/hooks/useSavedSearches";
import { useCategories } from "@/hooks/useCategories";
import SearchResults from "@/components/SearchResults";

interface HeroSectionProps {
  onSearch?: (term: string) => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

const PLACEHOLDER_WORDS = ["canalizador", "eletricista", "restaurante", "cabeleireiro", "mecânico", "clínica"];

const POPULAR_CITIES = ["Lisboa", "Porto", "Braga", "Coimbra", "Setúbal", "Faro", "Évora", "Aveiro", "Viseu", "Leiria"];

// Detect if URL is YouTube
const isYouTubeUrl = (url: string) => url.includes("youtube.com") || url.includes("youtu.be");

// Get YouTube embed URL
const getYouTubeEmbedUrl = (url: string): string => {
  const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  if (match)
    return `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&loop=1&playlist=${match[1]}&controls=0&showinfo=0`;
  return url;
};

// Detect base64
const isBase64 = (url: string) => url.startsWith("data:");

// Split array into N columns for masonry
function splitIntoColumns<T>(arr: T[], cols: number): T[][] {
  const columns: T[][] = Array.from({ length: cols }, () => []);
  arr.forEach((item, i) => columns[i % cols].push(item));
  return columns;
}

// Single masonry cell — image or video
const MasonryCell = ({
  name,
  imageUrl,
  videoUrl,
  slug,
}: {
  name: string;
  imageUrl: string | null;
  videoUrl: string | null;
  slug: string;
}) => {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  const hasVideo = !!videoUrl;
  const isYT = hasVideo && isYouTubeUrl(videoUrl!);
  const isMp4 = hasVideo && !isYT;

  return (
    <div
      className="relative overflow-hidden rounded-xl cursor-pointer group"
      style={{ marginBottom: "8px" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/top/${slug}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/top/${slug}`)}
      aria-label={`Ver top ${name}`}
    >
      {/* Media */}
      <div className="relative w-full" style={{ paddingBottom: "75%" }}>
        <div className="absolute inset-0">
          {/* Video (mp4 / Supabase) */}
          {isMp4 && <video src={videoUrl!} autoPlay muted loop playsInline className="w-full h-full object-cover" />}

          {/* Video (YouTube iframe) */}
          {isYT && (
            <iframe
              src={getYouTubeEmbedUrl(videoUrl!)}
              className="w-full h-full"
              frameBorder="0"
              allow="autoplay; muted"
              title={name}
            />
          )}

          {/* Image fallback */}
          {!hasVideo && imageUrl && !isBase64(imageUrl) && (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          )}

          {/* Base64 image fallback */}
          {!hasVideo && imageUrl && isBase64(imageUrl) && (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          )}

          {/* No media fallback */}
          {!hasVideo && !imageUrl && (
            <div className="w-full h-full bg-gradient-to-br from-primary/60 to-primary/20 flex items-center justify-center">
              <span className="text-3xl font-bold text-white/40">{name.charAt(0)}</span>
            </div>
          )}

          {/* Overlay on hover */}
          <div
            className={`absolute inset-0 bg-black transition-opacity duration-300 flex items-end p-3 ${
              hovered ? "opacity-70" : "opacity-0"
            }`}
          />
          <div
            className={`absolute bottom-0 left-0 right-0 p-3 transition-all duration-300 ${
              hovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            <p className="text-white text-xs font-semibold leading-tight drop-shadow-lg truncate">{name.trim()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const HeroSection = ({ onSearch, searchTerm = "", onSearchChange }: HeroSectionProps) => {
  const navigate = useNavigate();
  const [showResults, setShowResults] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [selectedCity, setSelectedCity] = useState("");
  const [activeDescendant, setActiveDescendant] = useState<string | undefined>();

  const { data: searchResults = [], isLoading: searchLoading } = useSearch(searchTerm);
  const { data: settings } = useSiteSettings();
  const { data: categories = [] } = useCategories();
  const autoSaveSearch = useAutoSaveSearch();

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);

  const heroTitle = settings?.hero_title || "Tem um Problema?\nNós Mostramos quem Resolve";
  const heroSubtitle = settings?.hero_subtitle || "Restaurantes, serviços, lojas e profissionais — tudo num só sítio.";

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

  // Build masonry items from categories (cycle if < 12)
  const masonryItems = (() => {
    const cats = categories.filter((c) => c.image_url || (c as any).video_url);
    if (cats.length === 0) return categories.slice(0, 12);
    // repeat until we have ~12
    const result = [];
    while (result.length < 12) {
      result.push(...cats);
    }
    return result.slice(0, 12);
  })();

  const columns = splitIntoColumns(masonryItems, 3);

  // Render title with line break support
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
    <section
      className="relative overflow-hidden bg-background"
      style={{ minHeight: "calc(100vh - 64px)" }}
      aria-labelledby="hero-heading"
    >
      {/* ── MASONRY BACKGROUND ── */}
      <div
        className="absolute inset-0 flex gap-2 p-2 opacity-20 pointer-events-none select-none"
        aria-hidden="true"
        style={{ filter: "blur(0px)" }}
      >
        {columns.map((col, ci) => (
          <div key={ci} className="flex-1 flex flex-col gap-2">
            {col.map((cat, ri) => (
              <div
                key={`${cat.id}-${ri}`}
                className="relative overflow-hidden rounded-xl bg-muted"
                style={{ paddingBottom: ri % 2 === 0 ? "120%" : "75%" }}
              >
                <div className="absolute inset-0">
                  {cat.image_url && !isBase64(cat.image_url) && (
                    <img src={cat.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  )}
                  {cat.image_url && isBase64(cat.image_url) && (
                    <img src={cat.image_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ── OVERLAY GRADIENT ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, rgba(var(--background-rgb, 255,255,255), 0.97) 0%, rgba(var(--background-rgb, 255,255,255), 0.85) 50%, rgba(var(--background-rgb, 255,255,255), 0.75) 100%)",
        }}
      />

      {/* ── CONTENT ── */}
      <div className="relative z-10 container py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* LEFT — text + search */}
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
              {/* Main search input */}
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

              {/* City filter row */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* City dropdown */}
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
                      {POPULAR_CITIES.map((city) => (
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

                {/* Active city pill */}
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

              {/* CTA buttons */}
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

          {/* RIGHT — interactive masonry grid */}
          <div className="hidden md:flex gap-2 max-h-[520px] overflow-hidden" aria-hidden="true">
            {columns.map((col, ci) => (
              <div
                key={ci}
                className="flex-1 flex flex-col gap-2"
                style={{
                  transform: `translateY(${ci % 2 === 0 ? "0px" : "-24px"})`,
                }}
              >
                {col.map((cat, ri) => (
                  <MasonryCell
                    key={`${cat.id}-${ri}`}
                    name={cat.name}
                    imageUrl={cat.image_url}
                    videoUrl={(cat as any).video_url ?? null}
                    slug={cat.slug}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
