import { Link } from "react-router-dom";
import { Subcategory } from "@/hooks/useSubcategories";
import { ArrowRight } from "lucide-react";

interface SubcategoriesGridProps {
  subcategories: Subcategory[];
  categorySlug: string;
  isLoading?: boolean;
}

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
        <Link
          key={sub.id}
          to={`/categoria/${categorySlug}/${sub.slug}`}
          className="group bg-card rounded-xl p-6 shadow-card hover:shadow-lg transition-all hover:-translate-y-1 border border-border"
        >
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
        </Link>
      ))}
    </div>
  );
};

export default SubcategoriesGrid;
