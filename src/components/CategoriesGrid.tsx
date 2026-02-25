import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  ArrowLeft,
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

// ─── Modal com navegação ──────────────────────────────────────────────────────
const CategoryModal = ({
  categories,
  initialIndex,
  onClose,
}: {
  categories: Category[];
  initialIndex: number;
  onClose: () => void;
}) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const category = categories[currentIndex];

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < categories.length - 1;

  const goPrev = useCallback(() => {
    if (hasPrev) setCurrentIndex((i) => i - 1);
  }, [hasPrev]);

  const goNext = useCallback(() => {
    if (hasNext) setCurrentIndex((i) => i + 1);
  }, [hasNext]);

  // Navegação por teclado
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goPrev, goNext]);

  const handleNavigate = () => {
    onClose();
    navigate(`/categoria/${category.slug}`);
  };

  const IconComponent = iconMap[category.icon || "Briefcase"] || Briefcase;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

      {/* Seta esquerda */}
      {hasPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="absolute left-3 md:left-6 z-20 w-11 h-11 rounded-full bg-black/50 hover:bg-primary flex items-center justify-center text-white transition-all hover:scale-110"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      {/* Seta direita */}
      {hasNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="absolute right-3 md:right-6 z-20 w-11 h-11 rounded-full bg-black/50 hover:bg-primary flex items-center justify-center text-white transition-all hover:scale-110"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      )}

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Imagem */}
        <div className="relative h-72 md:h-96">
          {category.image_url ? (
            <img
              key={category.id}
              src={category.image_url}
              alt={category.name}
              className="w-full h-full object-cover transition-opacity duration-300"
            />
          ) : (
            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
              <IconComponent className="w-24 h-24 text-primary/30" />
            </div>
          )}

          {/* Gradiente */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

          {/* Botão fechar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 hover:bg-black/90 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Indicador de posição */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {categories.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(i);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentIndex ? "w-6 bg-white" : "w-1.5 bg-white/40"
                }`}
              />
            ))}
          </div>

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
        <div className="bg-card p-6 space-y-5">
          {category.description && (
            <p className="text-foreground text-base md:text-lg leading-relaxed">{category.description}</p>
          )}

          {/* Navegação inferior + botão */}
          <div className="flex items-center gap-3">
            <button
              onClick={goPrev}
              disabled={!hasPrev}
              className="w-10 h-10 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleNavigate}
              className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-xl transition-colors text-base"
            >
              Ver {category.name}
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={goNext}
              disabled={!hasNext}
              className="w-10 h-10 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Contador */}
          <p className="text-center text-xs text-muted-foreground">
            {currentIndex + 1} de {categories.length} categorias · usa ← → para navegar
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Card de categoria ────────────────────────────────────────────────────────
const CategoryCard = ({ category, onOpen }: { category: Category; onOpen: () => void }) => {
  const [imgError, setImgError] = useState(false);
  const IconComponent = iconMap[category.icon || "Briefcase"] || Briefcase;
  const hasImage = category.image_url && !imgError;

  return (
    <div className="card-category group relative overflow-hidden cursor-pointer" onMouseEnter={onOpen} onClick={onOpen}>
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
  const [modalIndex, setModalIndex] = useState<number | null>(null);

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
            {categories.map((category, index) => (
              <CategoryCard key={category.id} category={category} onOpen={() => setModalIndex(index)} />
            ))}
          </div>
        </div>
      </section>

      {/* Modal com navegação */}
      {modalIndex !== null && (
        <CategoryModal categories={categories} initialIndex={modalIndex} onClose={() => setModalIndex(null)} />
      )}
    </>
  );
};
