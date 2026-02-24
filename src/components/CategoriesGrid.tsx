import { useState } from "react";
import { Link } from "react-router-dom";
import { Category } from "@/hooks/useCategories";
import {
  UtensilsCrossed,
  Wrench,
  Store,
  Hammer,
  Scissors,
  Briefcase,
  Car,
  Home,
  Heart,
  Sparkles,
  LucideIcon,
} from "lucide-react";

interface CategoriesGridProps {
  categories: Category[];
  isLoading?: boolean;
}

const iconMap: Record<string, LucideIcon> = {
  UtensilsCrossed,
  Wrench,
  Store,
  Hammer,
  Scissors,
  Briefcase,
  Car,
  Home,
  Heart,
  Sparkles,
};

const CategoryCard = ({ category }: { category: Category }) => {
  const [imgError, setImgError] = useState(false);
  const IconComponent = iconMap[category.icon || "Briefcase"] || Briefcase;
  const hasImage = category.image_url && !imgError;

  return (
    <Link key={category.id} to={`/categoria/${category.slug}`} className="card-category group relative overflow-hidden">
      {hasImage ? (
        <>
          <img
            src={category.image_url!}
            alt={category.name}
            onError={() => setImgError(true)}
            className="absolute inset-0 w-full h-full object-cover rounded-xl group-hover:grayscale transition-all duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/50 rounded-xl" />
          <div className="relative z-10 flex flex-col items-center justify-center h-full min-h-[140px]">
            <h3 className="font-semibold text-lg mb-2 text-white text-center">{category.name}</h3>
            {category.description && (
              <p className="text-sm text-white/80 line-clamp-2 text-center">{category.description}</p>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
            <IconComponent className="w-7 h-7 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">{category.name}</h3>
          {category.description && <p className="text-sm text-muted-foreground line-clamp-2">{category.description}</p>}
        </>
      )}
    </Link>
  );
};

const CategoriesGrid = ({ categories, isLoading }: CategoriesGridProps) => {
  if (isLoading) {
    return (
      <section id="categorias" className="py-12 md:py-16">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Encontre por categoria</h2>
            <p className="text-muted-foreground text-lg">Escolha a área de negócio que procura</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="card-category animate-pulse">
                <div className="w-14 h-14 rounded-2xl bg-muted mb-4" />
                <div className="h-5 bg-muted rounded w-24 mb-2" />
                <div className="h-4 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="categorias" className="py-12 md:py-16">
      <div className="container">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Encontre por categoria</h2>
          <p className="text-muted-foreground text-lg">Escolha a área de negócio que procura</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesGrid;
