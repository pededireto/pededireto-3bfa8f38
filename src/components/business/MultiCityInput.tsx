import { useState, useRef, KeyboardEvent } from "react";
import { X, Star, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MultiCityInputProps {
  cities: string[];
  primaryCity: string;
  onChange: (cities: string[], primaryCity: string) => void;
  disabled?: boolean;
}

const MultiCityInput = ({ cities, primaryCity, onChange, disabled }: MultiCityInputProps) => {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addCities = (raw: string) => {
    const newCities = raw
      .split(/[|,]/)
      .map((c) => c.trim())
      .filter(Boolean)
      .filter((c) => !cities.some((existing) => existing.toLowerCase() === c.toLowerCase()));

    if (newCities.length === 0) return;

    const updatedCities = [...cities, ...newCities];
    const newPrimary = cities.length === 0 ? newCities[0] : primaryCity;
    onChange(updatedCities, newPrimary);
    setInputValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputValue.trim()) addCities(inputValue);
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) addCities(inputValue);
  };

  const removeCity = (city: string) => {
    if (cities.length <= 1) return;
    const updated = cities.filter((c) => c !== city);
    const newPrimary = city === primaryCity ? updated[0] : primaryCity;
    onChange(updated, newPrimary);
  };

  const setPrimary = (city: string) => {
    onChange(cities, city);
  };

  return (
    <div className="space-y-2">
      {/* Pills */}
      {cities.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {cities.map((city) => {
            const isPrimary = city === primaryCity;
            return (
              <span
                key={city}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm border transition-colors ${
                  isPrimary
                    ? "bg-primary/10 border-primary/30 text-primary font-medium"
                    : "bg-muted border-border text-foreground"
                }`}
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => setPrimary(city)}
                        disabled={disabled}
                        className={`p-0.5 rounded-full transition-colors ${
                          isPrimary
                            ? "text-primary"
                            : "text-muted-foreground/40 hover:text-primary"
                        }`}
                      >
                        <Star className="h-3 w-3" fill={isPrimary ? "currentColor" : "none"} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        {isPrimary ? "Cidade principal" : "Tornar cidade principal"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {city}
                {cities.length > 1 && !disabled && (
                  <button
                    type="button"
                    onClick={() => removeCity(city)}
                    className="p-0.5 rounded-full text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder="Escreve cidades separadas por vírgula..."
          disabled={disabled}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (inputValue.trim()) addCities(inputValue);
          }}
          disabled={disabled || !inputValue.trim()}
          className="shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {cities.length > 1 && (
        <p className="text-xs text-muted-foreground">
          ★ = cidade principal (aparece nos resultados de pesquisa). {cities.length} cidades selecionadas.
        </p>
      )}
    </div>
  );
};

export default MultiCityInput;
