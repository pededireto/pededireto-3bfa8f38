import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { AlertTriangle, MapPin, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

interface CitySuggestion {
  name: string;
  similarity_score: number;
  is_exact: boolean;
}

const CityAutocomplete = ({ value, onChange, placeholder = "Ex: Lisboa", className }: CityAutocompleteProps) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");
  const containerRef = useRef<HTMLDivElement>(null);

  // Sincronizar valor externo
  useEffect(() => { setInputValue(value || ""); }, [value]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Query de sugestões
  const { data: suggestions = [] } = useQuery({
    queryKey: ["city-suggestions", inputValue],
    enabled: inputValue.length >= 2,
    queryFn: async () => {
      const { data } = await (supabase as any).rpc("search_cities", {
        p_query: inputValue,
        p_limit: 8,
      });
      return (data || []) as CitySuggestion[];
    },
    staleTime: 1000 * 30,
  });

  // Detectar possível duplicado (similar mas não exacto, score > 0.4)
  const nearDuplicates = suggestions.filter(
    (s) => !s.is_exact && s.similarity_score > 0.4 && s.name.toLowerCase() !== inputValue.toLowerCase()
  );
  const hasExactMatch = suggestions.some((s) => s.is_exact);
  const showDuplicateWarning = inputValue.length >= 3 && nearDuplicates.length > 0 && !hasExactMatch;

  const handleSelect = (name: string) => {
    setInputValue(name);
    onChange(name);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    onChange(e.target.value);
    setOpen(true);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => inputValue.length >= 2 && setOpen(true)}
          placeholder={placeholder}
          className={cn("pl-8", className)}
          autoComplete="off"
        />
        {hasExactMatch && (
          <Check className="absolute right-2.5 top-2.5 h-4 w-4 text-green-500" />
        )}
      </div>

      {/* Alerta de duplicado */}
      {showDuplicateWarning && (
        <div className="mt-1 flex items-start gap-1.5 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-md px-2.5 py-1.5">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            Já existe uma cidade semelhante:{" "}
            {nearDuplicates.slice(0, 2).map((s, i) => (
              <button
                key={s.name}
                type="button"
                onClick={() => handleSelect(s.name)}
                className="font-semibold underline hover:no-underline"
              >
                {s.name}
                {i < Math.min(nearDuplicates.length, 2) - 1 ? ", " : ""}
              </button>
            ))}
            {" "}— clica para usar.
          </span>
        </div>
      )}

      {/* Dropdown de sugestões */}
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-lg shadow-lg overflow-hidden">
          {suggestions.map((s) => (
            <button
              key={s.name}
              type="button"
              onClick={() => handleSelect(s.name)}
              className={cn(
                "w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-muted transition-colors",
                s.is_exact && "bg-green-50/50 dark:bg-green-950/20"
              )}
            >
              <span className="flex items-center gap-2">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                {s.name}
              </span>
              {s.is_exact && (
                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <Check className="h-3 w-3" /> Existente
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CityAutocomplete;
