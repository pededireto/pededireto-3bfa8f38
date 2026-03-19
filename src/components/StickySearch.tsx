import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, MapPin, X } from "lucide-react";
import { useSearch } from "@/hooks/useSearch";
import SearchResults from "@/components/SearchResults";
import { useAutoSaveSearch } from "@/hooks/useSavedSearches";
import { useCities } from "@/hooks/useCities";
import { useUserLocation } from "@/hooks/useUserLocation";

const HIDDEN_ROUTES = ["/pesquisa"];

const StickySearch = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const { data: searchResults = [], isLoading } = useSearch(searchTerm);
  const { data: cities = [] } = useCities(12);
  const autoSaveSearch = useAutoSaveSearch();
  const { city: detectedCity } = useUserLocation();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);
  const [hasInitCity, setHasInitCity] = useState(false);

  // Pre-fill detected city once
  useEffect(() => {
    if (detectedCity && !hasInitCity && !cityFilter) {
      setCityFilter(detectedCity);
      setHasInitCity(true);
    }
  }, [detectedCity, hasInitCity, cityFilter]);

  const isHiddenRoute = HIDDEN_ROUTES.some((r) => location.pathname.startsWith(r));

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
        setShowCityPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim().length >= 2) {
      autoSaveSearch.mutate({ searchQuery: searchTerm.trim() });
      setShowResults(false);
      const params = new URLSearchParams();
      params.set("q", searchTerm.trim());
      if (cityFilter) params.set("cidade", cityFilter);
      navigate(`/pesquisa?${params.toString()}`);
    }
  };

  if (!isVisible || isHiddenRoute) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm animate-in slide-in-from-top duration-300">
      <div className="container py-2">
        <form onSubmit={handleSubmit} role="search" className="max-w-2xl mx-auto">
          <div className="flex gap-2" ref={searchRef}>
            {/* Search input */}
            <div className="relative flex-1">
              <Search
                aria-hidden="true"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              />
              <input
                type="text"
                value={searchTerm}
                placeholder="O que procura?"
                className="w-full h-9 pl-10 pr-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowResults(true);
                  setShowCityPicker(false);
                }}
                onFocus={() => {
                  if (searchTerm.length >= 2) setShowResults(true);
                  setShowCityPicker(false);
                }}
              />

              {showResults && searchTerm.length >= 2 && (
                <SearchResults
                  results={searchResults}
                  isLoading={isLoading}
                  searchTerm={searchTerm}
                  onSelect={(result) => {
                    setShowResults(false);
                    if (result?.result_name) {
                      autoSaveSearch.mutate({ searchQuery: result.result_name });
                    }
                    setSearchTerm("");
                  }}
                />
              )}
            </div>

            {/* City filter button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowCityPicker(!showCityPicker);
                  setShowResults(false);
                }}
                className={`h-9 px-3 rounded-lg border text-sm flex items-center gap-1.5 transition-colors ${
                  cityFilter
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-input bg-background text-muted-foreground hover:text-foreground hover:border-foreground/30"
                }`}
              >
                <MapPin className="h-3.5 w-3.5" />
                <span className="hidden sm:inline max-w-[100px] truncate">
                  {cityFilter || "Cidade"}
                </span>
                {cityFilter && (
                  <X
                    className="h-3 w-3 ml-0.5 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCityFilter("");
                      setShowCityPicker(false);
                    }}
                  />
                )}
              </button>

              {showCityPicker && (
                <div className="absolute right-0 top-full mt-1 w-56 max-h-64 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg z-50 p-1">
                  {cities.map((city) => (
                    <button
                      key={city.name}
                      type="button"
                      onClick={() => {
                        setCityFilter(city.name);
                        setShowCityPicker(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between transition-colors ${
                        cityFilter === city.name
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted text-foreground"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {city.name}
                      </span>
                      <span className="text-xs text-muted-foreground">({city.count})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StickySearch;
