import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useSearch } from "@/hooks/useSearch";
import SearchResults from "@/components/SearchResults";
import { useAutoSaveSearch } from "@/hooks/useSavedSearches";

const StickySearch = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  const { data: searchResults = [], isLoading } = useSearch(searchTerm);
  const autoSaveSearch = useAutoSaveSearch();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

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
      navigate(`/pesquisa?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm animate-in slide-in-from-top duration-300">
      <div className="container py-2">
        <form onSubmit={handleSubmit} role="search" className="max-w-2xl mx-auto">
          <div className="relative" ref={searchRef}>
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
              }}
              onFocus={() => {
                if (searchTerm.length >= 2) setShowResults(true);
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
        </form>
      </div>
    </div>
  );
};

export default StickySearch;
