import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Subcategory } from "@/hooks/useSubcategories";
import { useSubcategoryCounts } from "@/hooks/useSubcategoryCounts";
import { ArrowRight, ArrowLeft, X } from "lucide-react";

interface SubcategoriesGridProps {
  subcategories: Subcategory[];
  categorySlug: string;
  isLoading?: boolean;
}

// ─── Modal com navegação ──────────────────────────────────────────────────────
const SubcategoryModal = ({
  subcategories,
  categorySlug,
  initialIndex,
  onClose,
}: {
  subcategories: Subcategory[];
  categorySlug: string;
  initialIndex: number;
  onClose: () => void;
}) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const sub = subcategories[currentIndex];

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < subcategories.length - 1;

  const goPrev = useCallback(() => {
    if (hasPrev) setCurrentIndex((i) => i - 1);
  }, [hasPrev]);

  const goNext = useCallback(() => {
    if (hasNext) setCurrentIndex((i) => i + 1);
  }, [hasNext]);

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
    navigate(`/categoria/${categorySlug}/${sub.slug}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8" onClick={onClose}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

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

      <div
        className="relative z-10 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-72 md:h-96">
          {sub.image_url ? (
            <img key={sub.id} src={sub.image_url} alt={sub.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
              <ArrowRight className="w-24 h-24 text-primary/20" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 hover:bg-black/90 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {subcategories.map((_, i) => (
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

          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h2
              className="text-2xl md:text-3xl font-bold text-white"
              style={{ textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}
            >
              {sub.name}
            </h2>
          </div>
        </div>

        <div className="bg-card p-6 space-y-5">
          {sub.description && <p className="text-foreground text-base md:text-lg leading-relaxed">{sub.description}</p>}

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
              Ver {sub.name}
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

          <p className="text-center text-xs text-muted-foreground">
            {currentIndex + 1} de {subcategories.length} subcategorias · usa ← → para navegar
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Card sem descrição — apenas nome + badge ─────────────────────────────────
const SubcategoryCard = ({ sub, onOpen, businessCount }: { sub: Subcategory; onOpen: () => void; businessCount?: number }) => {
  const [imgError, setImgError] = useState(false);
  const hasImage = sub.image_url && !imgError;

  return (
    <div
      className="group relative overflow-hidden bg-card rounded-xl shadow-card hover:shadow-lg transition-all hover:-translate-y-1 border border-border cursor-pointer"
      onClick={onOpen}
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
            {businessCount !== undefined && businessCount > 0 && (
              <span className="text-xs text-white/70 mt-0.5">{businessCount} negócio{businessCount !== 1 ? "s" : ""}</span>
            )}
          </div>
        </>
      ) : (
        <div className="p-6 min-h-[160px] md:min-h-[180px] flex flex-col justify-center">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{sub.name}</h3>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
          {businessCount !== undefined && businessCount > 0 && (
            <span className="text-xs text-muted-foreground">{businessCount} negócio{businessCount !== 1 ? "s" : ""}</span>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Grid principal ───────────────────────────────────────────────────────────
const SubcategoriesGrid = ({ subcategories, categorySlug, isLoading }: SubcategoriesGridProps) => {
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const { data: counts } = useSubcategoryCounts();

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
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subcategories.map((sub, index) => (
          <SubcategoryCard
            key={sub.id}
            sub={sub}
            onOpen={() => setModalIndex(index)}
            businessCount={counts?.get(sub.id)}
          />
        ))}
      </div>

      {modalIndex !== null && (
        <SubcategoryModal
          subcategories={subcategories}
          categorySlug={categorySlug}
          initialIndex={modalIndex}
          onClose={() => setModalIndex(null)}
        />
      )}
    </>
  );
};

export default SubcategoriesGrid;
