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
          {/* Gradiente de baixo para cima */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
          <div className="relative z-10 flex flex-col justify-end h-full min-h-[180px] md:min-h-[200px] p-4">
            <h3
              className="font-semibold text-base md:text-lg text-white text-center"
              style={{ textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}
            >
              {category.name}
            </h3>
            {category.description && (
              <p
                className="text-xs md:text-sm text-white/80 line-clamp-2 text-center mt-1"
                style={{ textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}
              >
                {category.description}
              </p>
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
              <div key={i} className="card-category animate-pulse min-h-[180px]">
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
