import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  ArrowRight,
  X,
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

// ─── Modal de preview ────────────────────────────────────────────────────────
const CategoryModal = ({ category, onClose }: { category: Category; onClose: () => void }) => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    onClose();
    navigate(`/categoria/${category.slug}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Imagem */}
        <div className="relative h-72 md:h-96">
          {category.image_url ? (
            <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
              {(() => {
                const IconComponent = iconMap[category.icon || "Briefcase"] || Briefcase;
                return <IconComponent className="w-24 h-24 text-primary/30" />;
              })()}
            </div>
          )}
          {/* Gradiente */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          {/* Botão fechar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Nome sobre a imagem */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h2
              className="text-2xl md:text-3xl font-bold text-white"
              style={{ textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}
            >
              {category.name}
            </h2>
          </div>
        </div>

        {/* Conteúdo inferior */}
        <div className="bg-card p-6 space-y-4">
          {category.description && (
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">{category.description}</p>
          )}
          <button
            onClick={handleNavigate}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Ver {category.name}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Card de categoria ────────────────────────────────────────────────────────
const CategoryCard = ({ category, onHover }: { category: Category; onHover: (category: Category) => void }) => {
  const [imgError, setImgError] = useState(false);
  const IconComponent = iconMap[category.icon || "Briefcase"] || Briefcase;
  const hasImage = category.image_url && !imgError;

  return (
    <div
      className="card-category group relative overflow-hidden cursor-pointer"
      onMouseEnter={() => onHover(category)}
      onClick={() => onHover(category)}
    >
      {hasImage ? (
        <>
          <img
            src={category.image_url!}
            alt={category.name}
            onError={() => setImgError(true)}
            className="absolute inset-0 w-full h-full object-cover rounded-xl group-hover:grayscale transition-all duration-300"
            loading="lazy"
          />
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
    </div>
  );
};

// ─── Grid principal ───────────────────────────────────────────────────────────
const CategoriesGrid = ({ categories, isLoading }: CategoriesGridProps) => {
  const [hoveredCategory, setHoveredCategory] = useState<Category | null>(null);

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
    <>
      <section id="categorias" className="py-12 md:py-16">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Encontre por categoria</h2>
            <p className="text-muted-foreground text-lg">Escolha a área de negócio que procura</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} onHover={setHoveredCategory} />
            ))}
          </div>
        </div>
      </section>

      {/* Modal de preview */}
      {hoveredCategory && <CategoryModal category={hoveredCategory} onClose={() => setHoveredCategory(null)} />}
    </>
  );
};

export default CategoriesGrid;
