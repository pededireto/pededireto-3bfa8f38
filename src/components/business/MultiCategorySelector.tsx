import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, X, Star } from "lucide-react";
import { useState } from "react";

interface MultiCategorySelectorProps {
  selectedCategoryIds: string[];
  primaryCategoryId: string;
  onChange: (categoryIds: string[], primaryCategoryId: string) => void;
  disabled?: boolean;
}

const MultiCategorySelector = ({
  selectedCategoryIds,
  primaryCategoryId,
  onChange,
  disabled,
}: MultiCategorySelectorProps) => {
  const { data: categories = [] } = useCategories();
  const [open, setOpen] = useState(false);

  const availableCategories = categories.filter(
    (c) => !selectedCategoryIds.includes(c.id)
  );

  const handleAdd = (categoryId: string) => {
    const newIds = [...selectedCategoryIds, categoryId];
    const newPrimary =
      selectedCategoryIds.length === 0 ? categoryId : primaryCategoryId;
    onChange(newIds, newPrimary);
    setOpen(false);
  };

  const handleRemove = (categoryId: string) => {
    if (selectedCategoryIds.length <= 1) return;
    const newIds = selectedCategoryIds.filter((id) => id !== categoryId);
    const newPrimary =
      categoryId === primaryCategoryId ? newIds[0] : primaryCategoryId;
    onChange(newIds, newPrimary);
  };

  const handleSetPrimary = (categoryId: string) => {
    onChange(selectedCategoryIds, categoryId);
  };

  return (
    <div className="space-y-3">
      {/* Selected pills */}
      {selectedCategoryIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCategoryIds.map((catId) => {
            const cat = categories.find((c) => c.id === catId);
            if (!cat) return null;
            const isPrimary = catId === primaryCategoryId;
            return (
              <Badge
                key={catId}
                variant={isPrimary ? "default" : "secondary"}
                className="px-3 py-1.5 text-sm gap-1.5 select-none"
              >
                {cat.icon && <span className="mr-0.5">{cat.icon}</span>}
                {cat.name}

                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetPrimary(catId);
                        }}
                        disabled={disabled}
                        className="ml-0.5 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`h-3.5 w-3.5 ${
                            isPrimary
                              ? "fill-current text-yellow-300"
                              : "text-muted-foreground/60 hover:text-yellow-400"
                          }`}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {isPrimary
                        ? "Categoria principal"
                        : "Tornar categoria principal"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {selectedCategoryIds.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(catId);
                    }}
                    disabled={disabled}
                    className="ml-0.5 hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Add button */}
      {availableCategories.length > 0 && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              className="gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar categoria
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-64 p-2 max-h-60 overflow-y-auto"
            align="start"
          >
            <div className="space-y-0.5">
              {availableCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleAdd(cat.id)}
                  className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors flex items-center gap-2"
                >
                  {cat.icon && <span>{cat.icon}</span>}
                  {cat.name}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Helper text */}
      <p className="text-[11px] text-muted-foreground">
        ★ = categoria principal (aparece nos resultados de pesquisa). Clica ★
        para alterar.
      </p>
    </div>
  );
};

export default MultiCategorySelector;
