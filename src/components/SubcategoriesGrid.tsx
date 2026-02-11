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
            className="absolute inset-0 w-full h-full object-cover rounded-xl grayscale group-hover:grayscale-0 transition-all duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/50 rounded-xl" />
          <div className="relative z-10 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg text-white">
                {sub.name}
              </h3>
              <ArrowRight className="w-5 h-5 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
            {sub.description && (
              <p className="text-sm text-white/80 line-clamp-2">
                {sub.description}
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
              {sub.name}
            </h3>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
          {sub.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {sub.description}
            </p>
          )}
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
          <div key={i} className="bg-card rounded-xl p-6 animate-pulse">
            <div className="h-6 bg-muted rounded w-32 mb-3" />
            <div className="h-4 bg-muted rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (subcategories.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhuma subcategoria disponível nesta categoria.
      </div>
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
