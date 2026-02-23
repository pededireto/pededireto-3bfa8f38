import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowRight } from "lucide-react";

interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  business_count: number;
}

const useCategoriesWithCount = () => {
  return useQuery({
    queryKey: ["categories-with-count"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, image_url")
        .eq("is_active", true);

      if (error) throw error;

      const { data: counts, error: countErr } = await supabase
        .from("businesses")
        .select("category_id")
        .eq("is_active", true);

      if (countErr) throw countErr;

      const countMap: Record<string, number> = {};

      (counts || []).forEach((b: any) => {
        if (b.category_id) {
          countMap[b.category_id] = (countMap[b.category_id] || 0) + 1;
        }
      });

      const result: CategoryWithCount[] = (data || [])
        .map((c: any) => ({
          ...c,
          business_count: countMap[c.id] || 0,
        }))
        .filter((c: CategoryWithCount) => c.business_count > 0)
        .sort((a: CategoryWithCount, b: CategoryWithCount) => b.business_count - a.business_count)
        .slice(0, 8);

      return result;
    },
    staleTime: 5 * 60 * 1000,
  });
};

const gradientFallbacks = [
  "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.6))",
  "linear-gradient(135deg, hsl(220 70% 50%), hsl(220 70% 30%))",
  "linear-gradient(135deg, hsl(340 65% 47%), hsl(340 65% 30%))",
  "linear-gradient(135deg, hsl(160 60% 40%), hsl(160 60% 25%))",
  "linear-gradient(135deg, hsl(30 80% 55%), hsl(30 80% 35%))",
  "linear-gradient(135deg, hsl(270 55% 50%), hsl(270 55% 30%))",
  "linear-gradient(135deg, hsl(190 70% 42%), hsl(190 70% 25%))",
  "linear-gradient(135deg, hsl(10 75% 50%), hsl(10 75% 30%))",
];

const CategoryAccordion = () => {
  const { data: categories = [], isLoading } = useCategoriesWithCount();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
        <span className="sr-only">A carregar categorias...</span>
      </div>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section className="py-8 md:py-12" aria-labelledby="categories-heading">
      <div className="container px-4">
        <h2 id="categories-heading" className="text-2xl md:text-3xl font-bold text-foreground mb-6">
          Explorar Categorias
        </h2>

        {/* Desktop */}
        <div
          className="hidden md:flex gap-2 h-[350px] rounded-2xl overflow-hidden"
          role="list"
          aria-label="Lista de categorias"
        >
          {categories.map((cat, i) => {
            const isHovered = hoveredIndex === i;

            const bgImage = cat.image_url ? `url(${cat.image_url})` : gradientFallbacks[i % gradientFallbacks.length];

            return (
              <Link
                key={cat.id}
                to={`/categoria/${cat.slug}`}
                role="listitem"
                aria-label={`Ver categoria ${cat.name} com ${cat.business_count} negócio${
                  cat.business_count !== 1 ? "s" : ""
                }`}
                className="relative overflow-hidden rounded-xl cursor-pointer group focus:outline-none focus:ring-2 focus:ring-primary"
                style={{
                  flex: isHovered ? 4 : 1,
                  transition: "flex 0.4s ease",
                  backgroundImage: cat.image_url ? bgImage : undefined,
                  background: !cat.image_url ? bgImage : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(i)}
                onBlur={() => setHoveredIndex(null)}
              >
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />

                {/* Collapsed */}
                <div
                  className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
                  style={{
                    opacity: isHovered ? 0 : 1,
                  }}
                >
                  <span className="text-white text-3xl font-bold drop-shadow-lg">{cat.name.charAt(0)}</span>
                </div>

                {/* Expanded */}
                <div
                  className="absolute inset-0 flex flex-col items-start justify-end p-6 transition-opacity duration-300"
                  style={{
                    opacity: isHovered ? 1 : 0,
                  }}
                >
                  <h3 className="text-white text-xl font-bold mb-1 drop-shadow-lg">{cat.name}</h3>
                  <p className="text-white/80 text-sm mb-3">
                    {cat.business_count} negócio
                    {cat.business_count !== 1 ? "s" : ""}
                  </p>
                  <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-full">
                    Ver todos
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Mobile */}
        <div
          className="flex md:hidden gap-3 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory"
          role="list"
          aria-label="Lista de categorias"
        >
          {categories.map((cat, i) => {
            const bgImage = cat.image_url ? `url(${cat.image_url})` : gradientFallbacks[i % gradientFallbacks.length];

            return (
              <Link
                key={cat.id}
                to={`/categoria/${cat.slug}`}
                role="listitem"
                aria-label={`Ver categoria ${cat.name} com ${cat.business_count} negócio${
                  cat.business_count !== 1 ? "s" : ""
                }`}
                className="relative flex-shrink-0 w-[200px] h-[220px] rounded-xl overflow-hidden snap-start focus:outline-none focus:ring-2 focus:ring-primary"
                style={{
                  backgroundImage: cat.image_url ? bgImage : undefined,
                  background: !cat.image_url ? bgImage : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute inset-0 flex flex-col items-start justify-end p-4">
                  <h3 className="text-white text-base font-bold drop-shadow-lg">{cat.name}</h3>
                  <p className="text-white/80 text-xs mb-2">
                    {cat.business_count} negócio
                    {cat.business_count !== 1 ? "s" : ""}
                  </p>
                  <span className="inline-flex items-center gap-1 text-white/90 text-xs font-medium">
                    Ver todos
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoryAccordion;
