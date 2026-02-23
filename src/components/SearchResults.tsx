import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SearchResult } from "@/hooks/useSearch";
import { Building2, FolderOpen, Loader2 } from "lucide-react";

interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  searchTerm: string;
  onSelect: (result?: SearchResult) => void;
}

const SearchResults = ({ results, isLoading, searchTerm, onSelect }: SearchResultsProps) => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  if (searchTerm.length < 2) return null;

  const handleSelect = (result: SearchResult) => {
    if (result.result_type === "subcategory") {
      navigate(`/categoria/${result.category_slug}/${result.result_slug}`);
    } else {
      navigate(`/negocio/${result.result_slug}`);
    }
    onSelect(result);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!results.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    }

    if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    }

    if (e.key === "Escape") {
      onSelect();
    }
  };

  return (
    <div
      className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-xl border border-border z-50 max-h-80 overflow-y-auto"
      role="listbox"
      aria-label="Resultados da pesquisa"
      onKeyDown={handleKeyDown}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-6" role="status" aria-live="polite">
          <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
          <span className="ml-2 text-sm text-muted-foreground">A pesquisar...</span>
        </div>
      ) : results.length === 0 ? (
        <div className="p-4 text-center text-sm text-muted-foreground" aria-live="polite">
          Sem resultados para "{searchTerm}"
        </div>
      ) : (
        <ul ref={listRef} className="py-2">
          {results.map((result, index) => {
            const isActive = index === activeIndex;

            return (
              <li key={`${result.result_type}-${result.result_id}`} role="option" aria-selected={isActive}>
                <button
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`w-full text-left px-4 py-3 transition-colors flex items-center gap-3 ${
                    isActive ? "bg-muted/70" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {result.result_type === "subcategory" ? (
                      <FolderOpen className="w-4 h-4 text-primary" aria-hidden="true" />
                    ) : (
                      <Building2 className="w-4 h-4 text-primary" aria-hidden="true" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{result.result_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {result.result_type === "subcategory" ? "Subcategoria" : "Negócio"}
                      {result.category_name ? ` • ${result.category_name}` : ""}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default SearchResults;
