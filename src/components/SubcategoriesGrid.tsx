import { useState } from "react";
import { Link } from "react-router-dom";
import { Subcategory } from "@/hooks/useSubcategories";
import { ArrowRight } from "lucide-react";

interface SubcategoriesGridProps {
  subcategories: Subcategory[];
  categorySlug: string;
  isLoading?: boolean;
}

const SubcategoryCard = ({ sub, categorySlug }: { sub: Subcategory; categorySlug: string }) => {
  const [imgError, setImgError] = useState(false);
  const hasImage = sub.image_url && !imgError;

  return (
    <Link
      to={`/categoria/${categorySlug}/${sub.slug}`}
      className="group relative overflow-hidden bg-card rounded-xl shadow-card hover:shadow-lg transition-all hover:-translate-y-1 border border-border"
    >
      {hasImage ? (
        <>
          <img
            src={sub.image_url!}
            alt={sub.name}
            onError={() => setImgError(true)}
            className="absolute inset-0 w-full h-full object-cover rounded-xl group-hover:grayscale transition-all duration-300"
            loading="lazy"
          />
          {/* Gradiente de baixo para cima */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
          <div className="relative z-10 flex flex-col justify-end min-h-[160px] md:min-h-[180px] p-5">
            <div className="flex items-center justify-between">
              <h3
                className="font-semibold text-base md:text-lg text-white"
                style={{ textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}
              >
                {sub.name}
              </h3>
              <ArrowRight className="w-5 h-5 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
            </div>
            {sub.description && (
              <p
                className="text-xs md:text-sm text-white/80 line-clamp-2 mt-1"
                style={{ textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}
              >
                {sub.description}
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="p-6 min-h-[160px] md:min-h-[180px] flex flex-col justify-center">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{sub.name}</h3>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
          {sub.description && <p className="text-sm text-muted-foreground line-clamp-2">{sub.description}</p>}
        </div>
      )}
    </Link>
  );
};

const SubcategoriesGrid = ({ subcategories, categorySlug, isLoading }: SubcategoriesGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card rounded-xl p-6 animate-pulse min-h-[160px]">
            <div className="h-6 bg-muted rounded w-32 mb-3" />
            <div className="h-4 bg-muted rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (subcategories.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">Nenhuma subcategoria disponível nesta categoria.</div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {subcategories.map((sub) => (
        <SubcategoryCard key={sub.id} sub={sub} categorySlug={categorySlug} />
      ))}
    </div>
  );
};

export default SubcategoriesGrid;
